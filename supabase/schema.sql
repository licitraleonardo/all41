-- All For One — schema del punto 2 (onboarding + codice di accesso)
-- Da incollare nell'SQL Editor di Supabase ed eseguire. È rieseguibile senza danni.

-- ---------------------------------------------------------------- tabelle

create table if not exists trips (
  id          text primary key,
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now()
);

create table if not exists members (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             text not null references trips (id) on delete cascade,
  name                text not null,
  avatar_seed         text not null,
  avatar_style        text not null,
  access_code         text not null unique,
  score               integer not null default 0,
  last_seen_at        timestamptz,
  last_known_location jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists members_trip_idx on members (trip_id);

-- Chat Rapida. Il payload cambia forma a seconda del tipo, quindi jsonb.
create table if not exists quick_actions (
  id          uuid primary key default gen_random_uuid(),
  trip_id     text not null references trips (id) on delete cascade,
  author_id   uuid not null references members (id) on delete cascade,
  kind        text not null check (kind in
                ('sos', 'dove_siete', 'si_riparte', 'free_text', 'poll', 'soundboard')),
  payload     jsonb not null default '{}'::jsonb,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Il feed legge per viaggio in ordine di tempo; i limiti contano le azioni
-- recenti di una persona per tipo. Due indici, due domande.
create index if not exists quick_actions_feed_idx
  on quick_actions (trip_id, created_at desc);

create index if not exists quick_actions_limiti_idx
  on quick_actions (author_id, kind, created_at desc);

-- ------------------------------------------------------------------ seed

insert into trips (id, name, start_date, end_date)
values ('sardegna-2026', 'Sardegna', '2026-08-12', '2026-08-16')
on conflict (id) do nothing;

-- --------------------------------------------------------------- sicurezza
-- Il modello dello spec: serve una sessione (anche anonima) per leggere o
-- scrivere. Chiude la porta a scanner e bot, non separa i membri fra loro.

alter table trips         enable row level security;
alter table members       enable row level security;
alter table quick_actions enable row level security;

drop policy if exists "trips: lettura per autenticati"    on trips;
drop policy if exists "members: lettura per autenticati"  on members;
drop policy if exists "members: creazione per autenticati" on members;
drop policy if exists "members: modifica per autenticati"  on members;
drop policy if exists "azioni: lettura per autenticati"    on quick_actions;
drop policy if exists "azioni: creazione per autenticati"  on quick_actions;
drop policy if exists "azioni: modifica per autenticati"   on quick_actions;

create policy "trips: lettura per autenticati"
  on trips for select to authenticated using (true);

create policy "members: lettura per autenticati"
  on members for select to authenticated using (true);

create policy "members: creazione per autenticati"
  on members for insert to authenticated with check (true);

create policy "members: modifica per autenticati"
  on members for update to authenticated using (true) with check (true);

create policy "azioni: lettura per autenticati"
  on quick_actions for select to authenticated using (true);

create policy "azioni: creazione per autenticati"
  on quick_actions for insert to authenticated with check (true);

-- Serve per il "elimina" dell'autore, che è un deleted_at e non una
-- cancellazione vera: il feed di chi era offline non deve avere buchi.
create policy "azioni: modifica per autenticati"
  on quick_actions for update to authenticated using (true) with check (true);

-- ------------------------------------------------------------- realtime
-- Senza questo il feed non si aggiorna da solo sugli altri telefoni.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'quick_actions'
  ) then
    alter publication supabase_realtime add table quick_actions;
  end if;
end $$;
