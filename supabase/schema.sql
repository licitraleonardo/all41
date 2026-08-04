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

-- ------------------------------------------------------------ punti
-- Ogni punto dell'app passa da qui. Nessuna sezione tocca members.score
-- direttamente: il punteggio e il suo storico devono restare d'accordo.

create table if not exists point_events (
  id          uuid primary key default gen_random_uuid(),
  trip_id     text not null references trips (id) on delete cascade,
  member_id   uuid not null references members (id) on delete cascade,
  points      int not null,
  reason      text not null,
  rule_id     text,
  vote_id     uuid references votes (id) on delete set null,

  -- Chi ha proposto, quando i punti li propone qualcun altro. Serve alle
  -- Leggi XII e XIII, che premiano o puniscono il proponente e non chi
  -- riceve i punti.
  proposed_by uuid references members (id) on delete set null,
  status      text not null default 'approved'
              check (status in ('approved', 'pending', 'rejected')),

  -- La chiave anti-doppione. Senza server, la chiusura di un voto o il
  -- rilevamento di una regola avviene sul client di chi apre l'app in quel
  -- momento: se due persone la aprono insieme, entrambi i client rilevano
  -- lo stesso evento. Con una chiave deterministica la seconda scrittura
  -- non fa niente invece di accreditare due volte.
  -- Resta null per i punti assegnati a mano, che non si deduplicano.
  dedupe_key  text unique,

  created_at  timestamptz not null default now()
);

create index if not exists point_events_classifica_idx
  on point_events (trip_id, created_at desc);

create index if not exists point_events_membro_idx
  on point_events (member_id, created_at desc);

-- Stato delle sfide della caccia al tesoro. Come per le Leggi, il testo
-- vive nel codice: qui resta solo chi ha vinto e quando si è chiusa.
create table if not exists challenges (
  trip_id       text not null references trips (id) on delete cascade,
  challenge_id  text not null,
  won_by_photo  uuid references photos (id) on delete set null,
  won_by_member uuid references members (id) on delete set null,
  closed_at     timestamptz not null default now(),
  primary key (trip_id, challenge_id)
);

-- Stato di scoperta delle Leggi. Il testo sta nel codice, qui c'è solo
-- chi l'ha fatta scattare per primo e quando.
create table if not exists leggi (
  trip_id       text not null references trips (id) on delete cascade,
  legge_id      text not null,
  discovered_at timestamptz not null default now(),
  discovered_by uuid references members (id) on delete set null,
  primary key (trip_id, legge_id)
);

-- ------------------------------------------------------------ spese
-- Due tipi di fatto, e nient'altro: quello che è stato speso e quello che
-- è stato restituito. I saldi si calcolano da questi, non si salvano —
-- così non esiste nessun flag "pagato" da tenere in vita quando i conti
-- si rifanno. Se hai saldato, registri un pagamento e il debito sparisce
-- da solo.
--
-- Gli importi sono centesimi interi. In virgola mobile una cena divisa
-- per tre lascia mezzo centesimo in giro a ogni riga, e dopo cinque
-- giorni i conti fra otto persone non tornano più.

-- paid_by e split_among sono due elenchi di persone, non due riferimenti:
-- una spesa può essere stata pagata in più di uno (il van, il pieno) e
-- l'importo si divide fra chi ha messo i soldi esattamente come si divide
-- fra chi l'ha consumata.
--
-- Sugli elenchi non c'è vincolo di chiave esterna — un uuid[] non può
-- averlo — quindi chi sparisce dal gruppo resta scritto qui dentro. Se ne
-- occupa il calcolo dei saldi, che ignora gli id che non conosce.
--
-- coalesce perché array_length su un array vuoto dà null, e un check che
-- vale null passa: senza, "pagata da nessuno" entrerebbe.
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  trip_id      text not null references trips (id) on delete cascade,
  description  text not null,
  amount_cents int not null check (amount_cents > 0),
  paid_by      uuid[] not null
               constraint expenses_paganti_non_vuoto
               check (coalesce(array_length(paid_by, 1), 0) > 0),
  split_among  uuid[] not null
               check (coalesce(array_length(split_among, 1), 0) > 0),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists expenses_viaggio_idx
  on expenses (trip_id, created_at desc);

