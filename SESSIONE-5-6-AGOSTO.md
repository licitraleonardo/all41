# Cos'è successo il 5 e 6 agosto

Documento di passaggio di consegne. Serve a chi riprende in mano il
progetto senza aver visto la conversazione: cosa è cambiato, **perché**,
dove si nascondono le trappole, e cosa resta da fare.

Il "perché" è la parte che conta. Il codice si legge da solo, le
decisioni no — e in due giorni ne sono state prese parecchie che
sembrano arbitrarie finché non si conosce il motivo.

> **Fonte di verità**: `sardegna-trip-app-spec.md` per cosa costruire,
> `CLAUDE.md` per come lavorare, `DA-FARE.md` per le trappole storiche.
> Questo file copre solo queste due giornate.

---

## In due righe

Lo **spec è finito** (punti 1-15). Queste due giornate sono state:
rifinitura di tutto quello che c'era, più l'**Impostore cresciuto da
mazziere a gioco vero**, più tre cose che non erano nello spec e servivano
davvero: statistiche, info pratiche, e una rete contro i crash.

**40 commit**, da `5162d2e` (l'icona rotta) a `0382ded` (l'eliminazione).
Tutto pushato su `main`, deploy automatico su Vercel.

**421 prove automatiche** in `prove/`, tutte verdi.

---

## Lo stato adesso

### Le sezioni

| Tab | Cosa c'è |
|---|---|
| 📅 Oggi | Itinerario, meteo, countdown coi giorni |
| 💬 Gruppo | Chat rapida + Vocali, pallini di non letto |
| 📷 Foto | Album (5/giorno) + sfide della caccia |
| 🏆 Gioco | Classifica, Testamento, **Impostore**, Pecora ("All") |
| 📎 Altro | Spese, Documenti, Mappa, **Stat.**, Guida, **Info** |

### Le Leggi

**31 in totale, 22 attive.** Nuove di queste giornate:

- **XIII** riscritta — la soundboard si spegne tutta, non un suono solo
- **XIV** nuova — recidiva sulla soundboard nella stessa giornata
- **III** e **XXIV** accese — servono all'Impostore
- **XXI** accesa — "MVP due volte", era morta dall'inizio perché nessuno
  teneva il conto delle giornate

### Le prove

```bash
npm run prova:conti        # 63 — soldi, con 100k casi casuali
npm run prova:impostore    # 139 — il gioco più coperto
npm run prova:pecora       # 82
npm run prova:statistiche   # 43
npm run prova:caccia       # 29
npm run prova:mvp          # 21
npm run prova:documenti    # 17
npm run prova:posizione    # 15
npm run prova:audio        # 12
```

E soprattutto, **da lanciare prima di ogni commit**:

```bash
npm run lint
```

---

## Le tre cose che ci sono costate di più

Non sono bug qualunque: sono i tre modi in cui questa app fa perdere
tempo, e li ripeterà se non si sta attenti.

### 1. Il `vercel.json` che ho scritto io bloccava tutti i deploy

Per mezza giornata abbiamo cercato un service worker incastrato sul
telefono. Il vero problema: avevo aggiunto una regola con **una parentesi
dentro un'altra**

```
/(sw.js|registerSW.js|workbox-(.*).js|manifest.webmanifest)
```

Vercel non accetta i gruppi annidati, **rifiuta l'intera configurazione**
e la build fallisce prima di cominciare. Il sito restava all'ultimo deploy
buono, funzionante ma vecchio di dodici ore.

**Come accorgersene in dieci secondi**: la targhetta col commit in fondo
alla **schermata del profilo** (tocca il tuo avatar). Dice da quale commit
è stata costruita l'app che stai guardando. Se non corrisponde all'ultimo
push, il problema è il deploy, non la cache.

### 2. Un identificatore mancante non lo vede il build

È successo **due volte in un'ora**: un componente usato e mai definito
(`<Abbandona>`), e una funzione usata e mai importata
(`abbandonaPartita`). Entrambe passavano `vite build` e i test, e
facevano **pagina bianca su tutta l'app** aprendo quella schermata.

Il motivo: un identificatore dentro il corpo di una funzione si risolve
solo quando quella funzione gira.

**Risolto con due regole in `.oxlintrc.json`**: `no-undef` e
`react/jsx-no-undef`, entrambe come errore. Provate innestando guasti
finti di proposito: le prendono. Da qui `npm run lint` prima di committare
non è un vezzo.

### 3. Il pannello di anteprima mente su tre cose

Nel browser del pannello **non girano** `requestAnimationFrame`,
`ResizeObserver` e `loading="lazy"` (la scheda non compone frame). E se
la finestra non è dimensionata, `innerWidth` è **0** e ogni misura è
finta.

