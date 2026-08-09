-- ====================================================================
-- TUTTO QUELLO CHE MANCA AL DATABASE, IN UN FILE SOLO
-- ====================================================================
--
-- Incollalo nell’SQL Editor di Supabase e premi Run. Una volta sola.
--
-- È rieseguibile: se l’hai già lanciato, rilanciarlo non rompe niente.
-- Se si ferma con un errore, i pezzi dopo NON sono stati eseguiti —
-- l’SQL Editor si ferma alla prima riga che fallisce. Correggi e
-- rilancia tutto da capo, non solo il pezzo che mancava.
--
-- In fondo c’è un controllo che stampa una tabella: quattro righe
-- tutte “a posto” vogliono dire che è andata.
--
-- ⚠️ GENERATO da strumenti/unisci-sql.mjs — non modificarlo a mano.
--    Gli originali sono i file qui accanto. Per rifarlo: npm run sql
--
-- Dentro, in quest’ordine: dama.sql, testimone.sql, apertura.sql, giro.sql, voto-unico.sql, rimborso-unico.sql

-- ====================================================================
-- dama.sql — La Dama: tabella, funzioni e — la parte che si dimentica — l’iscrizione al realtime
-- ====================================================================

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

drop policy if exists "dama: lettura per autenticati"   on dama_games;
drop policy if exists "dama: creazione per autenticati" on dama_games;

create policy "dama: lettura per autenticati"
  on dama_games for select to authenticated using (true);

create policy "dama: creazione per autenticati"
  on dama_games for insert to authenticated with check (true);

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

-- ====================================================================
-- testimone.sql — La colonna turno_da, cioè il testimone dei 30 secondi
-- ====================================================================

-- All For One — il testimone dell'Impostore.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Chiunque puo' far avanzare il turno — se a qualcuno si scarica il
-- telefono la partita non si blocca — ma per i primi trenta secondi puo'
-- farlo solo chi sta parlando.
--
-- ⚠️ Non e' il countdown che lo spec vieta, e la differenza conta: un
-- countdown mette fretta a chi parla, questo protegge chi parla da chi ha
-- il dito veloce. Alla scadenza non succede niente — nessun turno
-- saltato — si sblocca soltanto il tasto per gli altri.

-- Quando e' cominciato il turno in corso. Il default a now() vale anche
-- per le partite gia' aperte: al peggio il primo turno dopo
-- l'aggiornamento parte col testimone gia' scaduto, che non fa danno.
alter table impostore_games
  add column if not exists turno_da timestamptz not null default now();

-- La stessa funzione di prima, che adesso segna anche quando comincia il
-- turno nuovo. L'orario lo mette il database e non il telefono: sei
-- telefoni con sei orologi diversi darebbero sei conti alla rovescia
-- diversi, e quello indietro di un minuto sbloccherebbe il tasto a tutti
-- subito.
create or replace function avanza_impostore(
  p_partita uuid,
  p_turno_atteso int,
  p_ordine uuid[],
  p_turno int,
  p_giro int,
  p_stato text
)
returns impostore_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g impostore_games;
begin
  select * into g from impostore_games where id = p_partita for update;

  if not found then raise exception 'Questa partita non esiste.'; end if;

  if g.stato = 'in-corso' and g.turno = p_turno_atteso then
    update impostore_games
       set ordine = p_ordine,
           turno = p_turno,
           giro = p_giro,
           stato = p_stato,
           turno_da = now()
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function avanza_impostore(uuid, int, uuid[], int, int, text) from public;
grant execute on function avanza_impostore(uuid, int, uuid[], int, int, text) to authenticated;

notify pgrst, 'reload schema';

-- ====================================================================
-- apertura.sql — avvia_impostore con i giri: senza, l’Impostore non parte proprio
-- ====================================================================

-- All For One — il gruppo sceglie anche quanti giri.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Prima il voto d'apertura decideva solo quanti impostori, e i giri
-- erano fissi a due. Adesso si votano insieme, in una scelta sola: due
-- votazioni di fila sarebbero due momenti morti prima di cominciare, e
-- il secondo lo salterebbe meta' gruppo.

