import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { dataDiOggi } from './giorni.js'
import { faiScattareLegge } from './punti.js'
import { azzeraInsistenza, registraRifiuto } from './insistenza.js'
import { parolaProibitaIn } from '../config/paroleProibite.js'
import { ABUSO_SUONO } from '../config/limiti.js'

// Rilevamento delle Leggi che scattano da sole. Ogni chiamata ha una
// chiave deterministica: senza server è il client di chi sta usando l'app
// a rilevare l'evento, e se due lo rilevano insieme la chiave impedisce il
// doppio accredito.
//
// Le Leggi qui sono solo quelle rilevabili dai dati che l'app già scrive.
// Le altre si accendono man mano che nascono le sezioni che le alimentano.

const SOGLIA_FOTO_AL_GIORNO = 30

// Legge XXX. Si parte tutti sopra lo zero grazie al selfie di gruppo,
// quindi finirci sotto è una cosa che ti sei guadagnato.
//
// Scatta una volta per persona e per viaggio: la chiave non ha la data,
// altrimenti chi resta in negativo pagherebbe un punto ogni giorno e non
// ne uscirebbe più — che è la spirale che la Maglia Nera evita apposta.
//
// Si valuta all'apertura, come le altre cose senza server: chi apre
// l'app guarda i punteggi di tutti e chiude i conti in sospeso.
export async function forseSottoZero(membri) {
  const caduti = membri.filter((m) => m.punteggio < 0)

  for (const m of caduti) {
    await faiScattareLegge('sotto-zero', m.id, `sotto-zero_${m.id}`).catch(() => {})
  }

  return caduti.map((m) => m.id)
}

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

// Legge XXVI: parola proibita in un messaggio. Scatta dopo l'invio, non
// prima: il messaggio resta lì come prova.
export async function dopoTesto(memberId, testo, azioneId) {
  const parola = parolaProibitaIn(testo)
  if (!parola) return { scattata: false }

  const esito = await faiScattareLegge(
    'parola-proibita',
    memberId,
    `parola-proibita_${azioneId}`
  )
  return { scattata: true, parola, ...esito }
}

// Legge XIX: hai insistito su un bottone già bloccato dal limite. Da
// chiamare a ogni tentativo rifiutato; decide da sola se costa qualcosa.
export async function dopoRifiuto(memberId, tipo) {
  const { tentativi, penalita, quante } = registraRifiuto(memberId, tipo)
  if (penalita === 0) return { tentativi, scattata: false }

  const esito = await faiScattareLegge(
    'spam-insistente',
    memberId,
    `spam_${memberId}_${tipo}_${dataDiOggi()}_${quante}`,
    penalita
  )
  return { tentativi, scattata: true, penalita, ...esito }
}

export function dopoInvioRiuscito(memberId, tipo) {
  azzeraInsistenza(memberId, tipo)
}

// Legge XXVII: abuso di un suono. Cinque pressioni dello stesso bottone
// entro un minuto e quel bottone si spegne per un'ora — solo quello, e
// solo per chi ha esagerato.
//
// Il blocco non si salva da nessuna parte: si deduce dall'esistenza della
// penalità. Se c'è un evento di abuso per quel suono nell'ultima ora, il
// bottone è spento. Così sopravvive a un ricaricamento e a un cambio di
// telefono, senza una tabella in più.
export async function dopoSuonoPremuto(memberId, file) {
  const da = new Date(Date.now() - ABUSO_SUONO.entroSecondi * 1000).toISOString()

  const { count, error } = await supabase
    .from('quick_actions')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', memberId)
    .eq('kind', 'soundboard')
    .eq('payload->>file', file)
    .gte('created_at', da)
  if (error) throw error

  if ((count ?? 0) < ABUSO_SUONO.pressioni) return { abuso: false }

  const blocco = Math.floor(Date.now() / (ABUSO_SUONO.bloccoMinuti * 60000))
  const esito = await faiScattareLegge(
    'sound-abuse',
    memberId,
    `sound-abuse_${memberId}_${file}_${blocco}`
  )
  return { abuso: true, file, ...esito }
}

// Quali suoni sono spenti adesso per questa persona.
export async function suoniBloccati(memberId) {
  const da = new Date(Date.now() - ABUSO_SUONO.bloccoMinuti * 60000).toISOString()

  const { data, error } = await supabase
    .from('point_events')
    .select('dedupe_key, created_at')
    .eq('member_id', memberId)
    .eq('rule_id', 'sound-abuse')
    .gte('created_at', da)
    .limit(20)
  if (error) throw error

  // dedupe_key: sound-abuse_<membro>_<file>_<blocco>
  return new Set(
    data
      .map((r) => r.dedupe_key?.split('_')?.[2])
      .filter(Boolean)
  )
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
