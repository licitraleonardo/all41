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

// I giorni si contano a parte. Prima le ore correvano fino a 287 di fila,
// con l'idea che il numero grosso facesse effetto: ma a quattro cifre non
// si legge più quanto manca, si legge solo che è tanto. "6g 20:31:14" lo
// capisci in un colpo d'occhio.
//
// Niente mesi né anni: per un viaggio a una settimana sarebbero due zeri
// fissi, e uno zero che non cambia mai è rumore.
export function orologio(secondi) {
  const due = (n) => String(n).padStart(2, '0')
  const giorni = Math.floor(secondi / 86400)
  const ore = Math.floor((secondi % 86400) / 3600)
  const minuti = Math.floor((secondi % 3600) / 60)
  const conto = `${due(ore)}:${due(minuti)}:${due(secondi % 60)}`

  return giorni > 0 ? `${giorni}g ${conto}` : conto
}
