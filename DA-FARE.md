# Da fare

Coda di lavoro decisa, in ordine. Diversa da `IDEE.md`, che è il parcheggio
delle cose non decise. Aggiornata prima della partenza.

> 📋 **9 agosto — l'elenco aggiornato sta in `SESSIONE-9-AGOSTO.md`.** Quel
> giorno sono stati chiusi 45 difetti su 46, e cinque delle cose scritte qui
> sotto non ci sono più. Questo file resta per il contesto: **per sapere cosa
> manca adesso, guarda quello.**

⚠️ **SQL da lanciare**: **`supabase/DA-LANCIARE.sql`**, uno solo, da
incollare nell'SQL Editor di Supabase. Contiene tutto quello che manca e
in fondo dice da solo se è andata. È generato: `npm run sql` lo rifà dai
file originali.

## ⚠️ Tocca a te, e solo a te (8 agosto)

Due buchi che il codice non può riempire da solo. Sono gli unici difetti
gravi rimasti aperti dopo il giro di critica funzionale.

1. **La barca del 14 non dice a che ora né da dove si parte.**
   `config/itinerario.js`, la tappa del 14: è la giornata più importante
   del viaggio, l'unica confermata e pagata, e nell'app non c'è né
   l'orario d'imbarco né il molo né il link Maps. L'orario vive in un
   messaggio WhatsApp sul telefono di uno solo. Se l'app è la fonte di
   verità del programma, proprio lì fa il vuoto. **È un edit di due
   righe di configurazione, ma i dati li hai solo tu.**
2. **Il telefono del villaggio**, in `config/info.js`. L'indirizzo l'ho
   messo — stava già scritto nello spec — ma il numero no: un numero
   plausibile in una sezione che si chiama emergenze è peggio di nessun
   numero. Restano da verificare anche guardia medica e farmacia di
   turno di Quartu.

Da qui in poi tutte le prove insieme: **`npm run prova`** (dieci
famiglie, ~450 controlli). Prima di ogni commit: quello più `npm run lint`.

## Dove siamo

Fatti i punti **1-8** dello spec: setup e deploy, onboarding col codice,
itinerario, Chat Rapida col soundboard, Album Foto, motore punti,
classifica con MVP e Maglia Nera e Il Testamento, caccia al tesoro con
voto anonimo. Più le proposte di punti votate dal gruppo, il **meteo
della tappa** e la **mappa** (punto 12), la **PWA** (punto 14 senza il
tutorial), le **Spese** (punto 10), la **Pecora** (11) e i **Documenti**
(13).

Delle 27 Leggi ne sono vive 15: I, II, IV, VIII, XI, XII, XIII, XIV, XVI,
XIX, XX, XXII, XXV, XXVI, XXVII. Le altre aspettano le sezioni che le
alimentano.

### Offline: c'è tutto

Le tre cose che lo spec vuole in aereo mode ci sono: l'app **si apre**
(service worker attivo), **mostra i dati già scaricati** dicendo in cima
che sono vecchi, e c'è **la Pecora**.

Il gioco sta nel tab Gioco, alla scheda "Al", e compare anche nella
schermata senza rete — dove però non ci si arriva quasi più, perché con
una copia dei dati si entra nell'app vera. Resta per chi apre senza rete
e senza aver mai scaricato niente.

**Verifica bloccante n.3 — da chiudere sul campo.** I formati audio su
iPhone: mai provata perché in casa c'è solo un Android.

I Vocali però sono stati scritti come se la verifica fosse già stata
fatta, cioè **senza scrivere nessun formato nel codice**: si chiede al
browser cosa sa fare (`MediaRecorder.isTypeSupported`), si preferisce
`audio/mp4` perché si sente ovunque, e si salva il mimeType **vero**
accanto al file invece di assumerlo. Era esattamente quello che la
verifica avrebbe detto di fare. `npm run prova:audio` controlla la scelta
su finti Safari, Chrome e Firefox.

Quello che resta da provare su un iPhone vero: che registri davvero, e
che un vocale registrato su Android si senta su iPhone e viceversa. Se
qualcosa non va, il posto da guardare è `src/lib/formatoAudio.js` — è lì
che si decide, ed è una lista.

⚠️ Per provare le sfide e il giorno corrente si sposta l'orologio del PC.
Se un file o un commit sembra datato in mezzo al viaggio, viene da lì.

## Trappole già incontrate

