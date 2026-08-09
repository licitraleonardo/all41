// Tenere aggiornata l'app installata sulla home.
//
// Il service worker si aggiorna da solo, ma il browser decide lui quando
// andare a controllare: dentro una PWA aperta e chiusa dieci volte al
// giorno puo' voler dire restare a una versione di ieri senza che nessuno
// se ne accorga, e senza il tasto ricarica per rimediare. E' successo
// davvero, con la copia installata ferma a undici commit prima.
//
// Qui il controllo si chiede noi, ogni volta che l'app torna in primo
// piano. Costa una richiesta di pochi byte a un file che il server dice
// di non mettere in cache, e toglie di mezzo tutta la danza di chiudere
// e riaprire due volte.

// Se c'è qualcosa a metà a schermo, la ricarica aspetta.
//
// ⚠️ Prima ricaricava e basta, e la pagina si portava via quello che stavi
// facendo: il foglio della spesa compilato — descrizione, importo, chi ha
// pagato, divisa fra chi — spariva senza un messaggio, e con lui il
// messaggio in chat scritto a metà, la registrazione di un vocale in corso
// e la partita alla Pecora. Nessun avviso, nessun modo di capire cos'era
// successo: l'app semplicemente ricominciava.
//
// Chi ha un foglio aperto lo dichiara qui. La ricarica non viene annullata
// — la versione nuova serve — solo rimandata a quando lo schermo è di
// nuovo vuoto, che di solito sono pochi secondi.
const occupati = new Set()

export function tieniOccupato(motivo) {
  occupati.add(motivo)
  return () => occupati.delete(motivo)
}

export function siPuoRicaricare() {
  return occupati.size === 0
}

export function tieniAggiornata() {
  if (!('serviceWorker' in navigator)) return () => {}

  let ricaricata = false
  let inAttesa = false

  // Quando il service worker nuovo prende il comando, la pagina che sta
  // sotto e' ancora quella vecchia: va ricaricata, una volta sola.
  const alCambio = () => {
    if (ricaricata) return

    // C'è qualcosa a metà: si aspetta che si liberi invece di portarselo
    // via. Il controllo si rifà quando l'app torna in primo piano e a
    // intervalli lenti, perché chiudere un foglio non emette nessun
    // evento che si possa ascoltare da qui.
    if (!siPuoRicaricare()) {
      if (!inAttesa) {
        inAttesa = true
        console.info('[all41] versione nuova pronta: aspetto che chiudi quello che hai aperto')
        const riprova = setInterval(() => {
          if (ricaricata) return clearInterval(riprova)
          if (!siPuoRicaricare()) return
          clearInterval(riprova)
          alCambio()
        }, 2000)
      }
      return
    }

    ricaricata = true
    window.location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', alCambio)

  const controlla = () => {
    if (document.visibilityState !== 'visible') return
    navigator.serviceWorker
      .getRegistration()
      .then((r) => r?.update())
      // Offline o registrazione non ancora pronta: si riprova alla
      // prossima apertura, non e' niente di cui avvisare nessuno.
      .catch(() => {})
  }

  document.addEventListener('visibilitychange', controlla)
  window.addEventListener('focus', controlla)
  controlla()

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', alCambio)
    document.removeEventListener('visibilitychange', controlla)
    window.removeEventListener('focus', controlla)
  }
}
