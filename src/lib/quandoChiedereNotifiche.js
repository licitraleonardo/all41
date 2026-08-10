// Quando offrire le notifiche, e quando stare zitti.
//
// ⚠️ Accese di default non si può, e non dipende da noi: nessun browser
// lascia che un sito si dia il permesso da solo. Deve chiederlo, e a
// rispondere è la persona nel cartello del browser. Su iPhone in più
// serve l'app sulla schermata Home, prima non parte proprio.
//
// Quello che si può fare è **chiedere noi prima del browser**, ed è la
// parte che protegge, non un giro in più:
//
// il cartello del browser si brucia una volta sola. Un «Blocca» lì
// dentro è quasi definitivo — il browser smette di chiedere, e per
// tornare indietro bisogna entrare nelle impostazioni del sito, la
// caccia che ci è costata mezza serata su Android. Chiedendo prima in
// casa nostra, un «non ora» costa zero e si può richiedere domani; al
// cartello vero ci arriva solo chi ha già detto di sì.
//
// Niente browser qui dentro: sono condizioni, e si provano da riga di
// comando come `quandoChiedere.js` e `rinfrescaPosizione.js`.

// Il «non ora» vale per la giornata, come il «no» della posizione: in
// memoria tornerebbe a ogni ricaricamento, cioè sarebbe «una volta per
// apertura» — e un cartello che torna a ogni apertura si impara a
// chiudere senza leggerlo.
const CHIAVE_RIMANDATO = 'all41.notifiche.dopo'

export function vaOffertoIlPermesso({
  // 'default' | 'granted' | 'denied' — com'è messo il browser.
  permesso = 'default',
  // Il browser sa mandare notifiche?
  possibili = true,
  // Siamo su iPhone, e l'app è sulla schermata Home?
  suIPhone = false,
  installataSullaHome = false,
  // Il giorno in cui è stato detto «non ora», se è stato detto.
  rimandatoIl = null,
  adesso = new Date(),
} = {}) {
  if (!possibili) return false

  // Già concesso: ci pensa `riallineaIscrizione()`, in silenzio e senza
  // chiedere niente a nessuno.
  if (permesso === 'granted') return false

  // ⚠️ Già negato: non si insiste. Il browser ha chiuso la porta e
  // riaprirla non è in nostro potere — l'unico effetto di riproporlo
  // sarebbe un cartello nostro che non porta da nessuna parte.
  if (permesso === 'denied') return false

  // ⚠️ Su iPhone fuori dall'app installata le notifiche web non esistono
  // proprio: offrirle è promettere una cosa che non può succedere.
  if (suIPhone && !installataSullaHome) return false

  if (rimandatoIl === giornoDi(adesso)) return false

  return true
}

export function rimandatoIl() {
  try {
    return localStorage.getItem(CHIAVE_RIMANDATO)
  } catch {
    return null
  }
}

export function segnaRimandato(adesso = new Date()) {
  try {
    localStorage.setItem(CHIAVE_RIMANDATO, giornoDi(adesso))
  } catch {
    // Safari in navigazione privata può rifiutare: pazienza, si richiede.
  }
}

// Volutamente non passa da UTC, come `dataDiOggi`: all'una di notte in
// Italia la data UTC è ancora quella di ieri, e un «non ora» detto
// stanotte sarebbe già scaduto un secondo dopo averlo detto.
function giornoDi(data) {
  const due = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${due(data.getMonth() + 1)}-${due(data.getDate())}`
}
