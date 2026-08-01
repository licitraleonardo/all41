import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { OPZIONI_PROPOSTA, PROPOSTA, quorumRaggiunto } from '../config/proposte.js'
import { assegnaPunti, faiScattareLegge } from './punti.js'

// Crea la proposta: un voto di tre ore più un evento punti "in attesa",
// che non muove la classifica finché il gruppo non ha deciso.
export async function creaProposta({ proponenteId, destinatarioId, punti, motivo }) {
  const scade = new Date(Date.now() + PROPOSTA.minutiDiVoto * 60000).toISOString()

  const { data: voto, error: erroreVoto } = await supabase
    .from('votes')
    .insert({
      trip_id: VIAGGIO.id,
      category: 'point-proposal',
      question: `${segno(punti)} a chi di dovere: ${motivo}`,
      options: OPZIONI_PROPOSTA,
      anonymous: false,
      tally: OPZIONI_PROPOSTA.map(() => 0),
      expires_at: scade,
    })
    .select('id')
    .single()
  if (erroreVoto) throw erroreVoto

  const evento = await assegnaPunti({
    memberId: destinatarioId,
    punti,
    motivo,
    leggeId: 'poll-proposed',
    votoId: voto.id,
    stato: 'pending',
    propostoDa: proponenteId,
  })

  // Legge XIV: proporre punti per sé stessi. Scatta subito, non aspetta
  // il voto — l'ha già fatto.
  if (proponenteId === destinatarioId) {
    await faiScattareLegge('self-praise', proponenteId, `self-praise_${voto.id}`).catch(
      () => {}
    )
  }

  return { votoId: voto.id, evento }
}

// Risolve le proposte scadute: le chiude, applica l'esito e fa scattare
// le Leggi che dipendono da com'è andata. Chiamata all'avvio dell'app.
export async function risolviProposte(membriIds = []) {
  const { data, error } = await supabase
    .from('votes')
    .select('id, tally, voted, closed_at, expires_at')
    .eq('trip_id', VIAGGIO.id)
    // Non solo le scadute: una proposta si chiude anche prima, se hanno
    // votato tutti. Decide la funzione, che vede il conteggio vero.
    .eq('category', 'point-proposal')
    .is('closed_at', null)
    .limit(20)
  if (error) throw error

  const risolte = []
  for (const v of data) {
    const { data: evento, error: erroreRpc } = await supabase.rpc('risolvi_proposta', {
      p_voto: v.id,
    })
    if (erroreRpc || !evento) continue // già risolta da un altro telefono

    await leggiDellEsito(v, evento, membriIds).catch(() => {})
    risolte.push(evento)
  }
  return risolte
}

async function leggiDellEsito(voto, evento, membriIds) {
  const si = voto.tally?.[0] ?? 0
  const no = voto.tally?.[1] ?? 0
  const votanti = voto.voted?.length ?? 0

  // Proposta annullata per mancanza di quorum: non l'ha giudicata
  // nessuno, quindi nessuna Legge scatta. Chi ha proposto non merita la
  // penalità della XIII per il disinteresse degli altri.
  if (!quorumRaggiunto(votanti, membriIds.length)) return
  // Il pareggio è una regola di gruppo: colpisce tutti, anche chi non
  // aveva niente a che fare con la proposta. Va valutato prima, perché
  // non dipende da chi ha proposto.
  if (si === no && votanti > 0) {
    // Legge XI: pareggio, -1 a tutti. Bersaglio "tutti", non il singolo.
    for (const id of membriIds) {
      await faiScattareLegge('poll-tie', id, `poll-tie_${voto.id}_${id}`).catch(() => {})
    }
    return
  }

  // Le Leggi XII e XIII colpiscono chi ha proposto, non chi riceve.
  const proponente = evento.proposed_by
  if (!proponente) return

  if (si > no && no === 0 && votanti > 1) {
    await faiScattareLegge('unanimous', proponente, `unanimous_${voto.id}`).catch(() => {})
    return
  }

  if (si <= no) {
    await faiScattareLegge('proposal-rejected', proponente, `rejected_${voto.id}`).catch(
      () => {}
    )
  }
}

function segno(n) {
  return n > 0 ? `+${n}` : String(n)
}