Mi ha portato a "correggere" un layout che non era rotto. **Prima di
misurare qualcosa, dimensionare la finestra e controllare `innerWidth`.**

Corollario utile: il codice che dipende da rAF o ResizeObserver è fragile
anche sul telefono vero. La chat che non scendeva è stata riscritta senza
entrambi, ed è più solida.

---

## Cronologia ragionata

### Icona e PWA

- L'icona sulla home era **un PNG corrotto** — un chunk IDAT che non
  passava il proprio CRC. Nessun decodificatore poteva disegnarla.
  Rigenerata a 180×180 **senza canale alfa** (iOS appiattisce la
  trasparenza sul nero) e senza angoli arrotondati (la maschera la mette
  iOS).
- **`vercel.json`**: `/assets/*` immutabile, service worker e manifest
  `must-revalidate`. Senza, la CDN serve un service worker vecchio e
  l'app si congela.
- **`src/lib/aggiornamento.js`**: l'app installata chiede lei se c'è una
  versione nuova a ogni ritorno in primo piano. Prima aspettava che il
  browser decidesse, e dentro una PWA poteva voler dire restare a ieri.

### Gruppo — chat e vocali

- **La chat non scendeva quando mandavi.** Contavo i messaggi per
  accorgermi dei nuovi, ma il feed si ferma a 30: a elenco pieno il numero
  non cambia mai. Dal trentesimo messaggio in poi era morta. Ora si guarda
  **l'id dell'ultimo arrivato**. Stesso difetto era nei vocali, ancora
  addormentato.
- Tolta l'**animazione morbida**: non arrivava mai in fondo, perché la
  pagina cresce mentre lei scorre.
- **Due vocali suonavano insieme**: il primo non lo fermava nessuno.
- **Il microfono restava acceso** cambiando scheda durante la
  registrazione. `annulla()` esisteva e non la chiamava nessuno.
- **Soundboard**: il conteggio dell'abuso era per singolo suono, adesso è
  cumulativo — cinque suoni diversi in un minuto sono la stessa raffica.
  Primo blocco 15 minuti, recidiva nella stessa giornata 3 ore.
- Megafono e invio **dentro** la casella di scrittura; il tasto
  "importante" tolto dalla chat e sostituito nei vocali da un **gesto**
  (tieni premuto e trascina in su).
- **Nomi dentro le bolle, uno per persona** (`coloreNome` in
  `config/avatar.js`), gli stessi in chat e nei vocali.
- **Allan non commenta più in chat** — per adesso. Le battute restano in
  `config/allan.js`, spente.

### Pallini di non letto

`hooks/useNonLetto.js`. Il segnalibro "ho visto fino a qui" sta **su
questo dispositivo**, con l'id della persona nella chiave: funziona
offline e non aggiunge una scrittura a ogni apertura di scheda. Si segna
letto finché la scheda resta aperta, quindi i messaggi che arrivano
mentre leggi — e quelli che mandi tu — non accendono niente.

### Allan

Il personaggio ha uno **character sheet**: un dragonite pixel art con otto
espressioni. Le immagini sono ritagliate a mano dallo sheet in
`public/allan/`, normalizzate — stessa tela, teste alla stessa altezza,
altrimenti cambiando espressione sembra avvicinarsi e allontanarsi.

Due tentativi sbagliati prima di arrivarci (un SVG disegnato, un avatar
DiceBear): **Allan non è un avatar generato, è un personaggio disegnato.**

Si scrive **Allan con due L**. Il protagonista della Pecora era `alan` con
una: era lo stesso draghetto con due grafie, ora normalizzato.

**Le facce cambiano col contesto**: rassegnato su Oggi, scocciato in
Gruppo, sarcastico su Foto, giudica nel Gioco, esausto in Altro, e
sarcastico sul retro della carta dell'Impostore.

### Tutorial

- La card in cima al tab Gioco era troppo invadente: **tolta**.
- Al suo posto **una nuvoletta di Allan la prima volta che entri in ogni
  tab**, e mai più.
- La guida intera vive in **Altro → Guida**.
- ⚠️ Lo spec diceva di generare il tutorial dalle Leggi pubbliche, **ma di
  Leggi pubbliche non ne è rimasta nessuna**. La guida spiega dove stanno
  le cose e i tre gesti che nessuno indovina, e sulle regole dice solo
  che ci sono e che si scoprono.

### MVP di giornata

`lib/mvpStorico.js`, tabella `mvp_days`. Prima l'MVP viveva solo dentro la
sua giornata e a mezzanotte spariva — non era nascosto, **non esisteva
più**, perché l'app tiene gli ultimi 40 eventi.

