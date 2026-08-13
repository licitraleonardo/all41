-- «Il Testamento si è arrabbiato»
--
-- Il punteggio non lo capiva più nessuno. Chi ne aveva tanti non sapeva
-- perché, e chi ne aveva pochi nemmeno: il sistema premiava **chi usava
-- l'app**, e uno la usava molto più degli altri. Una gara di attenzione
-- al telefono travestita da gioco di gruppo, che è l'opposto di quello
-- che questo progetto voleva fare.
--
-- Invece di correggerlo in silenzio — che avrebbe cambiato i numeri di
-- tutti senza spiegare niente — si rimescola una volta sola e lo si
-- annuncia: il Testamento si arrabbia, avete mangiato troppo porceddu, e
-- i punti vengono rimessi a posto da capo.
--
-- ⚠️ IL SORTEGGIO SI FA QUI, UNA VOLTA, E SI SCRIVE.
--
-- È la ragione per cui questo file esiste invece di tre righe dentro
-- l'app. Se i punti nuovi li estraesse ogni telefono per conto suo, otto
-- persone vedrebbero otto classifiche diverse e ognuna sarebbe convinta
-- della sua — e nessun errore lo direbbe, perché ogni singolo telefono
-- sarebbe coerente con sé stesso. Si estrae una volta, si scrive, e da lì
-- in poi tutti leggono la stessa riga.
--
-- ⚠️ E NON SI CANCELLA NIENTE.
--
-- Il punteggio di questa app è sempre stato «la somma degli eventi», e
-- ogni schermata ci conta sopra. Qui si **aggiunge** una riga a testa con
-- la differenza che serve ad arrivare al punteggio nuovo: l'invariante
-- regge, il conto continua a tornare, e nella Classifica di ognuno
-- compare una riga sola che spiega il salto — invece di venti numeri
-- cambiati di nascosto.
--
-- Si può rilanciare quante volte si vuole: la chiave di deduplica fa sì
-- che la seconda volta non succeda niente.

do $$
declare
  viaggio text := 'sardegna-2026';
  prima text := 'Martina';
  -- ⚠️ Valori scelti e non casuali fino in fondo: distanziati, senza
  -- pareggi, e tutti positivi. Una classifica dove tre persone hanno lo
  -- stesso numero non si legge, e una con dei negativi sembra una
  -- punizione invece di uno scherzo.
  in_palio int[] := array[22, 19, 15, 12, 9, 6, 3];
  motivo text := 'Il Testamento si è arrabbiato: avete mangiato troppo porceddu';
  i int := 0;
  r record;
begin
  -- Prima in classifica, e di parecchio.
  for r in
    select id, score from members where trip_id = viaggio and name = prima
  loop
    insert into point_events
      (trip_id, member_id, points, reason, rule_id, status, dedupe_key)
    values
      (viaggio, r.id, 30 - r.score, motivo, 'testamento-arrabbiato', 'approved',
       'testamento-arrabbiato_' || r.id)
    on conflict (dedupe_key) do nothing;
  end loop;

  -- Tutti gli altri, in ordine sorteggiato. `order by random()` gira una
  -- volta sola: quello che esce da qui diventa la verità per tutti.
  for r in
    select id, score from members
     where trip_id = viaggio and name <> prima
     order by random()
  loop
    i := i + 1;
    insert into point_events
      (trip_id, member_id, points, reason, rule_id, status, dedupe_key)
    values
      (viaggio, r.id, in_palio[i] - r.score, motivo, 'testamento-arrabbiato', 'approved',
       'testamento-arrabbiato_' || r.id)
    on conflict (dedupe_key) do nothing;
  end loop;
end $$;

-- ⚠️ Ricalcolato dalla somma, mai messo a mano.
--
-- È la stessa regola di `azzera_prima_del_viaggio()`, e serve a due cose:
-- il numero a schermo torna sempre con lo storico sotto, e questo file si
-- può rilanciare senza raddoppiare niente.
update members m
   set score = coalesce(
     (select sum(p.points) from point_events p
       where p.member_id = m.id and p.status = 'approved'), 0)
 where m.trip_id = 'sardegna-2026';

-- Com'è finita, e la prova che il conto torna.
select m.name,
       m.score,
       (select sum(p.points) from point_events p
         where p.member_id = m.id and p.status = 'approved') as somma_eventi
  from members m
 where m.trip_id = 'sardegna-2026'
 order by m.score desc, m.name;
