'use strict';

/* ============================================================
   Ogarnij — menedżer zadań (vanilla JS, dane w localStorage)
   ============================================================ */

const STORE_KEY = 'ogarnij.v1';
const THEME_KEY = 'ogarnij.theme';
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const MONTHS_LONG = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const DAYS = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const REPEATS = { '': 'Nie powtarzaj', daily: 'Codziennie', weekdays: 'W dni robocze', weekly: 'Co tydzień', monthly: 'Co miesiąc', yearly: 'Co rok' };

const ICONS = {
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  check: 'M20 6 9 17l-5-5',
  done: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
  folder: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
  tag: 'M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.59-8.59a1 1 0 0 0 0-1.41z M7 7h.01',
  search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M21 21l-4.3-4.3',
  plus: 'M12 5v14 M5 12h14',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  x: 'M18 6 6 18 M6 6l12 12',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  checklist: 'M3 6l1.5 1.5L7 5 M3 12l1.5 1.5L7 11 M3 18l1.5 1.5L7 17 M11 6h10 M11 12h10 M11 18h10',
  settings: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  back: 'M15 18l-6-6 6-6',
  edit: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  repeat: 'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3',
  note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

/* ---------- daty ---------- */

const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => isoOf(new Date());
const addDays = (base, n) => { const d = parseISO(base); d.setDate(d.getDate() + n); return isoOf(d); };

function fmtDue(s) {
  const t = todayISO();
  if (s === t) return 'Dziś';
  if (s === addDays(t, 1)) return 'Jutro';
  if (s === addDays(t, -1)) return 'Wczoraj';
  const d = parseISO(s);
  const diff = Math.round((d - parseISO(t)) / 864e5);
  if (diff > 1 && diff < 7) return DAYS[d.getDay()];
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${y}`;
}

function fmtLongDate(s) {
  const d = parseISO(s);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

function fmtStamp(ts) {
  const d = new Date(ts);
  const day = isoOf(d) === todayISO() ? 'dziś' : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${day}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const dueClass = s => (s < todayISO() ? 'overdue' : s === todayISO() ? 'today' : '');

function nextDue(from, rep) {
  const d = parseISO(from);
  const step = () => {
    switch (rep) {
      case 'daily': d.setDate(d.getDate() + 1); break;
      case 'weekdays': do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); break;
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    }
  };
  do { step(); } while (isoOf(d) <= todayISO());
  return isoOf(d);
}

/* ---------- dane ---------- */

function newTask(fields = {}) {
  return {
    id: uid(), title: '', projectId: null, priority: false, due: null, repeat: '',
    labels: [], notes: '', checklist: [], comments: [],
    done: false, doneAt: null, createdAt: Date.now(),
    order: Math.min(0, ...state.tasks.map(t => t.order)) - 1,
    ...fields,
  };
}

function seed() {
  const p1 = { id: uid(), name: 'Praca', color: '#3b82f6' };
  const p2 = { id: uid(), name: 'Dom', color: '#22c55e' };
  const p3 = { id: uid(), name: 'Urlop 2027', color: '#f97316' };
  const l1 = { id: uid(), name: 'telefon', color: '#8b5cf6' };
  const l2 = { id: uid(), name: 'komputer', color: '#14b8a6' };
  const l3 = { id: uid(), name: 'na mieście', color: '#ec4899' };
  const t = todayISO();
  let o = 0;
  const mk = f => ({
    id: uid(), title: '', projectId: null, priority: false, due: null, repeat: '', labels: [], notes: '',
    checklist: [], comments: [], done: false, doneAt: null, createdAt: Date.now(), order: o++, ...f,
  });
  return {
    projects: [p1, p2, p3],
    labels: [l1, l2, l3],
    tasks: [
      mk({
        title: 'Witaj w Ogarnij! Kliknij to zadanie, żeby zobaczyć szczegóły',
        notes: 'Skrzynka to miejsce na wszystko, co wpada do głowy. Później przypisz zadanie do projektu, nadaj termin albo oznacz gwiazdką, żeby trafiło na listę Priorytet.\n\nSzybkie dodawanie: wpisz np. „Zadzwonić do Ani #Praca @telefon !”.',
        checklist: [
          { id: uid(), text: 'Dodaj pierwsze zadanie', done: false },
          { id: uid(), text: 'Utwórz projekt', done: false },
          { id: uid(), text: 'Zainstaluj aplikację na telefonie', done: false },
        ],
        comments: [{ id: uid(), text: 'Komentarze działają jak notatki z historią — dobre do zapisywania postępów.', ts: Date.now() }],
      }),
      mk({ title: 'Kupić baterie AA', labels: [l3.id] }),
      mk({ title: 'Zadzwonić do księgowej', projectId: p1.id, priority: true, due: t, labels: [l1.id] }),
      mk({ title: 'Przygotować prezentację na spotkanie', projectId: p1.id, priority: true, due: addDays(t, 3), labels: [l2.id] }),
      mk({ title: 'Odpisać na maile od klientów', projectId: p1.id, repeat: 'weekdays', due: t, labels: [l2.id] }),
      mk({ title: 'Wymienić filtr w okapie', projectId: p2.id }),
      mk({ title: 'Zapłacić rachunki', projectId: p2.id, repeat: 'monthly', due: addDays(t, 5), labels: [l2.id] }),
      mk({ title: 'Zarezerwować nocleg', projectId: p3.id, due: addDays(t, 14) }),
      mk({ title: 'Sprawdzić ważność paszportu', projectId: p3.id }),
    ],
  };
}

function normalize(s) {
  s.projects = Array.isArray(s.projects) ? s.projects : [];
  s.labels = Array.isArray(s.labels) ? s.labels : [];
  s.tasks = (Array.isArray(s.tasks) ? s.tasks : []).map((t, i) => ({
    repeat: '', labels: [], notes: '', checklist: [], comments: [], priority: false,
    projectId: null, due: null, done: false, doneAt: null, createdAt: Date.now(), order: i, ...t,
  }));
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch { /* uszkodzone dane lub brak dostępu — start od zera */ }
  return seed();
}

let saveFailed = false;
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); saveFailed = false; }
  catch { if (!saveFailed) toast('Nie udało się zapisać danych w przeglądarce'); saveFailed = true; }
}

let state = load();
const ui = { view: 'inbox', arg: null, sel: null, q: '', showDone: false, drawer: false };

const projectById = id => state.projects.find(p => p.id === id);
const labelById = id => state.labels.find(l => l.id === id);
const taskById = id => state.tasks.find(t => t.id === id);

function commit() { save(); render(); }

/* ---------- routing (#/widok/argument/t/idZadania) ---------- */

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let sel = null;
  const ti = parts.indexOf('t');
  if (ti >= 0) { sel = parts[ti + 1] || null; parts.splice(ti); }
  ui.view = parts[0] || 'inbox';
  ui.arg = parts[1] || null;
  ui.sel = sel && taskById(sel) ? sel : null;
}

const baseHash = () => `#/${ui.view}${ui.arg ? '/' + encodeURIComponent(ui.arg) : ''}`;

function go(hash) {
  if (location.hash !== hash) location.hash = hash;
  else route();
}

function openTask(id) {
  const h = `${baseHash()}/t/${id}`;
  if (ui.sel) history.replaceState({ detail: true }, '', h);
  else history.pushState({ detail: true }, '', h);
  route();
  if (matchMedia('(min-width: 761px)').matches) return;
  requestAnimationFrame(() => $('#detail').scrollTo(0, 0));
}

function closeTask() {
  if (!ui.sel) return;
  if (history.state && history.state.detail) history.back();
  else { history.replaceState(null, '', baseHash()); route(); }
}

function route() {
  const prevView = ui.view + ui.arg;
  parseRoute();
  if (prevView !== ui.view + ui.arg) ui.showDone = false;
  setDrawer(false);
  render();
}

/* ---------- model widoku ---------- */

const byOrder = (a, b) => a.order - b.order;
const byDue = (a, b) => (a.due || '9').localeCompare(b.due || '9') || byOrder(a, b);

function viewModel() {
  const open = state.tasks.filter(t => !t.done);
  const today = todayISO();
  switch (ui.view) {
    case 'priority':
      return { title: 'Priorytet', tasks: open.filter(t => t.priority).sort(byOrder), sortable: true, ctx: { priority: true },
        empty: 'Oznacz zadania gwiazdką, żeby zebrać tu to, co najważniejsze.' };
    case 'today':
      return { title: 'Na dziś', tasks: open.filter(t => t.due && t.due <= today).sort(byDue), grouped: true, ctx: { due: today },
        empty: 'Na dziś nic nie zostało. Dobra robota!' };
    case 'upcoming':
      return { title: 'Nadchodzące', tasks: open.filter(t => t.due).sort(byDue), grouped: true, noAdd: true,
        empty: 'Żadne zadanie nie ma jeszcze terminu.' };
    case 'done':
      return { title: 'Ukończone', tasks: state.tasks.filter(t => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)), noAdd: true,
        empty: 'Jeszcze nic nie ukończono.', clearDone: true };
    case 'search': {
      const q = ui.q.trim().toLowerCase();
      const hit = t => [t.title, t.notes, ...t.comments.map(c => c.text), ...t.checklist.map(c => c.text)].some(s => s.toLowerCase().includes(q));
      return { title: 'Szukaj', tasks: q ? state.tasks.filter(hit).sort((a, b) => a.done - b.done || byOrder(a, b)) : [], noAdd: true, search: true,
        empty: q ? 'Brak wyników.' : 'Wpisz frazę, aby wyszukać.' };
    }
    case 'projects':
      return { title: 'Projekty', projectsGrid: true, noAdd: true };
    case 'project': {
      const p = projectById(ui.arg);
      if (!p) break;
      const all = state.tasks.filter(t => t.projectId === p.id);
      return { title: p.name, color: p.color, kind: 'project', tasks: all.filter(t => !t.done).sort(byOrder),
        doneTasks: all.filter(t => t.done).sort((a, b) => b.doneAt - a.doneAt), sortable: true, ctx: { projectId: p.id },
        editable: true, empty: 'Ten projekt nie ma jeszcze zadań.' };
    }
    case 'label': {
      const l = labelById(ui.arg);
      if (!l) break;
      const all = state.tasks.filter(t => t.labels.includes(l.id));
      return { title: l.name, color: l.color, kind: 'label', tasks: all.filter(t => !t.done).sort(byOrder),
        doneTasks: all.filter(t => t.done).sort((a, b) => b.doneAt - a.doneAt), sortable: true, ctx: { labels: [l.id] },
        editable: true, empty: 'Brak zadań z tą etykietą.' };
    }
  }
  ui.view = 'inbox';
  return { title: 'Skrzynka', tasks: open.filter(t => !t.projectId).sort(byOrder), sortable: true, ctx: {},
    empty: 'Skrzynka pusta. Zapisz tu wszystko, co przyjdzie Ci do głowy.' };
}

const counts = () => {
  const open = state.tasks.filter(t => !t.done);
  const today = todayISO();
  return {
    inbox: open.filter(t => !t.projectId).length,
    priority: open.filter(t => t.priority).length,
    today: open.filter(t => t.due && t.due <= today).length,
    overdue: open.filter(t => t.due && t.due < today).length,
    project: id => open.filter(t => t.projectId === id).length,
    label: id => open.filter(t => t.labels.includes(id)).length,
  };
};

/* ---------- renderowanie ---------- */

function render() {
  renderSidebar();
  renderMain();
  renderDetail();
  renderTabbar();
  $('#app').classList.toggle('has-detail', !!ui.sel);
}

function navItem(hash, ic, label, count, active, drop, extra = '') {
  return `<a class="nav-item ${active ? 'active' : ''}" href="${hash}" ${drop ? `data-drop="${drop}"` : ''}>
    ${ic}<span class="nav-label">${esc(label)}</span>${extra}${count ? `<span class="count">${count}</span>` : ''}</a>`;
}

function renderSidebar() {
  const c = counts();
  const v = ui.view;
  const dot = color => `<span class="dot" style="background:${color}"></span>`;
  $('#sidebar').innerHTML = `
    <div class="brand"><img src="icons/icon.svg" alt="" width="28" height="28"><span>Ogarnij</span></div>
    <nav class="nav">
      ${navItem('#/inbox', icon('inbox'), 'Skrzynka', c.inbox, v === 'inbox', 'inbox')}
      ${navItem('#/priority', icon('star'), 'Priorytet', c.priority, v === 'priority', 'priority')}
      ${navItem('#/today', icon('sun'), 'Na dziś', c.today, v === 'today', 'today', c.overdue ? `<span class="badge-overdue" title="Zaległe">${c.overdue}</span>` : '')}
      ${navItem('#/upcoming', icon('calendar'), 'Nadchodzące', 0, v === 'upcoming')}
      ${navItem('#/search', icon('search'), 'Szukaj', 0, v === 'search')}
      ${navItem('#/done', icon('done'), 'Ukończone', 0, v === 'done')}
    </nav>
    <div class="nav-section">
      <a class="nav-head" href="#/projects">Projekty</a>
      <button class="icon-btn sm" data-act="new-project" aria-label="Nowy projekt" title="Nowy projekt">${icon('plus')}</button>
    </div>
    <nav class="nav">
      ${state.projects.map(p => navItem(`#/project/${p.id}`, dot(p.color), p.name, c.project(p.id), v === 'project' && ui.arg === p.id, `project:${p.id}`)).join('')
        || '<p class="nav-empty">Brak projektów</p>'}
    </nav>
    <div class="nav-section">
      <span class="nav-head">Etykiety</span>
      <button class="icon-btn sm" data-act="new-label" aria-label="Nowa etykieta" title="Nowa etykieta">${icon('plus')}</button>
    </div>
    <nav class="nav">
      ${state.labels.map(l => navItem(`#/label/${l.id}`, `<span class="ic-tag" style="color:${l.color}">${icon('tag')}</span>`, l.name, c.label(l.id), v === 'label' && ui.arg === l.id, `label:${l.id}`)).join('')
        || '<p class="nav-empty">Brak etykiet</p>'}
    </nav>
    <div class="sidebar-foot">
      <button class="nav-item" data-act="settings">${icon('settings')}<span class="nav-label">Ustawienia i kopia zapasowa</span></button>
    </div>`;
}

function renderMain() {
  const v = viewModel();
  $('#viewTitle').innerHTML = (v.color ? `<span class="dot lg" style="background:${v.color}"></span>` : '') + `<span>${esc(v.title)}</span>`;
  let actions = '';
  if (v.editable) actions += `<button class="icon-btn" data-act="edit-${v.kind}" data-id="${esc(ui.arg)}" title="Edytuj" aria-label="Edytuj">${icon('edit')}</button>`;
  if (v.projectsGrid) actions += `<button class="btn primary sm" data-act="new-project">${icon('plus')}Nowy projekt</button>`;
  if (v.clearDone && v.tasks.length) actions += `<button class="btn sm" data-act="clear-done">${icon('trash')}Usuń ukończone</button>`;
  $('#viewActions').innerHTML = actions;
  $('#quickadd').hidden = !!v.noAdd;
  $('#searchBar').hidden = !v.search;
  if (v.search && $('#searchInput').value !== ui.q) $('#searchInput').value = ui.q;
  $('#list').innerHTML = v.projectsGrid ? projectsGridHTML() : listHTML(v);
  document.title = `${v.title} · Ogarnij`;
}

function projectsGridHTML() {
  const c = counts();
  if (!state.projects.length) return `<div class="empty">${icon('folder')}<p>Nie masz jeszcze projektów.</p></div>`;
  return `<div class="pgrid">${state.projects.map(p => {
    const all = state.tasks.filter(t => t.projectId === p.id);
    const done = all.filter(t => t.done).length;
    const pct = all.length ? Math.round(done / all.length * 100) : 0;
    return `<a class="pcard" href="#/project/${p.id}" style="--c:${p.color}" data-drop="project:${p.id}">
      <span class="pcard-name"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}</span>
      <span class="pcard-count">${c.project(p.id)} do zrobienia</span>
      <span class="progress"><span style="width:${pct}%"></span></span>
    </a>`;
  }).join('')}</div>`;
}

function rowHTML(t, v) {
  const meta = [];
  const p = t.projectId && projectById(t.projectId);
  if (p && v.kind !== 'project') meta.push(`<span class="chip"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}</span>`);
  if (t.due) meta.push(`<span class="meta-i due ${t.done ? '' : dueClass(t.due)}">${icon('calendar')}${fmtDue(t.due)}${t.repeat ? icon('repeat') : ''}</span>`);
  for (const id of t.labels) {
    const l = labelById(id);
    if (l) meta.push(`<span class="label" style="--c:${l.color}">${esc(l.name)}</span>`);
  }
  if (t.checklist.length) meta.push(`<span class="meta-i">${icon('checklist')}${t.checklist.filter(c => c.done).length}/${t.checklist.length}</span>`);
  if (t.comments.length) meta.push(`<span class="meta-i">${icon('chat')}${t.comments.length}</span>`);
  if (t.notes.trim()) meta.push(`<span class="meta-i" title="Ma notatkę">${icon('note')}</span>`);
  const drag = v.sortable && !t.done;
  return `<li class="task ${t.done ? 'is-done' : ''} ${ui.sel === t.id ? 'is-sel' : ''}" data-id="${t.id}" ${drag ? 'draggable="true"' : ''}>
    <button class="check" data-act="toggle-done" data-id="${t.id}" aria-label="${t.done ? 'Przywróć' : 'Ukończ'}">${icon('check')}</button>
    <div class="task-body" data-act="open" data-id="${t.id}" tabindex="0" role="button">
      <div class="task-title">${esc(t.title) || '<em class="muted">Bez nazwy</em>'}</div>
      ${meta.length ? `<div class="task-meta">${meta.join('')}</div>` : ''}
    </div>
    <button class="star ${t.priority ? 'on' : ''}" data-act="toggle-star" data-id="${t.id}" aria-label="Priorytet" title="Priorytet">${icon('star', t.priority ? 'fill' : '')}</button>
  </li>`;
}

function listHTML(v) {
  let html = '';
  if (!v.tasks.length) {
    html += `<div class="empty">${icon(ui.view === 'search' ? 'search' : 'done')}<p>${esc(v.empty)}</p></div>`;
  } else if (v.grouped) {
    const t = todayISO();
    const groups = new Map();
    for (const task of v.tasks) {
      const key = task.due < t ? 'Zaległe' : task.due === t ? 'Dziś' : task.due === addDays(t, 1) ? 'Jutro' : fmtLongDate(task.due);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(task);
    }
    for (const [key, tasks] of groups) {
      html += `<h3 class="group ${key === 'Zaległe' ? 'overdue' : ''}">${esc(key)}<span>${tasks.length}</span></h3><ul class="tasks">${tasks.map(x => rowHTML(x, v)).join('')}</ul>`;
    }
  } else {
    html += `<ul class="tasks" data-sortable="${v.sortable ? 1 : 0}">${v.tasks.map(x => rowHTML(x, v)).join('')}</ul>`;
  }
  if (v.doneTasks && v.doneTasks.length) {
    html += `<button class="show-done" data-act="toggle-show-done">${icon('done')}${ui.showDone ? 'Ukryj' : 'Pokaż'} ukończone (${v.doneTasks.length})</button>`;
    if (ui.showDone) html += `<ul class="tasks">${v.doneTasks.map(x => rowHTML(x, v)).join('')}</ul>`;
  }
  return html;
}

function linkify(text) {
  return esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
}

function renderDetail() {
  const el = $('#detail');
  const t = ui.sel && taskById(ui.sel);
  if (!t) { el.innerHTML = ''; el.classList.remove('open'); return; }
  el.classList.add('open');
  const doneCount = t.checklist.filter(c => c.done).length;
  el.innerHTML = `
    <div class="d-head">
      <button class="icon-btn" data-act="close" aria-label="Zamknij">${icon(matchMedia('(max-width: 760px)').matches ? 'back' : 'x')}</button>
      <span class="d-head-title">${t.done ? 'Ukończone' : 'Zadanie'}</span>
      <button class="icon-btn star ${t.priority ? 'on' : ''}" data-act="toggle-star" data-id="${t.id}" aria-label="Priorytet" title="Priorytet">${icon('star', t.priority ? 'fill' : '')}</button>
      <button class="icon-btn danger" data-act="delete-task" data-id="${t.id}" aria-label="Usuń zadanie" title="Usuń zadanie">${icon('trash')}</button>
    </div>
    <div class="d-body">
      <div class="d-titlerow ${t.done ? 'is-done' : ''}">
        <button class="check" data-act="toggle-done" data-id="${t.id}" aria-label="Ukończ">${icon('check')}</button>
        <textarea class="d-title autosize" data-field="title" rows="1" placeholder="Nazwa zadania">${esc(t.title)}</textarea>
      </div>

      <div class="fields">
        <label class="field">
          <span class="field-label">${icon('folder')}Projekt</span>
          <select data-field="projectId">
            <option value="">Skrzynka</option>
            ${state.projects.map(p => `<option value="${p.id}" ${p.id === t.projectId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </label>
        <div class="field">
          <span class="field-label">${icon('calendar')}Termin</span>
          <div class="due-row">
            <input type="date" data-field="due" value="${t.due || ''}" aria-label="Termin">
            <div class="seg">
              <button data-act="due" data-v="0">Dziś</button>
              <button data-act="due" data-v="1">Jutro</button>
              <button data-act="due" data-v="7">+7 dni</button>
              ${t.due ? '<button data-act="due" data-v="">Usuń</button>' : ''}
            </div>
          </div>
        </div>
        <label class="field">
          <span class="field-label">${icon('repeat')}Powtarzanie</span>
          <select data-field="repeat">
            ${Object.entries(REPEATS).map(([k, n]) => `<option value="${k}" ${k === t.repeat ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>
        <div class="field">
          <span class="field-label">${icon('tag')}Etykiety</span>
          <div class="chips">
            ${state.labels.map(l => `<button class="label-toggle ${t.labels.includes(l.id) ? 'on' : ''}" style="--c:${l.color}" data-act="toggle-label" data-id="${l.id}">${esc(l.name)}</button>`).join('')}
            <button class="label-toggle add" data-act="new-label">${icon('plus')}Nowa</button>
          </div>
        </div>
      </div>

      <section class="d-section">
        <h4>${icon('note')}Notatka</h4>
        <textarea class="d-notes autosize" data-field="notes" placeholder="Dodaj opis, linki, szczegóły…">${esc(t.notes)}</textarea>
      </section>

      <section class="d-section">
        <h4>${icon('checklist')}Lista kontrolna ${t.checklist.length ? `<span class="muted">${doneCount}/${t.checklist.length}</span>` : ''}</h4>
        ${t.checklist.length ? `<span class="progress"><span style="width:${Math.round(doneCount / t.checklist.length * 100)}%"></span></span>` : ''}
        <ul class="checklist">
          ${t.checklist.map(c => `<li class="${c.done ? 'is-done' : ''}">
            <input type="checkbox" data-act="chk-toggle" data-id="${c.id}" ${c.done ? 'checked' : ''} aria-label="Zrobione">
            <input class="chk-text" data-chk="${c.id}" value="${esc(c.text)}" aria-label="Punkt listy">
            <button class="icon-btn sm" data-act="chk-del" data-id="${c.id}" aria-label="Usuń punkt">${icon('x')}</button>
          </li>`).join('')}
        </ul>
        <form class="inline-add" data-form="checklist"><input name="text" placeholder="Dodaj punkt…" autocomplete="off" enterkeyhint="done"></form>
      </section>

      <section class="d-section">
        <h4>${icon('chat')}Komentarze ${t.comments.length ? `<span class="muted">${t.comments.length}</span>` : ''}</h4>
        <ul class="comments">
          ${t.comments.map(c => `<li>
            <div class="comment-head"><span>${fmtStamp(c.ts)}</span><button class="icon-btn sm" data-act="comment-del" data-id="${c.id}" aria-label="Usuń komentarz">${icon('x')}</button></div>
            <div class="comment-text">${linkify(c.text)}</div>
          </li>`).join('')}
        </ul>
        <form class="comment-add" data-form="comment">
          <textarea name="text" class="autosize" rows="2" placeholder="Napisz komentarz… (Ctrl+Enter, aby dodać)"></textarea>
          <button class="btn primary sm" type="submit">Dodaj</button>
        </form>
      </section>

      <p class="d-meta">Utworzono ${fmtStamp(t.createdAt)}${t.doneAt ? ` · ukończono ${fmtStamp(t.doneAt)}` : ''}</p>
    </div>`;
  $$('.autosize', el).forEach(autosize);
}

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 2 + 'px';
}

function renderTabbar() {
  const c = counts();
  const v = ui.view;
  const tab = (hash, ic, label, active, n) => `<a href="${hash}" class="${active ? 'active' : ''}">${icon(ic)}<span>${label}</span>${n ? `<b>${n}</b>` : ''}</a>`;
  $('#tabbar').innerHTML =
    tab('#/inbox', 'inbox', 'Skrzynka', v === 'inbox', c.inbox) +
    tab('#/priority', 'star', 'Priorytet', v === 'priority', c.priority) +
    tab('#/today', 'sun', 'Dziś', v === 'today', c.today) +
    tab('#/projects', 'grid', 'Projekty', v === 'projects' || v === 'project', 0) +
    tab('#/search', 'search', 'Szukaj', v === 'search', 0);
}

/* ---------- akcje ---------- */

let toastTimer;
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Cofnij</button>' : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
  if (undo) el.querySelector('button').onclick = () => { undo(); el.classList.remove('show'); };
}

function toggleDone(id) {
  const t = taskById(id);
  if (!t) return;
  if (!t.done && t.repeat) {
    const prev = { due: t.due, checklist: t.checklist.map(c => ({ ...c })) };
    t.due = nextDue(t.due || todayISO(), t.repeat);
    t.checklist.forEach(c => { c.done = false; });
    commit();
    toast(`Zadanie cykliczne — następny termin: ${fmtDue(t.due)}`, () => { Object.assign(t, prev); commit(); });
    return;
  }
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  commit();
  if (t.done) toast('Ukończono zadanie', () => { t.done = false; t.doneAt = null; commit(); });
}

function deleteTask(id) {
  const i = state.tasks.findIndex(t => t.id === id);
  if (i < 0) return;
  const [t] = state.tasks.splice(i, 1);
  if (ui.sel === id) closeTask();
  commit();
  toast('Usunięto zadanie', () => { state.tasks.splice(i, 0, t); commit(); });
}

function findByName(list, token) {
  const norm = s => s.toLowerCase().replace(/\s+/g, '_');
  const k = norm(token);
  return list.find(x => norm(x.name) === k) || list.find(x => norm(x.name).startsWith(k));
}

function quickAdd(text) {
  let title = text.trim();
  if (!title) return;
  const v = viewModel();
  const t = newTask({ ...(v.ctx || {}), labels: [...((v.ctx && v.ctx.labels) || [])] });
  title = title.replace(/(^|\s)!(?=\s|$)/g, () => { t.priority = true; return ' '; });
  title = title.replace(/(^|\s)#([^\s#@!]+)/g, (m, sp, name) => {
    const p = findByName(state.projects, name);
    if (!p) return m;
    t.projectId = p.id;
    return ' ';
  });
  title = title.replace(/(^|\s)@([^\s#@!]+)/g, (m, sp, name) => {
    let l = findByName(state.labels, name);
    if (!l) {
      l = { id: uid(), name: name.replace(/_/g, ' '), color: COLORS[state.labels.length % COLORS.length] };
      state.labels.push(l);
    }
    if (!t.labels.includes(l.id)) t.labels.push(l.id);
    return ' ';
  });
  t.title = title.replace(/\s+/g, ' ').trim() || text.trim();
  state.tasks.push(t);
  commit();
  const visible = viewModel().tasks.some(x => x.id === t.id);
  if (!visible) {
    const p = t.projectId && projectById(t.projectId);
    toast(`Dodano do: ${p ? p.name : 'Skrzynka'}`);
  }
}

function updateField(t, field, value) {
  if (field === 'projectId') t.projectId = value || null;
  else if (field === 'due') t.due = value || null;
  else t[field] = value;
}

function reorder(dragId, targetId, after) {
  const ids = viewModel().tasks.map(t => t.id);
  const from = ids.indexOf(dragId);
  if (from < 0 || dragId === targetId) return;
  ids.splice(from, 1);
  let to = ids.indexOf(targetId);
  if (to < 0) return;
  if (after) to++;
  ids.splice(to, 0, dragId);
  ids.forEach((id, i) => { taskById(id).order = i; });
  commit();
}

function dropOn(target, id) {
  const t = taskById(id);
  if (!t) return;
  const [kind, arg] = target.split(':');
  let msg;
  if (kind === 'inbox') { t.projectId = null; msg = 'Przeniesiono do Skrzynki'; }
  else if (kind === 'priority') { t.priority = true; msg = 'Dodano do Priorytetu'; }
  else if (kind === 'today') { t.due = todayISO(); msg = 'Termin: dziś'; }
  else if (kind === 'project') { t.projectId = arg; msg = `Przeniesiono do: ${projectById(arg).name}`; }
  else if (kind === 'label') { if (!t.labels.includes(arg)) t.labels.push(arg); msg = `Dodano etykietę: ${labelById(arg).name}`; }
  commit();
  toast(msg);
}

/* ---------- okna dialogowe ---------- */

function editEntity(kind, id) {
  const list = kind === 'project' ? state.projects : state.labels;
  const ent = id ? list.find(x => x.id === id) : null;
  const what = kind === 'project' ? 'projekt' : 'etykietę';
  const color = ent ? ent.color : COLORS[(list.length + 5) % COLORS.length];
  const dlg = $('#dlg');
  dlg.innerHTML = `<form class="dlg-form">
    <h2>${ent ? 'Edytuj' : 'Nowy'} ${what}</h2>
    <label class="fld"><span>Nazwa</span><input name="name" required maxlength="60" value="${esc(ent ? ent.name : '')}" autocomplete="off"></label>
    <fieldset class="colors"><legend>Kolor</legend>
      ${COLORS.map(c => `<label><input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''}><span style="background:${c}"></span></label>`).join('')}
    </fieldset>
    <div class="dlg-actions">
      ${ent ? `<button type="button" class="btn danger" data-dlg="delete">${icon('trash')}Usuń</button>` : ''}
      <span class="sp"></span>
      <button type="button" class="btn" data-dlg="cancel">Anuluj</button>
      <button type="submit" class="btn primary">Zapisz</button>
    </div>
  </form>`;
  const form = $('form', dlg);
  form.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name')).trim();
    if (!name) return;
    if (ent) Object.assign(ent, { name, color: fd.get('color') });
    else {
      const n = { id: uid(), name, color: fd.get('color') };
      list.push(n);
      if (kind === 'project' && !ui.sel) location.hash = `#/project/${n.id}`;
      const t = ui.sel && taskById(ui.sel);
      if (kind === 'label' && t) t.labels.push(n.id);
    }
    dlg.close();
    commit();
  };
  $('[data-dlg="cancel"]', dlg).onclick = () => dlg.close();
  const del = $('[data-dlg="delete"]', dlg);
  if (del) del.onclick = () => {
    const msg = kind === 'project'
      ? `Usunąć projekt „${ent.name}”? Jego zadania trafią do Skrzynki.`
      : `Usunąć etykietę „${ent.name}”? Zadania pozostaną bez zmian.`;
    if (!confirm(msg)) return;
    list.splice(list.indexOf(ent), 1);
    for (const t of state.tasks) {
      if (kind === 'project' && t.projectId === ent.id) t.projectId = null;
      if (kind === 'label') t.labels = t.labels.filter(x => x !== ent.id);
    }
    dlg.close();
    if (ui.arg === ent.id) location.hash = kind === 'project' ? '#/projects' : '#/inbox';
    commit();
  };
  dlg.showModal();
  $('input[name="name"]', dlg).focus();
}

