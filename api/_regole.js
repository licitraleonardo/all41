// Le due decisioni di `api/notifica.js` che si possono provare senza un
// server e senza un telefono. Il resto di quel file è collegamento:
// leggere una riga, mandare, rispondere.
//
// Il trattino davanti al nome è una convenzione di Vercel: i file che
// cominciano per `_` non diventano indirizzi pubblici. Questo è un pezzo
// di libreria, non un endpoint.

// Quali tipi meritano di far suonare un telefono.
//
// ⚠️ Deve restare allineato a `public/push.js`, che decide *come* si
// mostra. Qui si decide *se* si manda. Mandare qualcosa che il service
// worker poi scarta è traffico per niente — e per otto telefoni a ogni
// messaggio non è poco.
//
// `poll` non c'è, ed è voluto: un sondaggio ha già il cartello dentro
// l'app e non è una cosa per cui svegliare qualcuno.
export const DA_MANDARE = new Set(['sos', 'si_riparte', 'dove_siete', 'free_text', 'vocale'])

export function daNotificare(tipo) {
  return DA_MANDARE.has(tipo)
}

// Le iscrizioni morte, da togliere.
//
// ⚠️ Un telefono che disinstalla l'app lascia il suo endpoint nella
// tabella per sempre, e il servizio di push risponde 404 o 410. Senza
// questa pulizia, fra un anno si proverebbe a mandare a otto telefoni che
// non esistono più — e ogni invio è tempo di attesa per chi ha appena
// premuto SOS.
//
// Solo 404 e 410: un 500 del servizio di push, o una rete che non
// risponde, NON sono un'iscrizione morta. Togliere anche quelle vorrebbe
// dire disiscrivere il gruppo intero il giorno in cui il servizio ha un
// problema, e nessuno se ne accorgerebbe finché non serve.
export function daTogliere(esiti, iscritti) {
  const morte = []
  esiti.forEach((e, i) => {
    if (e.status !== 'rejected') return
    const codice = e.reason?.statusCode
    if (codice === 404 || codice === 410) morte.push(iscritti[i].endpoint)
  })
  return morte
}
