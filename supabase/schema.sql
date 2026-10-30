-- Ogarnij: baza danych do synchronizacji między urządzeniami.
-- Wklej całość w Supabase → SQL Editor → New query → Run.

create table if not exists public.items (
  user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  id         text    not null,
  kind       text    not null check (kind in ('task', 'project', 'label')),
  data       jsonb   not null default '{}'::jsonb,
  updated_at bigint  not null,                 -- czas zmiany na urządzeniu (ms), decyduje o wygranej przy konflikcie
  deleted    boolean not null default false,   -- usunięte rekordy zostają jako "nagrobki", żeby inne urządzenia je usunęły
  server_ts  timestamptz not null default now(), -- czas zapisu na serwerze, służy do pobierania tylko nowych zmian
  primary key (user_id, id)
);

create index if not exists items_user_server_ts on public.items (user_id, server_ts);

-- Każdy użytkownik widzi i zmienia wyłącznie swoje rekordy.
alter table public.items enable row level security;

drop policy if exists "items: own rows" on public.items;
create policy "items: own rows" on public.items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ustawia czas serwera i nie pozwala starszej zmianie nadpisać nowszej.
create or replace function public.items_before_write() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.server_ts := clock_timestamp();
  return new;
end
$$;

drop trigger if exists items_before_write on public.items;
create trigger items_before_write
  before insert or update on public.items
  for each row execute function public.items_before_write();

-- Powiadomienia na żywo o zmianach (druga karta / drugie urządzenie odświeża się od razu).
do $$
begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null;
end
$$;