function openSettings() {
  const theme = getTheme();
  const dlg = $('#dlg');
  dlg.innerHTML = `<div class="dlg-form">
    <h2>Ustawienia</h2>
    <div class="fld"><span>Motyw</span>
      <div class="seg wide">
        ${[['auto', 'Systemowy'], ['light', 'Jasny'], ['dark', 'Ciemny']].map(([k, n]) => `<button data-theme-set="${k}" class="${theme === k ? 'on' : ''}">${n}</button>`).join('')}
      </div>
    </div>
    <div class="fld"><span>Kopia zapasowa</span>
      <p class="hint">Dane są zapisywane w tej przeglądarce. Wyeksportuj plik, by przenieść je na inne urządzenie lub zachować kopię.</p>
      <div class="row">
        <button class="btn" data-dlg="export">Eksportuj (JSON)</button>
        <label class="btn">Importuj…<input type="file" accept="application/json,.json" hidden data-dlg="import"></label>
      </div>
    </div>
    <div class="fld"><span>Dane</span>
      <div class="row">
        <button class="btn danger" data-dlg="reset">Wyczyść wszystko</button>
      </div>
    </div>
    <div class="dlg-actions"><span class="sp"></span><button class="btn primary" data-dlg="cancel">Gotowe</button></div>
  </div>`;
  $$('[data-theme-set]', dlg).forEach(b => b.onclick = () => {
    setTheme(b.dataset.themeSet);
    $$('[data-theme-set]', dlg).forEach(x => x.classList.toggle('on', x === b));
  });
  $('[data-dlg="cancel"]', dlg).onclick = () => dlg.close();
  $('[data-dlg="export"]', dlg).onclick = () => {
    const blob = new Blob([JSON.stringify({ app: 'ogarnij', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ogarnij-kopia-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('[data-dlg="import"]', dlg).onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.tasks)) throw new Error('format');
      if (!confirm(`Zaimportować ${data.tasks.length} zadań? Obecne dane zostaną zastąpione.`)) return;
      const { projects, labels, tasks } = data;
      state = normalize({ projects, labels, tasks });
      dlg.close();
      go('#/inbox');
      commit();
      toast('Zaimportowano dane');
    } catch {
      toast('To nie jest prawidłowy plik kopii zapasowej');
    }
  };
  $('[data-dlg="reset"]', dlg).onclick = () => {
    if (!confirm('Na pewno usunąć wszystkie zadania, projekty i etykiety?')) return;
    state = { projects: [], labels: [], tasks: [] };
    dlg.close();
    go('#/inbox');
    commit();
  };
  dlg.showModal();
}

/* ---------- motyw ---------- */

function getTheme() { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; } }
function applyTheme(theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* tylko na tę sesję */ }
  applyTheme(theme);
}

