import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { SFIDE, SFIDE_PER_ID } from '../config/sfide.js'
import { dataDiOggi } from './giorni.js'
import { faiScattareLegge } from './punti.js'
import { chiudiVoto } from './voti.js'

export const leggiSfideVinte = conCache('sfideVinte', async function leggiSfideVinte() {
  const { data, error } = await supabase
    .from('challenges')
    .select('challenge_id, won_by_photo, won_by_member, closed_at')
    .eq('trip_id', VIAGGIO.id)
    .limit(60)
  if (error) throw error

  return Object.fromEntries(
    data.map((r) => [
      r.challenge_id,
      { fotoId: r.won_by_photo, membroId: r.won_by_member, quando: r.closed_at },
    ])
  )
})

// Le foto già mandate a una sfida, per sapere chi ha partecipato.
export const leggiPartecipazioni = conCache(
  // Solo l'elenco intero: dopo un caricamento in gara si rilegge una
  // sfida sola, e quella non deve sostituire la copia di tutte.
  (sfideIds) => (sfideIds.length === SFIDE.length ? 'partecipazioni' : null),
  async function leggiPartecipazioni(sfideIds) {
    if (sfideIds.length === 0) return {}

    const { data, error } = await supabase
      .from('photos')
      .select('id, author_id, url, challenge_id, created_at')
      .eq('trip_id', VIAGGIO.id)
      .in('challenge_id', sfideIds)
      .is('deleted_at', null)
      .limit(200)
    if (error) throw error

    const per = {}
    for (const f of data) {
      ;(per[f.challenge_id] ??= []).push({
        id: f.id,
        autoreId: f.author_id,
        url: f.url,
        creataIl: f.created_at,
      })
    }
    return per
  }
)

// Fine della giornata in ora locale: il voto di una sfida dura fino a
// mezzanotte, come dice lo spec.
function fineGiornata() {
  const f = new Date()
  f.setHours(23, 59, 59, 999)
  return f.toISOString()
}

// I voti aperti delle sfide, per mostrarli e per votarci.
export const leggiVotiSfide = conCache('votiSfide', async function leggiVotiSfide() {
  const { data, error } = await supabase
    .from('votes')
    .select('id, challenge_id, options, tally, voted, expires_at, closed_at')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'photo-of-day')
    .limit(40)
  if (error) throw error

  return Object.fromEntries(
    data.map((v) => [
      v.challenge_id,
      {
        id: v.id,
        fotoIds: v.options,
        conteggi: v.tally,
        hannoVotato: v.voted ?? [],
        scadeIl: v.expires_at,
        chiusoIl: v.closed_at,
      },
    ])
  )
})

// Con due o più foto in gara si apre il voto; quelle che arrivano dopo si
// accodano al voto già aperto.
export async function assicuraVotoSfida(sfidaId, fotoIds, memberId) {
  if (fotoIds.length < 2) return null
  const { data, error } = await supabase.rpc('assicura_voto_sfida', {
    p_sfida: sfidaId,
    p_foto: fotoIds,
    p_scadenza: fineGiornata(),
    p_membro: memberId,
  })
  if (error) throw error
  return data
}

// A voto scaduto vince la foto più votata, e chi l'ha scattata prende i
// punti della sfida. In pareggio non vince nessuno: la sfida resta
// aperta invece di assegnare a caso.
export async function risolviVotiSfide(partecipazioni) {
  const { data, error } = await supabase
    .from('votes')
    .select('id, challenge_id, options, tally')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'photo-of-day')
    .is('closed_at', null)
    .lt('expires_at', new Date().toISOString())
    .limit(20)
  if (error) throw error

  const risolte = []
  for (const v of data) {
    await chiudiVoto(v.id).catch(() => {})

    const massimo = Math.max(...v.tally)
    const primi = v.tally.filter((n) => n === massimo).length
    if (massimo === 0 || primi > 1) continue // nessuno o pareggio

    const fotoId = v.options[v.tally.indexOf(massimo)]
    const autore = (partecipazioni[v.challenge_id] ?? []).find((f) => f.id === fotoId)
    if (!autore) continue

    const esito = await assegnaVittoria(v.challenge_id, autore.autoreId, fotoId)
    if (esito) risolte.push({ sfidaId: v.challenge_id, membroId: autore.autoreId })
  }
  return risolte
}

// Una sola foto in gara a fine giornata vince senza voto: non ha senso
// votare quando non c'è alternativa. Chi non ha ricevuto nemmeno una foto
// resta senza vincitore.
export async function risolviSfideSenzaVoto(partecipazioni, vinte, adesso = new Date()) {
  const oggi = dataDiOggi(adesso)
  const risolte = []

  for (const sfida of SFIDE) {
    if (sfida.tipo !== 'competitiva' || vinte[sfida.id]) continue
    if (dataDellaSfida(sfida) >= oggi) continue // giornata non ancora finita

    const foto = partecipazioni[sfida.id] ?? []
    if (foto.length !== 1) continue

    const esito = await assegnaVittoria(sfida.id, foto[0].autoreId, foto[0].id)
    if (esito) risolte.push({ sfidaId: sfida.id, membroId: foto[0].autoreId })
  }

  return risolte
}

function dataDellaSfida(sfida) {
  return `${VIAGGIO.dataInizio.slice(0, 8)}${String(sfida.giorno).padStart(2, '0')}`
}

// Chiude la sfida e assegna i punti a chi ha vinto, una volta sola.
export async function assegnaVittoria(sfidaId, membroId, fotoId = null) {
  const sfida = SFIDE_PER_ID[sfidaId]
  if (!sfida) return false

  const { data: hoChiuso, error } = await supabase.rpc('chiudi_sfida', {
    p_sfida: sfidaId,
    p_membro: membroId,
    p_foto: fotoId,
  })
  if (error) throw error
  if (!hoChiuso) return false

  await faiScattareLegge(
    'challenge-won',
    membroId,
    `challenge_${sfidaId}`,
    sfida.punti
  ).catch(() => {})

  return true
}

// Una sfida collettiva si chiude quando l'ha fatta tutto il gruppo. In
// quel momento vincono tutti: non è una gara, è una cosa da fare insieme.
export async function forseChiudiCollettiva(sfidaId, partecipanti, membriIds) {
  const sfida = SFIDE_PER_ID[sfidaId]
  if (!sfida || sfida.tipo !== 'collettiva') return { chiusa: false }

  const autori = new Set(partecipanti.map((p) => p.autoreId))
  const mancano = membriIds.filter((id) => !autori.has(id))
  if (mancano.length > 0) return { chiusa: false, mancano: mancano.length }

  // Il primo client che se ne accorge la chiude; gli altri trovano la
  // riga già lì e non riassegnano niente.
  const { data: hoChiuso, error } = await supabase.rpc('chiudi_sfida', {
    p_sfida: sfidaId,
    p_membro: membriIds[0],
    p_foto: null,
  })
  if (error) throw error
  if (!hoChiuso) return { chiusa: true, giaFatto: true }

  for (const id of membriIds) {
    await faiScattareLegge(
      'challenge-won',
      id,
      `challenge_${sfidaId}_${id}`,
      sfida.punti
    ).catch(() => {})
  }

  return { chiusa: true, appena: true, punti: sfida.punti }
}
