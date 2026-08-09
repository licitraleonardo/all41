# 9 agosto — la giornata dei 35 difetti

Tre giorni alla partenza. Questa è la giornata in cui l'app è stata
smontata pezzo per pezzo invece di aggiungerci roba.

**Punto di partenza:** una caccia sistematica su sei sezioni mai battute
prima — soldi, chat e vocali, punti e classifica, caccia al tesoro e
Pecora, comportamento senza rete, ingresso. **50 segnalazioni, 35
confermate**: ognuna passata a un secondo agente col compito di
smontarla leggendo il codice vero. Le 15 rifiutate non sono mai entrate
nell'elenco.

Poi due mappe (le ~60 chiamate di rete e le 16 letture in cache) hanno
tirato fuori altri 10 difetti che nessuno aveva segnalato — quelli
numerati **S1…S10** qui sotto.

**Alla fine della giornata: 45 su 46 chiusi.** Il quarantaseiesimo è la
coda dei vocali, rimandata da te di proposito.

---

## La cosa che ha cambiato la giornata

Non erano 35 problemi: erano **nove radici**. E la più grossa — otto
difetti su trentacinque — era **una sola cosa**:

> Con una tacca di segnale una richiesta di rete **non fallisce: aspetta.**
> Nessun `catch` scatta, quindi ogni «Un attimo…» che si spegne solo nel
> `catch` resta acceso **per sempre**.

Era già stata pagata tre volte e tappata tre volte, sempre nel punto in
cui faceva male quel giorno. Stamattina è successo di nuovo: la
correzione delle foto avvolgeva con cura le sue due chiamate e si
lasciava fuori quella **una riga sopra** — quindi la foto non finiva
nemmeno nella coda costruita apposta per salvarla.

**La correzione è una sola, ed è al centro** (`b214d9f`): un tetto di
tempo dentro il client, che copre tutte e sessanta le chiamate comprese
quelle che nessuno andrebbe a cercare. Tre condizioni non negoziabili,
tutte rispettate:

- rifiuta con `code: 'scaduta'`, o la copia offline smette di essere
  servita (sarebbe stata una regressione su una correzione di stamattina)
- **niente annullamento**: scaduta vuol dire *«non lo so»*, non *«non è
  partita»*. Su una spesa la differenza è fra un tasto piantato e una
  spesa doppia
- tetto scelto dal tipo di richiesta: 30 s per entrare e leggere, 90 s
  per caricare una foto

---

## Cosa è chiuso, in ordine di quando morde

### Il 12 sera, entrare · `9a749f0` `b214d9f`

- Il tasto **«Entra»** non resta più piantato: se la sessione non
  risponde, lo dice
- **«Non ti trovo, controlla il codice»** non viene più detto a chi ha il
  codice **giusto**. Era la frase che spinge a rifare il profilo — e otto
  persone diventano nove, con i saldi delle Spese sballati per tutti
- Riprovando **non nasce un secondo profilo**: il tentativo si ricorda, e
  al secondo giro adotta quello già creato
- Se la sessione non parte ma il profilo è già in copia locale, si entra
  lo stesso

### I soldi · `5ff3e8b` `44149da`

- **«Salda» ce l'avevano in mano tutti e due**: due dita, due rimborsi,
  saldo spostato di 60 €. Ora passa da una funzione del database che ne
  accetta uno solo
- **Il numero sul tasto non cambia più sotto il dito** mentre lo premi:
  si congela al tocco e la conferma mostra quello
- Le spese eliminate **non contano più** nei conti, e le prime giornate
  non spariscono più dal totale la sera del 16
- **Il saldo si può toccare e si apre**: dice da quali spese viene, riga
  per riga, e le righe sommano esatte. È il difetto vero dietro il tuo
  appunto *«5,63 non torna»* — il conto era giusto (22,50 ÷ 4 = 5,63),
  ma un numero che non sai rifare a mente, sui soldi, vale come un numero
  sbagliato

### I punti, che non si revocano · `13550ec` `2026730`

Tutti silenziosi, tutti irreversibili una volta sbagliati.

- Una proposta **approvata dal gruppo** che non pagava mai nessuno
- L'**MVP di giornata** calcolato sugli ultimi 40 eventi del viaggio
  invece che sulla giornata: incoronava la persona sbagliata, ogni sera