/* ---------- szuflada (mobile) ---------- */

function setDrawer(open) {
  ui.drawer = open;
  $('#app').classList.toggle('drawer-open', open);
  $('#scrim').classList.toggle('show', open);
}

/* ---------- zdarzenia ---------- */

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const id = el.dataset.id;
  const t = ui.sel && taskById(ui.sel);
  switch (el.dataset.act) {
    case 'open': openTask(id); break;
    case 'close': closeTask(); break;
    case 'drawer': setDrawer(!ui.drawer); break;
    case 'toggle-done': toggleDone(id); break;
    case 'toggle-star': { const x = taskById(id); x.priority = !x.priority; commit(); break; }
    case 'delete-task': deleteTask(id); break;
    case 'toggle-show-done': ui.showDone = !ui.showDone; renderMain(); break;
    case 'new-project': editEntity('project'); break;
    case 'new-label': editEntity('label'); break;
    case 'edit-project': editEntity('project', id); break;
    case 'edit-label': editEntity('label', id); break;
    case 'settings': setDrawer(false); openSettings(); break;
    case 'clear-done': {
      const n = state.tasks.filter(x => x.done).length;
      if (confirm(`Trwale usunąć ${n} ukończonych zadań?`)) { state.tasks = state.tasks.filter(x => !x.done); commit(); }
      break;
    }
    case 'due': if (t) { t.due = el.dataset.v === '' ? null : addDays(todayISO(), +el.dataset.v); commit(); } break;
    case 'toggle-label':
      if (t) { t.labels = t.labels.includes(id) ? t.labels.filter(x => x !== id) : [...t.labels, id]; commit(); }
      break;
    case 'chk-toggle':
      if (t) { const c = t.checklist.find(x => x.id === id); c.done = !c.done; commit(); }
      break;
    case 'chk-del': if (t) { t.checklist = t.checklist.filter(x => x.id !== id); commit(); } break;
    case 'comment-del':
      if (t && confirm('Usunąć komentarz?')) { t.comments = t.comments.filter(x => x.id !== id); commit(); }
      break;
  }
});

