# Da fare

Coda di lavoro decisa, in ordine. Diversa da `IDEE.md`, che è il parcheggio
delle cose non decise. Aggiornata il 31 luglio 2026.

Stato: punti 1-5 dello spec completi (minimo spedibile), più il punto 6
(motore punti) e il 7 (classifica, MVP, Maglia Nera, Il Testamento).

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

5. **Il Testamento con un'estetica vera** (~1 ora). Adesso è un elenco
   puntato. Serve epicità: legno inciso o pietra, numeri romani in rilievo,
   sigilli sulle Leggi ancora chiuse. Aria di antico, non di tabella.

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
