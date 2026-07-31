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

-- Voti. Per ora solo 'logistics' (sondaggio lampo); le altre categorie
-- arrivano con la caccia al tesoro e le proposte di punti.
create table if not exists votes (
  id          uuid primary key default gen_random_uuid(),
  trip_id     text not null references trips (id) on delete cascade,
  category    text not null check (category in
                ('logistics', 'point-proposal', 'photo-of-day', 'impostore')),
  question    text not null,
  options     text[] not null,
  anonymous   boolean not null default false,

  -- Conteggi aggregati: sono sempre la verità sul risultato.
  tally       int[] not null,
  -- Chi ha già votato, per impedire il doppio voto. Separato dalla
  -- preferenza apposta: per i voti anonimi è l'unica cosa che si salva.
  voted       uuid[] not null default '{}',
  -- Chi ha votato cosa. Resta vuoto quando anonymous = true, altrimenti
  -- l'anonimato sarebbe finto: chi apre il database vedrebbe tutto.
  ballots     jsonb not null default '{}'::jsonb,

  expires_at  timestamptz not null,
  closed_at   timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists votes_aperti_idx
  on votes (trip_id, closed_at, expires_at);

-- Album foto. Il file vive nello storage, qui resta il riferimento.
create table if not exists photos (
  id           uuid primary key default gen_random_uuid(),
  trip_id      text not null references trips (id) on delete cascade,
  author_id    uuid not null references members (id) on delete cascade,
  path         text not null,   -- percorso dentro il bucket
  url          text not null,
  width        int,
  height       int,
  challenge_id uuid,            -- caccia al tesoro, punto 8
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists photos_griglia_idx
  on photos (trip_id, created_at desc);

create index if not exists photos_limiti_idx
  on photos (author_id, created_at desc);

-- ---------------------------------------------------------------- storage
-- Bucket pubblico: i percorsi contengono un uuid, quindi non si indovinano,
-- ma chi ha il link vede la foto. È lo stesso modello di sicurezza del
-- resto dell'app — vale la pena saperlo, non è una svista.

insert into storage.buckets (id, name, public)
values ('foto', 'foto', true)
on conflict (id) do nothing;

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
alter table votes         enable row level security;
alter table photos        enable row level security;

drop policy if exists "trips: lettura per autenticati"    on trips;
drop policy if exists "members: lettura per autenticati"  on members;
drop policy if exists "members: creazione per autenticati" on members;
drop policy if exists "members: modifica per autenticati"  on members;
drop policy if exists "azioni: lettura per autenticati"    on quick_actions;
drop policy if exists "azioni: creazione per autenticati"  on quick_actions;
drop policy if exists "azioni: modifica per autenticati"   on quick_actions;
drop policy if exists "voti: lettura per autenticati"      on votes;
drop policy if exists "voti: creazione per autenticati"    on votes;
drop policy if exists "foto: lettura per autenticati"      on photos;
drop policy if exists "foto: creazione per autenticati"    on photos;
drop policy if exists "foto: modifica per autenticati"     on photos;

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

create policy "voti: lettura per autenticati"
  on votes for select to authenticated using (true);

create policy "voti: creazione per autenticati"
  on votes for insert to authenticated with check (true);

create policy "foto: lettura per autenticati"
  on photos for select to authenticated using (true);

create policy "foto: creazione per autenticati"
  on photos for insert to authenticated with check (true);

-- Serve per il "elimina" dell'autore: cancellazione morbida, non vera.
create policy "foto: modifica per autenticati"
  on photos for update to authenticated using (true) with check (true);

-- Permessi sul bucket. Lettura aperta perché il bucket è pubblico; la
-- scrittura richiede una sessione, anche anonima.
drop policy if exists "storage foto: lettura"     on storage.objects;
drop policy if exists "storage foto: caricamento" on storage.objects;

create policy "storage foto: lettura"
  on storage.objects for select using (bucket_id = 'foto');

create policy "storage foto: caricamento"
  on storage.objects for insert to authenticated with check (bucket_id = 'foto');

-- Nessuna policy di update: i voti non si modificano da fuori. Votare e
-- chiudere passano dalle due funzioni qui sotto, che girano dentro una
-- transazione con la riga bloccata. È la risposta alla domanda dello spec
-- "chi chiude un voto scaduto senza un server": il primo client che se ne
-- accorge, e se due ci provano insieme ne vince uno solo.

create or replace function vota(p_voto uuid, p_membro uuid, p_opzione int)
returns votes
language plpgsql
security definer
set search_path = public
as $$
declare
  v votes;
begin
  select * into v from votes where id = p_voto for update;

  if not found then raise exception 'Questo sondaggio non esiste.'; end if;
  if v.closed_at is not null then raise exception 'Il sondaggio è chiuso.'; end if;
  if now() >= v.expires_at then raise exception 'Il sondaggio è scaduto.'; end if;
  if p_membro = any(v.voted) then raise exception 'Hai già votato.'; end if;
  if p_opzione < 0 or p_opzione >= array_length(v.options, 1) then
    raise exception 'Opzione inesistente.';
  end if;

  -- Gli array in Postgres partono da 1, il client conta da 0.
  update votes
     set tally[p_opzione + 1] = tally[p_opzione + 1] + 1,
         voted = voted || p_membro,
         ballots = case
           when anonymous then ballots
           else ballots || jsonb_build_object(p_membro::text, p_opzione)
         end
   where id = p_voto
  returning * into v;

  return v;
end $$;

create or replace function chiudi_voto(p_voto uuid)
returns votes
language plpgsql
security definer
set search_path = public
as $$
declare
  v votes;
begin
  select * into v from votes where id = p_voto for update;
  if not found then raise exception 'Questo sondaggio non esiste.'; end if;

  -- Si chiude solo se è ancora aperto e davvero scaduto. Una seconda
  -- chiamata non fa niente invece di sovrascrivere l'ora di chiusura.
  if v.closed_at is null and now() >= v.expires_at then
    update votes set closed_at = now() where id = p_voto returning * into v;
  end if;

  return v;
end $$;

revoke execute on function vota(uuid, uuid, int) from public;
revoke execute on function chiudi_voto(uuid) from public;
grant execute on function vota(uuid, uuid, int) to authenticated;
grant execute on function chiudi_voto(uuid) to authenticated;

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

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'photos'
  ) then
    alter publication supabase_realtime add table photos;
  end if;
end $$;
