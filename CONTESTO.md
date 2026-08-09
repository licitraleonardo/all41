# Contesto — quello che non sta nel codice

La memoria condivisa delle chat. Su questo progetto hanno lavorato cinque
sessioni di Claude Code separate, che non sanno niente l'una dell'altra: qui
dentro c'è quello che il codice e `git log` non raccontano — perché una scelta è
fatta così, dove Leonardo ha cambiato idea, cosa è già stato provato e non
funziona, cosa aspetta una risposta.

**Da leggere all'inizio di ogni sessione nuova.** Cosa è stato fatto lo dice
`git log`; come funziona lo dice il codice. Questo file esiste per il resto.

> Ricavato il 9 agosto 2026 dalle trascrizioni delle cinque sessioni (38 MB,
> 233 messaggi di Leonardo). Dove due sessioni si contraddicono, è scritto.

---

## 1. Come lavora Leonardo

- **Non spiegargli come funziona il codice.** Ogni consegna finisce con: cosa
  aprire, cosa fare passo per passo, cosa dovrebbe vedere se funziona, cosa
  vedrebbe se è rotto e dove guardare in quel caso. È scritto in `CLAUDE.md` ed è
  la regola che ripete più spesso.
- **Spara idee a raffica e vuole che sia Claude a smistarle.** *«ovviamente io
  sparo idee a raffica poi sarai tu a valutarne la fattibilità»*. Proporre a
  parole invece di implementare è quello che si aspetta.
- **Non fare il manager sul costo.** *«non voglio influenzarti e fare il manager
  a meno costo massima resa, valuta tu»*. Ha rifiutato esplicitamente la proposta
  di verificare meno a fondo per risparmiare.
- **Dire sempre cosa NON è stato verificato, e perché.** Accetta bene i limiti
  dichiarati, male le cose date per buone. Separare sempre *«cosa ho verificato
  io»* da *«cosa puoi verificare solo tu su un dispositivo vero»*, dicendo anche
  **come** è stata fatta la verifica.
- **Si perde fra menu e passaggi.** Gli servono tabelle "dove sei tu" con lo
  stato di ogni cosa che deve fare, e l'indicazione di cosa **non** fare adesso.
  Da qui nascono `DA-LANCIARE.sql` (un file solo invece di quattro) e
  `npm run sql:lancia` (niente browser).
- **`vai`, `daje`, `sisi fai la cosa migliore` = delega piena sulla direzione,
  non permesso di saltare le verifiche.** Ha continuato a bocciare cose appena le
  ha viste, anche in "modalità auto".
- **Le credenziali non le scrive Claude.** Regola che Claude si è dato e che lui
  ha accettato: *«è una credenziale, e preferisco non metterci le mani»*.
- **Una feature per volta, poi stop** (`CLAUDE.md`). Sospeso deliberatamente per
  la fase finale — *«sei in modalità auto, ormai l'app deve essere solo
  ottimizzata»* — ma vale per l'ottimizzazione, **non** per feature nuove.
- **Se una richiesta è in realtà venti interventi, non si comincia**: si
  spacchetta a parole, si dice dove secondo te sbaglia, si propone un ordine.
- **Ammettere gli errori senza attenuarli**, e sistemare la causa non il sintomo.

### Come si scrive

- **Testi UI in italiano informale, voce di Allan**: puntiglioso, mai simpatico,
  ironico e detto piatto. La battuta nasce dalla precisione ossessiva
  (*«Mancano 287 ore. Non che le stessi contando.»*), non dall'essere spiritosi.
  Un Allan che fa il cicerone contento è un altro personaggio e si consuma alla
  prima schermata.
- **Allan tace quando non serve.** Nel foglio SOS non c'è nessuna battuta: è
  l'unico posto dell'app dove sta zitto.
- **Nomi di funzioni, variabili e file in italiano** (`esito`, `raccontaFinale`,
  `negliAppunti`, `prove/`).
- **Regola scritta nel file dei testi: nessuna frase può contenere "domani" o
  "stasera".** Devono reggere a qualsiasi ora. Scoperta provando *«Domani ti alzi
  presto»* alle 04:30 del 12 agosto, quando domani è già oggi.
- **I bottoni dicono cosa succede se li premi, non com'è adesso lo stato.**
  *«Metti ai voti +3»*, non un conferma generico. Lo stato si legge altrove.
- **I bottoni devono far agire, non pensare.** *«Torna all'itinerario»* →
  *«Indietro»*: *«a livello di reazione devo pensare a cosa fare, mi crea
  attrito»*.
- **I numeri nei testi si prendono dalla configurazione, mai scritti a mano.** Un
  testo scritto a mano mente appena cambi il limite: è successo con la Legge I,
  che diceva ancora ±10 quando il limite vero era ±5.