-- La vecchia firma sparisce: lasciarla in giro vorrebbe dire due
-- funzioni con lo stesso nome, e PostgREST sceglierebbe a caso quale
-- chiamare. Con `if exists` non protesta se non c'e'.
drop function if exists avvia_impostore(uuid, uuid[], jsonb, uuid[]);

create or replace function avvia_impostore(
  p_partita uuid,
  p_impostori uuid[],
  p_assegnazioni jsonb,
  p_ordine uuid[],
  p_giri int
)
returns impostore_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g impostore_games;
begin
  select * into g from impostore_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;

  -- Solo dalla preparazione: due telefoni che sorteggiano insieme
  -- darebbero due partite diverse alla stessa gente, e il secondo qui
  -- trova la partita gia' partita e non tocca niente.
  if g.stato = 'preparazione' then
    update impostore_games
       set impostori = p_impostori,
           assegnazioni = p_assegnazioni,
           ordine = p_ordine,
           -- coalesce per prudenza: un telefono con la versione vecchia
           -- dell'app manderebbe null, e i giri resterebbero quelli
           -- messi alla creazione invece di azzerarsi.
           giri_totali = coalesce(p_giri, giri_totali),
           stato = 'in-corso',
           turno_da = now()
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function avvia_impostore(uuid, uuid[], jsonb, uuid[], int) from public;
grant execute on function avvia_impostore(uuid, uuid[], jsonb, uuid[], int) to authenticated;

notify pgrst, 'reload schema';

-- ====================================================================
-- giro.sql — chiudi_accusa col giro vero: senza, il contatore resta su “Giro 1”
-- ====================================================================

-- All For One — il giro che sale, e il testimone che riparte.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.
-- Rieseguibile: se lo rilanci non rompe niente.
--
-- Due difetti nella stessa funzione, tutti e due invisibili:
--
-- 1. chiudi_accusa forzava `giro = 1` ogni volta che la partita
--    ripartiva. A schermo il contatore restava inchiodato: dopo tre giri
--    d'accusa continuava a dire "Giro 1", e nessuno capiva a che punto
--    fosse la serata.
--
-- 2. non toccava `turno_da`, quindi il testimone — i trenta secondi in
--    cui il turno lo passa solo chi parla — restava fermo al turno
--    precedente. Chi apriva un giro nuovo era gia' scaduto in partenza:
--    proprio la persona che il testimone doveva proteggere era l'unica
--    che non proteggeva.

drop function if exists chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid);

create or replace function chiudi_accusa(
  p_partita uuid,
  p_fuori uuid[],
  p_stato text,
  p_ordine uuid[],
  p_giri int,
  p_voto uuid,
  p_giro int default null
)
returns impostore_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g impostore_games;
begin
  select * into g from impostore_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;

  -- Vale solo dallo stato 'voto': due telefoni che chiudono la stessa
  -- accusa insieme eliminerebbero due volte, e il secondo trova la
  -- partita gia' andata avanti.
  if g.stato = 'voto' then
    update impostore_games
       set fuori = p_fuori,
           stato = p_stato,
           ordine = coalesce(p_ordine, ordine),
           giri_totali = coalesce(p_giri, giri_totali),
           turno = case when p_stato = 'in-corso' then 0 else turno end,
           -- Il giro che dice il motore, non un 1 fisso. Il coalesce
           -- copre un telefono con la versione vecchia dell'app, che
           -- questo parametro non lo manda.
           giro = case
                    when p_stato = 'in-corso' then coalesce(p_giro, giro + 1)
                    else giro
                  end,
           -- Il testimone riparte da adesso per chi apre il giro nuovo.
           turno_da = case when p_stato = 'in-corso' then now() else turno_da end,
           vote_id = p_voto,
           rivela_chiesta = '{}'
     where id = p_partita
    returning * into g;
  end if;

  return g;
end $$;

revoke execute on function chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid, int) from public;
grant execute on function chiudi_accusa(uuid, uuid[], text, uuid[], int, uuid, int) to authenticated;

notify pgrst, 'reload schema';

