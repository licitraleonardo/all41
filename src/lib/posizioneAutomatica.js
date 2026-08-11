// La posizione che si aggiorna da sola a ogni apertura, per chi lo
// sceglie.
//
// ⚠️ Questa cosa ribalta una decisione, e va scritto qui perché il
// perché non si perda.
//
// Il 10 agosto l'aggiornamento automatico è stato **tolto**: il mondino
// si toccava per *guardare* dove fossero gli altri, e come effetto
// pubblicava dov'eri a sette persone. In `Itinerario.jsx` c'è ancora
// scritto: «la posizione si condivide con un tasto, mai da sola».
//
// Quella regola regge ancora, e questa non la viola: quello che era
// sbagliato non era l'automatismo, era **l'automatismo di nascosto**,
// attaccato a un gesto che voleva dire un'altra cosa. Qui invece:
//
//   - si accende a mano, una volta, da un interruttore che dice cosa fa
//   - è **spenta** finché non la accendi
//   - ogni volta che parte lo dice a schermo
//   - se il telefono nega il permesso si spegne da sola, invece di
//     riprovare in silenzio a ogni apertura
//
// Vive nel telefono e non sul database perché è una scelta di *questo*
// telefono: lo stesso profilo aperto sul portatile non deve mettersi a
// mandare la posizione del portatile.

const CHIAVE = 'all41.posizione.automatica'

export function posizioneAutomatica() {
  try {
    return window.localStorage.getItem(CHIAVE) === 'si'
  } catch {
    return false
  }
}

export function impostaPosizioneAutomatica(accesa) {
  try {
    if (accesa) window.localStorage.setItem(CHIAVE, 'si')
    else window.localStorage.removeItem(CHIAVE)
  } catch {
    // Spazio finito o navigazione privata: resta spenta, che è il verso
    // giusto in cui sbagliare.
  }
  return posizioneAutomatica()
}

// ⚠️ Quando il telefono dice di no, si smette di chiedere.
//
// Un permesso negato non cambia da solo: continuare a provarci a ogni
// apertura vuol dire un errore silenzioso quaranta volte al giorno, e
// soprattutto un interruttore che dice «acceso» mentre non succede
// niente — che è il tipo di bugia che questa app non racconta.
export function eUnNoDefinitivo(errore) {
  if (!errore) return false
  // GeolocationPositionError.PERMISSION_DENIED === 1
  if (errore.code === 1) return true
  return /denied|permission/i.test(errore.message ?? '')
}