- **I messaggi d'errore dicono cosa fare, non cosa è successo al database.** E
  devono reggere grammaticalmente con tutti i nomi: *«Le foto si è rotto»* è
  diventato *«non si carica»* perché il participio sbagliava genere una volta su
  due.
- **Nessuno afferma quello che non sa.** Dove lo storico non può ricostruire i
  giri dice che da lì non si vede più, invece di *«Nessuno ha indovinato»*.
- **Non colorare di rosso ciò che non è un guasto.** E gli avvisi che spiegano
  qualcosa non scadono da soli.
- **Suggerimenti velati, non didascalici.** Chi propone punti per sé legge solo
  *«Il Testamento ha notato.»* — non quale Legge né quanto costa.
- **Commit in italiano, uno per decisione, che raccontano l'effetto e non il file
  toccato.** *«Lo storico racconta la partita intera, non solo l'ultimo giro»*.
  `git log` è la fonte da leggere per capire le scelte.
- **Nei blocchi di comando con segnaposto: niente bottone Run.** Leonardo lo
  preme. `git remote add origin https://github.com/TUO-USERNAME/all41.git` è
  stato eseguito letteralmente.

---

## 2. Dove ha cambiato idea

Le sue correzioni valgono più di tutto il resto: dicono come pensa.

- **I quattro bottoni combinati dell'Impostore** (1 impostore × 2 giri, 1×3, 2×2,
  2×3) → una domanda sola, e *«un altro giro»* dentro il voto d'accusa a ogni
  fine giro. *«mi sembra più logica così»* — e aveva ragione: dal codice è sparita
  roba invece di aggiungersene. *«Ne sappiamo abbastanza?»* ha senso solo dopo
  aver sentito, non prima.
- **La guardia contro il profilo creato per sbaglio**: da un'euristica che
  indovina se il nome somiglia a un codice → doppia conferma sempre. *«mi sembra
  complesso e perfetto per far buggare un semplice log, mi basterebbe una doppia
  conferma»*. Due regole stupide che non possono sbagliarsi battono una
  intelligente che può.
- **Il Testamento "epico"** (fondo scuro, venature, sigilli): chiesto da lui,
  poi interrotto a metà e bocciato. *«niente scusami non mi piace, lasciamolo
  minimale come la prima volta era già a posto»*. Se un giorno si cerca
  l'epicità: **una** cosa sola e forte (la tipografia dei numeri romani), non
  tutti gli effetti insieme.
- **Dove si vota una proposta di punti**: dentro la Classifica → banner globale
  in cima all'app. *«la classifica è il posto dove guardi il risultato, non dove
  prendi decisioni»*. La terza opzione *«Voto dopo»* esiste perché obbligare a
  scegliere per far sparire un banner produce voti a caso.
- **Le Spese**: tre segmenti → una pagina sola. *«tutto in uno»*.
- **I saldi di tutti** → solo il proprio e quelli di chi ha un conto con te.
  *«aprire i saldi di tutti mi sembra eccessivo»*: era un effetto classifica.
- **La notifica del Testamento**: si spegneva toccando → si spegne **guardando**.
  *«non mi piace che si deve cliccare per toglierla, basta visualizzarla a
  schermo»*.
- **La faccia di Allan**, tre versioni e due bocciate: SVG a mano (giusto di
  carattere, sbagliato di famiglia) e DiceBear (faceva facce simpatiche, e Allan
  simpatico non è) → gli 8 sprite pixel art dal character design originale.
- **Allan è sempre e solo il draghetto**, senza dettagli d'abito. *«too much
  così»*.
- **Il nome è Allan con due L**, contro il suo stesso character sheet che dice
  ALAN. Nell'app convivevano due grafie senza che nessuno se ne fosse accorto.
- **Il tasto «Rivela lo stesso»**: un tocco → richiesta di più della metà.
  *«quel rivela lo stesso è il male, rovinerebbe le partite se premuto per
  sbaglio»*.
- **Il preavviso della navicella nella Pecora**: tolto. *«non dobbiamo dare
  nessun indizio su quando arriva»*.
- **La tabella "Numeri"** a otto colonne per undici persone → dashboard a barre.
  *«no ahahah… la togliamo e mettiamo info dopo guida con i numeri utili da
  chiamare, sorry»*. Con "info" intendeva indirizzi e numeri, non statistiche.
- **Il blocco della soundboard**: per singolo suono → cumulativo su tutti.
- **I tasti rapidi in chat**: in cima → in fondo, attaccati alla barra di
  scrittura. Erano nel punto peggiore, lontano dal pollice.
- **L'auto-proposta di punti**: penalità fissa −3 → va ai voti ma smascherata, e
  la penalità vale quanto ti sei dato. Chiedere 5 costa 5.
- **Il push**: da *«proponimelo come codice da run»* → automatico, perché lavora
  spesso dal telefono e non riesce a fare push da lì.
