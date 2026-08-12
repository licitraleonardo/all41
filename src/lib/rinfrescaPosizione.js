// Quando ha senso chiedere "aggiorno dove sei?".
//
// La domanda è delicata: l'app si apre quaranta volte al giorno, e un
// banner a ogni apertura si impara a chiudere senza leggerlo — a quel
// punto non serve più a niente, e in più dà fastidio.
//
// Niente Supabase qui dentro: sono condizioni, e si provano da riga di
// comando come il resto delle regole.

// Sotto le due ore una posizione è ancora buona: in vacanza ci si sposta
// per tappe, non di continuo.
export const VECCHIA_DOPO_MINUTI = 120

export function vaChiesto({
  mia,
  rifiutatoIl = null,
  rimandato = false,
  dentroIlViaggio = true,
  automatica = false,
  adesso = new Date(),
}) {
  // Fuori dalle date del viaggio non interessa a nessuno dove sei.
  if (!dentroIlViaggio) return false

  // ⚠️ Chi ha acceso l'aggiornamento automatico non va interrotto per
  // chiedergli di fare a mano quello che l'app sta già facendo.
  //
  // Nel caso normale non cambia niente: con l'automatico acceso la
  // posizione è sempre fresca, e la soglia delle due ore non arriva mai.
  // Il caso che rompeva è quello di bordo — l'app chiusa per più di due
  // ore. Riaprendola partono insieme il banner e l'aggiornamento, e il
  // banner **non se ne va**: chi lo disegna legge la posizione caricata
  // al montaggio e non sa niente dell'invio appena fatto. Risultato: ti
  // si chiede di aggiornare una posizione mandata due secondi prima.
  //
  // L'interruttore è una promessa — «ci penso io» — e questa riga la
  // mantiene. Se il telefono nega il permesso l'interruttore si spegne
  // da solo (`lib/posizioneAutomatica.js`), e da lì il banner torna a
  // comparire come per tutti gli altri.
  if (automatica) return false

  // Chi non l'ha mai condivisa non ha detto di sì una prima volta: non
  // si insiste. La sezione c'è, e chi la vuole la trova.
  if (!mia?.quando) return false

  // "Non ora" vale per questa apertura: alla prossima si richiede.
  if (rimandato) return false

  // "No" vale per tutta la giornata. Non per sempre, perché domani è
  // un'altra tappa e la risposta può cambiare.
  const oggi = giornoDi(adesso)
  if (rifiutatoIl === oggi) return false

  const minuti = (adesso.getTime() - Date.parse(mia.quando)) / 60000
  return minuti >= VECCHIA_DOPO_MINUTI
}

// ------------------------------------------------------ il "no" di oggi
//
// Il "no" vale per la giornata e sta in localStorage: in memoria
// tornerebbe a ogni ricaricamento, cioè esattamente la seccatura che quel
// bottone deve togliere. È lo stesso ragionamento del "voto dopo".
//
// ⚠️ Sta qui e non dentro l'hook perché ha smesso di riguardare solo il
// banner. Il mondino accanto al conto alla rovescia aggiorna dove sei
// come effetto dell'aprire la mappa: chi oggi ha risposto "no" quel no
// l'ha detto una volta e vale, anche per una strada che allora non
// esisteva. Una regola che vive in un posto solo non si dimentica di
// valere altrove.
const CHIAVE_NO = 'all41.posizione.no'

export function rifiutatoIl() {
  try {
    return localStorage.getItem(CHIAVE_NO)
  } catch {
    return null
  }
}

export function segnaRifiuto(adesso = new Date()) {
  try {
    localStorage.setItem(CHIAVE_NO, giornoDi(adesso))
  } catch {
    // Safari in navigazione privata può rifiutare: pazienza, si richiede.
  }
}

// "Oggi ho detto di no": la domanda che si fa chi sta per condividere
// senza che nessuno gliel'abbia chiesto adesso.
export function haDettoNoOggi(adesso = new Date()) {
  return rifiutatoIl() === giornoDi(adesso)
}

// Da quanto è ferma, in parole: serve al testo del banner.
export function daQuanto(quando, adesso = new Date()) {
  const ore = Math.floor((adesso.getTime() - Date.parse(quando)) / 3600000)
  if (ore < 2) return 'da un paio d’ore'
  if (ore < 24) return `da ${ore} ore`

  const giorni = Math.round(ore / 24)
  return giorni === 1 ? 'da ieri' : `da ${giorni} giorni`
}

// Volutamente non passa da UTC, come dataDiOggi: alle 01:00 in Italia la
// data UTC è ancora quella di ieri, e il "no" di stasera varrebbe anche
// per domani.
function giornoDi(data) {
  const due = (n) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${due(data.getMonth() + 1)}-${due(data.getDate())}`
}