- **Due ore di buco ogni notte**: il giorno lo decideva l'orologio di
  Londra, non quello del telefono. Fra mezzanotte e le due i punti
  finivano nel giorno prima — cioè proprio nelle ore in cui si gioca.
  *(Questo era anche la risposta al tuo «l'app tiene conto del tempo?», se
  intendevi quello.)*
- La **sfida collettiva** che pagava metà gruppo e diceva «Fatta da tutti»
- Il **+2 di chi resta solo** e il **+3 della Pecora**, persi se cadeva
  la rete
- La **trappola dell'autoelogio** che si riarmava dopo 40 eventi e si
  poteva pagare più volte
- **Chi decide adesso legge fresco.** Sei letture assegnavano punti
  definitivi su una copia vecchia — compreso il premio finale da 10 punti
  e le due chiavi senza data, che valgono una volta sola per tutto il
  viaggio. Ora se non si riesce a leggere fresco **non si decide** e si
  aspetta la prossima apertura

### L'Impostore · `160bdc5` `25dd6c7` `37b3151` `49aaef0`

Tutti e nove i punti aperti, più quattro trovati strada facendo. Tre
rompevano la partita davvero. E **una trappola armata dentro `schema.sql`**:
rilanciarlo riportava indietro tre funzioni **senza dare nessun errore**.
Ora una funzione sta in un file solo, e `schema.sql` lo controlla da sé.

### La caccia al tesoro · `4748444`

- Il **20** i bottoni votavano ma la finestra era già chiusa: l'ultimo
  giorno non contava. Ora chiude **il 20 a fine giornata**, come hai deciso
- **«Cambia la tua»** durante il voto lasciava una foto fantasma che si
  portava via i voti
- In pareggio diceva **«Vince la foto di Turi»**. Adesso dice che è pareggio

### I vocali · `9c98f9a`

- Lo eliminavi, spariva a te, **restava agli altri sette** per tutta la
  sera
- Eliminato da un altro, restava ascoltabile su ogni telefono aperto
- Due tocchi ravvicinati e **il microfono restava acceso**
- Si eliminava **con un tocco solo**, per tutti, senza conferma

### Le ultime due · `1fda645` `64d031e`

- **L'app si ricaricava da sola sotto le dita** e portava via il foglio
  della spesa a metà. Adesso aspetta che tu abbia finito
- **Il buco del socket.** Se la connessione cade — il telefono in tasca,
  un tratto senza campo — quello che passa in quei minuti **non arriva
  mai più** su quel telefono, e lo schermo sembra fermo e completo. Nel
  caso peggiore a cadere nel buco è un **SOS**, e lì il buco non si
  richiude da solo: quando uno si perde gli altri smettono di scrivere in
  chat e cominciano a telefonare. Adesso feed e striscia SOS si
  riallineano quando l'app torna in primo piano, quando torna la rete e
  quando il canale si riaggancia.

  *Provato per davvero: staccato il socket, scritti un messaggio e un SOS
  dal database, verificato che non arrivano — e che al ritorno compaiono
  tutti e due.*

### Le correzioni a vista (i tuoi appunti N1) · `5322d70` `494d7b7` e altri

Dama «Rank» e via il suggerimento · via il suggerimento dell'Impostore ·
colore del sommario Spese · «Conti aperti» → **«Salda»** · il **«−»**
davanti alle cifre negative · un titolo per ogni statistica · alla Dama i
punti si prendono **solo vincendo**, abbandonare non ne toglie.

---

# ⚠️ QUELLO CHE RESTA

## 1. Tocca a te, e solo a te — prima di partire

- [ ] **Orario e molo della barca del 14.** `src/config/itinerario.js`. È
      la giornata più importante e l'unica pagata, e nell'app non c'è né
      l'ora d'imbarco né il molo né il link Maps. L'orario vive in un
      messaggio WhatsApp su un telefono solo. **Due righe, ma i dati li
      hai solo tu.**
- [ ] **Il numero di chi ci affitta la casa**, in `src/config/info.js`. Un
      «centralino del villaggio» da cercare **non esiste** — vedi il punto
      2 qui sotto. Il solo numero che ha senso lì è quello dell'host, e ce
      l'hai tu.
