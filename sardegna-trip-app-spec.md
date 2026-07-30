# All For One — Sardegna 12–16 Agosto

Web app per un gruppo di 8 amici durante il viaggio: itinerario, comunicazione rapida, vocali, foto, posizione, spese, e un sistema di punti che tiene insieme il tutto.

**Versione 2** — riscritta dopo una revisione critica approfondita. Le sezioni nuove o cambiate rispetto alla v1 sono segnate con ⚠️.

---

## ⚠️ Verifiche bloccanti — da fare PRIMA di scrivere codice

Quattro cose che, se scoperte a metà lavoro, costringono a rifare pezzi. Vanno verificate in mezz'ora, all'inizio.

**1. Firebase Storage richiede carta di credito.** Dal 30 ottobre 2024 i progetti Firebase nuovi devono essere sul piano Blaze (pay-as-you-go, carta richiesta) per poter creare un bucket Cloud Storage — sul piano gratuito Spark le chiamate alle API Storage falliscono con 402/403. Il piano Blaze ha comunque una fascia gratuita ampia e per 8 persone in 5 giorni il costo reale sarebbe ~0€, ma serve inserire una carta. Foto e vocali sono metà dell'app, quindi non è aggirabile.
→ **Decisione consigliata: usare Supabase invece di Firebase** (storage incluso nel piano gratuito, nessuna carta). Se si preferisce comunque Firebase, mettere in conto l'attivazione Blaze come primo passo, non come sorpresa.

**2. L'audio non parte da solo.** I browser bloccano la riproduzione audio senza un'interazione utente precedente sulla pagina. Il soundboard globale (suono lanciato da un altro che parte sul mio telefono) funziona **solo se ho già toccato qualcosa nell'app in quella sessione**. In pratica va quasi sempre bene — l'app è aperta e ci si sta interagendo — ma va gestito: sbloccare un `AudioContext` al primo tap dell'utente e riusare quello, invece di creare un `new Audio()` al volo sperando che parta. Senza questo accorgimento la feature sembra rotta a caso.

**3. iOS e Android registrano formati audio diversi.** Chrome e Firefox producono `audio/webm` con Opus, mentre Safari di default produce `audio/mp4` con AAC anche nelle versioni recenti. Se si hardcoda `webm`, su iPhone la registrazione fallisce; e un file registrato su Android potrebbe non essere riproducibile su iPhone più vecchi.
→ Usare `MediaRecorder.isTypeSupported()` per scegliere il formato, **preferendo `audio/mp4` quando disponibile** (si riproduce ovunque), e salvare il mimeType reale insieme al file invece di assumerlo. Da testare su almeno un iPhone e un Android del gruppo prima del 12.

**4. La quota letture di Firestore/Supabase si brucia con i listener.** Il piano gratuito Firestore dà ~50.000 letture al giorno. Con 8 persone che aprono l'app 40-50 volte al giorno, se ogni apertura ri-legge l'intera collezione foto (poniamo 300 documenti), sono già 100.000+ letture giornaliere solo per la galleria.
→ **Ogni listener deve avere un `limit()`** (es. ultimi 30 messaggi, ultime 40 foto) con caricamento incrementale a scorrimento. Non è un'ottimizzazione prematura: senza, l'app smette di funzionare a metà viaggio e non è ovvio capire perché.

---

## ⚠️ Cosa deve esistere per forza l'11 agosto

Lo scope complessivo di questo documento è realisticamente 60-100 ore di lavoro. In due settimane part-time non si finisce tutto, ed è giusto saperlo adesso invece di scoprirlo la sera prima.