document.addEventListener('keydown', e => {
  const typing = e.target.matches('input, textarea, select, [contenteditable]');
  if (e.key === 'Enter' && e.target.matches('.task-body')) { openTask(e.target.dataset.id); return; }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.closest('[data-form="comment"]')) {
    e.preventDefault();
    e.target.form.requestSubmit();
    return;
  }
  if (e.key === 'Escape') {
    if ($('#dlg').open) return;
    if (typing) { e.target.blur(); return; }
    if (ui.drawer) setDrawer(false);
    else closeTask();
    return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'n' || e.key === 'q') {
    e.preventDefault();
    if ($('#quickadd').hidden) go('#/inbox');
    $('#quickInput').focus();
  } else if (e.key === '/') {
    e.preventDefault();
    go('#/search');
    $('#searchInput').focus();
  }
});

$('#quickadd').addEventListener('submit', e => {
  e.preventDefault();
  quickAdd($('#quickInput').value);
  $('#quickInput').value = '';
});

$('#searchInput').addEventListener('input', e => { ui.q = e.target.value; renderMain(); });

const detail = $('#detail');

detail.addEventListener('input', e => {
  const t = ui.sel && taskById(ui.sel);
  if (!t) return;
  if (e.target.matches('.autosize')) autosize(e.target);
  const f = e.target.dataset.field;
  if (f === 'title' || f === 'notes') {
    t[f] = e.target.value;
    save();
    renderMain();
  } else if (e.target.dataset.chk) {
    const c = t.checklist.find(x => x.id === e.target.dataset.chk);
    if (c) { c.text = e.target.value; save(); }
  }
});

