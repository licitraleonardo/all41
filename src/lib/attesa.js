import { ATTESA } from '../config/attesa.js'
import { VIAGGIO } from '../config/viaggio.js'
import { GIORNI } from '../config/itinerario.js'
import { dataDiOggi } from './giorni.js'

// Tre fasi: prima della partenza si conta, durante il viaggio Allan tace
// (ci pensa già il badge "oggi"), dopo l'ultimo giorno chiude.
export function calcolaAttesa(adesso = new Date()) {
  const partenza = new Date(VIAGGIO.inizioEffettivo)
  const ultimoGiorno = GIORNI[GIORNI.length - 1].data

  if (dataDiOggi(adesso) > ultimoGiorno) return { fase: 'dopo' }
  if (adesso >= partenza) return { fase: 'durante' }

  // Ceil: mezzo secondo prima della partenza manca ancora un secondo.
  return { fase: 'prima', secondi: Math.ceil((partenza - adesso) / 1000) }
}

export function frasiAttesa(adesso = new Date()) {
  const stato = calcolaAttesa(adesso)

  if (stato.fase === 'durante') return null
  if (stato.fase === 'dopo') {
    return { tipo: 'chiuso', testo: ATTESA.finito.testo, commento: ATTESA.finito.commento }
  }

  const ore = Math.floor(stato.secondi / 3600)
  const scaglione = ATTESA.scaglioni.find((s) => ore < s.entroOre)

  return {
    tipo: 'conto',
    etichetta: ATTESA.etichetta,
    orologio: orologio(stato.secondi),
    commento: scaglione.commento,
  }
}

// Le ore non si azzerano a 24: a dodici giorni dalla partenza il numero è
// 287, ed è quello il punto. padStart non taglia, quindi le tre cifre
// passano intatte.
function orologio(secondi) {
  const due = (n) => String(n).padStart(2, '0')
  const ore = Math.floor(secondi / 3600)
  const minuti = Math.floor((secondi % 3600) / 60)
  return `${due(ore)}:${due(minuti)}:${due(secondi % 60)}`
}