- [ ] **Rigenerare la password del database.** È finita in una
      trascrizione per colpa mia. Supabase → Settings → Database → Reset
      password, e poi rimetti la riga nuova in `.env.local`.
- [ ] **Togliere i quattro profili di prova** prima di far entrare il
      gruppo. Adesso nel database ci sono **Leo + PROVA1…PROVA4**, una
      spesa di prova e due eventi punti. **Irreversibile e importante: un
      profilo in più sballa i saldi delle Spese di tutti.**

      ```
      npm run sql:lancia supabase/svuota.sql -- --sono-sicuro
      ```

      (oppure solo i profili: `delete from members where access_code like 'PROVA%'`)
- [ ] **Provare l'Impostore in sei o otto persone vere.** È l'ultimo dei
      cinque test su dispositivo ancora aperto, e non lo posso fare io.
- [ ] **Audio su iPhone** — registrare e riascoltare. Verifica bloccante
      n.3 dello spec, mai chiusa: in casa c'era solo un Android.

## 2. I numeri utili — ✅ fatti, ma **ricontrollali**

Cercati uno per uno su fonti ufficiali il 9 agosto, e **la fonte di ognuno
è scritta nel commento sopra al numero** in `src/config/info.js`: chi
arriva fra un anno lo ricontrolla in trenta secondi.

**Emergenze (rosse, gratuite, sempre):** 112 · **1530** emergenza in mare
(Guardia Costiera — dormiamo sulla spiaggia e il 14 si va in barca) ·
**1515** incendi e emergenze ambientali (Corpo forestale della Regione —
è metà agosto in Sardegna).

**Numeri utili (lista a parte, si legge con calma):** guardia medica di
Quartu 070 826494 coi suoi orari · farmacia di Flumini 070 891155, la più
vicina al villaggio · casa di cura Sant'Elena 070 86051 · centralino
capitaneria 070 60517303 · i tuoi due, barca a vela e Ichnusa Rent a Van.

**Due cose che la ricerca ha corretto:**

- **Il «telefono del villaggio» non esiste.** S'oru 'e Mari non è un
  residence con la reception: è una **località residenziale** dove
  l'indirizzo è *«Villaggio S'oru 'e Mari, ‹civico›»* — al 13 c'è una casa
  di riposo, all'83/B un B&B, al 37 stiamo noi. Quello che serve è il
  numero di **chi ci affitta la casa**, e ce l'hai solo tu.
- **La farmacia di turno non è un numero fisso**: cambia ogni settimana ed
  è affissa sulla porta di ogni farmacia. Nell'app c'è la più vicina, con
  l'avvertenza.

⚠️ Regola che resta valida: **i numeri di emergenza si verificano, non si
inventano.** Le tre emergenze sono numeri brevi nazionali o regionali,
quindi non cambiano; i quattro locali li ho presi dalle fonti ufficiali
(ASL 8, Regione Sardegna, Guardia Costiera, il sito della farmacia), **ma
un numero locale può essere cambiato ieri.** Se ne provi uno e non
risponde, dimmelo e lo tolgo.

## 3. Comportamenti da cambiare — i tuoi appunti N2

- [x] ✅ **I fogli si chiudono toccando fuori** — in tutta l'app
- [x] ✅ **Il tasto indietro del telefono torna indietro**, non chiude l'app
- [x] ✅ **Un solo modo di uscire da un foglio.** Da quattro parole a due:
      «Lascia stare» quando abbandoni qualcosa, «Chiudi» quando smetti di
      guardare

      Le tre uscite stanno in `components/Foglio.jsx`, un posto solo, e
      otto fogli lo usano. **Due rifiutano il tocco fuori e rispondono lo
      stesso al tasto indietro** — fuori si tocca per sbaglio, indietro si
      preme apposta: l'SOS, e la punizione del Testamento, che è l'unico
      posto in cui viene detto perché hai perso dei punti. E dove c'è roba
      scritta a mano, la prima uscita avvisa invece di buttare via.

