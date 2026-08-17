-- All For One — la Dama, il gioco di coppia.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Sul database vive solo la lista delle mosse: la scacchiera, il turno e
-- il vincitore si ricavano rigiocandola sul telefono, come i saldi delle
-- Spese si ricavano dalle spese. L'unica cosa che non si ricava e' la
-- resa, che infatti ha la sua colonna.

create table if not exists dama_games (
  id             uuid primary key default gen_random_uuid(),
  trip_id        text not null references trips (id) on delete cascade,
  -- Chi ha sfidato e' il bianco e muove per primo: nella rivincita i
  -- colori si scambiano, e il vantaggio della prima mossa gira da solo.
  bianco         uuid not null references members (id) on delete cascade,
  nero           uuid not null references members (id) on delete cascade,
  mosse          text[] not null default '{}',
  -- 'in-corso' oppure 'abbandonata'. Non c'e' 'finita': una partita
  -- finita si riconosce dalle mosse, senza fidarsi di nessun telefono.
  stato          text not null default 'in-corso'
                   check (stato in ('in-corso', 'abbandonata')),
  abbandonata_da uuid references members (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists dama_recenti_idx
  on dama_games (trip_id, created_at desc);

alter table dama_games enable row level security;

-- ⚠️ Le regole di accesso di questa tabella NON stanno piu qui: stanno
-- in `regole-chiuse.sql`, insieme a tutte le altre.
--
-- Ci stavano, e dicevano `true`: chiunque avesse una sessione. Rilanciare
-- questo file dopo la chiusura del 17 agosto avrebbe rimesso quella regola
-- **accanto** a quella stretta, senza nessun errore — e Postgres le valuta
-- in OR, quindi avrebbe vinto la piu larga. La sorveglia
-- `prove/sql-una-sola-volta.mjs`.

-- Nessuna policy di update: le mosse passano SOLO dalla funzione qui
-- sotto. Due telefoni che muovono insieme non devono poter scrivere due
-- volte la stessa mossa.

-- Aggiunge una mossa. p_indice e' quante mosse il telefono aveva visto:
-- se nel frattempo ne e' arrivata un'altra, i conti non tornano e la
-- mossa viene rifiutata invece di sovrascrivere. Il turno si controlla
-- dalla parita' — il bianco muove sulle mosse pari — cosi' il database
-- non deve sapere le regole della Dama per rifiutare chi gioca fuori
-- turno. La legalita' della mossa la controlla il motore sul telefono:
-- vale il modello di fiducia dell'Impostore, il controllo sociale basta.
create or replace function gioca_dama(
  p_partita uuid,
  p_membro uuid,
  p_mossa text,
  p_indice int
)
returns dama_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g dama_games;
  quante int;
begin
  select * into g from dama_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;
  if g.stato <> 'in-corso' then raise exception 'La partita è chiusa.'; end if;
  if p_membro <> g.bianco and p_membro <> g.nero then
    raise exception 'Non è la tua partita.';
  end if;

  quante := coalesce(array_length(g.mosse, 1), 0);
  if quante <> p_indice then
    raise exception 'È già arrivata un''altra mossa.';
  end if;
  if (p_indice % 2 = 0 and p_membro <> g.bianco)
     or (p_indice % 2 = 1 and p_membro <> g.nero) then
    raise exception 'Non è il tuo turno.';
  end if;

  update dama_games
     set mosse = array_append(mosse, p_mossa),
         updated_at = now()
   where id = p_partita
  returning * into g;

  return g;
end $$;

-- La resa. Solo un giocatore della partita, solo da in-corso: premuta
-- due volte non abbandona due volte.
create or replace function abbandona_dama(
  p_partita uuid,
  p_membro uuid
)
returns dama_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g dama_games;
begin
  select * into g from dama_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;
  if p_membro <> g.bianco and p_membro <> g.nero then
    raise exception 'Non è la tua partita.';
  end if;

  if g.stato = 'in-corso' then
    update dama_games
       set stato = 'abbandonata',
           abbandonata_da = p_membro,
           updated_at = now()
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

-- ⚠️ Senza questo, le mosse dell'altro non arrivano.
--
-- Il realtime di Supabase non ascolta tutte le tabelle: ascolta quelle
-- iscritte alla pubblicazione, e le altre le ignora in silenzio. La
-- sottoscrizione dal telefono riesce lo stesso, non arriva nessun
-- errore, semplicemente non succede mai niente — e sembra che il gioco
-- sia rotto, mentre e' il database che non sta parlando.
--
-- Con la dama e' il difetto peggiore possibile: due persone davanti a
-- due telefoni, ognuna che aspetta la mossa dell'altra.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'dama_games'
  ) then
    alter publication supabase_realtime add table dama_games;
  end if;
end $$;

revoke execute on function gioca_dama(uuid, uuid, text, int) from public;
grant execute on function gioca_dama(uuid, uuid, text, int) to authenticated;
revoke execute on function abbandona_dama(uuid, uuid) from public;
grant execute on function abbandona_dama(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
