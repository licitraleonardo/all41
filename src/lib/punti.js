import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { PER_ID } from '../config/leggi.js'
import { viaggioCominciato } from '../config/rilascio.js'

const CAMPI =
  'id, member_id, points, reason, rule_id, vote_id, proposed_by, status, created_at'

export const TETTO_STORICO = 40

function daRiga(riga) {
  return {
    id: riga.id,
    membroId: riga.member_id,
    punti: riga.points,
    motivo: riga.reason,
    leggeId: riga.rule_id,
    votoId: riga.vote_id,
    propostoDa: riga.proposed_by,
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
  propostoDa = null,
}) {
  const { data, error } = await supabase.rpc('assegna_punti', {
    p_membro: memberId,
    p_punti: punti,
    p_motivo: motivo,
    p_regola: leggeId,
    p_chiave: dedupeKey,
    p_voto: votoId,
    p_stato: stato,
    p_proposto_da: propostoDa,
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
export async function faiScattareLegge(leggeId, memberId, dedupeKey, puntiEspliciti = null) {
  const legge = PER_ID[leggeId]
  if (!legge) throw new Error(`Legge sconosciuta: ${leggeId}`)

  // ⚠️ Prima del viaggio le Leggi non scattano. Qui, e in nessun altro
  // posto.
  //
  // Ci passano tutte e trentanove le chiamate sparse in nove file: e'
  // l'unica strozzatura, ed e' per questo che il congelamento e' una
  // riga invece di una caccia. Ferma insieme i punti, la scoperta e il
  // festeggiamento — che sono la stessa cosa vista da tre parti.
  //
  // ⚠️ E non spegne l'app: i punti delle proposte **non passano di qui**.
  // `creaProposta` chiama `assegnaPunti` per conto suo, quindi darsi
  // punti a vicenda, votare e vedere la classifica muoversi continua a
  // funzionare identico. Si congela il gioco nascosto, non l'app.
  if (!viaggioCominciato()) return null

  // Qualche Legge non ha un punteggio fisso — la XIX cresce con
  // l'insistenza — e in quel caso chi chiama passa il valore.
  const punti = puntiEspliciti ?? legge.punti
  if (typeof punti !== 'number') {
    throw new Error(`La Legge ${leggeId} vuole un punteggio esplicito.`)
  }

  const evento = await assegnaPunti({
    memberId,
    punti,
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

export const leggiClassifica = conCache('classifica', async function leggiClassifica() {
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
})

export const leggiEventi = conCache(
  (limite = TETTO_STORICO) => (limite === TETTO_STORICO ? 'eventi' : null),
  async function leggiEventi(limite = TETTO_STORICO) {
    const { data, error } = await supabase
      .from('point_events')
      .select(CAMPI)
      .eq('trip_id', VIAGGIO.id)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) throw error
    return data.map(daRiga)
  }
)

export const leggiScoperte = conCache('scoperte', async function leggiScoperte() {
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
})
