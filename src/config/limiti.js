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
  soundboard: { cooldown: 10, raffica: 5, finestra: 120, giorno: null },
  free_text: { cooldown: 3, raffica: 10, finestra: 300, giorno: null },
  voice: { cooldown: 30, raffica: 3, finestra: 600, giorno: 15, durataMax: 60 },
  photo: { cooldown: 0, raffica: 20, finestra: 600, giorno: null },
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
