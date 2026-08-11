// Le notifiche vecchie si chiudono quando riapri l'app.
//
// ⚠️ La regola «una notifica di chat sola finché non riapri» non era
// quella che succedeva davvero.
//
// Il service worker mostra una notifica sola per tag, e prima di
// mostrarne un'altra controlla se ce n'è già una a schermo. Ma l'unico
// posto che ne chiudeva una era il tocco sulla notifica stessa. Chi apre
// l'app dall'icona sulla home — cioè quasi sempre — si lascia dietro
// quella vecchia nel centro notifiche, e da quel momento **nessun
// messaggio successivo fa più suonare niente**: il controllo la trova
// ancora lì e sta zitto.
//
// «Una sola finché non riapri» diventava «una sola per sempre», e
// nessun errore da nessuna parte: si vede solo un telefono che a un
// certo punto smette di avvisarti.
//
// ⚠️ Si chiude dalla pagina e non dal service worker, di proposito:
// `registration.getNotifications()` si può chiamare da qui, quindi
// funziona su ogni telefono **così com'è adesso**, senza aspettare che
// il service worker si aggiorni insieme all'app.

import { conScadenza } from './scadenza.js'

// L'SOS no. È l'unica che deve restare a schermo anche dopo che hai
// aperto l'app: chi si è perso non smette di esserlo perché tu hai
// guardato il telefono, e quella notifica è anche un promemoria.
const DA_TENERE = /^sos-/

export async function chiudiLeNotificheLette() {
  if (!('serviceWorker' in navigator)) return 0

  try {
    // ⚠️ Con scadenza: `serviceWorker.ready` non rifiuta mai. Se la
    // registrazione non arriva, questa promessa resta appesa per sempre
    // dentro un `visibilitychange`, e ogni apertura ne lascia una.
    const registrazione = await conScadenza(navigator.serviceWorker.ready, 3000)
    if (!registrazione?.getNotifications) return 0

    const aperte = await registrazione.getNotifications()
    let chiuse = 0
    for (const n of aperte) {
      if (DA_TENERE.test(n.tag ?? '')) continue
      n.close()
      chiuse += 1
    }
    return chiuse
  } catch {
    // Non è andata: è un di più, e un di più che non funziona non è un
    // guasto. Al massimo resta una notifica vecchia, cioè come prima.
    return 0
  }
}

// Aggancia la pulizia al ritorno dell'app in primo piano. Restituisce la
// funzione per staccarla.
export function tieniPulite() {
  if (typeof document === 'undefined') return () => {}

  const forse = () => {
    if (document.visibilityState !== 'visible') return
    chiudiLeNotificheLette()
  }

  document.addEventListener('visibilitychange', forse)
  window.addEventListener('focus', forse)
  forse()

  return () => {
    document.removeEventListener('visibilitychange', forse)
    window.removeEventListener('focus', forse)
  }
}
