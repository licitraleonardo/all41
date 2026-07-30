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

-- ------------------------------------------------------------------ seed

insert into trips (id, name, start_date, end_date)
values ('sardegna-2026', 'Sardegna', '2026-08-12', '2026-08-16')
on conflict (id) do nothing;

-- --------------------------------------------------------------- sicurezza
-- Il modello dello spec: serve una sessione (anche anonima) per leggere o
-- scrivere. Chiude la porta a scanner e bot, non separa i membri fra loro.

alter table trips   enable row level security;
alter table members enable row level security;

drop policy if exists "trips: lettura per autenticati"    on trips;
drop policy if exists "members: lettura per autenticati"  on members;
drop policy if exists "members: creazione per autenticati" on members;
drop policy if exists "members: modifica per autenticati"  on members;

create policy "trips: lettura per autenticati"
  on trips for select to authenticated using (true);

create policy "members: lettura per autenticati"
  on members for select to authenticated using (true);

create policy "members: creazione per autenticati"
  on members for insert to authenticated with check (true);

create policy "members: modifica per autenticati"
  on members for update to authenticated using (true) with check (true);
