-- I file: si toglie l'elenco, e si toglie la penna.
--
--   npm run sql:lancia supabase/file-chiusi.sql
--
-- ⚠️ Com'era, misurato il 17 agosto da fuori, con una sessione anonima
-- chiesta alla chiave che sta dentro il sito:
--
--   elenco del bucket «foto» ......... 15 voci
--   elenco di «vocali» ............... 11 voci
--   elenco di «documenti» ............  3 voci
--
-- Cioè gli indirizzi **non serviva indovinarli**: bastava chiederli. E
-- una volta chiesti, i bucket sono pubblici, quindi si scaricava tutto.
-- Chiudere il database non era servito a niente per i file: la porta era
-- da un'altra parte.
--
-- ⚠️ E le regole dicevano solo «è il bucket foto», senza chiedere altro.
-- Sul `INSERT` questo vuol dire una cosa peggiore del leggere: **uno
-- sconosciuto poteva caricare roba dentro il vostro spazio.**
--
-- ————————————————————————————————————————————————————————————
-- Cosa NON cambia, e perché l'app non se ne accorge
--
-- I bucket restano **pubblici**, e non è una svista.
--
-- Nel database ci sono 94 indirizzi pubblici completi, scritti dentro le
-- righe delle foto, dei documenti e dei vocali. Rendendo i bucket privati
-- quegli indirizzi muoiono tutti insieme, e l'album diventa un muro di
-- immagini rotte finché non si riscrive il modo in cui l'app li apre —
-- con indirizzi firmati che scadono, e con l'album offline che peggiora.
-- È un lavoro a sé, e va fatto quando c'è tempo di provarlo.
--
-- Questo file fa la parte che costa **zero** al telefono e toglie quasi
-- tutto il problema: nessuno può più sapere **quali** file esistono né
-- **dove** stanno, e nessuno può più scriverci. L'app non elenca mai un
-- bucket — legge gli indirizzi dal database, che adesso è chiuso —
-- quindi non perde niente.
--
-- ⚠️ **Quello che resta, detto chiaro:** chi si fosse segnato l'indirizzo
-- di una foto prima di stasera la apre ancora. Non c'è modo di togliere
-- quello senza rendere privati i bucket.

-- ————————————————————————————————————————————————————————— l'elenco

-- `(storage.foldername(name))[1]` è la prima cartella del percorso, che
-- qui è l'id del viaggio: `sardegna-2026/<membro>/<file>.jpg`. Così la
-- regola non nomina il viaggio e vale anche per quello dopo.
--
-- ⚠️ Un file messo nella radice del bucket non ha prima cartella: la
-- funzione torna vuoto, il confronto è nullo e la regola dice **no**.
-- È il verso giusto in cui sbagliare.

drop policy if exists "storage foto: lettura" on storage.objects;
drop policy if exists "storage foto: elenco del viaggio" on storage.objects;
create policy "storage foto: elenco del viaggio" on storage.objects
  for select using (
    bucket_id = 'foto' and sono_del_viaggio((storage.foldername(name))[1])
  );

drop policy if exists "storage vocali: lettura" on storage.objects;
drop policy if exists "storage vocali: elenco del viaggio" on storage.objects;
create policy "storage vocali: elenco del viaggio" on storage.objects
  for select using (
    bucket_id = 'vocali' and sono_del_viaggio((storage.foldername(name))[1])
  );

drop policy if exists "storage documenti: lettura" on storage.objects;
drop policy if exists "storage documenti: elenco del viaggio" on storage.objects;
create policy "storage documenti: elenco del viaggio" on storage.objects
  for select using (
    bucket_id = 'documenti' and sono_del_viaggio((storage.foldername(name))[1])
  );

-- ————————————————————————————————————————————————————————— la penna

drop policy if exists "storage foto: caricamento" on storage.objects;
drop policy if exists "storage foto: caricamento del viaggio" on storage.objects;
create policy "storage foto: caricamento del viaggio" on storage.objects
  for insert with check (
    bucket_id = 'foto' and sono_del_viaggio((storage.foldername(name))[1])
  );

drop policy if exists "storage vocali: caricamento" on storage.objects;
drop policy if exists "storage vocali: caricamento del viaggio" on storage.objects;
create policy "storage vocali: caricamento del viaggio" on storage.objects
  for insert with check (
    bucket_id = 'vocali' and sono_del_viaggio((storage.foldername(name))[1])
  );

drop policy if exists "storage documenti: caricamento" on storage.objects;
drop policy if exists "storage documenti: caricamento del viaggio" on storage.objects;
create policy "storage documenti: caricamento del viaggio" on storage.objects
  for insert with check (
    bucket_id = 'documenti' and sono_del_viaggio((storage.foldername(name))[1])
  );

-- ————————————————————————————————————————————————————————— com'è messo

select policyname, cmd from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
 order by cmd, policyname;