-- Rimborsi realmente avvenuti: "ti ho dato 12€ in contanti ieri". È un
-- fatto accaduto, non lo stato di una riga calcolata.
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  trip_id      text not null references trips (id) on delete cascade,
  from_member  uuid not null references members (id) on delete cascade,
  to_member    uuid not null references members (id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (from_member <> to_member)
);

create index if not exists payments_viaggio_idx
  on payments (trip_id, created_at desc);

-- ------------------------------------------------------------ pecora
-- Il record del gioco di Al. Una riga per persona e per giornata, col
-- meglio che ha fatto quel giorno: da qui escono sia il record del
-- giorno (che si azzera da solo, perché domani è un'altra riga) sia
-- quello del viaggio (il massimo di tutte), senza salvare nessuno dei
-- due come dato a parte.
--
-- Otto persone per cinque giorni fanno quaranta righe in tutto.
create table if not exists sheep_records (
  trip_id    text not null references trips (id) on delete cascade,
  member_id  uuid not null references members (id) on delete cascade,
  giorno     date not null,
  punteggio  int not null check (punteggio >= 0),
  updated_at timestamptz not null default now(),
  primary key (trip_id, member_id, giorno)
);

create index if not exists sheep_records_giorno_idx
  on sheep_records (trip_id, giorno, punteggio desc);

-- ------------------------------------------------------------ documenti
-- QR dell'escursione, biglietti del traghetto, PDF delle prenotazioni:
-- oggi vivono sepolti nella chat di uno solo, e servono sempre nel
-- momento peggiore.
--
-- Condivisi di default. `solo_per_me` esiste per le poche cose personali,
-- ma NON e' una cassaforte: chi apre il database li vede tutti. Il nome
-- della sezione e i testi lo dicono chiaramente — promettere una privacy
-- che l'app non puo' mantenere e' peggio che non offrirla.
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  trip_id     text not null references trips (id) on delete cascade,
  owner_id    uuid not null references members (id) on delete cascade,
  titolo      text not null,
  path        text not null,   -- percorso dentro il bucket
  url         text not null,
  mime_type   text not null,
  byte        int,
  solo_per_me boolean not null default false,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists documents_viaggio_idx
  on documents (trip_id, created_at desc);

-- ------------------------------------------------------------ adeguamenti
--
-- "create table if not exists" crea la tabella la prima volta e poi non
-- fa più niente: su un database dove la tabella esiste già, le colonne
-- aggiunte dopo non comparirebbero mai. Vanno dichiarate qui.
--
-- Ogni colonna aggiunta a una tabella esistente va messa in questo
-- elenco, altrimenti funziona solo per chi parte da zero.

alter table point_events add column if not exists proposed_by uuid
  references members (id) on delete set null;

alter table members add column if not exists last_known_location jsonb;

-- Gli id delle sfide sono etichette leggibili ('faro', 'seada'), non
-- uuid: la colonna nasceva uuid e va convertita dove esiste già.
alter table photos add column if not exists challenge_id text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'photos' and column_name = 'challenge_id' and data_type = 'uuid'
  ) then
    alter table photos alter column challenge_id type text using challenge_id::text;
  end if;
end $$;

create index if not exists photos_sfida_idx
  on photos (trip_id, challenge_id) where challenge_id is not null;

alter table votes add column if not exists ballots jsonb not null default '{}'::jsonb;

-- A quale sfida appartiene un voto foto-del-giorno.
alter table votes add column if not exists challenge_id text;

create index if not exists votes_sfida_idx
  on votes (trip_id, challenge_id) where challenge_id is not null;