- **Il tutorial di Altro**: cinque nuvolette consecutive → ognuna aspetta la sua
  sotto-sezione. *«il tutorial di altri è tutto consecutivo»*.
- **I mini suggerimenti dell'Impostore**: tolti tutti tranne uno. *«è già
  abbastanza intuitivo il gioco»*.
- **Il taglio degli audio**: aveva chiesto mezzo secondo da inizio **e** fine.
  Misurando, le code risultavano fra i punti più forti dei file (la battuta è
  proprio in fondo) e `Beee.mp3` dura 1,07s — mezzo secondo per lato l'avrebbe
  cancellato. Tagliato solo il vuoto iniziale: *«la cosa che volevi ottenere, non
  quella che avevi chiesto»*.
- **Le sfide foto**, riscritte due volte: *«in viaggio sarà raro prendere il
  telefono in continuazione»*. Le sfide restano aperte per sempre, durante il
  viaggio non si assegna niente, il 17 si vota, il 20 si chiude.

---

## 3. Decisioni prese, e perché

### Impostore

- **Le schede di voto sul database sono NUMERI DI POSIZIONE dentro
  `votes.options`, mai id.** È la trappola più ricorrente del progetto:
  incontrata **quattro volte**, sempre senza nessun errore visibile. Dal secondo
  giro d'accusa le opzioni sono solo i superstiti, quindi leggerle con l'elenco
  intero sposta ogni numero di un posto e premia le persone sbagliate. Le opzioni
  si leggono **sempre dal voto stesso**, mai dalla configurazione.
- **Il testimone dei 30 secondi non è un countdown, e l'orario lo mette il
  database.** Lo spec vieta i timer: questo non mette fretta a chi parla, protegge
  chi parla da chi ha il dito veloce. Alla scadenza non succede niente, si sblocca
  solo il tasto per gli altri. Sei orologi di telefoni diversi darebbero sei conti
  diversi, e quello indietro di un minuto sbloccherebbe tutto subito.
- **«Un altro giro» sta dentro il voto d'accusa**, non in un bottone a parte: è
  la stessa decisione. A parità con l'accusa, si accusa — un gruppo indeciso che
  si blocca da solo è peggio di un'accusa sbagliata.
- **Se alla soglia ci sono più persone di quante se ne possono accusare, non esce
  nessuno.** Un gruppo che si divide così non ha accusato: ha detto che non lo sa.
- **Rivelare in anticipo e far partire la partita richiedono più della metà** —
  non la metà: quattro su otto non bastano. Una soglia sola, perché due
  maggioranze diverse nella stessa serata sarebbero confusione.
- **«Annulla la partita» invece non chiede il consenso di nessuno**, solo doppia
  conferma: se serve annullare è proprio perché qualcuno manca all'appello.
- **Chi è stato beccato in un giro precedente NON può tentare il colpo di coda —
  è voluto**, e ci sono sei prove che lo fissano perché nessuno lo "corregga"
  pensando di chiudere un buco. Chi è caduto prima vede le parole di tutti dalla
  schermata "Sei fuori", quindi la parola del gruppo la sa già.
- **Nel colpo di coda riuscito i punti si ribaltano**: chi aveva beccato
  l'impostore non prende più niente. Pagare entrambi sarebbe pagare due volte lo
  stesso finale, ai due lati opposti.
- **Il confronto della parola ignora maiuscole, accenti, apostrofi storti e spazi
  doppi**: è il punto dove *caffe* contro *caffè* decide una partita.
- **Il conteggio dei voti si vede in tempo reale durante l'accusa.** Chi vota per
  ultimo diventa l'ago della bilancia ed è voluto: una parità la vedi arrivare e
  la puoi rompere.
- **I voti dei giri passati si ritrovano per finestra temporale, non con una
  chiave esterna** — perché la strada pulita voleva un quinto SQL da far lanciare
  a Leonardo, che ne aveva già quattro in coda. **Regge sull'invariante "di
  partita aperta ce n'è sempre una sola": se quell'invariante cade, cade anche
  questo.** La finestra ha un **soffitto** esplicito (la partita successiva):
  senza, un telefono rimasto indietro che tocca «Rivela» venti minuti dopo faceva
  girare `paga()` su una partita vecchia, con punti non revocabili e nessun errore
  in console.
- **I voti di categoria `impostore` sono esclusi da `chiudiScaduti`, e il filtro
  sta nella LETTURA.** La lettura si ferma a venti: venti voti impostore rimasti
  aperti dalle sere prima avrebbero occupato tutti i posti, e i sondaggi veri non
  si sarebbero chiusi più.