- [ ] **Audio: un tocco per registrare**, non tenere premuto. E a fine
      registrazione chiedere *«Vuoi contrassegnarlo come importante?»*

      ✅ **Correzione:** avevo scritto che tocca anche la Guida. **Non è
      vero.** La Guida insegna solo il «tieni premuto»; il «trascina in su
      per segnarlo importante» vive solo dentro Vocali, nel suggerimento
      sotto il tasto e nell'`aria-label`. Il lavoro è più piccolo di come
      l'avevo messo in conto. ⚠️ Resta che **va provato su un telefono
      vero**: è un gesto, e su desktop non si prova.
- [ ] **Gli avvisi dei messaggi rapidi si vedono da tutti i tab**
      (*«Leo ha lanciato un sondaggio — mostra / vedo dopo»*)
- [ ] **La richiesta di aggiornare la posizione compare in tutti i tab**
      (*aggiorna / lo faccio dopo*), non solo nella Mappa
- [ ] **Numero di telefono quando ci si registra**, skippabile: prefisso,
      numero validato, e la frase che spiega dove finisce — *«verrà
      salvato fra le info utili e resta raggiungibile dal gruppo anche
      offline»*. Vuole una colonna nuova su `members`.

## 4. Due cose piccole rimaste aperte

- [ ] **Lo spazietto nella chat** fra i segmenti delle sezioni e la barra
      di invio. **Mi serve uno screenshot**: ho misurato gli elementi e mi
      risultano attaccati, quindi o è un telefono specifico o sto
      guardando il punto sbagliato — e non volevo spostare a caso il
      layout della chat tre giorni prima di partire.
- [ ] **Dire a schermo quanto sono vecchi i dati** (*«Dati delle 18:04»*).
      Adesso chi **decide** legge sempre fresco, quindi il danno grosso
      non c'è più — ma quando l'app **mostra** una copia vecchia non lo
      dice da nessuna parte, perché la striscia guarda `navigator.onLine`,
      che con una tacca dice *sono online*. L'ora è già salvata a ogni
      copia e oggi finisce solo nella console.

## 5. Dopo il viaggio

- [ ] **La coda dei vocali.** Un vocale che non parte è perso per sempre:
      le foto hanno una coda, i vocali no. Rimandato da te di proposito —
      è l'unico dei 46 difetti ancora aperto.
- [ ] **Solitario con le carte alla Allan**, o una sezione single player
      con dentro Pecora e solitario *(in `IDEE.md`)*
- [ ] **Scacchi accanto alla dama**, in una sezione «Duo» *(in `IDEE.md`)*
- [ ] **Onboarding che chiede i documenti importanti** — o appesantisce?
      *(in `IDEE.md`)*
- [ ] **GAME-1**: la Pecora in verticale col doppio salto. Costa i record
      del viaggio e 82 prove.

## 6. Da guardare quando c'è tempo

- [x] ✅ **La Guida è allineata?** Controllata, e non lo era in tre punti.
      Diceva **«Sono 49» Leggi** ma dieci sono spente: in un gioco dove si
      scoprono facendole scattare, dieci introvabili vuol dire dieci
      persone che a fine viaggio pensano di essersi perse qualcosa. I
      **Documenti erano l'unica sezione muta** dell'app. E descriveva tre
      sezioni di Altro su sei. Adesso `prove/guida.mjs` se ne accorge da
      sola: se ne aggiungi una senza il suo fumetto, la suite lo dice.
- [ ] **La schermata di chi viene eliminato all'Impostore** — volevi
      vedere come viene svelato l'impostore. Si guarda solo giocando.
- [ ] **Il tetto giornaliero dei punti dell'Impostore.** Una sera di
      partite può iniettare più punti di tutte le Leggi insieme.
- [ ] **`CONTESTO.md` non è mai stato verificato contro il codice**: la
      fase di controllo è morta sul limite di sessione. Materiale buono,
      **non una fonte**.

---

## Come si verifica quello che si tocca

`npm run prova` (20 famiglie di prove) e `npm run lint` **prima di ogni
commit**. Per le cose di rete il modo che ha funzionato tutto il giorno è
appendere la `fetch` dal browser e guardare che il tasto torni vivo entro
il tetto. Sul database si lancia da riga di comando con `npm run
sql:lancia`, senza aprire il browser.