-- Una spesa può essere stata pagata in più di uno: paid_by nasceva come
-- un riferimento singolo e diventa un elenco. Le spese già registrate si
-- convertono da sole, ognuna col suo unico pagante dentro un elenco di
-- uno — nessuna riga si perde e nessun saldo cambia.
--
-- Prima va tolta la chiave esterna: un uuid[] non può averla.
alter table expenses drop constraint if exists expenses_paid_by_fkey;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'expenses' and column_name = 'paid_by' and data_type = 'uuid'
  ) then
    alter table expenses alter column paid_by type uuid[] using array[paid_by];
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'expenses_paganti_non_vuoto'
  ) then
    alter table expenses add constraint expenses_paganti_non_vuoto
      check (coalesce(array_length(paid_by, 1), 0) > 0);
  end if;
end $$;

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
alter table point_events  enable row level security;
alter table leggi         enable row level security;
alter table challenges    enable row level security;
alter table expenses      enable row level security;
alter table payments      enable row level security;
alter table sheep_records enable row level security;
alter table documents     enable row level security;

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
drop policy if exists "punti: lettura per autenticati"     on point_events;
drop policy if exists "leggi: lettura per autenticati"     on leggi;
drop policy if exists "sfide: lettura per autenticati"     on challenges;
drop policy if exists "spese: lettura per autenticati"     on expenses;
drop policy if exists "spese: creazione per autenticati"   on expenses;
drop policy if exists "spese: modifica per autenticati"    on expenses;
drop policy if exists "rimborsi: lettura per autenticati"  on payments;
drop policy if exists "rimborsi: creazione per autenticati" on payments;
drop policy if exists "rimborsi: modifica per autenticati" on payments;
drop policy if exists "pecora: lettura per autenticati"    on sheep_records;
drop policy if exists "documenti: lettura per autenticati"   on documents;
drop policy if exists "documenti: creazione per autenticati" on documents;
drop policy if exists "documenti: modifica per autenticati"  on documents;

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

-- Punti e Leggi si leggono, non si scrivono da fuori: passano solo dalle
-- funzioni qui sotto. Altrimenti chiunque potrebbe regalarsi cento punti
-- lasciando lo storico muto, ed è proprio quello che il motore deve
-- impedire.
create policy "punti: lettura per autenticati"
  on point_events for select to authenticated using (true);

create policy "leggi: lettura per autenticati"
  on leggi for select to authenticated using (true);

create policy "sfide: lettura per autenticati"
  on challenges for select to authenticated using (true);

-- Le spese non passano da nessuna funzione: qui non c'è niente da
-- proteggere dal furbo di turno, perché non danno punti e non entrano in
-- classifica. È l'unica sezione dove il database è solo un quaderno.
-- La modifica serve al "elimina" dell'autore, che resta morbido come
-- altrove: un importo sbagliato si toglie, non si riscrive la storia.
create policy "spese: lettura per autenticati"
  on expenses for select to authenticated using (true);

create policy "spese: creazione per autenticati"
  on expenses for insert to authenticated with check (true);

create policy "spese: modifica per autenticati"
  on expenses for update to authenticated using (true) with check (true);

create policy "rimborsi: lettura per autenticati"
  on payments for select to authenticated using (true);

create policy "rimborsi: creazione per autenticati"
  on payments for insert to authenticated with check (true);

create policy "rimborsi: modifica per autenticati"
  on payments for update to authenticated using (true) with check (true);

-- Il record della pecora si legge, non si scrive da fuori: passa dalla
-- funzione qui sotto, che non lo lascia mai scendere. Da questo record
-- dipendono due Leggi, quindi vale la stessa regola dei punti.
create policy "pecora: lettura per autenticati"
  on sheep_records for select to authenticated using (true);

-- I documenti si leggono tutti: il "solo per me" e' un filtro nella
-- schermata, non una serratura, e i testi dell'app lo dicono. Nascondere
-- qui sarebbe promettere una privacy che questo modello di sicurezza non
-- puo' mantenere comunque — chi apre il database li vedrebbe lo stesso.
create policy "documenti: lettura per autenticati"
  on documents for select to authenticated using (true);