- **`chiudiAccusa` lancia un'eccezione se le passi l'oggetto sbagliato.**
  Passandole l'esito invece del voto chiudeva il giro senza accusare nessuno, in
  silenzio. Un no-op silenzioso su un input storto è la trappola che questo
  progetto ha già pagato due volte.

### Punti, Leggi, proposte

- **I voti sulle proposte sono palesi, ma i nomi si vedono solo dopo aver
  votato.** Le sfide restano anonime davvero (`ballots` resta `{}`), l'Impostore
  era già palese.
- **La ripetibilità delle Leggi non ha un campo nuovo: la decide la `dedupeKey`
  che c'era già.** Senza data = una volta per viaggio; con l'id = una a testa;
  con la data = una al giorno; con la coppia = una per coppia.
- **Quorum a metà gruppo: sotto la metà la proposta si ANNULLA, non viene
  bocciata.** Sarebbe ingiusto dare il malus a chi ha proposto solo perché gli
  altri non hanno guardato il telefono.
- **La Legge "sei sceso sotto lo zero" scatta una volta sola per persona**: la
  chiave non contiene la data, altrimenti chi resta in negativo pagherebbe un
  punto al giorno e non ne uscirebbe più.
- **Nessuna Legge è nota in partenza.** Decisione di Leonardo: *«non esistono
  trofei o leggi note a tutti, si scopriranno tutte nel corso del gioco»*.
  Conseguenza: il tutorial non può elencare le regole dei punti.
- **Le nuove Leggi si scrivono solo se l'app scrive già i dati che le fanno
  scattare**: *«quelle che richiedono dati che l'app non scrive sembrano gratis e
  poi non scattano mai»*.
- **La caccia al tesoro è stata ribilanciata da 190 punti in palio a 36**: 13
  sfide competitive valevano più di **tutte** le Leggi attive messe insieme.
- **I punti della Dama passano dal titolo di giornata, non dalla singola
  vittoria**: pagare ogni vittoria vorrebbe dire che il viaggio lo vince chi gioca
  di più.
- **Tutti i pareggi si risolvono allo stesso modo (id più basso).** Senza una
  regola stabile due telefoni calcolano vincitori diversi per gli stessi numeri, e
  a spuntarla sarebbe chi scrive per primo.

### Soldi

- **Centesimi interi, e i centesimi che avanzano vanno sempre ai primi in ordine
  di id**: così il conto viene identico su tutti e otto i telefoni.
- **Con più paganti, l'importo si divide fra chi ha messo i soldi esattamente
  come si divide fra chi l'ha consumata**: la somma dei saldi resta zero **per
  costruzione**, non perché torna.
- **Niente «segna come pagato» sui debiti**: il debito sparisce perché il rimborso
  esiste, non perché qualcuno spunta una casella. Si salvano i fatti, non i
  risultati.
- **L'eliminazione della propria spesa non scade** (messaggi e foto sì, entro 5
  minuti): un importo storto lo scopri facendo i conti la sera.

### Struttura, offline, robustezza

- **Serverless**: i voti scaduti li chiude il primo che apre l'app, con funzioni
  SQL che bloccano la riga. Lo spec lo chiama *«il punto più delicato
  dell'architettura»*.
- **I record della Pecora si derivano, non si salvano**: il record del giorno si
  azzera da solo perché domani sono altre righe. Nessun lavoro a mezzanotte.
- **La cache offline non maschera MAI un guasto vero**: ripiega solo sugli errori
  di rete, e ha un numero di versione per buttare le copie salvate con una forma
  vecchia.
- **Ogni tab è avvolto in un error boundary**; banner, nuvolette e coriandoli ne
  hanno uno "zitto"; la barra dei tab resta fuori da tutto. Senza confini, un tab
  che esplode porta giù gli altri quattro — **è successo davvero**.
- **Le prove automatiche leggono dentro `supabase/schema.sql`, non solo il
  JavaScript**: se qualcuno cambia un fatto su cui poggia una decisione, deve
  rompersi una prova invece di restare scritto in un commento che nessuno rilegge.
- **Il commit e l'ora di build sono a schermo fin dal punto 1** (in fondo al
  Profilo): è il modo esatto per distinguere un problema di deploy da una cache
  incastrata.
- **I documenti nascono condivisi, con un avviso esplicito che "solo per me" non
  è vera privacy.** Con auth anonima e codice d'accesso, promettere una privacy
  che l'app non può mantenere è peggio che non offrirla.
- **La posizione si condivide con un tasto e non si aggiorna mai da sola**, 5
  decimali: quello che vedi è *«l'ultima volta che ha detto dov'era»*.
- **I bottoni a limite raggiunto sembrano spenti ma restano cliccabili e
  rifiutano**: un tasto che non risponde lascia solo a chiedersi se l'app si è
  rotta.

---

## 4. Trappole già pagate — non riproporle da zero

### iOS e browser

