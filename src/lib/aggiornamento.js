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

export function tieniAggiornata() {
  if (!('serviceWorker' in navigator)) return () => {}

  let ricaricata = false

  // Quando il service worker nuovo prende il comando, la pagina che sta
  // sotto e' ancora quella vecchia: va ricaricata, una volta sola.
  const alCambio = () => {
    if (ricaricata) return
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
