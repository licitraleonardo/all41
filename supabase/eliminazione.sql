-- All For One — questo file NON SERVE PIÙ. Non lanciarlo.
--
-- È rimasto qui apposta invece di essere cancellato: era citato in
-- `SESSIONE-5-6-AGOSTO.md` come "da lanciare", e un file che sparisce
-- lascia un'istruzione che punta nel vuoto. Così invece chi ci arriva
-- legge perché non serve, e se lo esegue non succede niente.
--
-- Conteneva due cose, e tutte e due hanno trovato una casa migliore:
--
--   * la colonna `fuori` → sta negli adeguamenti di `schema.sql`
--   * la funzione `chiudi_accusa` → sta in `giro.sql`, nella versione
--     nuova che sa anche il numero del giro
--
-- ⚠️ E la seconda era una trappola. Qui dentro `chiudi_accusa` aveva sei
-- argomenti, quella di `giro.sql` ne ha sette. Postgres distingue le
-- funzioni per firma, quindi rilanciando questo file la versione vecchia
-- **tornava in vita accanto a quella nuova**. Con due funzioni dello
-- stesso nome, una chiamata a sei argomenti diventa ambigua e fallisce; e
-- nel frattempo resta in giro codice morto che sembra vivo.
--
-- La regola che ne è uscita, e che `npm run prova:sql` fa rispettare:
-- **una funzione, un file.** Se una funzione è definita in due posti,
-- vince chi esegue per ultimo — e quale sia "l'ultimo" dipende da in che
-- ordine qualcuno ha aperto dei file sei mesi fa.
--
-- Per mettere in piedi un database da zero servono due file, in
-- quest'ordine:
--
--   1. supabase/schema.sql
--   2. supabase/DA-LANCIARE.sql
--
-- Il secondo, in fondo, dice da solo se è andata.

do $$
begin
  raise notice 'eliminazione.sql non serve piu'': tutto quello che conteneva sta in schema.sql e in DA-LANCIARE.sql. Non ha fatto niente, ed e'' giusto cosi''.';
end $$;