- **`crypto.randomUUID()` esiste solo in contesto sicuro** (HTTPS o localhost).
  Su `http://192.168.x.x` non c'è proprio: dal telefono falliva **qualunque**
  upload, e sembrava un problema di foto. C'è un ripiego in `src/lib/id.js`.
- **Microfono, geolocalizzazione e service worker hanno lo stesso vincolo, e per
  quelli NON esiste ripiego.** Su HTTP di rete locale non funzioneranno mai, per
  quanto il codice sia giusto.
- **Su iOS la copia negli appunti fallisce se c'è un `await` davanti**:
  l'attivazione utente scade. Va dichiarata l'intenzione dentro il gesto e passata
  una **Promise** a `navigator.clipboard.write` con un `ClipboardItem`. Il ripiego
  classico (textarea + `select()`) su iOS non funziona affatto.
- **La PWA installata su iOS ha storage separato dal browser**: chiede di
  rientrare col codice. Chi installa senza il codice a portata resta fuori.
- **La PWA su iOS non ha tasto ricarica**: va chiusa dallo switcher e riaperta
  **due** volte. Prima di reinstallare, segnarsi il codice dal Profilo.
- **Su iOS "Aggiungi a Home" esiste solo in Safari**, e **fissa l'indirizzo
  corrente** — installando da `/installa` l'icona riaprirebbe per sempre la guida.
- **iOS non supporta la trasparenza nelle icone home.** Ma la volta che l'icona
  sembrava "danneggiata" la causa vera era un'altra: il PNG era **corrotto**, un
  chunk IDAT non passava il CRC.
- **L'iPad si dichiara Macintosh**: si distingue solo dal touch. Il caso che conta
  non è riconoscere WhatsApp, è non dire *«apri in Safari»* a chi è già in Safari.
- **Safari non riproduce l'Ogg in modo affidabile.** I cinque audio consegnati
  erano `.ogg`, convertiti tutti in mp3 mono.
- **Un vocale WhatsApp o Telegram non prova niente sui formati**: ricodificano
  tutto.
- **`capture` e `multiple` su un input file si escludono a vicenda**: servono due
  bottoni. E `capture` **non mette la foto nel rullino**: è un file temporaneo, se
  resta solo in memoria basta bloccare lo schermo per perderlo.
- **Nessun browser apre HEIC senza libreria.** `heic-to` pesa 751 KB gzip, ed è
  caricato pigro. Il formato si riconosce dai **primi 12 byte**, non
  dall'estensione: un HEIC che passa da WhatsApp arriva col nome `.jpg`.
- **L'attributo HTML `hidden` perde contro `display: flex`.**
- **`scrollTo` con `behavior:'smooth'` non arriva mai in fondo se la pagina cresce
  mentre scorre.**
- **Un effetto che dipende dalla LUNGHEZZA di una lista cappata non scatta mai una
  volta che la lista è piena.** La chat non scendeva perché il feed tiene max 30
  messaggi: dal trentesimo in poi la lunghezza resta 30.
- **L'app legge la data del dispositivo una volta sola, quando disegna.** Chi
  lascia l'app aperta oltre la mezzanotte resta a ieri, e su iOS le app in home
  vengono congelate e riprese invece che ricaricate.

### Supabase e SQL

- **`create table if not exists` NON aggiunge colonne nuove a una tabella che
  esiste già, e non se ne lamenta.** C'è una sezione "adeguamenti" con
  `alter table … add column if not exists`.
- **L'SQL Editor si ferma al PRIMO errore.** La sezione storage sta in fondo
  apposta, dentro blocchi che catturano l'errore.
- **PostgREST tiene in cache le firme delle funzioni**, e con due funzioni omonime
  di firma diversa **ne sceglie una a caso**: la vecchia va droppata
  esplicitamente. Ogni file finisce con `notify pgrst, 'reload schema'`.
- **Supabase realtime ascolta SOLO le tabelle iscritte alla pubblicazione.** La
  sottoscrizione riesce lo stesso, nessun errore, non arriva mai niente. È il
  difetto peggiore possibile per la Dama: due persone che aspettano la mossa
  dell'altra.
- **Supabase non ha la persistenza offline stile Firestore**: lo spec dava per
  scontata una riga di configurazione che vale solo per Firestore. La cache è
  scritta a mano.
- **Il client non può svuotare le tabelle** (le policy non danno il permesso), e
  `truncate` **non tocca lo storage**: i file vanno cancellati a mano.
- **Il client Supabase non ha nessuna scadenza globale**, e `storage-js` non ha
  timeout suo: ogni invio senza `conScadenza` aspetta all'infinito.
- **Il piano gratuito ha 1 GB di storage**: è l'unico freno rimasto.
- **La password del database non è la password dell'account** (Leonardo è entrato
  con GitHub) e non si rivede più dopo la creazione: va rigenerata.