Ora le giornate finite si chiudono alla prima apertura dopo mezzanotte, e
i coriandoli partono **al risveglio**, non alle 00:00.

⚠️ **Difetto trovato dalle prove**: a pari merito l'MVP dipendeva
dall'ordine degli eventi, quindi due telefoni potevano scrivere due
vincitori diversi. Ora a parità vince l'id più basso. **Stesso problema
aveva la Maglia Nera.**

### La Pecora

- **Muro**: oltre il record (finto a 600 per chi non ne ha) il respiro fra
  gli ostacoli si chiude quasi del tutto e le doppiette raddoppiano.
- **Tre tipi di raggio** invece di uno.
- **Doppiette**: due ostacoli attaccati da scavalcare con un salto solo.
- Tolto il "la navicella arriva a 300" scritto sotto il gioco.

⚠️ **Il difetto più istruttivo di tutta la sessione.** La prima versione
delle doppiette misurava la larghezza come frazione del salto, e usciva la
coppia di **due muretti**: 108 unità dove ne bastano 103 per morire. Non
si vede a occhio. L'ha trovata la prova che fa correre un pilota
automatico per dieci minuti.

Ora il tetto viene dalla fisica vera (`larghezzaMassimaCoppia`): il tempo
passato sopra l'ostacolo più alto, meno il corpo di Allan, per un
margine. **E il pilota automatico è stato rifatto** — guardava solo il
primo ostacolo e saltava troppo presto, morendo dove un giocatore vero
salta più tardi.

### Statistiche e Info

- **Altro → Stat.**: la tua scheda in cima, i titoli, e una classifica a
  barre per categoria. Nessun SQL: si conta da quello che c'è già.
  ⚠️ I punti possono essere **negativi**, e una barra larga meno di zero il
  browser la butta lasciando disegnata quella di prima.
- **Altro → Info**: villaggio, date, 112. ⚠️ Indirizzo, telefono, guardia
  medica e farmacia **non ci sono apposta**: non li so, e un numero
  plausibile in una sezione che si chiama "se serve aiuto" è peggio che
  non avere la sezione. In `config/info.js`, con l'elenco di cosa manca.

### Spese

Sotto il saldo c'era l'elenco di tutti col saldo di ciascuno: **sembrava
una classifica** di chi sta bene e chi sta male, in una sezione che parla
di soldi fra amici. E non era azionabile. Ora il riquadro del tuo saldo è
un bottone che apre i **tuoi** conti, divisi in "a chi devi dare" e "chi
deve dare a te".

**I conti non sono stati toccati.**

### La rete contro i crash

`components/Riparo.jsx` — un error boundary per ogni scheda. Prima una
svista in una schermata faceva **pagina bianca su tutta l'app**.

Banner, nuvolette e coriandoli hanno una rete **che tace**: sono cose in
più, e una che si rompe deve sparire, non prendersi lo schermo. La barra
dei tab resta fuori da tutto.

Provato rompendo l'album di proposito.

---

## L'Impostore, in dettaglio

È la parte più cambiata, e quella con più regole. Il flusso completo:

```
preparazione  →  in-corso  →  voto  →  ┌─ colpo  → finita
   (quanti      (giri di      (accusa) ├─ finita (vinto per numeri)
   impostori)    parole)               └─ in-corso (eliminazione, si continua)
```

Più **`annullata`**, che è l'uscita di sicurezza.

### Le regole, e perché

**Voto d'apertura** — quanti impostori lo decide il gruppo, non una regola
fissa. Parte quando ha votato **più della metà**: aspettare l'ultimo vuol
dire restare fermi per chi è in bagno. A parità vince l'opzione
consigliata — non importa quale sia la regola, importa che sia sempre la
stessa, o due telefoni fanno partire due partite diverse.

**La carta** — retro con Allan sarcastico, e girata resta una carta.
L'impostore vede un **bollo rosso "SEI TU L'IMPOSTORE"** e un
suggerimento: senza saperlo non può bluffare, che secondo lo spec è tutto
il senso della variante con la parola simile.

**I turni** — faccia grande di chi tocca (da tre metri si riconosce
quella), pallini del giro, e "Fatto, avanti" che può premere chiunque.

**Il voto d'accusa** — si indicano tanti quanti sono gli impostori
**ancora in gioco**. Si accusano i più votati; a parità sull'ultimo posto
entrano tutti i pari.

**Rivelare in anticipo** — non è di chi tocca il tasto per primo: serve
che lo chieda più della metà. Prima c'era "Rivela lo stesso", un gesto
irreversibile a un tocco solo che bruciava la partita a otto persone.

