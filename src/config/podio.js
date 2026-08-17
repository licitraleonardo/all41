// Il podio: la festa che chiude il gioco.
//
// Si vede una volta a testa, quando la classifica è chiusa, e serve a
// dire con una cerimonia una cosa che altrimenti si scoprirebbe premendo
// un tasto che non risponde: **è finita, e questi sono i primi tre.**

export const PODIO = {
  occhiello: 'Il viaggio è finito',
  titolo: 'Il podio',

  // I posti si scoprono uno alla volta, dal terzo al primo. Non è
  // decorazione: dette tutte insieme, le tre facce sono un elenco;
  // scoperte in ordine, sono una premiazione.
  //
  // ⚠️ 1400 ms fra un posto e l'altro. Più corto non si legge il nome,
  // più lungo si diventa impazienti e si tocca lo schermo — e toccare
  // chiude.
  passo: 1400,

  // Quanto resta a schermo dopo l'ultimo. Si chiude anche toccando.
  restaDopo: 7000,

  medaglie: ['🥇', '🥈', '🥉'],

  // La riga sotto le facce. È anche l'unico posto dove viene spiegato
  // che i punti non si muovono più: chi salta la festa lo scoprirà dal
  // messaggio della Classifica, che dice la stessa cosa.
  chiusura: 'La classifica si ferma qui. I punti non si muovono più.',

  // ⚠️ Se il gruppo fosse in meno di tre non ci sarebbe un podio, e la
  // festa non parte invece di inventarsi un terzo posto vuoto.
  minimo: 3,
}

// Il messaggio fisso, per chi apre la Classifica dopo la festa.
export const CLASSIFICA_CHIUSA = {
  titolo: 'Classifica chiusa',
  testo: 'Il viaggio è finito e i punti sono fermi. Resta tutto scritto.',
  // Cosa si sente rispondere chi prova a proporre punti lo stesso.
  rifiuto: 'La classifica è chiusa: i punti non si muovono più.',
}