- **La connection string sta dietro il bottone Connect in alto**, non in Project
  Settings → Database. Serve il **Session pooler (5432, IPv4)**: la Direct è solo
  IPv6, e la Transaction pooler (6543) non regge le funzioni e i blocchi `do $$`.

### Vercel e deploy

- **Vercel rifiuta i pattern con gruppi annidati in `vercel.json` — e quando li
  rifiuta FALLISCE OGNI DEPLOY in silenzio**, lasciando online l'ultimo build
  buono. Una riga ha bloccato tutti i deploy per ~12 ore e 12 commit. C'è uno
  script che lo verifica.
- **Senza una regola no-cache sulla CDN, il service worker resta in cache e l'app
  resta congelata per settimane.** La prova che distingue un deploy rotto da un
  service worker incastrato: aprire in incognito.
- **Vite incolla le variabili d'ambiente nel bundle AL MOMENTO DELLA BUILD**, e
  espone solo quelle con prefisso `VITE_`. Aggiungerle su Vercel dopo un deploy
  già costruito non ha effetto: serve Redeploy **senza** cache.
- **`.env.local` non è nel repo, quindi Vercel non lo vede mai.**
- **Il service worker non esiste in sviluppo**: la PWA va provata sul deploy.

### Il pannello di anteprima

- **Non compone fotogrammi.** Niente screenshot, `requestAnimationFrame` non
  scatta, `ResizeObserver` e `IntersectionObserver` non consegnano,
  `document.hasFocus()` è `false` (quindi la copia appunti fallisce **sempre**
  lì). Tutta la verifica si fa con misure sincrone via `javascript_tool`.
- **Rifiuta il certificato autofirmato del dev server HTTPS.** Per guardare l'app
  serve `npm run dev:http` sulla 5174, in chiaro.
- **Le misure mentono se la finestra è 0×0**: una carta risultava larga 46px
  invece di 300. **Chiamare `resize_window` prima di misurare.**
- **I moduli restano in cache fra sessioni**: più volte un "non funziona" era il
  modulo vecchio. Ricaricare la pagina prima di concludere.

### Strumenti e ambiente di lavoro

- **`sed` corrompe i file** (mangia le parentesi di chiusura) e le sostituzioni
  via python/bash falliscono in silenzio se l'ancora non matcha. **Usare `Edit`.**
- **Il tool `Write` converte le sequenze di escape in caratteri veri** e può
  inserire byte NUL nel sorgente. Successo due volte.
- **Un identificatore mancante PASSA il build e i test**: si scopre solo aprendo
  quella schermata. Due crash spediti a Leonardo in un'ora. Ora `no-undef` e
  `react/jsx-no-undef` sono errori — **`npm run lint` prima di ogni commit non è
  opzionale**.
- **Un `process.exit` a fine file di prove uccide il processo prima delle prove
  aggiunte in coda**: sono "passate" senza girare mai. Successo due volte.
- **Su Windows il `/tmp` di Git Bash e quello di Node non sono lo stesso posto.**
- **`\b` dopo `IMG` non funziona in regex**: l'underscore è un carattere di
  parola.
- **I limiti di sessione Claude fanno fallire i workflow multi-agente a metà.**
  Già successo due volte. Le critiche non verificate vanno ricontrollate a mano:
  *«un elenco di difetti finti è peggio di nessun elenco»*.
- **Un contrasto formalmente a norma non basta**: 5,33:1 a 12px in maiuscoletto
  spaziato sembra spento comunque. Calcolare sempre i rapporti prima di scegliere
  un colore — la stessa abitudine ha scoperto i pezzi neri invisibili sulla
  scacchiera (1,05).
- **Con quattro persone il rimescolamento dà lo stesso ordine 18 volte su 400**:
  sembra un difetto e non lo è.

---

## 5. Scartate di proposito — non riproporle

