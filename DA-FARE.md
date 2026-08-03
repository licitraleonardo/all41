# Da fare

Coda di lavoro decisa, in ordine. Diversa da `IDEE.md`, che è il parcheggio
delle cose non decise. Aggiornata prima della partenza.

## Dove siamo

Fatti i punti **1-8** dello spec: setup e deploy, onboarding col codice,
itinerario, Chat Rapida col soundboard, Album Foto, motore punti,
classifica con MVP e Maglia Nera e Il Testamento, caccia al tesoro con
voto anonimo. Più le proposte di punti votate dal gruppo, il **meteo
della tappa** (punto 12 senza la mappa), la **PWA** (punto 14 senza il
tutorial) e le **Spese** (punto 10).

Delle 27 Leggi ne sono vive 13: I, II, IV, VIII, XI, XII, XIII, XIV, XVI,
XIX, XXII, XXVI, XXVII. Le altre aspettano le sezioni che le alimentano.

### Offline: manca solo la Pecora

Lo spec vuole tre cose in aereo mode, e due ci sono: l'app **si apre**
(service worker attivo) e **mostra i dati già scaricati**, dicendo in
cima che sono vecchi e che quello che scrivi non parte. Resta:

- **la Pecora** — punto 11. Il posto dove va **non è più** la schermata
  senza rete: quella adesso mostra l'app vera. La Pecora sta nel tab
  Gioco, e la schermata di Allan resta solo per chi apre senza rete e
  senza aver mai scaricato niente

**Verifica bloccante ancora aperta**: la n.3 dello spec, i formati audio
su iPhone. Mai fatta perché in casa c'è solo un Android, e prima della
partenza non si è trovato nessuno del gruppo disponibile. **Si fa il
12**, quando siamo tutti nella stessa stanza: serve prima del punto 9, e
lo spec dice che dal punto 6 in poi si può deployare la sera.

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
- **Il tab si chiama "Spese", non "Altro"**: lo spec dice Altro perché lì
  dentro ci andranno anche Documenti, Mappa e Info, ma un tab chiamato
  "Altro" con una cosa sola dentro non dice niente. Si rinomina quando ne
  conterrà davvero altre — stesso criterio per cui i tab sono cresciuti
  da due a cinque invece di nascere tutti spenti.

## In sospeso

**Il Testamento con un'estetica vera.** Provato e scartato: pannello
scuro tipo stele, venatura di legno, numeri romani incisi, solchi al
posto dei blocchi neri. Non piaceva.

Se si riprova, **non ripartire da lì**: il problema non era la mancanza
di dettagli, semmai il contrario. Meglio una cosa sola e forte — la
tipografia dei numeri romani — che texture e fondi scuri insieme.

## Cosa resta dello spec

In ordine di quanto servono davvero, non di numero:

1. **Pecora** (11) — nel tab Gioco, non più nella schermata senza rete
2. **Chat Vocale** (9) — prima serve la verifica bloccante n.3, in
   programma il 12
3. **Documenti** (13), **Mappa** (12), **Tutorial** (14),
   **L'Impostore** (15)

Lo spec dice esplicitamente che dal punto 6 in poi tutto può arrivare
**durante** il viaggio, con un deploy la sera. Vale ancora: mancano nove
giorni e il minimo spedibile è chiuso da un pezzo.
