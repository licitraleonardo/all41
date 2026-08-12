# Da fare

Coda di lavoro decisa, in ordine. Diversa da `IDEE.md`, che è il parcheggio
delle cose non decise. Aggiornata il 12 agosto 2026, primo giorno di
viaggio.

## Dove siamo

Fatti i punti **1-8** dello spec: setup e deploy, onboarding col codice,
itinerario, Chat Rapida col soundboard, Album Foto, motore punti,
classifica con MVP e Maglia Nera e Il Testamento, caccia al tesoro con
voto anonimo. Più le proposte di punti votate dal gruppo.

Restano, tutti facoltativi: **9** Chat Vocale, **10** Spese, **11** la
Pecora offline, **12** Mappa e meteo, **13** Documenti, **14** PWA,
**15** L'Impostore.

Delle 27 Leggi ne sono vive 11: I, II, IV, VIII, XI, XII, XIII, XIV, XVI,
XIX, XXII, XXVI, XXVII. Le altre aspettano le sezioni che le alimentano.

**Verifica bloccante ancora aperta**: la n.3 dello spec, i formati audio
su iPhone. Non è mai stata fatta perché in casa c'è solo un Android.
Serve prima del punto 9.

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

## Subito — fastidi quotidiani, mezz'ora in tutto

- **"Torna all'itinerario" → "Indietro"**. La frase lunga fa pensare invece
  di far tornare indietro: crea attrito su un gesto che dev'essere
  automatico.
- **Via lo sfondo coi simboli** ereditato da `sardegna-itinerario.html`.
  Tutte le sezioni sullo stesso fondo.
- **Doppia conferma prima di creare un profilo nuovo.** Capita di incollare
  il proprio codice nel campo nome andando veloce, e ritrovarsi un doppione.
  Due controlli semplici, non un indovino:
  - conferma sempre: *"Sicuro di voler creare un profilo nuovo chiamato
    YEHAKD?"*
  - se il nome è tutto maiuscolo, avvisa che i codici sono sempre maiuscoli:
    *"Sicuro che non sia un codice?"*

## Poi — quello che tiene in piedi il gioco

1. **Legge XIX, la scala delle penalità** (~45 min). −1 al terzo tentativo
   rifiutato, poi ogni tre, fino a −5 per blocco; il contatore si azzera al
   primo invio riuscito. È la Legge che il gruppo scoprirà per prima, ed è
   già stata cercata senza trovarla.

2. **Proposte di punti votate dal gruppo** (~2-3 ore). La Legge I, e il
   pezzo che unisce la vacanza all'app. Slider da ±10 estendibile a ±15,
   mai un campo libero. L'evento punti nasce "in attesa" e non muove la
   classifica finché il voto non chiude. Accende anche le Leggi XI
   (pareggio), XII (unanimità), XIII (bocciata) e XIV (punti proposti per
   sé stessi).

3. **Scoperta di una Legge celebrata su tutti i telefoni** (~1 ora).
   Sovrimpressione con coriandoli, non una riga grigia: è il momento di
   paga di tutto il sistema, e chi scopre va celebrato.

4. **Chat in stile messaggistica** (~1,5-2 ore). I miei messaggi a destra,
   quelli degli altri a sinistra. Casella fissa in basso con la freccia di
   invio dentro, e i suoni in un menu che si apre dalla casella stessa.
   ⚠️ **Allan interviene ogni tanto** con una sua bolla colorata, passivo
   aggressivo o annoiato. Da tenere raro e locale: se commenta troppo
   diventa rumore, e se lo si scrive nel database va deciso chi lo scrive.

5. **Il Testamento con un'estetica vera** — *in sospeso, non urgente*.

   ⚠️ Provato il 1 agosto e scartato: pannello scuro tipo stele di pietra,
   venatura di legno, numeri romani incisi in oro, solchi vuoti al posto
   dei blocchi neri. Non piaceva. Il minimale attuale va bene così.

   Se si riprova, **non ripartire da lì**: il problema non era la mancanza
   di dettagli, semmai il contrario. Meglio cercare l'epicità con una cosa
   sola e forte — la tipografia dei numeri romani, per dire — che con
   texture e fondi scuri.

## Dove si vota una proposta — da rifare

Adesso le proposte in attesa stanno **dentro la Classifica**, con i bottoni
Sì/No sulla riga. Sbagliato: la classifica è il posto dove si guarda il
risultato, non dove si prendono decisioni. Mettendoci dei bottoni diventa
un modulo da compilare.

Come va fatto:

- **Un banner che resta aperto** finché non hai deciso, così la proposta
  ti trova invece di doverla cercare
- **Tre scelte, non due**: Sì, No, e **"Non mi va, voto dopo"**. La terza
  è quella che manca ovunque: se ti obbligo a scegliere fra sì e no per
  far sparire il banner, voti a caso — e un voto a caso vale meno di un
  voto in meno
- Chi rimanda **la ritrova nel tab Proponi**, che diventa il posto dove
  stanno le proposte aperte oltre che dove se ne fanno di nuove
- La Classifica torna a essere solo classifica: le proposte in attesa si
  possono ancora **vedere** lì, ma senza bottoni

⚠️ Da decidere quando si costruisce: se il banner compare **in tutta
l'app** o solo nel tab Gruppo. Io lo farei globale — una proposta di punti
riguarda tutti e scade in un'ora, quindi ha senso che ti raggiunga dove
sei, come la celebrazione delle Leggi. Ma occupa spazio in cima a ogni
schermata, quindi va tenuto basso e richiudibile.

## Al suo turno (punto 8 dello spec)

**Caccia al tesoro.** Vincoli dati dal gruppo, da rispettare quando si
costruisce:

- **tante** sfide, e **legate ai luoghi veri** dell'itinerario
- la prima è il **selfie di tutti**: si sblocca quando l'hanno caricato
  tutti, e in quel momento lo sa il gruppo intero
- **non guidata**: le sfide si scoprono usando l'app, non si presentano in
  fila con un cartello

## Da valutare — la demo esplorativa

Idea: rilasciare al gruppo prima del viaggio un assaggio volutamente
incompleto, con aria di presagio. Creazione del personaggio, chat ridotta,
selfie che sblocca il primo punto, classifica ferma, Testamento "rotto a
metà", più un tutorial in stile videogioco.

**Nota di fattibilità.** Metà è già vera senza costruire niente: il
Testamento *è* già oscurato per 19 Leggi su 25, e quell'effetto di mistero
non va simulato, c'è. Fingere che pezzi funzionanti siano rotti costa
lavoro per peggiorare l'app, e rischia di far arrivare segnalazioni di bug
veri sepolte fra quelli finti.

Il tutorial invece lo spec lo mette per ultimo di proposito: descrive
regole che cambiano a ogni feature nuova, quindi scriverlo adesso significa
riscriverlo tre volte prima del 12.

Versione consigliata: condividere il deploy com'è, con una card
d'introduzione breve, e tenere il tutorial vero per il punto 14.