| Cosa | Perché no |
|---|---|
| **GAME-1**, la Pecora a tutto schermo | Aritmeticamente impossibile: 208 unità di mondo = 0,22s di preavviso contro 0,58s di salto. Le varianti (doppio salto, tieni premuto) vogliono un secondo comando, azzerano i record e invalidano 82 controlli. I numeri sono in `DA-FARE.md`. Il candidato migliore, se mai: il doppio salto |
| Firebase / Firestore | Carta di credito obbligatoria per lo Storage. Costo accettato: la cache offline va scritta a mano |
| Inviti con notifiche per l'Impostore | Siete otto **nella stessa stanza**: si dice a voce. Serve invece la sala d'attesa |
| L'elenco completo delle sfide | *«non deve essere troppo guidata, sempre alla scoperta dell'app»* |
| MVP e info utente in ogni tab | Una striscia su ogni schermata per un dato che cambia una volta al giorno. L'MVP ovunque smette di essere un premio |
| La lista globale "chi deve a chi" | *«sapere che Turi deve dei soldi a Leo non è una cosa su cui puoi agire»* |
| Un campo importo per ogni pagante | Raddoppia il modulo per un caso raro: quelle restano due spese separate |
| Due schede "Miei"/"Condivisi" nei Documenti | Si sovrappongono, e il volume è di 5-15 documenti in tutto |
| Il doppio tap per "importante" | Invisibile, e sul tasto dei vocali due gesti si pestano i piedi |
| L'onda vera dei vocali | Decodificare ogni messaggio all'apertura per un dettaglio che nessuno guarda |
| La mappa dentro l'Itinerario | I link 📍 Maps aprono la navigazione, che davanti a un bivio serve più di un puntino |
| La lucina che pulsa sui personaggi | Dopo il secondo giorno diventa un tic |
| Demo con feature deliberatamente rotte | Mescola bug veri e finti. E metà dell'effetto c'è già: il Testamento è davvero oscurato |
| Il QR su `/installa` | La CSP impedisce librerie esterne, e a mano sarebbero ~150 righe per un caso che si risolve copiando il link |
| Codici a 6 caratteri, nomi generati | I codici da 5 sono già distribuiti; con nomi inventati nessuno si riconosce in classifica |
| Alzare i limiti di chat/vocali/album | Renderebbe la chat un'altra cosa: riscritte le soglie delle idee, non i limiti |
| Accorciare i suoni a 3-4s | *«mi piace come funziona anche con gli audio lunghi»* |
| Precaricare album e decodificatore HEIC nel service worker | 3 MB per chi non ne ha bisogno; la cache tiene solo le foto già guardate |

---

## 6. Ambiente e comandi

