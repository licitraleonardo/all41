# Da fare

Coda di lavoro decisa, in ordine. Diversa da `IDEE.md`, che è il parcheggio
delle cose non decise. Aggiornata prima della partenza.

## Dove siamo

Fatti i punti **1-8** dello spec: setup e deploy, onboarding col codice,
itinerario, Chat Rapida col soundboard, Album Foto, motore punti,
classifica con MVP e Maglia Nera e Il Testamento, caccia al tesoro con
voto anonimo. Più le proposte di punti votate dal gruppo, il **meteo
della tappa** (punto 12 senza la mappa) e la **PWA** (punto 14 senza il
tutorial).

Delle 27 Leggi ne sono vive 13: I, II, IV, VIII, XI, XII, XIII, XIV, XVI,
XIX, XXII, XXVI, XXVII. Le altre aspettano le sezioni che le alimentano.

### Offline: a metà

Lo spec vuole tre cose in aereo mode. L'app **si apre** (service worker
attivo) e senza rete **parla Allan** invece di dare un errore tecnico, e
riprende da sola quando torna il segnale. Mancano le altre due:

- **mostrare i dati già scaricati** — con Supabase la cache va scritta a
  mano, non è una riga di configurazione come dice lo spec (quello vale
  per Firestore). Qualche ora di lavoro
- **la Pecora** — punto 11, e il posto dove va è esattamente quella
  schermata

**Verifica bloccante ancora aperta**: la n.3 dello spec, i formati audio
su iPhone. Mai fatta perché in casa c'è solo un Android. Serve prima del
punto 9. Il modo più semplice: mandare il link del deploy a qualcuno del
gruppo che ha un iPhone.

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

⚠️ Nel pannello di anteprima **`requestAnimationFrame` non scatta**: la
scheda non compone fotogrammi. Coriandoli, animazioni e `ResizeObserver`
lì non funzionano, e non è un bug del codice. Dove serve una misura, farla
in modo sincrono.

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

## In sospeso

**Il Testamento con un'estetica vera.** Provato e scartato: pannello
scuro tipo stele, venatura di legno, numeri romani incisi, solchi al
posto dei blocchi neri. Non piaceva.

Se si riprova, **non ripartire da lì**: il problema non era la mancanza
di dettagli, semmai il contrario. Meglio una cosa sola e forte — la
tipografia dei numeri romani — che texture e fondi scuri insieme.

## Cosa resta dello spec

In ordine di quanto servono davvero, non di numero:

1. **Cache offline dei dati** — è la metà mancante dell'offline, e si
   sente ogni volta che manca il segnale. Qualche ora
2. **Spese** (10) — modello a due fatti, `expenses` meno `payments`, mai
   un flag "pagato" da preservare. È l'unica sezione fuori dal sistema
   punti e dalle battute di Allan
3. **Pecora offline** (11) — va nella schermata senza rete
4. **Chat Vocale** (9) — prima serve la verifica bloccante n.3
5. **Documenti** (13), **Mappa** (12), **Tutorial** (14),
   **L'Impostore** (15)

Lo spec dice esplicitamente che dal punto 6 in poi tutto può arrivare
**durante** il viaggio, con un deploy la sera. Vale ancora: mancano nove
giorni e il minimo spedibile è chiuso da un pezzo.