Costate tempo una volta; sarebbe stupido ripagarle.

- **`create table if not exists` non aggiunge colonne.** Su un database
  dove la tabella esiste già, una colonna nuova nel file non compare mai.
  Ogni colonna aggiunta dopo va dichiarata nella sezione "adeguamenti" di
  `supabase/schema.sql`.
- **PostgREST tiene in memoria le firme delle funzioni.** Dopo averle
  cambiate risponde "function does not exist" anche se la funzione c'è.
  Lo schema finisce con `notify pgrst, 'reload schema'` apposta.
- **Lo storage sta in fondo allo schema apposta.** Su progetti dove
  `storage` appartiene a un altro utente quelle istruzioni falliscono, e
  l'SQL Editor si ferma al primo errore: se stessero in mezzo, tutto il
  resto non verrebbe creato.
- **Contesto sicuro.** `crypto.randomUUID`, appunti, microfono, posizione
  e service worker esistono solo su HTTPS o localhost. Dal telefono su
  `http://192.168.x.x` mancano, e sembra tutto rotto. Per questo il dev
  server è in HTTPS (`SENZA_HTTPS=1` lo riporta in chiaro).
- **L'attributo `hidden` perde contro `display: flex`.** Per nascondere
  un blocco, non disegnarlo.
- **Due componenti fissi in cima si tolgono la classe a vicenda.** Il
  banner delle proposte e la striscia senza rete spostano le schermate
  con la stessa classe su `body`: quello che si smonta la toglieva anche
  all'altro, e il contenuto finiva sotto. In `useAltezzaBanner` si conta
  chi la sta usando invece di togliere e basta.
- **Una copia locale non deve mai coprire un guasto vero.** La cache
  offline risponde al posto del database solo quando l'errore è di rete
  (`sembraRete`). Su una tabella mancante l'errore deve restare visibile,
  o si torna a cercare il problema dove non è.
- **Le classi `.campo` sono nate per le schermate scure.** Riusate su
  fondo chiaro scrivono color sabbia su crema: testo invisibile. Succede
  ogni volta che si porta un campo di testo in una sezione nuova.
- **I messaggi d'errore tradotti nascondono la verità.** Hanno mandato a
  cercare tabelle mancanti che c'erano, per tre giri. L'errore grezzo
  finisce sempre in console con `[all41]`.
- **Le funzioni pure vanno tenute fuori dai file che importano Supabase**,
  o non si possono provare da riga di comando. Vedi `regoleLimiti.js` e
  `sfideDaMostrare` in `config/sfide.js`.
- **Il Write converte le sequenze di escape in caratteri veri.** Per
  byte zero e segni di accento, filtrare i codici numericamente invece di
  scriverli in un'espressione regolare.

## Come si verifica

Ogni pezzo di logica sta in una funzione pura provata con `node
--input-type=module`. Le schermate si controllano montando il singolo
componente nel browser con dati finti, senza scrivere nel database.

**I conti delle Spese si controllano da soli**: `npm run prova:conti`,
dieci secondi. Sono due file in `prove/`:

- `conti.mjs` — casi scritti a mano, che fissano il **verso** delle cose:
  chi paga è in credito, chi consuma è in debito. Una prova casuale non
  lo può controllare, perché resterebbe coerente anche coi segni girati
- `conti-casuali.mjs` — centomila situazioni generate a caso (gruppi da 2
  a 10, spese con più paganti, divisioni che non tornano, righe
  eliminate, gente uscita dal gruppo) su cui verifica le quattro
  proprietà che coi soldi devono valere sempre: la somma dei saldi fa
  zero, eseguendo i passaggi tutti finiscono a zero, nessuno paga sé
  stesso, e lo stesso elenco di passaggi esce su ogni telefono in
  qualunque ordine arrivino i dati

Il generatore ha un seme fisso: se un caso fallisce, si rilancia identico
invece di sperare che ricapiti. Questo è il modo di rispondere a "non so
come provare tutte le combinazioni": non si provano le combinazioni, si
provano le proprietà.

**Il gioco si prova allo stesso modo**: `npm run prova:pecora`. La
proprietà che conta è che un pilota automatico sopravviva all'infinito —
se il generatore mettesse due ostacoli troppo vicini uscirebbe prima o
poi una combinazione impossibile, e un gioco che uccide senza scampo non
è difficile, è rotto. Sessanta minuti simulati su sei semi diversi.

