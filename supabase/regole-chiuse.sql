-- Le porte si chiudono.
--
--   npm run sql:lancia supabase/regole-chiuse.sql
--
-- ⚠️ NON LANCIARE QUESTO FILE finché `chi-si-e-agganciato.sql` non dice
-- che tutti hanno almeno un telefono. Chiudere mentre qualcuno è fuori
-- vuol dire chiuderlo fuori, e non riceve un errore: riceve **zero
-- righe**. Foto sparite, chat sparita, spese sparite, e nessun messaggio
-- che spieghi perché.
--
-- ⚠️ E non lanciarlo prima che sia in produzione la versione dell'app che
-- entra col codice passando da `entra_col_codice`. Prima di quella, chi
-- svuota la cache si sente rispondere «Codice non riconosciuto» e resta
-- fuori per sempre.
--
-- **La strada del ritorno esiste ed è una riga:**
--
--   npm run sql:lancia supabase/regole-aperte.sql
--
-- ————————————————————————————————————————————————————————————
-- Cosa cambia, in una frase
--
-- Ogni regola diceva `true`: chiunque avesse una sessione poteva leggere
-- tutto. E la sessione la distribuisce la chiave pubblica dentro il sito,
-- quindi bastava chiederla. Misurato il 17 agosto, da fuori, senza aprire
-- l'app: 8 membri, 229 messaggi, 43 spese, 93 foto.
--
-- Da adesso ogni regola chiede `sono_del_viaggio(...)`, che risponde di
-- sì solo a un telefono agganciato a un membro di questo viaggio.
--
-- ⚠️ **Le foto, i documenti e i vocali restano nei bucket pubblici.**
-- Questo file toglie **l'elenco**, non i file: da fuori non si può più
-- sapere quali foto esistono né dove stanno, ma chi si è segnato un
-- indirizzo prima di oggi lo apre ancora. È un passo vero e va fatto
-- prima; i bucket sono un lavoro a sé, con la sua conseguenza (gli
-- indirizzi firmati scadono, e l'album offline peggiora).

begin;

-- ————————————————————————————————————————————————————————— le persone

drop policy if exists "members: lettura per autenticati" on members;
drop policy if exists "members: lettura del viaggio" on members;
create policy "members: lettura del viaggio" on members
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "members: modifica per autenticati" on members;
drop policy if exists "members: modifica del viaggio" on members;
create policy "members: modifica del viaggio" on members
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

-- ⚠️ La creazione di un profilo si chiude, e va saputo: da qui in poi un
-- nono membro non nasce dall'app. Non è una dimenticanza — è un gruppo
-- chiuso di otto persone che hanno già tutte il loro profilo, e lasciare
-- aperta la creazione vorrebbe dire lasciare aperta l'unica scrittura che
-- un estraneo può fare. Chi perde il telefono **rientra col codice**, che
-- non passa di qui. Se un giorno servisse una nona persona, si crea con
-- una riga di SQL.
drop policy if exists "members: creazione per autenticati" on members;

-- ————————————————————————————————————————————————————————— il viaggio

-- L'unica tabella senza `trip_id`: la chiave è la sua stessa riga.
drop policy if exists "trips: lettura per autenticati" on trips;
drop policy if exists "trips: lettura del viaggio" on trips;
create policy "trips: lettura del viaggio" on trips
  for select using (sono_del_viaggio(id));

-- ————————————————————————————————————————————————————————— la chat

drop policy if exists "azioni: lettura per autenticati" on quick_actions;
drop policy if exists "azioni: lettura del viaggio" on quick_actions;
create policy "azioni: lettura del viaggio" on quick_actions
  for select using (sono_del_viaggio(trip_id));

-- ⚠️ Questa è la più importante delle scritture. Fino a oggi uno
-- sconosciuto non poteva solo **leggere** la vostra chat: poteva
-- **scriverci dentro**.
drop policy if exists "azioni: creazione per autenticati" on quick_actions;
drop policy if exists "azioni: creazione del viaggio" on quick_actions;
create policy "azioni: creazione del viaggio" on quick_actions
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "azioni: modifica per autenticati" on quick_actions;
drop policy if exists "azioni: modifica del viaggio" on quick_actions;
create policy "azioni: modifica del viaggio" on quick_actions
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

-- ————————————————————————————————————————————————————————— i soldi

drop policy if exists "spese: lettura per autenticati" on expenses;
drop policy if exists "spese: lettura del viaggio" on expenses;
create policy "spese: lettura del viaggio" on expenses
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "spese: creazione per autenticati" on expenses;
drop policy if exists "spese: creazione del viaggio" on expenses;
create policy "spese: creazione del viaggio" on expenses
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "spese: modifica per autenticati" on expenses;
drop policy if exists "spese: modifica del viaggio" on expenses;
create policy "spese: modifica del viaggio" on expenses
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

drop policy if exists "rimborsi: lettura per autenticati" on payments;
drop policy if exists "rimborsi: lettura del viaggio" on payments;
create policy "rimborsi: lettura del viaggio" on payments
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "rimborsi: creazione per autenticati" on payments;
drop policy if exists "rimborsi: creazione del viaggio" on payments;
create policy "rimborsi: creazione del viaggio" on payments
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "rimborsi: modifica per autenticati" on payments;
drop policy if exists "rimborsi: modifica del viaggio" on payments;
create policy "rimborsi: modifica del viaggio" on payments
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

-- ————————————————————————————————————————————————————————— i ricordi

drop policy if exists "foto: lettura per autenticati" on photos;
drop policy if exists "foto: lettura del viaggio" on photos;
create policy "foto: lettura del viaggio" on photos
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "foto: creazione per autenticati" on photos;
drop policy if exists "foto: creazione del viaggio" on photos;
create policy "foto: creazione del viaggio" on photos
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "foto: modifica per autenticati" on photos;
drop policy if exists "foto: modifica del viaggio" on photos;
create policy "foto: modifica del viaggio" on photos
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

drop policy if exists "vocali: lettura per autenticati" on voice_messages;
drop policy if exists "vocali: lettura del viaggio" on voice_messages;
create policy "vocali: lettura del viaggio" on voice_messages
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "vocali: creazione per autenticati" on voice_messages;
drop policy if exists "vocali: creazione del viaggio" on voice_messages;
create policy "vocali: creazione del viaggio" on voice_messages
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "vocali: modifica per autenticati" on voice_messages;
drop policy if exists "vocali: modifica del viaggio" on voice_messages;
create policy "vocali: modifica del viaggio" on voice_messages
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

drop policy if exists "documenti: lettura per autenticati" on documents;
drop policy if exists "documenti: lettura del viaggio" on documents;
create policy "documenti: lettura del viaggio" on documents
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "documenti: creazione per autenticati" on documents;
drop policy if exists "documenti: creazione del viaggio" on documents;
create policy "documenti: creazione del viaggio" on documents
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "documenti: modifica per autenticati" on documents;
drop policy if exists "documenti: modifica del viaggio" on documents;
create policy "documenti: modifica del viaggio" on documents
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

-- ————————————————————————————————————————————————————————— il gioco

drop policy if exists "punti: lettura per autenticati" on point_events;
drop policy if exists "punti: lettura del viaggio" on point_events;
create policy "punti: lettura del viaggio" on point_events
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "leggi: lettura per autenticati" on leggi;
drop policy if exists "leggi: lettura del viaggio" on leggi;
create policy "leggi: lettura del viaggio" on leggi
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "sfide: lettura per autenticati" on challenges;
drop policy if exists "sfide: lettura del viaggio" on challenges;
create policy "sfide: lettura del viaggio" on challenges
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "voti: lettura per autenticati" on votes;
drop policy if exists "voti: lettura del viaggio" on votes;
create policy "voti: lettura del viaggio" on votes
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "voti: creazione per autenticati" on votes;
drop policy if exists "voti: creazione del viaggio" on votes;
create policy "voti: creazione del viaggio" on votes
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "mvp: lettura per autenticati" on mvp_days;
drop policy if exists "mvp: lettura del viaggio" on mvp_days;
create policy "mvp: lettura del viaggio" on mvp_days
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "mvp: creazione per autenticati" on mvp_days;
drop policy if exists "mvp: creazione del viaggio" on mvp_days;
create policy "mvp: creazione del viaggio" on mvp_days
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "pecora: lettura per autenticati" on sheep_records;
drop policy if exists "pecora: lettura del viaggio" on sheep_records;
create policy "pecora: lettura del viaggio" on sheep_records
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "dama: lettura per autenticati" on dama_games;
drop policy if exists "dama: lettura del viaggio" on dama_games;
create policy "dama: lettura del viaggio" on dama_games
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "dama: creazione per autenticati" on dama_games;
drop policy if exists "dama: creazione del viaggio" on dama_games;
create policy "dama: creazione del viaggio" on dama_games
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "impostore: lettura per autenticati" on impostore_games;
drop policy if exists "impostore: lettura del viaggio" on impostore_games;
create policy "impostore: lettura del viaggio" on impostore_games
  for select using (sono_del_viaggio(trip_id));

drop policy if exists "impostore: creazione per autenticati" on impostore_games;
drop policy if exists "impostore: creazione del viaggio" on impostore_games;
create policy "impostore: creazione del viaggio" on impostore_games
  for insert with check (sono_del_viaggio(trip_id));

drop policy if exists "impostore: modifica per autenticati" on impostore_games;
drop policy if exists "impostore: modifica del viaggio" on impostore_games;
create policy "impostore: modifica del viaggio" on impostore_games
  for update using (sono_del_viaggio(trip_id))
         with check (sono_del_viaggio(trip_id));

-- ————————————————————————————————————————————————————— quello che dite di me

drop policy if exists "feedback: scrittura per autenticati" on feedback;
drop policy if exists "feedback: scrittura del viaggio" on feedback;
create policy "feedback: scrittura del viaggio" on feedback
  for insert with check (sono_del_viaggio(trip_id));

commit;

-- ——————————————————————————————————————————————————————— si toglie il ponte

-- ⚠️ `aggancia_dispositivo` era la migrazione silenziosa: serviva a far
-- entrare gli otto telefoni senza chiedergli niente, ed è finita — 8 su
-- 8, il 17 agosto. Da adesso è una **chiave sotto lo zerbino**.
--
-- Il motivo è preciso: per agganciarsi le basta l'id di un membro, e
-- quegli id sono stati **leggibili dal mondo per cinque settimane**. Chi
-- avesse trovato il sito in quel periodo può essersene segnati otto, e
-- con uno di quelli entrerebbe ancora — attraversando tutto quello che
-- abbiamo appena chiuso.
--
-- Chi arriva da un telefono nuovo passa dalla porta, `entra_col_codice`,
-- che chiede una cosa che non è mai stata pubblica: il codice di 5
-- lettere. **Una porta sola.**
--
-- Si torna indietro con una riga, se un giorno servisse:
--   grant execute on function aggancia_dispositivo(uuid) to authenticated;
revoke execute on function aggancia_dispositivo(uuid) from authenticated;

-- ————————————————————————————————————————————————————— resta qualcosa aperto?

-- ⚠️ Questo controllo non è di cortesia: è l'unica cosa che dice se ho
-- dimenticato una tabella. Una regola dimenticata non si vede da nessuna
-- parte — l'app funziona uguale, e quel pezzo resta leggibile dal mondo.
--
-- **Deve tornare zero righe.**
select tablename, cmd, policyname
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual, '') = 'true' or coalesce(with_check, '') = 'true')
 order by tablename, cmd;