| Cosa | Dove / come |
|---|---|
| **Repo** | `licitraleonardo/all41`, privato. Deploy Vercel su `all41.vercel.app`, build automatica a ogni push su `main` |
| **Stack** | Vite 8 + React 19 in **JavaScript**, non TypeScript. Supabase. Node 24.18 |
| **Prima di ogni commit** | `npm run lint` **e** `npm run prova`. Non è opzionale |
| **Prove** | ~421 controlli in `prove/*.mjs`, girano in pochi secondi con Node puro |
| **SQL dal terminale** | `npm run sql:lancia <file>` — serve `SUPABASE_DB_URL` in `.env.local`. `svuota.sql` pretende `--sono-sicuro` |
| **SQL dal browser** | Supabase → SQL Editor → incolla `supabase/schema.sql` → Run. Deve rispondere `Success. No rows returned`; un errore in fondo sullo storage è accettabile |
| **File SQL** | `DA-LANCIARE.sql` è **generato** da `strumenti/unisci-sql.mjs`; `CONTROLLA.sql` è la verifica in sola lettura |
| **Che versione gira** | Targhetta col commit in fondo al Profilo (tocca l'avatar in alto). Se non corrisponde, ogni altro test non vale niente |
| **Dev server** | `npm run dev` (HTTPS, 5173) per il telefono; `npm run dev:http` (5174) per il pannello di anteprima |
| **Dal telefono** | `https://192.168.1.9:5173` — https per esteso, e passare l'avviso del certificato |
| **Profili di prova** | Turi `694Z7`, Giulia `SUESS`, Ciccio `GEXSF`, più Ale, Nadia, ProvaAuth, Francesca. **Sette da cancellare prima della partenza** |
| **Provare le date** | Si sposta l'orologio del PC: sfide, voto della caccia (17), chiusura (20), MVP, banner posizione |
| **Impersonare** | `all41.memberId` in localStorage — ripristinare sempre dopo |
| **Pulizia dopo le prove** | Le partite dell'Impostore lasciate aperte bloccano tutti: vanno annullate |
| **Diagnostica** | La riga `[all41] errore grezzo:` in console porta il messaggio vero. `code: 'scaduta'` = timeout, qualsiasi altro codice è un guasto |
| **Dimensioni** | Telefono da 390px = **358px utili** |

### I documenti del repo, e il loro stato

| File | Stato |
|---|---|
| `sardegna-trip-app-spec.md` | **Chiuso.** Tutti e 15 i punti fatti |
| `Specifiche Modifiche.md` | **Chiuso.** Stato di ogni ID scritto dentro — non rifare quel lavoro |
| `idee-leggi-trofei.md` | **Chiuso.** Parte 6 col verdetto per ogni idea |
| `SESSIONE-8-AGOSTO.md` | Consegna corrente. Le prime due sezioni sono bloccanti |
| `CACCIA-IMPOSTORE.md` | **Nove difetti aperti** dell'Impostore, col punto esatto nel codice |
| `DA-FARE.md` | Trappole storiche e idee parcheggiate (fra cui i numeri di GAME-1) |
| `CANTIERE.md` | Chi sta lavorando su cosa. **Da leggere prima di scrivere qualunque file** |

---

## 7. Aperte — cosa aspetta una risposta

**Decide Leonardo:**

- **I nove difetti dell'Impostore** in `CACCIA-IMPOSTORE.md` — chi li prende. La
  sessione A ha proposto di prenderli lei (ha il contesto fresco); vedi
  `CANTIERE.md`, conflitto 1. Il più urgente non aspetta che qualcuno giochi:
  **`schema.sql` rilanciato disfa il testimone e il contatore dei giri, in
  silenzio.**
- **SFI-1**: la finestra di voto della caccia chiude il 19 o il 20? Tre giorni
  dopo il 16 fa 19, ma `CACCIA.chiude` è il 20.
- **I malus sono pubblici o privati?** Indicata come una delle decisioni che
  cambiano il tono più di qualsiasi numero, mai risposta. I voti palesi sono stati
  decisi, i malus no.
- **I voti palesi restano visibili solo dopo aver votato, o sempre?** Claude ha
  scelto la prima; si cambia togliendo una condizione.
- **GAME-1**: riscriverlo in una forma fattibile o toglierlo del tutto.
- **Allan torna a commentare in chat?** Le battute sono già scritte e spente in
  `config/allan.js`. Ha detto *«per adesso no»*, non *«mai»*.
- **I testi del tutorial**: Claude li ha riscritti nella voce asciutta di Allan
  invece dei testi entusiasti di Leonardo, dicendolo esplicitamente. Mai risposto.
- **Il tutorial di Altro**: adesso ogni voce aspetta la sua sotto-sezione, quindi
  Guida e Info molti non le vedranno mai. Torna consecutivo in una riga.
- **Un tetto ai punti dell'Impostore.** Oggi non ce n'è: una partita in otto ne
  inietta fino a 16, e in una sera se ne giocano quattro o cinque, contro 44 di
  tutte le Leggi. Da decidere **dopo** la prima sera di gioco vero.
- **La sala d'attesa dell'Impostore**: chi arriva a partita iniziata la vede in
  corso e si mette in coda.
- **Cosa fa chi viene eliminato** in un gioco che dura venti minuti: oggi vede le
  parole di tutti ma non parla e non vota.
- **Con due impostori il colpo di coda vale il PRIMO tentativo, non il migliore**:
  possono rovinarsi la partita a vicenda. Segnalato come *«da concordare a voce
  prima»*, non risolto nel codice.
- **Le quattro righe di controllo di `DA-LANCIARE.sql` dicevano tutte "a posto"?**
  Leonardo ha scritto solo *«da lanciare fatto»*: la conferma non è mai arrivata.
  Verificabile in sola lettura con `supabase/CONTROLLA.sql`.
- **Rigenerare la password del database**: è finita stampata in una trascrizione
  per un comando di ispezione andato storto. **Non è finita nel repo**
  (`.env.local` è escluso).

---

## 8. Solo Leonardo può farlo

- **L'Impostore giocato davvero in sei-otto persone.** È l'unico dei cinque test
  su dispositivo ancora aperto: iPhone/safe area, Dama in tempo reale fra due
  telefoni, `/installa` da WhatsApp e l'audio incrociato sono tutti passati.
- **Lanciare `svuota.sql` il giorno prima di far entrare il gruppo**, Francesca
  compresa. Un profilo di troppo o di meno sballa i saldi di tutti. **Cancella
  tutto**, non solo i profili di prova — comprese le quattro partite vere
  dell'Impostore usate per verificare lo storico. E i file nello storage **restano
  lì**: vanno svuotati a mano dalla pagina Storage.
- **Orario e molo della barca del 14**, più link Maps. È la giornata più
  importante e l'unica pagata, e nell'app non c'è né ora né luogo:
  l'informazione vive in un messaggio WhatsApp sul telefono di uno solo.
- **Telefono del villaggio, guardia medica e farmacia di Quartu.** Vanno
  **verificati, non inventati**: nella sezione Info c'è solo il 112, e gli altri
  sono scritti come mancanti apposta. Un numero plausibile in una sezione che si
  chiama "se serve aiuto" è peggio che non avere la sezione.
- **L'SOS mandato da un telefono con una tacca vera, in giro**: i dieci secondi di
  attesa sono scelti a tavolino e vanno tarati sul campo.
- **Le tarature della Pecora** (`src/config/pecora.js`): solo lui può dire se il
  gioco è troppo facile o troppo cattivo dopo due minuti veri.
- **L'ASPETTO.** Claude può verificare struttura, misure e colori da JavaScript —
  che basta per i bug, non per dire se una cosa è bella.
- **`/code-review ultra`** (quello che chiama "ultracode"): parte a pagamento sul
  suo account, Claude non può lanciarlo.
