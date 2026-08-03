import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { SFIDE_PER_ID } from '../config/sfide.js'
import { faiScattareLegge } from './punti.js'

export async function leggiSfideVinte() {
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
}

// Le foto già mandate a una sfida, per sapere chi ha partecipato.
export async function leggiPartecipazioni(sfideIds) {
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
