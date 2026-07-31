import { ATTESA } from '../config/attesa.js'
import { VIAGGIO } from '../config/viaggio.js'
import { GIORNI } from '../config/itinerario.js'
import { dataDiOggi } from './giorni.js'

const UN_MINUTO = 60000

// Tre fasi: prima della partenza si conta, durante il viaggio Allan tace
// (ci pensa già il badge "oggi"), dopo l'ultimo giorno chiude.
export function calcolaAttesa(adesso = new Date()) {
  const partenza = new Date(VIAGGIO.inizioEffettivo)
  const ultimoGiorno = GIORNI[GIORNI.length - 1].data

  if (dataDiOggi(adesso) > ultimoGiorno) return { fase: 'dopo' }
  if (adesso >= partenza) return { fase: 'durante' }

  // Ceil: a 59 minuti e mezzo mancano ancora 60 minuti, non 59.
  return { fase: 'prima', minuti: Math.ceil((partenza - adesso) / UN_MINUTO) }
}

export function frasiAttesa(adesso = new Date()) {
  const stato = calcolaAttesa(adesso)

  if (stato.fase === 'durante') return null
  if (stato.fase === 'dopo') return ATTESA.finito

  const { minuti } = stato
  const ore = Math.floor(minuti / 60)
  const scaglione = ATTESA.scaglioni.find((s) => ore < s.entroOre)

  return { conteggio: conteggio(minuti, ore), commento: scaglione.commento }
}

// Sotto le due ore si passa ai minuti: "Mancano 90 minuti" è più preciso
// e più divertente di un "Manca un'ora" che resta appeso per sessanta.
function conteggio(minuti, ore) {
  if (minuti >= 120) return `Mancano ${ore} ore.`
  if (minuti === 1) return 'Manca un minuto.'
  return `Mancano ${minuti} minuti.`
}
