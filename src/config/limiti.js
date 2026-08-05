// Limiti anti-spam. Modello a due strati dello spec: quello che conta è la
// velocità, non il totale. Una quota oraria bloccherebbe l'uso legittimo
// (cinque messaggi alle 13:00 per organizzare il pranzo ti lasciano muto
// alle 13:20) e permetterebbe comunque la raffica.
//
//   cooldown  secondi minimi fra due invii
//   raffica   quanti invii al massimo dentro la finestra
//   finestra  secondi su cui si conta la raffica
//   giorno    tetto giornaliero (null = nessuno)
//
// null al posto dell'oggetto = nessun limite, mai.

export const LIMITI = {
  // Il soundboard non ha freni: si può pestare a raffica, il suono
  // riparte da capo e chi lo preme lo sente subito. A regolarlo ci pensa
  // la Legge dell'abuso qui sotto, che invece di rallentare tutti
  // colpisce chi esagera — ed è più divertente e più giusto.
  soundboard: { cooldown: 0, raffica: null, finestra: null, giorno: null },
  free_text: { cooldown: 3, raffica: 10, finestra: 300, giorno: null },
  // I vocali non hanno freni. Erano tre in dieci minuti con mezzo minuto
  // fra uno e l'altro, ed è il ritmo sbagliato per un walkie-talkie: le
  // raffiche di vocali sono il punto, non l'abuso. Resta solo la durata
  // massima, che si impone in registrazione e non è un limite di invio.
  voice: { cooldown: 0, raffica: null, finestra: null, giorno: null, durataMax: 60 },
  // Cinque al giorno a testa nell'album. La raffica resta larga perché
  // caricarne otto di fila dopo una giornata in spiaggia è uso normale,
  // non spam: è il totale della giornata che tiene l'album leggibile.
  // Il tetto vale solo per l'album — le foto mandate a una sfida non lo
  // consumano — e una foto eliminata libera il posto.
  photo: { cooldown: 0, raffica: 20, finestra: 600, giorno: 5 },
  dove_siete: { cooldown: 60, raffica: null, finestra: null, giorno: null },
  si_riparte: { cooldown: 60, raffica: null, finestra: null, giorno: null },
  poll: { cooldown: 60, raffica: null, finestra: null, giorno: null },

  // SOS è escluso da tutto, per principio. Nessun limite in nessuna
  // combinazione di eventi: è l'unica funzione di sicurezza dell'app.
  sos: null,
}

// La scala delle penalità della Legge XIX. Cresce con l'insistenza e ha un
// tetto: martellare un bottone bloccato non può costare più di -5.
export const PENALITA = {
  primaPenalita: 3, // i primi due rifiuti non costano niente
  ogniQuanti: 3, // poi -1 ogni tre
  massimoPerBlocco: 5,
}

// Abuso di un suono (Legge XXVII). Non rallenta nessuno: chi pesta lo
// stesso bottone all'infinito se lo vede togliere, e solo quello. Meglio
// una punizione mirata che un freno addosso a tutti.
export const ABUSO_SUONO = {
  pressioni: 5,
  entroSecondi: 60,
  bloccoMinuti: 60,
}
