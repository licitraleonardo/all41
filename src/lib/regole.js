import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { dataDiOggi } from './giorni.js'
import { faiScattareLegge } from './punti.js'

// Rilevamento delle Leggi che scattano da sole. Ogni chiamata ha una
// chiave deterministica: senza server è il client di chi sta usando l'app
// a rilevare l'evento, e se due lo rilevano insieme la chiave impedisce il
// doppio accredito.
//
// Le Leggi qui sono solo quelle rilevabili dai dati che l'app già scrive.
// Le altre si accendono man mano che nascono le sezioni che le alimentano.

const SOGLIA_FOTO_AL_GIORNO = 30

function inizioGiornata() {
  const m = new Date()
  m.setHours(0, 0, 0, 0)
  return m.toISOString()
}

async function conta(tabella, filtra) {
  let query = supabase
    .from(tabella)
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', VIAGGIO.id)
    .gte('created_at', inizioGiornata())
  query = filtra(query)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

// Legge IV (prima foto della giornata) e Legge XVI (più di 30 foto in un
// giorno). Da chiamare dopo un caricamento riuscito.
export async function dopoFoto(memberId) {
  const oggi = dataDiOggi()
  const scattate = []

  const delGruppo = await conta('photos', (q) => q.is('deleted_at', null))
  if (delGruppo === 1) {
    const esito = await faiScattareLegge('first-photo-day', memberId, `first-photo-day_${oggi}`)
    scattate.push({ leggeId: 'first-photo-day', ...esito })
  }

  const mie = await conta('photos', (q) =>
    q.is('deleted_at', null).eq('author_id', memberId)
  )
  if (mie > SOGLIA_FOTO_AL_GIORNO) {
    const esito = await faiScattareLegge('photo-spam', memberId, `photo-spam_${memberId}_${oggi}`)
    scattate.push({ leggeId: 'photo-spam', ...esito })
  }

  return scattate
}

// Legge VIII: soundboard lanciato tra l'01:00 e le 07:00. Una volta per
// persona al giorno, non a ogni suono: la Legge punisce l'ora, non il
// numero di volte.
export async function dopoSuono(memberId, adesso = new Date()) {
  const ora = adesso.getHours()
  if (ora < 1 || ora >= 7) return []

  const oggi = dataDiOggi(adesso)
  const esito = await faiScattareLegge(
    'night-owl-sound',
    memberId,
    `night-owl-sound_${memberId}_${oggi}`
  )
  return [{ leggeId: 'night-owl-sound', ...esito }]
}
