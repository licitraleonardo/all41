// Una richiesta che non torna mai è peggio di una che fallisce: quando
// fallisce c'è un errore da mostrare, quando resta appesa non c'è niente.
// Il bottone continua a dire "Invio…" e chi guarda non sa se rifare o
// rassegnarsi.
//
// Con segnale debole — che in mezzo alla Sardegna è la condizione
// normale, non l'eccezione — è proprio questo che succede: la fetch non
// solleva, aspetta. E `catch` non scatta mai.
//
// `conScadenza` mette un tempo massimo e trasforma l'attesa in un errore
// vero, che l'interfaccia sa già raccontare.
//
// ⚠️ La richiesta NON viene annullata, di proposito. Scaduta vuol dire
// "non lo so", non "non è partita": se era già per strada deve arrivare
// lo stesso, e comparire agli altri anche se chi l'ha mandata ha smesso
// di aspettare. Il prezzo è che riprovando possono uscire due cartelli
// uguali; per una richiesta d'aiuto è il verso giusto in cui sbagliare.

export const SCADUTA = 'scaduta'

export function eScaduta(e) {
  return e?.code === SCADUTA
}

// I timer si passano da fuori, così le prove non aspettano dieci secondi
// veri: stessa idea dell'orologio finto del pilota automatico della
// Pecora.
export function conScadenza(promessa, ms, { avvia = setTimeout, ferma = clearTimeout } = {}) {
  // Nessuna scadenza: si aspetta all'infinito, com'era prima. Serve che
  // resti possibile — la maggior parte degli invii non ha un tempo
  // massimo e non deve averlo.
  if (!ms || ms <= 0) return Promise.resolve(promessa)

  return new Promise((risolvi, rifiuta) => {
    const orologio = avvia(() => {
      const e = new Error('Ci sta mettendo troppo.')
      e.code = SCADUTA
      rifiuta(e)
    }, ms)

    // Le due mani si registrano comunque, anche dopo la scadenza: senza,
    // una risposta che arriva tardi e va male diventa un rifiuto che
    // nessuno raccoglie.
    Promise.resolve(promessa).then(
      (valore) => {
        ferma(orologio)
        risolvi(valore)
      },
      (errore) => {
        ferma(orologio)
        rifiuta(errore)
      }
    )
  })
}