⚠️ **Un gioco in canvas si può far girare anche nel pannello**, che non
compone fotogrammi: si sostituisce `requestAnimationFrame` con una coda e
si chiamano i fotogrammi a mano con un orologio finto. Non usare
`setTimeout`: in una scheda nascosta viene strozzato a uno al secondo e
sembra che il gioco sia fermo.

⚠️ Nel pannello di anteprima **`requestAnimationFrame` non scatta**: la
scheda non compone fotogrammi. Coriandoli, animazioni e `ResizeObserver`
lì non funzionano, e non è un bug del codice. Dove serve una misura, farla
in modo sincrono.

⚠️ **Il pannello non apre il dev server in HTTPS**: rifiuta il
certificato autofirmato, e i file aperti con `file://` li rende come
istantanee statiche, senza JavaScript. Per questo c'è **`npm run
dev:http`**, che parte in chiaro sulla 5174 (voce `all41-guarda` in
`.claude/launch.json`). Su localhost il contesto resta sicuro, quindi
microfono, posizione e service worker ci sono lo stesso; dal telefono su
192.168.x.x no, lì serve `npm run dev`.

Il pannello però **non compone fotogrammi**, quindi gli screenshot non
riescono: si guarda con l'albero della pagina e misurando gli elementi da
JavaScript, che basta per accorgersi di quasi tutto.

⚠️ **Per entrare senza creare profili**: scrivere in `localStorage` la
chiave `all41.memberId` con l'id di un membro che esiste già (c'è un
profilo `test` apposta) e ricaricare. Creare un profilo nuovo per provare
aggiunge una persona ai conti delle Spese e alla classifica di tutti.

---

## Fatte, con le decisioni prese

Restano scritte perché la decisione conta più del codice.

- **Proposte di punti**: slider senza campo libero (un +500 votato per
  ridere azzera la classifica), evento "in attesa" che non muove niente
  fino alla chiusura, quorum a metà gruppo. Sotto quorum si **annulla**,
  non si boccia: chi ha proposto non merita la penalità per il
  disinteresse degli altri.
- **Dove si vota**: banner in cima a tutta l'app con **tre** scelte. La
  terza — "voto dopo" — esiste perché obbligare a scegliere fra sì e no
  per far sparire un banner produce voti a caso, e un voto a caso vale
  meno di un voto in meno.
- **Soundboard**: nessun freno per tutti, ma chi pesta lo stesso bottone
  cinque volte in un minuto se lo vede togliere per un'ora (Legge XXVII).
  Punizione mirata invece di rallentamento collettivo.
- **Caccia al tesoro**: mai l'elenco completo, solo le sfide del giorno
  in corso più le vinte come trofeo. Voto anonimo per davvero — nel
  database non c'è chi ha votato cosa — e la propria foto non ha il
  bottone, invece di averlo e rifiutare.
- **Allan nella chat**: battute locali ed effimere, rare e mai due volte
  di fila. Se commentasse un messaggio su tre si consumerebbe entro il
  primo pomeriggio del 12.
- **Spese**: importi in **centesimi interi**, mai in virgola mobile — una
  cena divisa per tre lascia un residuo a ogni riga e dopo cinque giorni
  la somma dei saldi non fa più zero. I centesimi che avanzano vanno ai
  primi in ordine di id, così il conto viene identico su tutti i
  telefoni. Due fatti (`expenses` e `payments`) e nessun saldo salvato:
  se hai restituito, registri il rimborso e il debito sparisce da solo.
  L'elimina della propria spesa **non scade**, al contrario dei cinque
  minuti di messaggi e foto: un importo storto lo scopri facendo i conti
  la sera, e per allora sarebbe troppo tardi.
- **Una spesa può avere più paganti**, e l'importo si divide fra loro in
  parti uguali come si divide fra chi l'ha consumata: due divisioni dello
  stesso totale, quindi la somma dei saldi resta zero per costruzione. Se
  due hanno messo cifre **diverse** (30 e 20) restano due spese separate:
  i campi per l'importo di ciascuno raddoppiano il modulo per un caso
  raro. `paid_by` è quindi un `uuid[]` e non ha chiave esterna — un array
  non può averla — quindi chi esce dal gruppo resta scritto lì dentro e
  lo ignora il calcolo dei saldi.
- **Chi ha pagato ha la stessa forma di "Divisa fra"**: è la stessa
  domanda, chi sono le persone. Prima era una riga che si apriva, e in un
  foglio che scorre non si capiva che l'elenco fosse comparso.
- **Record della Pecora**: una riga per persona e per giornata col meglio
  di quel giorno, e nient'altro. Il record del giorno e quello del
  viaggio **non si salvano**: si ricavano da lì, come i saldi delle
  Spese. Quello di giornata si azzera da solo perché domani è un'altra
  riga, e non serve nessun lavoro a mezzanotte. In pareggio non vince
  nessuno, come per le sfide.
- **La navicella arriva a un punteggio fisso e scritto**. Legarla al
  record la rendeva un evento che non si sa quando arriva: soglia diversa
  a ogni partita, invisibile, impossibile da prevedere.
- **Alan è solo il draghetto**, senza vestiti: a trenta pixel ogni
  dettaglio in più è una macchia. Se un giorno si cambia ambientazione si
  cambia lo **sfondo**, non lui.
- **Il tab si chiama "Altro"** da quando contiene Spese, Documenti e
  Mappa. Finché c'erano solo le Spese si chiamava così: un tab chiamato
  "Altro" con una cosa sola dentro non dice niente. Stesso criterio per
  cui i tab sono cresciuti da due a cinque invece di nascere tutti spenti.
- **Leaflet si carica solo aprendo la Mappa** (`lazy` + `Suspense`): pesa
  150 kB e la mappa è la sezione che lo spec stesso dice che si guarda
  meno di quanto sembri. Resta però nella cache offline: se non ci fosse,
  aprendo quella scheda senza rete il componente non si caricherebbe e la
  scheda si romperebbe invece di mostrare un rettangolo grigio.
- **La posizione non si aggiorna mai da sola.** Quello che si vede è
  "l'ultima volta che ha detto dov'era", e l'interfaccia lo scrive: la
  differenza fra una comodità e una cosa che nessuno vuole addosso è
  tutta lì. Cinque decimali, cioè circa un metro: più preciso non serve e
  dice più di quanto si voglia dire.

## In sospeso

**Il Testamento con un'estetica vera.** Provato e scartato: pannello
scuro tipo stele, venatura di legno, numeri romani incisi, solchi al
posto dei blocchi neri. Non piaceva.

Se si riprova, **non ripartire da lì**: il problema non era la mancanza
di dettagli, semmai il contrario. Meglio una cosa sola e forte — la
tipografia dei numeri romani — che texture e fondi scuri insieme.

## Cosa resta dello spec

In ordine di quanto servono davvero, non di numero:

Niente: lo spec è finito.

Il **Tutorial** (14) è l'ultimo arrivato, e non assomiglia a quello che
lo spec descriveva. Lo spec diceva di generarlo da
`POINT_RULES.filter(r => r.discoverable)`, ma di Leggi pubbliche non ne è
rimasta nessuna — si era deciso che si scoprono usando l'app. Un tutorial
che le elenca smonterebbe proprio quella scelta, quindi la guida spiega
**dove stanno le cose e i tre gesti che nessuno indovina** (tocca la
classifica per proporre punti, tieni premuto il microfono, tocca la foto
per aprirla) e chiude con la card vaga che lo spec voleva. I testi stanno
in `src/config/guida.js`, non nel componente.

L'**Impostore** (15) è fatto. Il motore sta in `src/lib/impostore.js` e
non sa cosa sia Supabase: le partite si rigiocano uguali passandogli un
generatore, ed è così che sono venuti fuori i due difetti che a occhio
non si vedevano — `avanza()` che perdeva `giriTotali` e non arrivava mai
al voto, e le schede del database che sono **numeri di opzione, non id di
persone** (i punti sarebbero andati a nessuno, in silenzio). Se un giorno
qualcuno tocca i voti, `schedePerId` è il punto dove si rompe tutto.

Il **tutorial va tenuto per ultimo davvero**: lo spec lo dice, e queste
sessioni l'hanno dimostrato — le regole sono cambiate una decina di volte
in una sera. Scritto adesso sarebbe già falso.

**Da decidere sull'Impostore**: i punti non hanno un tetto giornaliero.
Una partita in otto con due impostori può iniettare fino a 16 punti, e in
una sera se ne giocano quattro o cinque. Tutte le Leggi insieme ne valgono
44. Non l'ho limitato perché lo spec non lo prevede, ma se dopo la prima
sera la classifica si ribalta, il posto giusto è `IMPOSTORE` in
`src/config/impostore.js`.

Lo spec dice esplicitamente che dal punto 6 in poi tutto può arrivare
**durante** il viaggio, con un deploy la sera. Vale ancora: mancano nove
giorni e il minimo spedibile è chiuso da un pezzo.

## Idee parcheggiate

Cose decise a voce e messe da parte apposta, non dimenticate. Se qualcuno
le ritrova fra sei mesi, qui c'è il perché.

### Numeri utili e indirizzi (rimandata il 5 agosto)

In Altro, accanto ai Numeri: l'indirizzo del villaggio, i numeri che
servono davvero sul posto — 112, guardia medica, il ristorante da
richiamare se si fa tardi — e in generale i contatti utili della zona.

Rimandata da Leonardo con parole precise: *"togliamola per ora, lasciamola
come un'idea volante, la riprenderemo forse come qualcosa di più
avanzato"*. Quindi **non è una cosa da aggiungere in fretta la sera
prima**: se torna, torna come sezione pensata.

Due cose da sapere quando si riprenderà:

- **I numeri di emergenza vanno verificati, non inventati.** In Italia il
  112 è unico e vale ovunque, ma guardia medica, farmacia di turno e
  capitaneria cambiano per comune, e un numero sbagliato in una sezione
  che si chiama "emergenze" è peggio che non averla.
- Deve funzionare **offline e senza account**: è l'unico posto dell'app
  che potrebbe servire quando il telefono non prende e uno ha fretta.
  Quindi dati nel codice, non sul database.

### La Pecora in verticale, cioè GAME-1 (rimandata il 7 agosto)

`Specifiche Modifiche.md` chiede al punto **GAME-1** di ingrandire l'area
di gioco "fino a occupare quasi tutta la schermata". **Non si può**, e i
numeri dicono perché — vale la pena tenerli, perché la domanda tornerà.

La larghezza sullo schermo è quella del telefono e non si tratta. L'unico
modo di far crescere il riquadro in altezza è **mettere meno mondo
dentro**, cioè far vedere meno pista davanti ad Allan:

| Mondo visibile | Preavviso a velocità massima | Riquadro su 390px |
|---|---|---|
| **500 (oggi)** | 0,64 s | 250 px |
| 460 | 0,58 s — *esattamente un salto* | 271 px |
| 420 | 0,53 s | 297 px |
| 208 | 0,22 s | 600 px |

Un salto dura **0,58 s**. Sotto le 460 unità l'ostacolo compare più tardi
di quanto ci metta il salto a concludersi: dovresti saltare prima di
poterlo vedere. **Le 500 di oggi erano già scelte vicino al limite**, non
a caso.

Alzare il cielo invece della larghezza non serve: **il 45% del mondo è
già cielo irraggiungibile**. La terra sta a y=272 su 320, l'apice del
salto è 93 unità, la testa di Allan al massimo arriva a y=143. Un mondo
più alto aggiunge cielo morto, e Allan resta 31px comunque — la sua
dimensione a schermo dipende solo da `MONDO.larghezza`.

⚠️ **Le due richieste dentro GAME-1 sono in conflitto.** "Il riquadro
occupa più schermo" si ottiene alzando il rapporto altezza/larghezza; "il
gioco si vede meglio, Allan è più grande" si ottiene solo abbassando
`larghezza`, ed è tappato a 460. Una versione verticale soddisfa la prima
e **non** la seconda.

**Perché serve un secondo comando.** Lo dice già il commento su
`navicella.quote` in `config/pecora.js`: la quota alta è "un respiro, non
un terzo pericolo — coi due soli comandi che ci sono non potrebbe essere
altro". Con un tocco solo non esiste gioco verticale. Il candidato più
piccolo è il **doppio salto** (apice da 93 a ~186, testa fino a y=50, che
giustificherebbe un riquadro quasi doppio).

**Cosa costa, quando si riprenderà**: i record del viaggio **ripartono da
zero**, perché un punteggio col salto singolo e uno col doppio non sono
la stessa cosa. E vanno riscritte le prove che derivano dal salto: "nessuna
coppia più larga di un salto", le quote del gabbiano e della navicella.
Sono 82 controlli, e il pilota automatico è l'unico che trova gli errori
di questo tipo — la coppia di muretti impossibile non si vedeva a occhio.

Rimandata da qui perché mancano cinque giorni alla partenza e questa è la
sezione dove un errore non si vede leggendo il codice.
