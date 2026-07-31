// Testi del conto alla rovescia. Sono qui e non nei componenti così si
// possono riscrivere senza toccare la logica.
//
// Registro: Allan. Frasi corte, punto fermo, nessun entusiasmo, niente
// emoji, niente punti esclamativi. La comicità sta nell'understatement —
// vedi "Allan — la voce dell'app" nello spec. Se una frase nuova suona
// più su di giri delle altre, è sbagliata.

export const ATTESA = {
  etichetta: 'Mancano',

  // Il primo scaglione la cui soglia in ore è maggiore delle ore mancanti.
  // Dal più vicino al più lontano.
  //
  // Nessuna frase può dire "domani" o "stasera": si parte alle 07:00, e a
  // quattro ore dalla partenza è già lo stesso giorno. Devono reggere a
  // qualsiasi ora.
  scaglioni: [
    { entroOre: 2, commento: 'Dovresti essere già in viaggio.' },
    { entroOre: 8, commento: 'Non vale più la pena dormire.' },
    { entroOre: 72, commento: 'La valigia non si fa da sola.' },
    { entroOre: Infinity, commento: 'Non che le stessi contando.' },
  ],

  finito: {
    testo: 'È finita.',
    commento: 'Non c’è altro da contare.',
  },
}
