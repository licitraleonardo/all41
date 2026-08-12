// La posizione si riaggiorna da sola, per chi l'ha già condivisa.
//
// ⚠️ Non c'è nessuna preferenza da salvare, ed è la correzione che conta.
//
// La prima versione teneva un interruttore in `localStorage`. Sembrava
// giusto — «scegli tu» — ed era sbagliato per un motivo che si è visto
// solo usandolo: chi aveva condiviso la posizione **prima** che
// l'interruttore esistesse ce l'aveva spento, quindi continuava a
// ricevere il cartello «la tua posizione è vecchia» e non si aggiornava
// niente. Cioè tutti.
//
// La regola vera l'aveva già detta Leonardo: **una volta condivisa la
// posizione, è sottinteso che si vuole tenerla aggiornata.** Quindi lo
// stato non va salvato da nessuna parte, va **dedotto**:
//
//   hai una posizione condivisa  +  il telefono dà il permesso
//   ────────────────────────────────────────────────────────────
//                    si aggiorna da sola
//
// Uno stato dedotto non può disallinearsi da quello che vedi: togliendo
// la posizione dalla mappa smette, ricondividendola riparte, e non c'è
// nessun terzo posto che possa dire una cosa diversa.

// ⚠️ Il permesso si **guarda**, non si chiede.
//
// Chiederlo a ogni apertura farebbe comparire il cartello del telefono a
// chi ha detto di no, quaranta volte al giorno. Qui si legge soltanto: se
// è già concesso si procede, altrimenti si sta zitti e resta il tasto
// sulla mappa.
export async function permessoGiaDato() {
  try {
    if (!navigator?.permissions?.query) {
      // ⚠️ Safari su iPhone non sa rispondere a questa domanda. Lì si
      // ripiega su «ha una posizione condivisa», che vuol dire che il
      // permesso l'ha dato almeno una volta: il caso peggiore è un
      // tentativo che fallisce in silenzio, non un cartello di troppo.
      return true
    }
    const esito = await navigator.permissions.query({ name: 'geolocation' })
    return esito.state === 'granted'
  } catch {
    return true
  }
}

// ⚠️ Un no definitivo si riconosce, e da lì non si insiste più per
// questa apertura: un permesso negato non cambia da solo, e riprovare
// vuol dire un errore silenzioso a ogni ritorno in primo piano.
export function eUnNoDefinitivo(errore) {
  if (!errore) return false
  // GeolocationPositionError.PERMISSION_DENIED === 1
  if (errore.code === 1) return true
  return /denied|permission/i.test(errore.message ?? '')
}