detail.addEventListener('change', e => {
  const t = ui.sel && taskById(ui.sel);
  const f = e.target.dataset.field;
  if (!t || !f || f === 'title' || f === 'notes') return;
  updateField(t, f, e.target.value);
  commit();
});

detail.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('.d-title')) { e.preventDefault(); e.target.blur(); }
});

detail.addEventListener('submit', e => {
  e.preventDefault();
  const t = ui.sel && taskById(ui.sel);
  const form = e.target;
  const text = form.elements.text.value.trim();
  if (!t || !text) return;
  if (form.dataset.form === 'checklist') {
    t.checklist.push({ id: uid(), text, done: false });
    commit();
    $('[data-form="checklist"] input', detail).focus();
  } else {
    t.comments.push({ id: uid(), text, ts: Date.now() });
    commit();
  }
});

$('#scrim').addEventListener('click', () => setDrawer(false));
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
window.addEventListener('storage', e => { if (e.key === STORE_KEY) { state = load(); render(); } });

// Odświeżenie liczników o północy / po powrocie do karty
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

/* ---------- przeciąganie (desktop) ---------- */

let dragId = null;

document.addEventListener('dragstart', e => {
  const li = e.target.closest && e.target.closest('li.task[draggable]');
  if (!li) return;
  dragId = li.dataset.id;
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragId);
});

