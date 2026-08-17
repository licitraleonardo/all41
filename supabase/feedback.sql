-- Quello che avete da dire sull'app, scritto mentre vi viene.
--
-- ⚠️ Questa tabella si scrive e NON si rilegge, ed è l'unica dell'app
-- fatta così.
--
-- Non c'è nessuna policy di `select`: quello che uno scrive non deve
-- comparire agli altri sette. Se comparisse, la metà delle cose non
-- verrebbero scritte — nessuno segnala «questa schermata non si capisce»
-- sapendo che lo legge il gruppo. Si legge da riga di comando, con
-- `npm run sql:lancia`, e basta.
--
-- `author_id` è nullable e senza `on delete cascade` verso il nulla: se
-- un profilo sparisce, quello che ha scritto resta. È una segnalazione
-- sull'app, non un messaggio suo.

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  trip_id     text not null references trips(id),
  author_id   uuid references members(id) on delete set null,
  testo       text not null,
  -- Quale schermata stava guardando: senza, metà delle segnalazioni
  -- diventano indovinelli. Lo mette l'app, non chi scrive.
  dove        text,
  created_at  timestamptz not null default now()
);

alter table feedback enable row level security;

-- Solo insert. Nessun select, nessun update, nessun delete: quello che è
-- stato scritto non si ritira e non si legge dall'app.
-- ⚠️ Le regole di accesso di questa tabella NON stanno piu qui: stanno
-- in `regole-chiuse.sql`, insieme a tutte le altre.
--
-- Ci stavano, e dicevano `true`: chiunque avesse una sessione. Rilanciare
-- questo file dopo la chiusura del 17 agosto avrebbe rimesso quella regola
-- **accanto** a quella stretta, senza nessun errore — e Postgres le valuta
-- in OR, quindi avrebbe vinto la piu larga. La sorveglia
-- `prove/sql-una-sola-volta.mjs`.
