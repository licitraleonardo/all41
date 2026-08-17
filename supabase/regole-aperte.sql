-- La strada del ritorno.
--
--   npm run sql:lancia supabase/regole-aperte.sql
--
-- ⚠️ Rimette tutto **com'era prima del 17 agosto**: ogni regola torna a
-- dire `true`, cioè chiunque abbia una sessione può leggere e scrivere.
-- L'app torna a funzionare per tutti in pochi secondi, e torna anche a
-- essere leggibile da chiunque conosca l'indirizzo.
--
-- Esiste per una ragione sola, ed è la ragione per cui chiudere è stato
-- possibile: **sbagliare una regola di accesso non dà errore.** Le
-- letture tornano vuote e a schermo sembra che i dati siano spariti — su
-- un'app che adesso è un ricordo, è il modo di fallire peggiore. Se
-- succede, non si indaga col telefono di otto persone in mano: si
-- riapre, e si indaga con calma.
--
-- Non è una sconfitta lanciarlo. È il motivo per cui si è potuto provare.

begin;

drop policy if exists "members: lettura del viaggio" on members;
create policy "members: lettura per autenticati" on members for select using (true);
drop policy if exists "members: modifica del viaggio" on members;
create policy "members: modifica per autenticati" on members for update using (true) with check (true);
-- Questa la chiusura l'aveva tolta del tutto, quindi qui si ricrea.
-- ⚠️ `create policy` non accetta `if not exists`: prima si toglie.
drop policy if exists "members: creazione per autenticati" on members;
create policy "members: creazione per autenticati" on members for insert with check (true);

drop policy if exists "trips: lettura del viaggio" on trips;
create policy "trips: lettura per autenticati" on trips for select using (true);

drop policy if exists "azioni: lettura del viaggio" on quick_actions;
create policy "azioni: lettura per autenticati" on quick_actions for select using (true);
drop policy if exists "azioni: creazione del viaggio" on quick_actions;
create policy "azioni: creazione per autenticati" on quick_actions for insert with check (true);
drop policy if exists "azioni: modifica del viaggio" on quick_actions;
create policy "azioni: modifica per autenticati" on quick_actions for update using (true) with check (true);

drop policy if exists "spese: lettura del viaggio" on expenses;
create policy "spese: lettura per autenticati" on expenses for select using (true);
drop policy if exists "spese: creazione del viaggio" on expenses;
create policy "spese: creazione per autenticati" on expenses for insert with check (true);
drop policy if exists "spese: modifica del viaggio" on expenses;
create policy "spese: modifica per autenticati" on expenses for update using (true) with check (true);

drop policy if exists "rimborsi: lettura del viaggio" on payments;
create policy "rimborsi: lettura per autenticati" on payments for select using (true);
drop policy if exists "rimborsi: creazione del viaggio" on payments;
create policy "rimborsi: creazione per autenticati" on payments for insert with check (true);
drop policy if exists "rimborsi: modifica del viaggio" on payments;
create policy "rimborsi: modifica per autenticati" on payments for update using (true) with check (true);

drop policy if exists "foto: lettura del viaggio" on photos;
create policy "foto: lettura per autenticati" on photos for select using (true);
drop policy if exists "foto: creazione del viaggio" on photos;
create policy "foto: creazione per autenticati" on photos for insert with check (true);
drop policy if exists "foto: modifica del viaggio" on photos;
create policy "foto: modifica per autenticati" on photos for update using (true) with check (true);

drop policy if exists "vocali: lettura del viaggio" on voice_messages;
create policy "vocali: lettura per autenticati" on voice_messages for select using (true);
drop policy if exists "vocali: creazione del viaggio" on voice_messages;
create policy "vocali: creazione per autenticati" on voice_messages for insert with check (true);
drop policy if exists "vocali: modifica del viaggio" on voice_messages;
create policy "vocali: modifica per autenticati" on voice_messages for update using (true) with check (true);

drop policy if exists "documenti: lettura del viaggio" on documents;
create policy "documenti: lettura per autenticati" on documents for select using (true);
drop policy if exists "documenti: creazione del viaggio" on documents;
create policy "documenti: creazione per autenticati" on documents for insert with check (true);
drop policy if exists "documenti: modifica del viaggio" on documents;
create policy "documenti: modifica per autenticati" on documents for update using (true) with check (true);

drop policy if exists "punti: lettura del viaggio" on point_events;
create policy "punti: lettura per autenticati" on point_events for select using (true);

drop policy if exists "leggi: lettura del viaggio" on leggi;
create policy "leggi: lettura per autenticati" on leggi for select using (true);

drop policy if exists "sfide: lettura del viaggio" on challenges;
create policy "sfide: lettura per autenticati" on challenges for select using (true);

drop policy if exists "voti: lettura del viaggio" on votes;
create policy "voti: lettura per autenticati" on votes for select using (true);
drop policy if exists "voti: creazione del viaggio" on votes;
create policy "voti: creazione per autenticati" on votes for insert with check (true);

drop policy if exists "mvp: lettura del viaggio" on mvp_days;
create policy "mvp: lettura per autenticati" on mvp_days for select using (true);
drop policy if exists "mvp: creazione del viaggio" on mvp_days;
create policy "mvp: creazione per autenticati" on mvp_days for insert with check (true);

drop policy if exists "pecora: lettura del viaggio" on sheep_records;
create policy "pecora: lettura per autenticati" on sheep_records for select using (true);

drop policy if exists "dama: lettura del viaggio" on dama_games;
create policy "dama: lettura per autenticati" on dama_games for select using (true);
drop policy if exists "dama: creazione del viaggio" on dama_games;
create policy "dama: creazione per autenticati" on dama_games for insert with check (true);

drop policy if exists "impostore: lettura del viaggio" on impostore_games;
create policy "impostore: lettura per autenticati" on impostore_games for select using (true);
drop policy if exists "impostore: creazione del viaggio" on impostore_games;
create policy "impostore: creazione per autenticati" on impostore_games for insert with check (true);
drop policy if exists "impostore: modifica del viaggio" on impostore_games;
create policy "impostore: modifica per autenticati" on impostore_games for update using (true) with check (true);

drop policy if exists "feedback: scrittura del viaggio" on feedback;
create policy "feedback: scrittura per autenticati" on feedback for insert with check (true);

commit;

select 'riaperto: ' || count(*) || ' regole tornate a true' as esito
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual, '') = 'true' or coalesce(with_check, '') = 'true');
