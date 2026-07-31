import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { PER_ID } from '../config/leggi.js'

const CAMPI = 'id, member_id, points, reason, rule_id, vote_id, status, created_at'

export const TETTO_STORICO = 40

function daRiga(riga) {
  return {
    id: riga.id,
    membroId: riga.member_id,
    punti: riga.points,
    motivo: riga.reason,
    leggeId: riga.rule_id,
    votoId: riga.vote_id,
    stato: riga.status,
    creatoIl: riga.created_at,
  }
}

// L'unica porta d'ingresso per i punti. Nessun componente scrive score.
export async function assegnaPunti({
  memberId,
  punti,
  motivo,
  leggeId = null,
  dedupeKey = null,
  votoId = null,
  stato = 'approved',
}) {
  const { data, error } = await supabase.rpc('assegna_punti', {
    p_membro: memberId,
    p_punti: punti,
    p_motivo: motivo,
    p_regola: leggeId,
    p_chiave: dedupeKey,
    p_voto: votoId,
    p_stato: stato,
  })
  if (error) throw error
  return daRiga(data)
}

// Fa scattare una Legge: assegna i suoi punti, la svela al gruppo se
// nessuno l'aveva ancora fatta scattare, e in quel caso dà anche il punto
// extra della Legge XXII a chi l'ha scoperta.
//
// dedupeKey è obbligatoria: senza, due telefoni che aprono l'app insieme
// rilevano lo stesso evento e i punti si accreditano due volte.
export async function faiScattareLegge(leggeId, memberId, dedupeKey) {
  const legge = PER_ID[leggeId]
  if (!legge) throw new Error(`Legge sconosciuta: ${leggeId}`)
  if (typeof legge.punti !== 'number') {
    throw new Error(`La Legge ${leggeId} non ha un punteggio fisso.`)
  }

  const evento = await assegnaPunti({
    memberId,
    punti: legge.punti,
    motivo: legge.testo,
    leggeId,
    dedupeKey,
  })

  const { data: nuova, error } = await supabase.rpc('scopri_legge', {
    p_legge: leggeId,
    p_membro: memberId,
  })
  if (error) throw error

  // Vale anche quando la Legge appena scoperta era una penalità: ti sei
  // preso un -2 ma hai svelato una pagina del codice al gruppo.
  if (nuova && leggeId !== 'discoverer') {
    await assegnaPunti({
      memberId,
      punti: PER_ID.discoverer.punti,
      motivo: PER_ID.discoverer.testo,
      leggeId: 'discoverer',
      dedupeKey: `discoverer_${leggeId}`,
    })
  }

  return { evento, scopertaNuova: nuova }
}

export async function leggiClassifica() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name, avatar_seed, avatar_style, score')
    .eq('trip_id', VIAGGIO.id)
    .order('score', { ascending: false })
    .limit(50)

  if (error) throw error
  return data.map((r) => ({
    id: r.id,
    nome: r.name,
    avatarSeed: r.avatar_seed,
    avatarStyle: r.avatar_style,
    punteggio: r.score,
  }))
}

export async function leggiEventi(limite = TETTO_STORICO) {
  const { data, error } = await supabase
    .from('point_events')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data.map(daRiga)
}

export async function leggiScoperte() {
  const { data, error } = await supabase
    .from('leggi')
    .select('legge_id, discovered_at, discovered_by')
    .eq('trip_id', VIAGGIO.id)
    .limit(100)

  if (error) throw error
  return Object.fromEntries(
    data.map((r) => [
      r.legge_id,
      { quando: r.discovered_at, chi: r.discovered_by },
    ])
  )
}
