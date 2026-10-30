'use strict';

/* ============================================================
   Synchronizacja z Supabase.
   Aplikacja zawsze pracuje na danych lokalnych; ten moduł w tle
   wysyła zmienione rekordy i pobiera zmiany z innych urządzeń.
   Konflikt na tym samym rekordzie: wygrywa nowsza zmiana.
   ============================================================ */

const Sync = (() => {
  const CFG_KEY = 'ogarnij.cloud';
  const META_KEY = 'ogarnij.sync';
  const KINDS = { task: 'tasks', project: 'projects', label: 'labels' };
  const PAGE = 500;
  const OVERLAP_MS = 60_000; // pobieramy z zakładką, żeby nie zgubić zapisów zatwierdzonych "w tle"

  let client = null;
  let user = null;
  let channel = null;
  let timer = null;
  let running = false;
  let again = false;
  let status = 'off'; // off | connecting | signedout | syncing | ok | offline | error
  let lastError = '';
  let lastSync = null;
  let meta = loadMeta();

  // Stabilny zapis JSON (posortowane klucze) — jsonb w Postgresie zmienia kolejność kluczy.
  const stable = v => Array.isArray(v) ? `[${v.map(stable).join(',')}]`
    : v && typeof v === 'object' ? `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',')}}`
    : JSON.stringify(v ?? null);

  function loadMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || emptyMeta(null); } catch { return emptyMeta(null); }
  }
  function emptyMeta(userId) { return { userId, cursor: null, first: true, items: {} }; }
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* brak miejsca */ } }

  function config() {
    const def = window.OGARNIJ_CONFIG || {};
    let own = {};
    try { own = JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { /* brak */ }
    return { url: (own.url || def.supabaseUrl || '').trim(), key: (own.key || def.supabaseAnonKey || '').trim(), own: !!own.url };
  }

  function setStatus(s) {
    status = s;
    if (typeof onSyncStatus === 'function') onSyncStatus();
  }

  function loadLibrary() {
    if (window.supabase) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/supabase.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Nie udało się wczytać biblioteki Supabase'));
      document.head.append(s);
    });
  }

  /* ---------- wykrywanie zmian lokalnych ---------- */

  function scan() {
    const now = Date.now();
    const seen = new Set();
    for (const [kind, coll] of Object.entries(KINDS)) {
      for (const e of state[coll]) {
        seen.add(e.id);
        const h = stable(e);
        const m = meta.items[e.id];
        if (!m || m.d || m.h !== h) meta.items[e.id] = { k: kind, h, u: Math.max(now, m ? m.u + 1 : 0), d: false, dirty: true };
      }
    }
    for (const [id, m] of Object.entries(meta.items)) {
      if (!m.d && !seen.has(id)) Object.assign(m, { d: true, h: null, u: Math.max(now, m.u + 1), dirty: true });
    }
  }

  /* ---------- pobieranie i scalanie ---------- */

  async function pull(since) {
    const rows = [];
    for (let from = 0; ; from += PAGE) {
      let q = client.from('items').select('id,kind,data,updated_at,deleted,server_ts')
        .order('server_ts', { ascending: true }).range(from, from + PAGE - 1);
      if (since) q = q.gt('server_ts', since);
      const { data, error } = await q;
      if (error) throw error;
      rows.push(...data);
      if (data.length < PAGE) break;
    }
    return rows;
  }

  function apply(rows) {
    let changed = false;
    for (const r of rows) {
      if (!meta.cursor || r.server_ts > meta.cursor) meta.cursor = r.server_ts;
      if (!KINDS[r.kind]) continue;
      const u = Number(r.updated_at);
      const m = meta.items[r.id];
      if (m && m.u >= u) continue; // mamy tę samą lub nowszą wersję
      const coll = state[KINDS[r.kind]];
      const i = coll.findIndex(x => x.id === r.id);
      if (r.deleted) {
        if (i >= 0) { coll.splice(i, 1); changed = true; }
        meta.items[r.id] = { k: r.kind, h: null, u, d: true, dirty: false };
      } else {
        let e = { ...r.data, id: r.id };
        if (r.kind === 'task') e = normalize({ tasks: [e] }).tasks[0];
        if (i >= 0) coll[i] = e; else coll.push(e);
        meta.items[r.id] = { k: r.kind, h: stable(e), u, d: false, dirty: false };
        changed = true;
      }
    }
    return changed;
  }

  function entityOf(kind, id) {
    return state[KINDS[kind]].find(x => x.id === id) || {};
  }

  async function push() {
    const dirty = Object.entries(meta.items).filter(([, m]) => m.dirty);
    for (let i = 0; i < dirty.length; i += PAGE) {
      const chunk = dirty.slice(i, i + PAGE);
      const rows = chunk.map(([id, m]) => ({
        user_id: user.id, id, kind: m.k, updated_at: m.u, deleted: m.d,
        data: m.d ? {} : entityOf(m.k, id),
      }));
      const { error } = await client.from('items').upsert(rows, { onConflict: 'user_id,id' });
      if (error) throw error;
      // Jeśli w trakcie wysyłki coś zmieniono, następny scan() i tak to wykryje (inny hash).
      for (const [, m] of chunk) m.dirty = false;
    }
  }

  async function firstSync() {
    const rows = await pull(null);
    const remote = rows.filter(r => !r.deleted && KINDS[r.kind]).length;
    const local = state.tasks.length + state.projects.length + state.labels.length;
    if (remote && local && confirm(
      `W chmurze jest już ${remote} rekordów z innego urządzenia.\n\n` +
      'OK — zastąp dane na tym urządzeniu danymi z chmury (zalecane).\n' +
      'Anuluj — połącz oba zestawy danych.')) {
      state.tasks.length = 0;
      state.projects.length = 0;
      state.labels.length = 0;
      meta.items = {};
    }
    return apply(rows);
  }

  async function syncNow() {
    if (!client || !user) return;
    if (running) { again = true; return; }
    running = true;
    clearTimeout(timer);
    setStatus('syncing');
    try {
      scan();
      const changed = meta.first
        ? await firstSync()
        : apply(await pull(meta.cursor && new Date(new Date(meta.cursor).getTime() - OVERLAP_MS).toISOString()));
      if (changed) { persist(); refreshFromSync(); }
      await push();
      meta.first = false;
      lastSync = Date.now();
      lastError = '';
      setStatus('ok');
    } catch (e) {
      lastError = (e && e.message) || String(e);
      setStatus(navigator.onLine === false ? 'offline' : 'error');
    } finally {
      saveMeta();
      running = false;
      if (again) { again = false; schedule(300); }
    }
  }

  function schedule(delay = 1200) {
    if (!client || !user) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, delay);
  }

  /* ---------- logowanie ---------- */

  function setUser(u) {
    if ((u && u.id) === (user && user.id)) return;
    user = u;
    if (channel) { client.removeChannel(channel); channel = null; }
    if (!user) { setStatus('signedout'); return; }
    if (meta.userId !== user.id) { meta = emptyMeta(user.id); saveMeta(); }
    channel = client.channel(`items-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${user.id}` }, () => schedule(300))
      .subscribe();
    syncNow();
  }

  async function init() {
    const { url, key } = config();
    if (!url || !key) { setStatus('off'); return; }
    setStatus('connecting');
    try {
      await loadLibrary();
      client = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'ogarnij.auth' },
      });
      const { data } = await client.auth.getSession();
      setUser(data && data.session ? data.session.user : null);
      if (!user) setStatus('signedout');
      // Wywołania Supabase wewnątrz tego callbacku mogą się zablokować — odkładamy je.
      client.auth.onAuthStateChange((_ev, session) => setTimeout(() => setUser(session ? session.user : null), 0));
    } catch (e) {
      lastError = (e && e.message) || String(e);
      setStatus(navigator.onLine === false ? 'offline' : 'error');
    }
  }

  async function signIn(email, password) {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return !!data.session; // false = trzeba potwierdzić adres e-mail
  }

  async function signOut() {
    await client.auth.signOut();
    meta = emptyMeta(null);
    saveMeta();
    setUser(null);
  }

  function configure(url, key) {
    try {
      if (url) localStorage.setItem(CFG_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
      else localStorage.removeItem(CFG_KEY);
    } catch { /* brak dostępu */ }
    location.reload();
  }

  window.addEventListener('online', () => schedule(0));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(0); });
  setInterval(() => { if (!document.hidden) schedule(0); }, 60_000);
  window.addEventListener('storage', e => { if (e.key === META_KEY) meta = loadMeta(); });

  return {
    init, schedule, syncNow, signIn, signUp, signOut, configure, config,
    info: () => ({
      status, lastSync, lastError, configured: !!config().url, email: user && user.email,
      pending: Object.values(meta.items).filter(m => m.dirty).length,
    }),
  };
})();