**Minimo spedibile (se si arriva solo a questo, l'app è comunque un successo):**
1. Onboarding (nome + avatar + codice di accesso)
2. Itinerario con giorno corrente + curiosità
3. Chat Rapida con i bottoni azione
4. Album Foto

Con questi quattro pezzi l'app è già utile ogni singolo giorno del viaggio. Tutto il resto — punti, classifica, MVP, vocali, spese, caccia al tesoro, giochi, mappa — è valore aggiunto che può arrivare anche **durante** il viaggio, con un deploy la sera.

**Ordine di sviluppo consigliato:**
1. Setup progetto + deploy vuoto (verificare la pipeline prima di scrivere feature)
2. Onboarding + codice di accesso
3. Itinerario + curiosità
4. Chat Rapida (bottoni, testo libero, soundboard)
5. Album Foto (con compressione, vedi sezione)
6. Motore punti (`awardPoints` + `POINT_RULES`)
7. Classifica + MVP + vista Le Leggi
8. Caccia al tesoro (usa Foto + motore punti + voti)
9. Chat Vocale
10. Spese
11. Pecora (runner offline — nessuna dipendenza dal resto, si può anticipare come pausa leggera tra due sezioni pesanti)
12. Mappa + Meteo della tappa (il meteo è mezz'ora, si può infilare ovunque)
13. Documenti del viaggio
14. Tutorial + PWA + rifiniture
15. L'Impostore (gioco di gruppo — vedi sezione: molto più economico di quanto sembri)

⚠️ **Correzione rispetto alla v1**: prima avevo messo il tutorial al punto 3, insieme al motore punti. Sbagliato — il tutorial descrive regole che cambiano man mano che le feature nascono, quindi scriverlo presto significa riscriverlo tre volte. Il *motore* punti va prima delle sezioni che lo usano (giusto), il *tutorial* va alla fine.

**Notifiche push**: fuori scope. L'app sarà aperta spesso, e la complessità non vale il beneficio per 5 giorni. Vedi però "Indicatori di novità" sotto: c'è un sostituto che costa quasi nulla.

---

## Stack

- **Frontend:** Next.js (o Vite + React) — deploy su Vercel
- **Backend/dati:** ⚠️ **Supabase consigliato** (Postgres + Realtime + Storage nel tier gratuito, nessuna carta). Firebase resta valido ma richiede Blaze per lo Storage — vedi verifiche bloccanti
- **Audio:** MediaRecorder API con feature detection del formato (vedi verifiche bloccanti)
- **Avatar:** DiceBear HTTP API (`https://api.dicebear.com/`), seed = nome + stile scelto
- **Mappa:** Leaflet + OpenStreetMap — ⚠️ **un solo componente mappa condiviso** tra tab Mappa e Itinerario, non due implementazioni separate
- **Offline:** ⚠️ attivare la persistenza offline del client (IndexedDB). Costa una riga di configurazione e cambia tutto su una spiaggia con una tacca di segnale: l'app si apre e mostra i dati già scaricati invece di una schermata vuota. Gli upload falliti vanno messi in coda con un messaggio chiaro, non persi in silenzio

## Installabilità sul telefono (PWA, non app nativa)

Obiettivo: icona sulla home, apertura a schermo intero, sensazione di app vera — **senza** passare da App Store/Play Store (tempi di approvazione e account sviluppatore fuori scala per questo progetto).

Serve un `manifest.json` (nome, icone, colore tema dalla palette) più un service worker minimo per il caching. Va aggiunta verso la fine, quando le feature principali funzionano: sono pochi file sopra un'app già pronta, non un progetto a parte. È anche il prerequisito della Pecora offline, che senza service worker non si apre senza rete.

**Sigla e icona**: il nome resta *All For One*, la forma breve è **ALL41** — "ALL" intero, poi 41 (For = 4, One = 1). Funziona come marchio visivo tipo numero dipinto sulla fiancata di una barca o numero di maglia, e sta in un quadrato senza illustrazioni: icona PWA, testata della barra in alto, intestazione del Testamento. A voce nessuno dirà "all-quarantuno": si dice "All For One", oppure si chiama per nome il personaggio (vedi sotto). Da evitare la variante "Ai41": suggerisce un prodotto di intelligenza artificiale, l'opposto del tono dell'app.

Non fare: build nativa React Native/Flutter con pubblicazione sugli store.

## ⚠️ Allan — la voce dell'app

L'app ha un personaggio: **Allan** (**ALL**-an), che il gruppo chiama **Al**. Non è un assistente e non è un'intelligenza artificiale: è il nono membro del gruppo, quello che tiene i conti, custodisce il Testamento e non viene mai in spiaggia. Il collegamento tiene insieme tutto — *All For One* → *Allan* → *Al* → **ALL41**.

⚠️ **Allan è anche la pecora.** Il protagonista del gioco offline è lui: un personaggio solo, due usi, zero lavoro in più. Quando non c'è rete, "Al si annoia" e ti tocca farlo saltare.

**Come parla:**

| Situazione | Allan dice | Non dice |
|---|---|---|
| Spesa registrata | "Segnata." | "Spesa aggiunta con successo!" |
| Album vuoto | "Ancora niente. Qualcuno si muova." | "Non ci sono ancora foto 😊" |
| Upload fallito | "Non è partita. Riprova quando torna il segnale." | "Ops! Qualcosa è andato storto 😅" |
| Offline | "Niente rete. Mi annoio." (poi parte il gioco) | "Sembra che tu sia offline!" |
| Nessuna Maglia Nera | "Giornata senza colpevoli." | "Nessun dato disponibile" |
| Cooldown | "Aspetta 6s." | "Rallenta un attimo, campione! 🚀" |

Il registro è **asciutto e un po' svogliato**: frasi corte, punto fermo, nessun entusiasmo forzato, niente emoji sorridenti, nessun punto esclamativo se non serve davvero. La comicità sta nell'understatement, non nell'esuberanza. Allan non si scusa a ripetizione, non dà consigli non richiesti, e non parla mai di sé come di un'app o di un assistente.

**Dove Allan NON parla — tre eccezioni assolute:**

1. **SOS e tutto ciò che riguarda un'emergenza.** Testi piani, diretti, zero personaggio. Nessuno vuole trovare una battuta mentre chiede aiuto.
2. **Le Leggi.** Il Testamento ha una voce sua, solenne e legislativa, in numeri romani. Allan non scrive le Leggi: le **custodisce**. In testata del Testamento ci sta bene una riga tipo *"Custodito da Allan"*, ma il testo delle Leggi resta in terza persona e in tono da codice.
3. **Le Spese.** Registrazione asciutta, nessun commento sui soldi altrui. È già l'unica sezione fuori dal sistema punti: resti fuori anche dalle battute.

Il contrasto tra i tre registri — Allan svogliato, le Leggi solenni, l'SOS pulito — è ciò che dà carattere all'app senza farla sembrare una barzelletta continua.

## ⚠️ Sicurezza: Anonymous Auth invece di database aperto

Il problema che la v1 non affrontava: senza autenticazione, l'unica regola scrivibile è "chiunque può leggere e scrivere tutto". La configurazione del progetto è visibile nel JavaScript del client, quindi il database sarebbe scrivibile da chiunque lo trovi. Per 8 amici e 5 giorni il rischio pratico è basso, ma la mitigazione costa dieci minuti:

- Attivare l'**autenticazione anonima** (Firebase Anonymous Auth o Supabase anonymous sign-in): il client ottiene un'identità tecnica automatica, **senza nessun attrito per l'utente** — nessuna schermata di login, nessuna email, l'esperienza resta identica a quella descritta nell'onboarding
- Le regole di sicurezza diventano `request.auth != null`, che blocca scanner e bot casuali
- Il `memberId` applicativo (nome + avatar + codice) resta separato e gestito come descritto sotto: l'auth anonima serve solo a chiudere la porta, non a identificare le persone

Da tenere presente: l'auth anonima genera un'identità **per dispositivo/browser**, che si perde svuotando i dati del sito — motivo in più per cui il codice di accesso applicativo serve comunque.

## Feature: Codice personale di accesso

L'identità applicativa (nome, avatar, punteggio, spese) non deve dipendere da localStorage, altrimenti chi cambia telefono o pulisce la cache si ritrova un profilo nuovo — e nelle Spese un profilo duplicato sballa i saldi di tutti.

- Al primo accesso l'app genera un **codice di 4-6 caratteri** (es. `LX7K2`) legato al `memberId`, mostrato con un invito a salvarlo
- Link "Hai già un codice?" in onboarding per recuperare il proprio profilo su un altro dispositivo
- Nessuna password, nessun recupero via email: chi vede il codice può impersonarti, ma sono 8 amici e il danno massimo è una battuta

## ⚠️ Struttura app: 5 tab, non 9

Il problema della v1: nove tab in una bottom bar su schermo da 360px danno ~40px per voce, con etichette da 8px illeggibili. Le linee guida sia iOS che Android indicano cinque voci come massimo pratico. Raggruppando per *momento d'uso* invece che per feature:

| Tab | Contiene |
|---|---|
| **Oggi** | Itinerario (giorno corrente in evidenza + curiosità), meteo della tappa |
| **Gruppo** | Chat Rapida (bottoni + testo + soundboard) e Vocali, come due sotto-schede in alto |
| **Foto** | Album + Caccia al tesoro |
| **Gioco** | Classifica, MVP, Il Testamento, Pecora, Impostore |
| **Altro** | Spese, Documenti del viaggio, Mappa, Info, regole |

Le sotto-schede in alto (segmented control) sono un pattern standard e non aggiungono profondità percepita. La Mappa perde il primo posto — ha senso in teoria, ma nella pratica si guarda molto meno di quanto sembri quando si progetta.

---

## ⚠️ Sistema di punti — il core

Un punteggio per persona (può andare negativo), alimentato da tutta l'app ma sempre attraverso **un solo motore**.

### Una funzione sola

```
awardPoints({ tripId, memberId, points, reason, ruleId, dedupeKey })
```

Scrive in transazione un `pointEvents` e incrementa `members.score`. Nessuna sezione tocca `score` direttamente.

⚠️ **`dedupeKey` è la novità e serve a evitare punti doppi.** Senza server, la chiusura di un voto o il rilevamento di una regola avviene sul client di chi apre l'app in quel momento — e se due persone la aprono insieme, entrambi i client rilevano lo stesso evento e assegnano i punti due volte. Soluzione: l'ID del documento `pointEvents` è deterministico (es. `codenames-win_{gameId}_{memberId}`, `challenge_{challengeId}`, `polltie_{voteId}_{memberId}`). Una seconda scrittura con la stessa chiave è un no-op invece di un secondo accredito. Vale per ogni punto assegnato automaticamente.

### ⚠️ Definizione di spam e limiti (sezione centrale)

Il "sette volte consecutive" della v2 era un numero preso a caso, e i limiti orari avevano la forma sbagliata: una quota oraria blocca l'uso legittimo (cinque messaggi spesi alle 13:00 per organizzare il pranzo lasciano muti alle 13:20) e contemporaneamente **permette** lo spam (cinque messaggi in dieci secondi rientrano in qualsiasi quota oraria). Quello che conta è la velocità, non il totale.

Modello a due strati, con i valori in un unico file di configurazione:

```js
const LIMITI = {
  soundboard: { cooldown: 10,  burst: 5,  finestra: 120,  giorno: null },
  free_text:  { cooldown: 3,   burst: 10, finestra: 300,  giorno: null },
  voice:      { cooldown: 30,  burst: 3,  finestra: 600,  giorno: 15, durataMax: 60 },
  photo:      { cooldown: 0,   burst: 20, finestra: 600,  giorno: null },
  bottoni:    { cooldown: 60,  burst: null, finestra: null, giorno: null },  // dove_siete, si_riparte
  sos:        null                                                            // nessun limite, mai
};
```

Letto in italiano:

| Canale | Regola | Perché |
|---|---|---|
| **Soundboard** | 1 ogni 10s, max 5 in 2 min, **nessun tetto giornaliero** | Dieci suoni sparsi nella giornata sono divertenti, dieci in un minuto sono una tortura. I file sono già sul dispositivo, non costano banda: l'unico problema è il fastidio, quindi si limita solo la raffica |
| **Messaggi liberi** | 1 ogni 3s, max 10 in 5 min, nessun tetto | Una vera raffica di coordinamento ("siamo al bar" / "quale bar" / "quello davanti alla chiesa") sono 3-4 messaggi rapidi e **non deve essere bloccata**. Trenta in cinque minuti invece è una chat, che non è lo scopo della sezione |
| **Vocali** | 1 ogni 30s, max 3 in 10 min, 15 al giorno, **max 60 secondi ciascuno** | ⚠️ Erano 4 al giorno: troppo pochi per essere il sostituto del walkie-talkie. Meglio un tetto generoso con una raffica strozzata. Il limite di durata è importante quanto il resto: impedisce il monologo da sei minuti che nessuno ascolterà e tiene sotto controllo lo storage |
| **Foto** | max 20 in 10 min, nessun cooldown | Caricarne otto di fila dopo una giornata in spiaggia è uso normale, non spam. Serve solo un tetto per non saturare lo storage in un colpo |
| **Bottoni singoli** | 1 ogni 60s | "Dove siete" e "Si riparte tra" non hanno senso ripetuti dopo dieci secondi |
| **SOS** | nessun limite | Mai, in nessuna combinazione. È l'unica funzione di sicurezza dell'app |

### La scala delle penalità

Tu dici "tutto ciò che va oltre il limite va punito", ma va distinta l'impazienza dall'accanimento — altrimenti si penalizza il comportamento umano normale, che è il contrario dell'obiettivo:

1. **Primo e secondo tentativo rifiutato**: nessuna penalità, solo il feedback ("aspetta 6s"). Un doppio tap o un po' di fretta non sono spam
2. **Terzo tentativo rifiutato nello stesso blocco**: −1
3. **Ogni ulteriore tre tentativi**: −1, fino a un massimo di **−5 per blocco**
4. Il contatore si azzera al primo invio riuscito

Così la penalità non scatta mai per sbaglio, cresce con l'insistenza, e ha un tetto — restare in un blocco a martellare non può costare più di −5. Ed è una Legge che **scatterà davvero**: prima o poi qualcuno pesterà il bottone del suono.

⚠️ **Il bottone a limite raggiunto resta cliccabile** ma rifiuta mostrando il tempo di attesa: se fosse disabilitato, la scala sopra non potrebbe materialmente attivarsi. I contatori si derivano dai documenti recenti dell'utente nel database, non da localStorage (che si azzera cambiando dispositivo).

## ⚠️ Le Leggi — il regolamento come dato scopribile

Il regolamento si chiama **"Le Leggi di All For One"**: una tabella unica da cui si generano la logica, il tutorial e il codice delle Leggi scoperte. Tre Leggi sono **pubbliche** (spiegate nel tutorial), il resto è **nascosto** e si scopre quando scatta.

**Perché ~25 e non 100.** Cinque giorni per otto persone producono realisticamente 20-30 attivazioni totali. Su cento Leggi il contatore finirebbe intorno a 12/100, che si legge come un fallimento, non come un achievement. Con 25 il gruppo può arrivare a 12-15, e la barra si è mossa davvero. Ogni Legge, inoltre, deve essere **rilevabile da dati che l'app già scrive** — quelle sotto lo sono tutte: timestamp, autori, conteggi voti, punteggi del gioco. Nessun riempitivo che non scatterà mai.

**La scoperta è collettiva, non individuale.** Quando una Legge scatta per la prima volta su chiunque, si sblocca nel codice per tutto il gruppo (`discoveredAt` + `discoveredBy`). Rende la cosa cooperativa, fa correre il contatore otto volte più in fretta, e lascia la competizione dove deve stare: nella classifica dei punti.

```js
const LEGGI = [
  // ——— PUBBLICHE (nel tutorial) ———
  { n: 1,  id: "poll-proposed",     points: "±10 (max ±15)", public: true,
    text: "Punti proposti da qualcuno e approvati dal gruppo a maggioranza" },
  { n: 2,  id: "challenge-won",     points: "10/15/20",      public: true,
    text: "Hai vinto una sfida della caccia al tesoro" },
  { n: 3,  id: "impostore-impunito", points: +5,            public: true,
    text: "Sei sfuggito al voto: l'impostore l'ha fatta franca" },

  // ——— NASCOSTE: ritmo quotidiano ———
  { n: 4,  id: "first-photo-day",   points: +3,  text: "Prima foto della giornata" },
  { n: 5,  id: "early-bird",        points: +1,  text: "Primo del gruppo ad aprire l'app la mattina" },
  { n: 6,  id: "ghost-day",         points: -2,  text: "Non hai aperto l'app per un giorno intero" },
  { n: 7,  id: "group-silence",     points: -1,  target: "everyone",
    text: "Nessuno ha caricato foto per un'intera giornata" },
  { n: 8,  id: "night-owl-sound",   points: -2,  text: "Soundboard lanciato tra l'01:00 e le 07:00" },

  // ——— NASCOSTE: voti e democrazia ———
  { n: 9,  id: "last-to-vote",      points: -1,  text: "Ultimo del gruppo a votare in un sondaggio" },
  { n: 10, id: "lone-voter",        points: +1,  text: "Unico ad aver votato in un sondaggio scaduto" },
  { n: 11, id: "poll-tie",          points: -1,  target: "everyone",
    scope: "solo category 'point-proposal'", text: "Una proposta di punti è finita in pareggio" },
  { n: 12, id: "unanimous",         points: +5,  text: "Una tua proposta è passata con voto unanime" },
  { n: 13, id: "proposal-rejected", points: -2,  text: "Una tua proposta è stata bocciata dal gruppo" },
  { n: 14, id: "self-praise",       points: -3,  text: "Hai proposto punti per te stesso" },
  { n: 15, id: "wrong-side",        points: -1,  text: "Hai votato l'opzione perdente tre volte di fila" },

  // ——— NASCOSTE: foto e vocali ———
  { n: 16, id: "photo-spam",        points: -1,  text: "Più di 30 foto caricate in un solo giorno" },
  { n: 17, id: "triple-challenge",  points: +5,  text: "Hai vinto tre sfide della caccia al tesoro" },
  { n: 18, id: "the-mute",          points: -2,  text: "Nessun vocale registrato in tutto il viaggio" },
  { n: 19, id: "spam-insistente",   points: "-1 progressivo (max -5)",
    triggers: ["free_text","voice","soundboard","photo","bottoni"],
    text: "Hai insistito su un bottone già bloccato dal limite (vedi scala delle penalità)" },

  // ——— NASCOSTE: pecora e classifica ———
  { n: 20, id: "sheep-daily",       points: +3,  text: "Detieni il record della pecora a fine giornata" },
  { n: 21, id: "double-mvp",        points: +5,  text: "Sei stato MVP di giornata due volte" },
  { n: 22, id: "discoverer",        points: +1,  text: "Hai fatto scattare una Legge mai vista prima" },
  { n: 23, id: "riscatto",          points: +3,  text: "Eri Maglia Nera e non lo sei più" },
  { n: 24, id: "smascheratore",     points: +2,  text: "Hai votato l'impostore giusto" },
  { n: 25, id: "sheep-trip",        points: +5,  text: "Record della Pecora al termine del viaggio" }
];
```

### ⚠️ Il Testamento (la sezione delle Leggi scoperte)

Il codice delle Leggi ha un nome: **Il Testamento**. Vive nel tab Gioco e continua di proposito il tono legislativo-scritturale — sta bene con l'estetica del pattern mitologico dell'itinerario, e costa niente.

- Elenco numerato in **numeri romani** (`Legge VII`), il tocco che trasforma una lista di regole in un codice
- **Legge scoperta**: testo leggibile, punti, e in piccolo *"scoperta da Marco, 13 agosto"* — l'attribuzione è metà del divertimento
- **Legge non scoperta**: `Legge XIII — ███████████` e nient'altro
- Contatore in cima: **"Scoperte: 14 / 25"**, con barra di avanzamento
- Le tre Leggi pubbliche partono già rivelate
- Le Leggi aggiunte durante il viaggio compaiono in fondo con un marcatore "nuova", così è chiaro che il codice è cresciuto

**Una Legge si scopre quando scatta**: nel momento in cui qualcuno la fa scattare, il testo si rivela nel Testamento per tutto il gruppo e compare una notifica in-app ("📜 Nuova Legge scoperta: Legge VIII"). Chi la fa scattare per primo prende il punto extra della Legge XXII, **anche se la Legge appena scoperta era una penalità** — il che rende divertente pure prendersi un −2, perché hai comunque svelato una pagina del codice al gruppo.

Effetto collaterale utile: le Leggi sui limiti si auto-documentano. Non c'è bisogno di spiegare i cooldown nel tutorial — il primo che pesta il bottone del suono scopre la Legge XIX e da quel momento è scritta nel Testamento per tutti.

**La Legge 22 premia l'esplorazione**: chi fa scattare per primo una Legge mai vista prende un punto extra, quindi provare cose strane conviene.

**Si possono aggiungere Leggi durante il viaggio.** Essendo un dato, se il 13 agosto succede qualcosa di memorabile, quella sera si aggiunge la Legge relativa e il denominatore cresce insieme al gruppo. È probabilmente la cosa più divertente di tutto il sistema.

⚠️ **Nota di coerenza**: nessuna Legge riguarda le Spese, per la ragione già stabilita — soldi veri e punti-gioco non si mescolano. Tentazioni tipo "non hai mai registrato una spesa, -2" vanno respinte anche se sembrano innocue: il confine regge solo se non lo si buca mai.

### Dettagli che cambiano il comportamento

- **SOS è escluso da tutto**, per principio: nessun rate limit, nessuna regola, nessuna penalità può mai toccarlo in nessuna combinazione di eventi. È l'unica funzione di sicurezza dell'app.
- **"Sette volte consecutive"** è un contatore per persona e per tipo di azione che si azzera al primo invio riuscito.
- **Il bottone a limite raggiunto resta cliccabile** ma rifiuta con un messaggio, altrimenti la regola sopra non può materialmente scattare.
- **Range dei punti proposti**: slider ±10 con estensione a ±15, non un campo numerico libero. Senza tetto, un +500 votato per ridere azzera il senso della classifica in un colpo solo.
- **Fuori dal sistema punti**: Spese (mescolare soldi veri e punti-gioco confonde), Itinerario, Mappa, Info.
- ⚠️ **I contatori dei rate limit si derivano dal database, non da localStorage** — un contatore locale si azzera cambiando dispositivo o svuotando la cache, e diventa inutile proprio quando serve. Si contano i documenti propri nell'ultima ora con una query, tenendo il risultato in cache locale per non ri-interrogare a ogni tasto.

## Feature: Classifica, MVP e Maglia Nera

- Lista membri ordinata per `score`, con storico dei `pointEvents` sotto (motivo sempre visibile: è metà del divertimento)
- Proposte "pending" separate da quelle già approvate
- **MVP del giorno**: chi ha guadagnato più punti in quella data — somma dei `pointEvents` del giorno raggruppati per persona, calcolata al volo all'apertura, nessun cron necessario
- **MVP del viaggio**: il primo in classifica per punteggio totale. Dopo il 16 agosto quella riga prende l'etichetta "👑 MVP del viaggio"
- Card in cima con "👑 MVP di oggi: [nome] (+X)" separata dalla lista totale — sono spesso persone diverse ed è parte del gioco che lo siano
- Badge sull'icona del tab Gioco con il proprio punteggio, con accento a corona se MVP di giornata, maglia nera se Maglia Nera

### ⚠️ La Maglia Nera

Il contraltare dell'MVP, con il nome della tradizione del Giro d'Italia (fino al 1951 l'ultimo in classifica indossava la maglia nera). Il tono conta: "Maglia Nera" è una gag ciclistica, "il peggiore" è un giudizio.

- **Maglia Nera del giorno**: chi ha il saldo giornaliero più **negativo** — e solo se il saldo è effettivamente negativo. Se nessuno è andato sotto zero, quel giorno non c'è nessuna maglia nera: la card dice "giornata senza colpevoli"
- **Maglia Nera del viaggio**: l'ultimo in classifica al termine, come chiusura simmetrica all'MVP

⚠️ **Perché il criterio è "punti persi" e non "punti guadagnati meno di tutti".** Sembrano la stessa cosa e non lo sono: col secondo criterio la maglia finisce addosso a chi semplicemente non ha partecipato — telefono scarico, o era in acqua a godersi la vacanza. Punire l'assenza è meschino e colpisce proprio chi si stava divertendo di più. Col criterio del saldo negativo la maglia **te la guadagni con i fatti**: bisogna aver fatto qualcosa che valeva una penalità. Più giusto e molto più divertente da leggere.

⚠️ **La Maglia Nera non toglie punti.** È solo cosmetica. Aggiungere una penalità a chi è già ultimo crea la spirale classica del cattivo game design: sei ultimo → vieni penalizzato → sei più ultimo → smetti di giocare il terzo giorno. Chi è chiaramente in fondo deve avere un motivo per restare in partita, non una ragione in più per mollare.

**Meccanica di riscatto** (Legge XXIII): chi esce dalla Maglia Nera dopo averla indossata prende +3. Costa una riga, ed è il modo pulito per tenere agganciato chi sta perdendo — in gergo si chiama rubber-banding, e in un gruppo di otto amici per cinque giorni serve davvero.

## ⚠️ Indicatori di novità (il sostituto delle notifiche)

Senza push, il rischio è aprire l'app e non capire cosa è successo mentre non c'eri. Il campo `lastSeenAt` esiste già nel modello e non era usato: basta confrontarlo con il `createdAt` dei contenuti per mostrare un puntino sui tab con roba nuova, e una riga "3 nuovi messaggi, 2 foto" all'apertura. Costa poco ed è letteralmente il motivo per cui si riapre un'app di gruppo.

---

## Feature: Chat Rapida

Non è una chat generica: azioni veloci con bottoni dedicati e un feed cronologico sotto.

- **SOS** — tap apre un foglio "Cosa succede?" con motivi preimpostati ("Mi sono perso/a", "Problema con l'auto", "Serve aiuto ora") più campo libero opzionale; un secondo tap invia. Il feed mostra "🆘 [nome]: [motivo]", non un allarme senza contesto. Nessun limite, nessuna regola punti, mai.
- **Dove siete** — posta la richiesta, con l'ultima posizione nota se disponibile. Nessun limite.
- **Si riparte tra…** — selettore 5/10/15/30 min. Nessun limite.
- **Sondaggio lampo** — opzioni preimpostate ("Si mangia qui / Si torna a casa"), crea un `votes` con `category: "logistics"`.
- **Soundboard** — 4-6 clip brevi da `public/sounds/` (`aho.mp3`, `forza.mp3`, `boh.mp3`, `ahahah.mp3`: minuscolo, senza spazi, 1-4 secondi). Il tap posta nel feed **e riproduce su tutti i dispositivi con l'app aperta**, tramite un listener a livello di shell — vedi verifica bloccante n.2 sull'audio. Se un file manca, il bottone è disabilitato, non rompe l'app. Limiti: vedi sezione centrale (1 ogni 10s, max 5 in 2 min, nessun tetto giornaliero)
- **Messaggi liberi** — campo di testo per il "arriviamo tra 5 minuti" scritto a mano, senza diventare una chat infinita. Limiti: vedi sezione centrale (1 ogni 3s, max 10 in 5 min). Il contatore mostrato è il tempo di attesa residuo, non una quota rimanente — è più utile sapere "puoi riscrivere tra 2s" che "ti restano 3 messaggi"

⚠️ **Serve poter cancellare.** Foto sbagliata, spesa con l'importo storto, proposta di punti partita per errore: senza un "elimina" (almeno per l'autore, almeno entro pochi minuti) ogni errore resta lì per cinque giorni. È la mancanza più fastidiosa nell'uso reale e costa poco.

## Feature: Chat Vocale

- Push-to-talk: tieni premuto, registra, rilascia, invia
- Formato scelto per feature detection, non hardcoded (vedi verifica bloccante n.3)
- Lista realtime con `limit()`, player con durata
- Limiti: vedi sezione centrale (1 ogni 30s, max 3 in 10 min, 15 al giorno, **massimo 60 secondi per messaggio**). Il limite di durata va imposto in registrazione, con stop automatico e un indicatore che scorre — non con un errore dopo che uno ha già parlato per due minuti

## Feature: Album Foto

- Input con `capture="environment"` o selezione da galleria
- ⚠️ **Compressione lato client obbligatoria** — nella v1 era fuori scope, ed era un errore. Una foto da telefono pesa 3-5 MB; 8 persone per 5 giorni fanno facilmente 2-3 GB, che significa superare i limiti di storage, upload lentissimi sotto l'ombrellone con una tacca, e consumo di traffico di tutti quando aprono la galleria. Ridimensionare a lato lungo 1600px e riesportare in JPEG qualità 0.8 via canvas porta un file da 4 MB a ~300 KB: venti righe di codice che decidono se la feature funziona o no in mobilità.
- Griglia con autore visibile, caricamento incrementale

## Feature: Caccia al tesoro fotografica

4-6 sfide con punteggio, definite come dato statico nel seed.

- Più persone possono sottomettere una foto per la stessa sfida (`challengeId` sulla foto)
- **Una sola sottomissione nella giornata** → vince direttamente, nessun voto (non ha senso votare senza alternative)
- **Due o più nella stessa giornata** → si apre un voto tra quelle foto, **anonimo**, **non si può votare la propria** (l'opzione è nascosta per l'autore), chiusura a fine giornata
- Sfida vinta = sfida chiusa: non si riapre il giorno dopo per una foto migliore
- Nessuna validazione automatica del contenuto: è la parola di chi tagga e di chi vota

⚠️ **L'anonimato va implementato davvero.** Nella v1 il documento salvava `votes: { memberId: opzione }`, cioè esattamente chi ha votato cosa: l'interfaccia lo nascondeva, ma chiunque apra la console del database (o i devtools) vede tutto. Per i voti con `anonymous: true` si salvano **solo i conteggi aggregati** più una lista separata di chi ha già votato (per impedire il doppio voto), senza mai legare persona e preferenza.

## ⚠️ Feature: Spese — modello corretto

Nella v1 salvavo i `settlements` calcolati e poi avvertivo di "non perdere il flag pagato quando i saldi si ricalcolano". Quel problema non andava aggirato, andava eliminato: nasceva dal salvare un dato derivato come se fosse un fatto. Il modello giusto tiene due tipi di fatti e calcola tutto il resto.

- **`expenses`** — spese sostenute: descrizione, importo, chi ha pagato, tra chi si divide
- **`payments`** — rimborsi realmente avvenuti: da chi, a chi, quanto ("ti ho dato 12€ in contanti ieri")
- I saldi netti si calcolano da `expenses` **meno** `payments`; il "chi deve a chi" è un algoritmo greedy di poche righe sui saldi risultanti

Così non esiste più nessun flag "pagato" da preservare: se hai saldato, registri un pagamento e il debito sparisce da solo. È anche il modello mentale corretto — "ho dato 12€ a Giulia" è un fatto avvenuto, non lo stato di una riga calcolata.

## Feature: Itinerario

- ⚠️ **Portare markup e CSS** di `sardegna-itinerario.html` dentro un componente, **scartando lo script Leaflet inline** in fondo al file: la mappa la fa il componente mappa condiviso dell'app, non serve una seconda istanza
- Giorno corrente calcolato lato client dalla data del dispositivo; fuori dal range 12-16 nessun giorno è marcato "OGGI"
- Blocco espandibile per giorno con **Da sapere** (storia/curiosità) e **Da provare** (cibo tipico)

```
day 12 — Arrivo, Poetto
  daSapere: "Il Poetto è una delle spiagge urbane più lunghe d'Europa, quasi 8 km.
    Alle sue spalle c'è lo Stagno di Molentargius, ex salina oggi zona umida
    protetta dove nidificano i fenicotteri rosa — guardando verso l'entroterra
    in tarda mattinata spesso si vedono in volo."
  daProvare: "Pardulas (dolcetti con ricotta e zafferano) o pane carasau: tra i
    simboli gastronomici sardi più semplici da trovare anche al supermercato."

day 13 — Costa Rei / Cala Sinzias
  daSapere: "La costa è dominata dalla macchia mediterranea — ginepro, lentisco,
    mirto — che tiene insieme dune altrimenti fragilissime. Zona quasi disabitata
    fino al boom turistico degli anni '60-'70: prima era terra di pastori."
  daProvare: "Il mirto, il liquore sardo per eccellenza, fatto con le bacche della
    pianta che vedrete lungo tutta la costa."

day 14 — Barca, area marina protetta di Capo Carbonara
  daSapere: "Lungo questa costa ci sono ancora torri di avvistamento spagnole del
    '500-'600, costruite contro le incursioni dei pirati barbareschi: cercatele
    tra Punta Molentis e Porto Giunco. L'Isola dei Cavoli prende il nome dal
    cavolo selvatico che cresce sulle sue rocce, non dagli ortaggi."
  daProvare: "La bottarga (uova di muggine essiccate), specialità tipica di questa
    costa — ottima anche solo come antipasto su pane carasau."

day 15 — Villasimius
  daSapere: "Queste acque nascondono diversi relitti, romani e moderni, ed è una
    delle mete subacquee più note dell'isola: il piccolo museo archeologico del
    paese espone anfore recuperate proprio da questi fondali."
  daProvare: "Culurgiones (ravioli di patata, pecorino e menta, chiusi con la
    treccia a mano) o malloreddus alla campidanese: i due piatti più
    rappresentativi della cucina sarda."

day 16 — Partenza
  daSapere: null
  daProvare: "Ultima occasione per una seada (pasta fritta con formaggio fresco
    e miele) prima di ripartire."
```

## Feature: Mappa

- Bottone esplicito "condividi la mia posizione", mai automatico
- Marker per membro con il proprio avatar; in UI è chiaro che è "ultima posizione condivisa", non tracking continuo
- Limite noto: niente aggiornamento in background su iOS, la posizione si aggiorna solo ad app aperta

## ⚠️ Feature: Meteo della tappa

Non un widget meteo generico (ce l'hanno tutti sul telefono), ma il meteo **della destinazione del giorno**, agganciato all'itinerario:

- Una riga nel tab Oggi: temperatura, vento, condizioni per le coordinate della tappa di oggi e di domani
- **Il vento del 14 conta più di tutto il resto**: per la giornata in barca è l'unica informazione che può far cambiare i piani. Se supera una soglia (es. 20 km/h) va evidenziato
- API meteo gratuita senza chiave (es. Open-Meteo), chiamata una volta all'apertura e messa in cache per qualche ora — non serve tempo reale
- Se la chiamata fallisce, la riga sparisce e basta: il meteo non è mai un motivo per rompere la schermata principale

## ⚠️ Feature: Documenti del viaggio

Il problema vero: QR dell'escursione in barca, biglietti del traghetto, PDF delle prenotazioni oggi vivono sepolti in WhatsApp o nella mail di uno solo, e servono sempre nel momento peggiore.

- Upload di immagini e PDF, con anteprima e apertura a schermo intero (i QR devono essere leggibili senza zoom acrobatici)
- **Condivisi di default**, con interruttore "solo per me" per le poche cose personali. Il biglietto della barca è un documento di gruppo: se ce l'ha una persona sola e il telefono si scarica, non ce l'ha nessuno
- Vive nel tab **Altro**, insieme a Spese e Mappa: è materiale di consultazione, non contenuto quotidiano. Tenerlo in "Oggi" occuperebbe spazio nella schermata più usata del giorno per una cosa che serve in un momento preciso e basta
- ⚠️ *Rifinitura opzionale, quasi gratuita*: un campo `giornoCollegato` sul documento permette di far comparire una scorciatoia in "Oggi" solo nel giorno in cui quel documento serve — il biglietto della barca appare il 14 e sparisce il 15. È lo stesso principio della carta d'imbarco che salta fuori il giorno del volo. Da fare solo se avanza tempo

⚠️ **Non chiamarla "area personale" e non trattarla come una cassaforte.** Con il modello di sicurezza di questa app (auth anonima + codice di accesso) i documenti "privati" non sono realmente privati: chi accede al database li vede. Il nome e i testi devono renderlo chiaro, e va scoraggiato l'upload di documenti sensibili (carte d'identità, dati bancari). Promettere una privacy che l'app non può mantenere è peggio che non offrirla.

## ⚠️ Feature: La Pecora — Allan offline

Un runner in stile dinosauro di Chrome. Il protagonista è Allan stesso, in forma di pecora, su paesaggio sardo — nessun personaggio nuovo da inventare. Tecnicamente è il pezzo più autonomo dell'app: tutto locale, nessuno stato condiviso, nessun turno, nessun ruolo. Canvas, uno sprite, fisica del salto, ostacoli che scorrono, box di collisione, punteggio.

**È il gioco dell'offline, e questa è la parte bella.** Il gioco del dinosauro esiste perché non hai connessione; l'app è una PWA con persistenza offline. Quindi la Pecora è ciò che compare **quando l'app non ha rete** — sulla barca, in macchina verso Costa Rei, in spiaggia con una tacca — al posto di una schermata di errore. Costa zero in più: il gioco è già interamente locale, il punteggio si sincronizza quando la linea torna. È anche raggiungibile normalmente dal tab Gioco, non solo offline.

- **Grafica**: sagome disegnate in canvas, nessun asset esterno. Ostacoli a tema — nuraghi, fichi d'India, muretti a secco — e un gabbiano che passa basso al posto dello pterodattilo. Palette identica al resto dell'app
- ⚠️ **Protagonista e ostacoli come configurazione, non come codice.** Costa zero adesso e rende quasi gratuita un'eventuale versione tematizzata in futuro (in Islanda sarebbe un husky tra blocchi di ghiaccio): il motore di un endless runner è identico ovunque, cambiano solo i disegni. Basta non scrivere "pecora" e "nuraghe" dentro i componenti:

```js
const TEMA_GIOCO = {
  player: "pecora",
  obstacles: ["fico-india", "nuraghe", "muretto"],
  flying: "gabbiano",
  sky: "#0B3550", ground: "#F2A93B"
};
```

- **Record condiviso**: un solo record di gruppo (`highScore` + `holderId`), non una classifica separata per persona — chi lo supera diventa il detentore e lo vede il gruppo intero

⚠️ **Come NON assegnare i punti.** La tentazione è "chi supera il record guadagna punti", ma un runner è ripetibile e basato sull'abilità: chi ci è bravo si mette venti minuti in spiaggia e diventa MVP a colpi di record, mentre gli altri prendono punti in base a quanto sono stati simpatici o puntuali. Sono due valute diverse nello stesso salvadanaio, e la classifica perde il senso sociale che è tutto il punto dell'app.

Quindi:
- **Nessun punto per il singolo record superato**
- **+3 a chi detiene il record a fine giornata** (Legge 20), valutato alla chiusura del giorno con `dedupeKey` sulla data
- **+5 una volta sola** a chi ha il record al termine del viaggio

Giocare cento volte non rende più di giocare bene una volta.

## ⚠️ Feature: L'Impostore (gioco di gruppo)

Il gioco che il gruppo già fa dal vivo, con l'app nel ruolo di semplice mazziere. **Sostituisce Codenames**, tagliato: l'Impostore costa una frazione del lavoro ed è molto più adatto a otto persone dopo cena.

Perché è così economico: l'app deve solo **distribuire le parole in privato, raccogliere i voti e rivelare**. Tutto il gioco vero — dire la propria parola, accusarsi, difendersi — avviene a voce nella stanza. Nessuna griglia condivisa, nessun turno da sincronizzare, nessun timer obbligatorio.

**Svolgimento:**
1. Chi apre la partita sceglie quanti impostori (1 con 5-6 giocatori, 2 con 7-8) e avvia
2. Ogni giocatore apre l'app e vede **solo la propria parola**, a schermo pieno, con un "ho letto" che la nasconde subito dopo
3. **Giro di parole gestito dall'app**: a turno ognuno dice a voce una parola legata alla propria
4. Si vota nell'app: ognuno indica chi sospetta
5. Rivelazione: chi erano gli impostori e quali erano le due parole

**Gestione dei turni** — poco codice (un array ordinato e un indice), ma due dettagli che migliorano il gioco rispetto a come lo si fa a voce:

- ⚠️ **Ordine casuale rimescolato a ogni giro**, non l'ordine in cui si è seduti. Costa una riga e toglie il vantaggio strutturale di chi parla per ultimo avendo già sentito tutte le altre parole — che è il difetto principale del gioco senza gestione
- ⚠️ **Due giri prima del voto** (`totalRounds`, configurabile). Con un giro solo si finisce spesso in un'accusa a caso; con due c'è abbastanza informazione per ragionare
- Il tap "fatto" lo dà **la persona di turno sul proprio telefono**, non un operatore centrale
- **Chiunque può far avanzare il turno**, non solo chi è di turno: se a qualcuno si scarica il telefono o esce dall'app, la partita non si blocca. Stesso principio della chiusura dei voti

⚠️ **L'app non deve diventare il centro dell'attenzione.** È un gioco da tavolo: se tutti fissano lo schermo, il gioco è morto. Quindi schermata di turno essenzialmente vuota con una scritta enorme — "TOCCA A GIULIA" — leggibile con un'occhiata da tre metri, e **nessun timer**: un countdown trasformerebbe una cosa rilassata in ansia da prestazione.

**Variante consigliata come default**: l'impostore riceve una **parola simile ma diversa** (tutti "mare", lui "lago") invece di non riceverne nessuna. Rende il bluff possibile e le partite molto più divertenti — chi non ha alcuna parola si blocca e si smaschera da solo al primo giro. Tenere comunque come opzione la versione classica "sei l'impostore, non hai parola".

**Parole**: lista statica di 100-150 coppie, dato puro, con qualche coppia a tema sardo per gusto. Il gruppo può aggiungerne durante il viaggio, come per le Leggi.

**Punti** (Leggi XXIV e XXV): impostori non scoperti → +5 a testa; impostori scoperti → +2 a ciascuno di chi li ha votati correttamente. Il voto passa dalla collezione `votes` già esistente, con `category: "impostore"`.

⚠️ **Segretezza**: come tutto in questa app, i ruoli stanno nel database e chi lo apre li vede. Qui però l'attacco è poco praticabile — servirebbero i devtools su un telefono, scomodissimo e soprattutto **visibile**: chi fissa lo schermo con aria strana per trenta secondi si è già tradito da solo. Il controllo sociale basta e avanza.

## Feature: Tutorial (per ultimo)

- ⚠️ **Non bloccante all'ingresso.** Un tutorial obbligatorio prima di poter guardare l'app viene saltato senza leggerlo. Meglio far entrare subito e mostrare le regole come card richiudibile in cima al tab Gioco, più un "?" in Altro per rivederle
- Le regole esplicite si generano da `POINT_RULES.filter(r => r.discoverable)` — mai riscritte a mano, o si disallineano al primo cambiamento
- Card finale volutamente vaga: *"Ci sono anche altre regole nascoste, le scoprirete usando l'app"* — e con le quattro regole aggiunte sopra, adesso è una promessa che l'app può mantenere davvero
- Le regole nascoste restano trasparenti **quando scattano**: il motivo compare sempre nello storico della Classifica

---

## Modello dati

```
trips/{tripId}
  name, startDate, endDate

members/{memberId}
  name, avatarSeed, avatarStyle, accessCode
  score: number                    // default 0, può essere negativo
  lastSeenAt: timestamp            // usato per gli indicatori di novità
  lastKnownLocation: { lat, lng, updatedAt } | null

quickActions/{actionId}
  authorId, createdAt
  kind: "sos" | "dove_siete" | "si_riparte" | "free_text" | "poll" | "soundboard"
  payload:
    sos:         { reason: string }
    dove_siete:  { location: {lat,lng} | null }
    si_riparte:  { minutes: 5|10|15|30 }
    free_text:   { text: string }
    poll:        { voteId: string }
    soundboard:  { soundFile: string }
  deletedAt: timestamp | null      // soft delete

votes/{voteId}
  category: "logistics" | "point-proposal" | "photo-of-day"
  question, options: string[]
  anonymous: boolean
  // se anonymous === false:
  ballots: { [memberId]: number }          // chi ha votato cosa
  // se anonymous === true:
  tally: number[]                          // solo conteggi per opzione
  voted: memberId[]                        // solo chi ha votato, senza la preferenza
  challengeId: string | null               // solo photo-of-day
  linkedPointEventId: string | null        // solo point-proposal
  expiresAt: timestamp                     // logistics +15min, point-proposal +3h, photo-of-day fine giornata
  closedAt: timestamp | null
  createdAt: timestamp

voiceMessages/{id}
  authorId, audioUrl, mimeType, durationSec, createdAt, deletedAt

photos/{id}
  authorId, url, width, height, challengeId, createdAt, deletedAt

challenges/{id}
  label, points, wonByPhotoId, wonByMemberId, closedAt

expenses/{id}
  description, amount, paidBy, splitAmong: memberId[], createdAt, deletedAt

payments/{id}                              // rimborsi realmente avvenuti
  from, to, amount, createdAt

pointEvents/{eventId}                      // eventId deterministico per gli automatici
  targetMemberId, points, reason, ruleId
  voteId: string | null
  status: "approved" | "pending" | "rejected"
  createdAt

leggi/{leggeId}                            // stato di scoperta, non il testo (che sta in codice)
  discoveredAt: timestamp | null
  discoveredBy: memberId | null            // chi l'ha fatta scattare per primo

sheep/record                               // documento singolo, non collezione
  highScore: number
  holderId: memberId
  achievedAt: timestamp

impostore/{gameId}
  parolaGruppo: string
  parolaImpostore: string
  impostori: memberId[]
  assegnazioni: { [memberId]: string }   // parola vista da ciascuno
  turnOrder: memberId[]                  // rimescolato a ogni giro
  turnIndex: number
  round: number
  totalRounds: number                    // default 2
  voteId: string | null
  status: "in-corso" | "voto" | "finita"
  createdAt
```

### ⚠️ Chiusura dei voti senza server

Il punto più delicato dell'architettura, non affrontato nella v1: senza backend, **chi chiude un voto scaduto?** La risposta è "il primo client che se ne accorge", e questo richiede tre accorgimenti:

1. **Chiusura in transazione**: si legge `closedAt`, si verifica che sia ancora `null`, e solo allora si scrive. Se due telefoni ci provano insieme, uno solo vince
2. **`dedupeKey` sui punti derivati**, come descritto nel motore punti: anche se la transazione fallisse, i punti non si duplicano
3. **Risoluzione all'apertura**: all'avvio l'app controlla se ci sono voti scaduti e non chiusi e li risolve. Senza questo, un voto foto-del-giorno che scade alle 23:59 mentre tutti dormono resta appeso per sempre

Stesso principio per `group-silence` (la penalità di gruppo per una giornata senza foto): si valuta all'apertura del giorno successivo, con `dedupeKey` sulla data.

---

## ⚠️ Tono e voce (conta quanto il codice)

L'app è per otto amici in vacanza, non per un ufficio. I micro-testi decidono se sembra viva o se sembra un gestionale — e sono decine: messaggi di attesa, stati vuoti, errori, notifiche.

**Chi scrive quei testi è Allan**: la sezione "Allan — la voce dell'app" più sopra contiene registro, esempi e le tre eccezioni in cui il personaggio deve tacere (SOS, Leggi, Spese). Va letta prima di scrivere qualsiasi stringa dell'interfaccia.

**Regole generali che valgono comunque**: italiano informale, "tu", frasi brevi, nessun inglese nell'interfaccia, emoji funzionali e non decorative (🆘 📍 🚗 👑 🏴 📜 sono già in uso, bastano). Niente testi generati al volo con tono diverso da quello stabilito: se una stringa nuova non suona come le altre, è sbagliata.

## Fuori scope, consapevolmente

- Notifiche push (sostituite dagli indicatori di novità)
- Audio streaming live / walkie-talkie vero (coperto dai messaggi vocali)
- Skribbl.io e Gartic Phone (richiedono canvas sincronizzato: progetto a sé)
- Modifiche/reazioni/thread sui messaggi
- Validazione server-side anti-cheat: è un gioco tra amici, il controllo client-side basta

## Sezione Info

- Indirizzo Villaggio S'oru 'e Mari, 37, Quartu Sant'Elena
- Numeri utili (da compilare col gruppo)
- Accesso al regolamento e al tutorial

## Se un giorno diventasse generale

Due cambi strutturali da tenere a mente, non da fare ora:
- **Configurazione al posto dell'hardcoding**: giorni, tappe, curiosità oggi sono cuciti su questo viaggio; servirebbe un flusso di setup iniziale. I contenuti storia/cibo resteranno comunque un mix di API e curatela a mano
- **Auth vera**: l'anonima + codice va bene per 8 amici fidati, non per gruppi sconosciuti che condividono la stessa infrastruttura

## File da fornire insieme a questo spec

- `sardegna-itinerario.html` — palette (`--sea #0B3550`, `--gold #F2A93B`, `--coral #E8604A`, `--juniper #3F6E5C`, `--sand #F7F4EC`) e markup del timeline da riusare
- `public/sounds/*.mp3` — i clip del soundboard, quando li trovi
