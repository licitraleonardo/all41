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
  adesso = new Date(),
}) {
  // Fuori dalle date del viaggio non interessa a nessuno dove sei.
  if (!dentroIlViaggio) return false

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