create policy "documenti: creazione per autenticati"
  on documents for insert to authenticated with check (true);

create policy "documenti: modifica per autenticati"
  on documents for update to authenticated using (true) with check (true);

-- Tiene solo il meglio della giornata: due partite di fila non si
-- sovrascrivono l'una con l'altra, e un punteggio più basso non abbassa
-- quello già segnato.
create or replace function segna_pecora(
  p_membro uuid,
  p_punti int,
  p_giorno date
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finale int;
begin
  insert into sheep_records (trip_id, member_id, giorno, punteggio)
  values ('sardegna-2026', p_membro, p_giorno, greatest(p_punti, 0))
  on conflict (trip_id, member_id, giorno) do update
    set punteggio = greatest(sheep_records.punteggio, excluded.punteggio),
        updated_at = now()
  returning punteggio into v_finale;

  return v_finale;
end $$;

-- Chiude una sfida assegnandola a chi ha vinto. Una sola volta: se due
-- telefoni la risolvono insieme, il secondo trova la riga già lì e non
-- fa niente. Restituisce true solo a chi ha vinto la corsa, così i punti
-- li assegna uno solo.
create or replace function chiudi_sfida(
  p_sfida text,
  p_membro uuid,
  p_foto uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viaggio text;
  righe int;
begin
  select trip_id into viaggio from members where id = p_membro;
  if not found then raise exception 'Questa persona non esiste.'; end if;

  insert into challenges (trip_id, challenge_id, won_by_photo, won_by_member)
  values (viaggio, p_sfida, p_foto, p_membro)
  on conflict (trip_id, challenge_id) do nothing;

  get diagnostics righe = row_count;
  return righe > 0;
end $$;

revoke execute on function chiudi_sfida(text, uuid, uuid) from public;
grant execute on function chiudi_sfida(text, uuid, uuid) to authenticated;

-- Apre il voto di una sfida quando le foto in gara diventano due, e ci
-- aggiunge quelle che arrivano dopo.
--
-- Le opzioni si accodano in fondo e mai in mezzo: gli indici già votati
-- non si spostano, quindi chi ha votato prima non si ritrova il voto su
-- una foto diversa.
--
-- anonymous = true: si salvano solo i conteggi e l'elenco di chi ha
-- votato, mai chi ha votato cosa. È l'unico modo perché l'anonimato sia
-- vero e non solo nascosto dall'interfaccia.
create or replace function assicura_voto_sfida(
  p_sfida text,
  p_foto uuid[],
  p_scadenza timestamptz,
  p_membro uuid
)
returns votes
language plpgsql
security definer
set search_path = public
as $$
declare
  v votes;
  viaggio text;
  f uuid;
begin
  select trip_id into viaggio from members where id = p_membro;
  if not found then raise exception 'Questa persona non esiste.'; end if;

  select * into v from votes
   where trip_id = viaggio and challenge_id = p_sfida and closed_at is null
     for update;

  if not found then
    if coalesce(array_length(p_foto, 1), 0) < 2 then return null; end if;

    insert into votes (trip_id, category, question, options, anonymous, tally,
                       challenge_id, expires_at)
    values (viaggio, 'photo-of-day', 'Quale vince?',
            (select array_agg(x::text) from unnest(p_foto) as x),
            true,
            (select array_agg(0) from unnest(p_foto)),
            p_sfida, p_scadenza)
    returning * into v;

    return v;
  end if;

  -- Voto già aperto: si accodano solo le foto che non ci sono ancora.
  foreach f in array p_foto loop
    if not (f::text = any(v.options)) then
      update votes
         set options = options || f::text,
             tally = tally || 0
       where id = v.id
      returning * into v;
    end if;
  end loop;

  return v;
end $$;

revoke execute on function assicura_voto_sfida(text, uuid[], timestamptz, uuid) from public;
grant execute on function assicura_voto_sfida(text, uuid[], timestamptz, uuid) to authenticated;

-- Il motore punti: scrive l'evento e aggiorna il punteggio nella stessa
-- transazione, così storico e totale non possono divergere.
-- La firma è cambiata strada facendo (è arrivato proposed_by). Senza
-- questa riga resterebbero due funzioni con lo stesso nome e la chiamata
-- diventerebbe ambigua.
drop function if exists assegna_punti(uuid, int, text, text, text, uuid, text);

create or replace function assegna_punti(
  p_membro uuid,
  p_punti int,
  p_motivo text,
  p_regola text default null,
  p_chiave text default null,
  p_voto uuid default null,
  p_stato text default 'approved',
  p_proposto_da uuid default null
)
returns point_events
language plpgsql
security definer
set search_path = public
as $$
declare
  e point_events;
  viaggio text;
begin
  select trip_id into viaggio from members where id = p_membro;
  if not found then raise exception 'Questa persona non esiste.'; end if;

  insert into point_events
    (trip_id, member_id, points, reason, rule_id, vote_id, status, dedupe_key, proposed_by)
  values
    (viaggio, p_membro, p_punti, p_motivo, p_regola, p_voto, p_stato, p_chiave, p_proposto_da)
  on conflict (dedupe_key) do nothing
  returning * into e;

  -- Niente riga = la chiave c'era già: qualcun altro ha assegnato lo
  -- stesso punto un istante prima. Si restituisce quello, senza toccare
  -- il punteggio una seconda volta.
  if not found then
    select * into e from point_events where dedupe_key = p_chiave;
    return e;
  end if;

  -- Le proposte in attesa di voto non muovono ancora la classifica.
  if e.status = 'approved' then
    update members set score = score + p_punti where id = p_membro;
  end if;

  return e;
end $$;

-- Una Legge si scopre quando scatta, e da quel momento è svelata per
-- tutto il gruppo. Restituisce true solo alla prima volta, così chi
-- chiama sa se deve dare il punto extra della Legge XXII.
create or replace function scopri_legge(p_legge text, p_membro uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viaggio text;
  righe int;
begin
  select trip_id into viaggio from members where id = p_membro;
  if not found then raise exception 'Questa persona non esiste.'; end if;

  insert into leggi (trip_id, legge_id, discovered_by)
  values (viaggio, p_legge, p_membro)
  on conflict (trip_id, legge_id) do nothing;

  get diagnostics righe = row_count;
  return righe > 0;
end $$;

-- Chiude una proposta di punti e ne applica l'esito, tutto insieme.
-- Bloccando sia il voto sia l'evento in attesa, due telefoni che aprono
-- l'app nello stesso istante non possono approvare due volte: il secondo
-- non trova più niente in attesa.
create or replace function risolvi_proposta(p_voto uuid)
returns point_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v votes;
  e point_events;
  si int;
  no int;
  votanti int;
  totale int;
begin
  select * into v from votes where id = p_voto for update;
  if not found then return null; end if;

  select * into e from point_events
   where vote_id = p_voto and status = 'pending'
     for update;
  if not found then return null; end if; -- già risolta da qualcun altro

  select count(*) into totale from members where trip_id = v.trip_id;
  votanti := coalesce(array_length(v.voted, 1), 0);

  -- Si chiude allo scadere, oppure prima se hanno votato tutti: non ha
  -- senso far aspettare un'ora quando la risposta c'è già.
  if v.closed_at is null and (votanti >= totale or now() >= v.expires_at) then
    update votes set closed_at = now() where id = p_voto returning * into v;
  end if;
  if v.closed_at is null then return null; end if; -- non è ancora ora

  si := coalesce(v.tally[1], 0);
  no := coalesce(v.tally[2], 0);

  -- Quorum: se ha votato meno di metà gruppo la proposta si annulla. Non
  -- è stata bocciata, semplicemente non l'ha guardata nessuno.
  if votanti * 2 < totale then
    update point_events set status = 'rejected' where id = e.id returning * into e;
    return e;
  end if;

  -- Il pareggio vale come bocciatura: i punti non si muovono. Chi ha
  -- proposto se la vede con la Legge XI.
  if si > no then
    update point_events set status = 'approved' where id = e.id returning * into e;
    update members set score = score + e.points where id = e.member_id;
  else
    update point_events set status = 'rejected' where id = e.id returning * into e;
  end if;

  return e;
end $$;

revoke execute on function risolvi_proposta(uuid) from public;
grant execute on function risolvi_proposta(uuid) to authenticated;

revoke execute on function assegna_punti(uuid, int, text, text, text, uuid, text, uuid) from public;
revoke execute on function scopri_legge(text, uuid) from public;
grant execute on function assegna_punti(uuid, int, text, text, text, uuid, text, uuid) to authenticated;
grant execute on function scopri_legge(text, uuid) to authenticated;

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

  -- La classifica si muove sotto gli occhi di tutti mentre si gioca.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'point_events'
  ) then
    alter publication supabase_realtime add table point_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'members'
  ) then
    alter publication supabase_realtime add table members;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'leggi'
  ) then
    alter publication supabase_realtime add table leggi;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'challenges'
  ) then
    alter publication supabase_realtime add table challenges;
  end if;

  -- Chi paga il ristorante la registra al tavolo: gli altri devono
  -- vederla comparire senza ricaricare.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table expenses;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table payments;
  end if;

  -- Chi batte il record lo vede comparire sugli altri telefoni mentre
  -- sono ancora in spiaggia.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sheep_records'
  ) then
    alter publication supabase_realtime add table sheep_records;
  end if;