-- ====================================================================
-- voto-unico.sql — Un giro d’accusa apre UN voto solo, non uno per telefono
-- ====================================================================

-- All For One — un giro d'accusa, un voto solo.
--
-- Il problema. `apriVoto` faceva due cose in fila: prima l'INSERT del
-- voto, poi l'UPDATE della partita protetto da `vote_id is null`. La
-- protezione c'era, ma arrivava troppo tardi.
--
-- Sei telefoni vedono lo stato passare a 'voto' nello stesso istante,
-- ognuno con la sua copia dove `vote_id` è ancora nullo. Partono sei
-- `apriVoto`. L'UPDATE lo vince uno solo — quello sì — ma le SEI righe in
-- `votes` sono già state scritte tutte. Cinque sondaggi orfani per ogni
-- giro d'accusa, aperti e votabili per chi ne conosce l'id.
--
-- Nell'interfaccia non si vedevano, e per un po' è sembrato innocuo. Non
-- lo è: da quando i giri di una partita si ritrovano per finestra
-- temporale — i voti di categoria `impostore` fra questa partita e la
-- successiva — quegli orfani **cadono dentro la finestra** e vengono
-- contati come giri. Le loro schede sono vuote, quindi non regalano punti
-- a nessuno, ma gonfiano il conto su cui `giriTuttiNoti` decide se il
-- finale può dire "nessuno ha indovinato".
--
-- La correzione è la stessa forma di tutte le altre scritture concorrenti
-- di questo progetto: **una funzione sola, con la riga bloccata**. Chi
-- arriva secondo non crea niente e si ritrova quello vero.

create or replace function apri_voto_impostore(
  p_partita uuid,
  p_viaggio text,
  p_opzioni text[],
  p_scade timestamptz
)
returns impostore_games
language plpgsql
security definer
set search_path = public
as $$
declare
  g impostore_games;
  v uuid;
begin
  -- `for update` blocca la riga: gli altri cinque aspettano qui, e quando
  -- passano trovano vote_id già pieno.
  select * into g from impostore_games where id = p_partita for update;
  if not found then raise exception 'Questa partita non esiste.'; end if;

  -- Chi arriva secondo esce senza scrivere. Non è un errore: è la
  -- risposta giusta, e chi l'ha ricevuta si ritrova la partita vera.
  if g.stato <> 'voto' or g.vote_id is not null then
    return g;
  end if;

  if p_opzioni is null or array_length(p_opzioni, 1) is null then
    raise exception 'Un voto senza opzioni non si apre.';
  end if;

  insert into votes (trip_id, category, question, options, anonymous, tally, expires_at)
  values (
    p_viaggio,
    'impostore',
    'Chi e’ l’impostore?',
    p_opzioni,
    -- Mai anonimo: senza sapere chi ha votato chi non si può dare il
    -- punto a chi ha indovinato.
    false,
    (select coalesce(array_agg(0), '{}') from generate_series(1, array_length(p_opzioni, 1))),
    p_scade
  )
  returning id into v;

  update impostore_games set vote_id = v where id = p_partita returning * into g;

  return g;
end $$;

revoke execute on function apri_voto_impostore(uuid, text, text[], timestamptz) from public;
grant execute on function apri_voto_impostore(uuid, text, text[], timestamptz) to authenticated;

notify pgrst, 'reload schema';

-- ====================================================================
-- rimborso-unico.sql — Un rimborso registrato una volta sola, non una per telefono
-- ====================================================================