document.addEventListener('dragend', () => {
  dragId = null;
  $$('.dragging, .drop-before, .drop-after, .drop-target').forEach(x => x.classList.remove('dragging', 'drop-before', 'drop-after', 'drop-target'));
});

document.addEventListener('dragover', e => {
  if (!dragId) return;
  $$('.drop-before, .drop-after, .drop-target').forEach(x => x.classList.remove('drop-before', 'drop-after', 'drop-target'));
  const zone = e.target.closest('[data-drop]');
  if (zone) { e.preventDefault(); zone.classList.add('drop-target'); return; }
  const li = e.target.closest('ul[data-sortable="1"] li.task');
  if (li && li.dataset.id !== dragId) {
    e.preventDefault();
    const r = li.getBoundingClientRect();
    li.classList.add(e.clientY > r.top + r.height / 2 ? 'drop-after' : 'drop-before');
  }
});

document.addEventListener('drop', e => {
  if (!dragId) return;
  e.preventDefault();
  const zone = e.target.closest('[data-drop]');
  if (zone) { dropOn(zone.dataset.drop, dragId); return; }
  const li = e.target.closest('ul[data-sortable="1"] li.task');
  if (li) {
    const r = li.getBoundingClientRect();
    reorder(dragId, li.dataset.id, e.clientY > r.top + r.height / 2);
  }
});

/* ---------- start ---------- */

applyTheme(getTheme());
$('[data-act="drawer"]').innerHTML = icon('menu');
$('.quickadd-plus').innerHTML = icon('plus');
if (matchMedia('(max-width: 760px)').matches) $('#quickInput').placeholder = 'Dodaj zadanie…';
history.replaceState(null, '', location.hash || '#/inbox');
parseRoute();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
