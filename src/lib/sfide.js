import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { CACCIA, SFIDE, SFIDE_PER_ID, scadenzaDelVoto } from '../config/sfide.js'
import {
  cacciaChiusa,
  chiusureDaFare,
  sfideDaMettereAiVoti,
  vincitoreDellaCaccia,
} from './cacciaFinale.js'
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

// La scadenza la decide la configurazione della caccia: si vota fino
// alla fine della finestra, come promette CACCIA.chiude. Vive in
// config/sfide.js perché è una regola, e perché lì si può provare.

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
    p_scadenza: scadenzaDelVoto(new Date()),
    p_membro: memberId,
  })
  if (error) throw error
  return data
}

// Tutta la caccia al tesoro si decide dopo il viaggio, in tre momenti
// scanditi dalle date in config/sfide.js: il 17 si aprono i voti, si
// vota per tre giorni, il 20 si chiude e si assegna il premio.
//
// Come per i sondaggi scaduti, la muove il primo che apre l'app: non
// c'è nessun server a cui dire di fare qualcosa a una certa data.
export async function risolviCaccia(partecipazioni, vinte, voti, membroId, adesso = new Date()) {
  const oggi = dataDiOggi(adesso)
  const fatto = []

  // 1. Le gare vere vanno ai voti.
  for (const sfidaId of sfideDaMettereAiVoti(partecipazioni, vinte, voti, oggi)) {
    const foto = partecipazioni[sfidaId] ?? []
    await assicuraVotoSfida(
      sfidaId,
      foto.map((f) => f.id),
      membroId
    ).catch(() => {})
    fatto.push({ cosa: 'voto-aperto', sfidaId })
  }

  if (!cacciaChiusa(oggi)) return fatto

  // 2. Chiusa la caccia si chiudono i voti ancora aperti, così i
  //    conteggi non si muovono più mentre si assegnano le vittorie.
  const { data: apertivi } = await supabase
    .from('votes')
    .select('id')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'photo-of-day')
    .is('closed_at', null)
    .limit(40)

  for (const v of apertivi ?? []) await chiudiVoto(v.id).catch(() => {})

  // 3. Si assegnano le sfide. Chi vince una gara non prende punti di
  //    suo: conta solo per il premio finale. Chi è rimasto l'unico ad
  //    aver mandato una foto prende i suoi, e scopre una Legge.
  for (const c of chiusureDaFare(partecipazioni, vinte, voti, oggi)) {
    const chiusa = await assegnaVittoria(c.sfidaId, c.membroId, c.fotoId).catch(() => false)
    if (!chiusa) continue

    if (c.motivo === 'solitario') {
      await faiScattareLegge(
        'sfida-solitario',
        c.membroId,
        `solitario_${c.sfidaId}`,
        CACCIA.puntiUnico
      ).catch(() => {})
    }
    fatto.push({ cosa: 'sfida-chiusa', ...c })
  }

  return fatto
}

// Il premio finale, uno solo. Va chiamato con le vittorie già assegnate,
// quindi dopo risolviCaccia e una rilettura.
export async function assegnaPremioCaccia(vinte, adesso = new Date()) {
  if (!cacciaChiusa(dataDiOggi(adesso))) return null

  const primo = vincitoreDellaCaccia(vinte)
  if (!primo) return null

  await faiScattareLegge(
    'challenge-won',
    primo.membroId,
    'caccia-finale',
    CACCIA.premioPrimo
  ).catch(() => {})

  return primo
}

// Chiude la sfida e segna chi ha vinto, una volta sola. Non assegna
// punti: durante il viaggio non ne assegna nessuno, e alla fine paga
// solo il premio a chi ne ha vinte di più.
export async function assegnaVittoria(sfidaId, membroId, fotoId = null) {
  if (!SFIDE_PER_ID[sfidaId]) return false

  const { data: hoChiuso, error } = await supabase.rpc('chiudi_sfida', {
    p_sfida: sfidaId,
    p_membro: membroId,
    p_foto: fotoId,
  })
  if (error) throw error
  return Boolean(hoChiuso)
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

  // Ha una Legge sua: la II adesso premia chi ha vinto più sfide, e
  // questa non è una gara.
  for (const id of membriIds) {
    await faiScattareLegge(
      'gruppo-al-completo',
      id,
      `collettiva_${sfidaId}_${id}`,
      sfida.punti
    ).catch(() => {})
  }

  return { chiusa: true, appena: true, punti: sfida.punti }
}
