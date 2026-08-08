-- All41 — svuota tutto e riparti da zero.
--
-- ⚠️ NON SI TORNA INDIETRO. Cancella profili, punti, messaggi, foto,
-- spese, partite e Leggi scoperte. Resta in piedi solo la struttura: le
-- tabelle, le funzioni, le regole. E resta la riga del viaggio.
--
-- Da usare prima di far entrare il gruppo per davvero, per togliere di
-- mezzo i profili di prova: un profilo in piu' sballa i saldi delle
-- Spese di tutti e non si cancella da solo.
--
-- Da incollare nell'SQL Editor di Supabase ed eseguire.

-- L'ordine non conta grazie a `cascade`: truncate sui membri porta via
-- da solo tutto quello che li riferisce. Sono elencate lo stesso, per
-- rendere chiaro cosa sparisce leggendo il file invece di scoprirlo
-- dopo.
truncate table
  dama_games,
  impostore_games,
  mvp_days,
  voice_messages,
  documents,
  sheep_records,
  payments,
  expenses,
  challenges,
  leggi,
  point_events,
  photos,
  votes,
  quick_actions,
  members
restart identity cascade;

-- ⚠️ I FILE restano dove sono. truncate svuota le tabelle, non lo
-- storage: foto, vocali e documenti gia' caricati continuano a occupare
-- spazio nei bucket, semplicemente non li riferisce piu' nessuno.
-- Se si vuole fare pulizia anche li', si svuotano i bucket a mano dalla
-- pagina Storage — oppure si lasciano, che non danno fastidio a nessuno.

-- Il viaggio NON si tocca: le date, il nome e l'id restano, o l'app non
-- saprebbe piu' a quale viaggio appartiene niente.
select id, name, start_date, end_date from trips;