**L'eliminazione** — chi viene accusato esce. Se era innocente, il gruppo
si è tolto un voto da solo e la caccia continua con **un giro solo** di
parole. Chi esce **vede le parole di tutti**: restare venti minuti a
guardare senza sapere niente è la parte peggiore dei giochi a
eliminazione.

**Gli impostori vincono per numeri** quando smettono di essere in
minoranza: da lì il voto lo decidono loro.

**Il colpo di coda** — l'impostore beccato scrive la parola del gruppo, e
se la indovina vince lo stesso. Confronto **generoso**: maiuscole,
accenti, apostrofi storti e spazi doppi non contano. Coi punti ribaltati:
pagano gli impostori, e chi li aveva beccati non prende niente.

### ⚠️ La trappola da conoscere prima di toccarlo

Le schede del voto sul database sono **numeri di posizione**, non id. E
dal secondo giro d'accusa **le opzioni non sono più tutti i giocatori**,
ma solo i superstiti.

Leggerle con l'elenco intero sposta ogni numero di un posto: **i punti
vanno alle persone sbagliate, senza nessun errore visibile.** Si leggono
con `voto.opzioni`, mai con `partita.giocatori`.

`schedePerId(schede, opzioni)` è il punto dove si rompe tutto.

---

## Cosa resta

### Da fare tu

1. ⚠️ **Lanciare `supabase/eliminazione.sql`** — colonna `fuori` e
   funzione `chiudi_accusa`. Senza, **il tab Impostore non si apre** (lo
   dice, e il resto dell'app funziona).
2. **Provare l'Impostore in otto persone vere.** È l'unica prova che
   conta e non posso farla io.
3. Le prove sui dispositivi che restano dallo spec: **foto dalla
   fotocamera**, **modalità aereo**, e i **vocali su iPhone** (già
   passata).
4. Avvisare il gruppo di **chiudere e riaprire l'app** se sono fermi a una
   versione vecchia.

### Da fare in codice

Dell'elenco dato a voce, in ordine di quanto cambiano il gioco:

- **Voto per continuare** dopo i giri, invece di andare al voto d'accusa
  in automatico
- **Testimone coi 30 secondi**: passa solo chi è di turno, poi si sblocca
  per tutti. ⚠️ Contraddice lo spec ("nessun timer") ma è diverso: non è
  tempo per parlare, è uno sblocco perché la partita non si pianti. Il
  conto non deve vedersi finché non scade
- **Punteggio e classifica dell'Impostore** — per ultimo, quando le regole
  sono ferme. ⚠️ **Attenzione al bilanciamento**: la caccia al tesoro era
  stata ridimensionata apposta per non sommergere le Leggi, e partite a
  raffica la sera possono iniettare più punti di tutto il resto
- **Rispondi a un messaggio** stile WhatsApp (vuole una colonna)
- **Sala d'attesa e inviti** — il pezzo più caro e il meno utile: siete
  otto nella stessa stanza. Vale invece la parte "chi arriva a partita
  iniziata si mette in coda"
- **MVP celebrato**: fatto, ma la parte "storico dei vincitori" si può
  ampliare

### Idee parcheggiate

In `DA-FARE.md`, sezione "Idee parcheggiate": **numeri utili e indirizzi**,
rimandata di proposito, con le due avvertenze per quando si riprenderà.

---

## Convenzioni che valgono la pena ricordare

- **Logica pura separata dal database**, sempre: `saldi.js` / `spese.js`,
  `impostore.js` / `partiteImpostore.js`, `classifica.js`. Solo così si
  prova da riga di comando.
- **Le prove provano proprietà, non casi**: la somma dei saldi fa zero, il
  pilota automatico sopravvive, nessun blocco è più largo di un salto.
- **A parità vince sempre l'id più basso.** Vale per MVP, Maglia Nera,
  accusati, titoli delle statistiche. Non perché sia giusto, ma perché due
  telefoni devono dare la stessa risposta.
- **Ogni scrittura concorrente passa da una funzione del database**, mai
  da un update: due telefoni che fanno la stessa cosa insieme non devono
  farla due volte.
- **`dedupeKey` obbligatoria** su ogni punto derivato.
- **Ogni lettura ha un `limit()`** — verifica bloccante n.4 dello spec.
- **Limiti, regole e testi in `config/`**, mai sparsi nei componenti.
- **Un solo selettore CSS per classe**: ho creato regole duplicate che si
  contendevano lo stesso elemento **tre volte** in due giorni. Il
  controllo è banale e vale la pena farlo.