-- All For One — un rimborso registrato una volta sola.
--
-- Il problema. Il tasto «Salda» ce l'hanno in mano tutti e due: chi paga e
-- chi incassa. È voluto — se i contanti te li mette in mano lui, l'app
-- aperta ce l'hai tu — ma vuol dire che lo stesso passaggio di soldi può
-- essere registrato due volte, una per telefono, nel giro di pochi secondi.
--
-- Un debito di 30 € saldato due volte sposta il saldo di 60 € nella
-- direzione sbagliata su due persone: chi doveva dare risulta in credito,
-- chi doveva ricevere risulta a meno trenta. E per accorgersene bisogna
-- aprire la scheda Rimborsi e notare due righe identiche con la stessa
-- data — cioè non se ne accorge nessuno fino alla sera dei conti.
--
-- La correzione è la stessa forma di ogni altra scrittura concorrente del
-- progetto: passa da una funzione, con la finestra guardata dentro una
-- transazione invece che da due telefoni che non si vedono.
--
-- ⚠️ LA SCELTA, detta chiara. Due rimborsi identici — stesse persone,
-- stesso importo — a meno di due minuti l'uno dall'altro sono considerati
-- lo stesso rimborso, e il secondo restituisce il primo invece di
-- aggiungerne un altro.
--
-- È una scelta, non una verità: due passaggi veri di 30 € fra le stesse
-- due persone nello stesso paio di minuti esistono in teoria. Ma il danno
-- dei due casi non è simmetrico. Un doppione silenzioso sposta 60 € e non
-- lo scopre nessuno fino alla fine; un secondo pagamento vero rifiutato lo
-- si vede subito — il saldo non si muove come ci si aspetta — e si
-- riregistra fra due minuti. Si sbaglia dalla parte che si vede.

create or replace function registra_rimborso(
  p_viaggio text,
  p_da uuid,
  p_a uuid,
  p_centesimi int,
  p_minuti int default 2
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  r payments;
begin
  if p_da = p_a then
    raise exception 'Un rimborso a se stessi non vuol dire niente.';
  end if;
  if p_centesimi is null or p_centesimi <= 0 then
    raise exception 'Un rimborso deve avere un importo.';
  end if;

  -- Ce n'è già uno uguale, appena registrato? Allora è lo stesso, e il
  -- secondo telefono si riprende quello invece di scriverne un altro.
  select * into r
    from payments
   where trip_id = p_viaggio
     and from_member = p_da
     and to_member = p_a
     and amount_cents = p_centesimi
     and deleted_at is null
     and created_at > now() - make_interval(mins => p_minuti)
   order by created_at desc
   limit 1;

  if found then
    return r;
  end if;

  insert into payments (trip_id, from_member, to_member, amount_cents)
  values (p_viaggio, p_da, p_a, p_centesimi)
  returning * into r;

  return r;
end $$;

revoke execute on function registra_rimborso(text, uuid, uuid, int, int) from public;
grant execute on function registra_rimborso(text, uuid, uuid, int, int) to authenticated;

notify pgrst, 'reload schema';


-- ====================================================================
-- È ANDATA? Quattro righe, tutte devono dire "a posto".
-- ====================================================================

select
  'La Dama esiste' as cosa,
  case when to_regclass('public.dama_games') is not null
       then 'a posto' else 'MANCA — rilancia il file' end as com_e
union all
select
  'La Dama parla in tempo reale',
  case when exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and tablename = 'dama_games')
       then 'a posto'
       else 'MANCA — le mosse dell''altro non arriveranno mai' end
union all
select
  'Il testimone dei 30 secondi',
  case when exists (
         select 1 from information_schema.columns
         where table_name = 'impostore_games' and column_name = 'turno_da')
       then 'a posto' else 'MANCA — il tasto resta libero per tutti' end
union all
select
  'L''Impostore parte e conta i giri',
  case when exists (
         select 1 from pg_proc
         where proname = 'avvia_impostore' and pronargs = 5)
       and exists (
         select 1 from pg_proc
         where proname = 'chiudi_accusa' and pronargs = 7)
       then 'a posto' else 'MANCA — la partita non parte o resta su Giro 1' end
union all
select
  'Un giro apre un voto solo',
  case when exists (
         select 1 from pg_proc
         where proname = 'apri_voto_impostore' and pronargs = 4)
       then 'a posto'
       else 'MANCA — ogni giro lascia in giro un sondaggio orfano per telefono' end
union all
select
  'Un rimborso si registra una volta sola',
  case when exists (
         select 1 from pg_proc
         where proname = 'registra_rimborso' and pronargs = 5)
       then 'a posto'
       else 'MANCA — lo stesso rimborso puo essere registrato da tutti e due' end
;
