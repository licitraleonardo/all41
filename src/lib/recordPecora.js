import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { dataDiOggi } from './giorni.js'
import { faiScattareLegge } from './punti.js'
import { giornateDaPremiare, premioDelViaggio } from './classificaPecora.js'

const CAMPI = 'member_id, giorno, punteggio, updated_at'

function daRiga(riga) {
  return {
    membroId: riga.member_id,
    giorno: riga.giorno,
    punteggio: riga.punteggio,
    quando: riga.updated_at,
  }
}

// Otto persone per cinque giorni fanno quaranta righe: si leggono tutte,
// e il tetto c'è lo stesso perché la regola non ha eccezioni.
export const leggiRecordPecora = conCache('pecora', async function leggiRecordPecora() {
  const { data, error } = await supabase
    .from('sheep_records')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .order('punteggio', { ascending: false })
    .limit(200)

  if (error) throw error
  return data.map(daRiga)
})

// La funzione del database tiene solo il meglio della giornata: una
// partita storta non abbassa quello che avevi già fatto, e due telefoni
// che scrivono insieme non si sovrascrivono a vicenda.
export async function segnaPunteggio(membroId, punti, giorno = dataDiOggi()) {
  const { data, error } = await supabase.rpc('segna_pecora', {
    p_membro: membroId,
    p_punti: punti,
    p_giorno: giorno,
  })
  if (error) throw error
  return data
}

// Le Leggi XX e XXV. Come per i voti scaduti, le chiude il primo che
// apre l'app: nessuno è sveglio a mezzanotte, e senza questo il record
// del 13 resterebbe senza premio per sempre.
//
// La chiave anti-doppione contiene la data, quindi due telefoni che
// aprono l'app nello stesso momento accreditano una volta sola.
export async function risolviRecordPecora(righe, oggi = dataDiOggi()) {
  const assegnati = []

  for (const premio of giornateDaPremiare(righe, oggi, VIAGGIO.dataInizio, VIAGGIO.dataFine)) {
    await faiScattareLegge(
      'sheep-daily',
      premio.membroId,
      `sheep-daily_${premio.giorno}`
    ).catch(() => {})
    assegnati.push({ legge: 'sheep-daily', ...premio })
  }

  const finale = premioDelViaggio(righe, oggi, VIAGGIO.dataFine)
  if (finale) {
    await faiScattareLegge('sheep-trip', finale.membroId, 'sheep-trip').catch(() => {})
    assegnati.push({ legge: 'sheep-trip', ...finale })
  }

  return assegnati
}
