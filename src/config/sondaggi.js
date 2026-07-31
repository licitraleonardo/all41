// Sondaggio lampo: domande preimpostate, non testo libero. Serve a
// decidere in dieci secondi mentre si è in piedi davanti a un ristorante,
// non a scrivere un questionario.

export const SONDAGGI = [
  { id: 'mangia-qui', domanda: 'Si mangia qui?', opzioni: ['Sì', 'Cerchiamo altro'] },
  { id: 'ci-spostiamo', domanda: 'Ci spostiamo?', opzioni: ['Sì', 'Stiamo qui'] },
  { id: 'torna-casa', domanda: 'Si torna a casa?', opzioni: ['Sì', 'Restiamo'] },
  { id: 'bagno', domanda: 'Ultimo bagno?', opzioni: ['Sì', 'Basta così'] },
]

// Un sondaggio di logistica serve adesso: dopo un quarto d'ora la domanda
// non ha più senso e si chiude da sola.
export const DURATA_MINUTI = 15