end $$;

-- ---------------------------------------------------------------- storage
--
-- Sta in fondo di proposito, ed è l'unico pezzo che può fallire senza
-- fermare il resto. Su certi progetti lo schema `storage` appartiene a un
-- altro utente e queste istruzioni danno "must be owner of table objects":
-- se succede, tutto il resto è comunque già stato creato, e il bucket si
-- fa a mano da Storage → New bucket, nome `foto`, spuntando "Public".
--
-- Bucket pubblico: i percorsi contengono un uuid, quindi non si indovinano,
-- ma chi ha il link vede la foto. È lo stesso modello di sicurezza del
-- resto dell'app — vale la pena saperlo, non è una svista.

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('foto', 'foto', true)
  on conflict (id) do nothing;
exception when others then
  raise notice 'Bucket non creato (%). Crealo a mano: Storage -> New bucket, nome foto, Public.', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "storage foto: lettura"     on storage.objects;
  drop policy if exists "storage foto: caricamento" on storage.objects;

  create policy "storage foto: lettura"
    on storage.objects for select using (bucket_id = 'foto');

  create policy "storage foto: caricamento"
    on storage.objects for insert to authenticated with check (bucket_id = 'foto');
exception when others then
  raise notice 'Permessi sul bucket non impostati (%). Se le foto si caricano, va bene cosi.', sqlerrm;
end $$;

-- Bucket dei documenti, separato dalle foto: qui dentro ci sono anche
-- PDF, e i due posti hanno regole diverse su cosa si accetta.
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('documenti', 'documenti', true)
  on conflict (id) do nothing;
exception when others then
  raise notice 'Bucket documenti non creato (%). Crealo a mano: Storage -> New bucket, nome documenti, Public.', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "storage documenti: lettura"     on storage.objects;
  drop policy if exists "storage documenti: caricamento" on storage.objects;

  create policy "storage documenti: lettura"
    on storage.objects for select using (bucket_id = 'documenti');

  create policy "storage documenti: caricamento"
    on storage.objects for insert to authenticated with check (bucket_id = 'documenti');
exception when others then
  raise notice 'Permessi sul bucket documenti non impostati (%). Se si caricano, va bene cosi.', sqlerrm;
end $$;

-- PostgREST tiene in memoria le firme delle funzioni: dopo averle
-- cambiate va avvisato, altrimenti continua a cercare quella vecchia e
-- risponde "function does not exist" anche se la nuova esiste.
notify pgrst, 'reload schema';
