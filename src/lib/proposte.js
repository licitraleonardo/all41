import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { OPZIONI_PROPOSTA, PROPOSTA, quorumRaggiunto } from '../config/proposte.js'
import { assegnaPunti, faiScattareLegge } from './punti.js'
import { PER_ID, etichetta } from '../config/leggi.js'

// Quante proposte ha già fatto oggi. Si contano dal database e non da
// localStorage: un contatore locale si azzera cambiando telefono, e
// diventa inutile proprio quando serve.
export async function proposteDiOggi(proponenteId, adesso = new Date()) {
  const inizio = new Date(adesso)
  inizio.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('point_events')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', VIAGGIO.id)
    .eq('proposed_by', proponenteId)
    .gte('created_at', inizio.toISOString())

  if (error) throw error
  return count ?? 0
}

// Crea la proposta: un voto di un'ora più un evento punti "in attesa",
// che non muove la classifica finché il gruppo non ha deciso.
//
// Restituisce { ok: false, restano } se hai finito quelle di oggi: un
// limite raggiunto non è un errore, è una risposta.
export async function creaProposta({ proponenteId, destinatarioId, punti, motivo }) {
  const fatte = await proposteDiOggi(proponenteId)
  if (fatte >= PROPOSTA.alGiorno) return { ok: false, restano: 0 }

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

  // La proposta su sé stessi va ai voti lo stesso, ma smascherata: il
  // gruppo la vede per quello che è e se la gode. Il conto invece lo
  // paghi subito, e vale quanto ti sei dato — chiedere cinque punti
  // costa cinque. Se ti eri proposto una penalità, l'ironia vale uno.
  //
  // È una trappola vera: niente avvisi prima di premere, altrimenti non
  // ci cascherebbe nessuno.
  let autoElogio = null
  if (proponenteId === destinatarioId) {
    const legge = PER_ID['self-praise']
    const costo = punti > 0 ? -punti : -1

    autoElogio = { punti: costo, testo: legge.testo, legge: etichetta(legge) }

    await faiScattareLegge(
      'self-praise',
      proponenteId,
      `self-praise_${voto.id}`,
      costo
    ).catch(() => {})
  }

  return { ok: true, votoId: voto.id, evento, autoElogio, restano: PROPOSTA.alGiorno - fatte - 1 }
}

// Le proposte ancora aperte, con dentro tutto quello che serve a
// mostrarle: il voto e l'evento punti in attesa che gli è agganciato.
export async function leggiProposteAperte() {
  const { data: voti, error } = await supabase
    .from('votes')
    .select('id, question, options, tally, voted, expires_at, closed_at')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'point-proposal')
    .is('closed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(10)
  if (error) throw error
  if (voti.length === 0) return []

  const { data: eventi, error: erroreEventi } = await supabase
    .from('point_events')
    .select('id, member_id, points, reason, proposed_by, vote_id')
    .in(
      'vote_id',
      voti.map((v) => v.id)
    )
    .eq('status', 'pending')
    .limit(10)
  if (erroreEventi) throw erroreEventi

  const perVoto = Object.fromEntries(eventi.map((e) => [e.vote_id, e]))

  return voti
    .filter((v) => perVoto[v.id])
    .map((v) => ({
      votoId: v.id,
      conteggi: v.tally,
      hannoVotato: v.voted ?? [],
      scadeIl: v.expires_at,
      punti: perVoto[v.id].points,
      motivo: perVoto[v.id].reason,
      destinatarioId: perVoto[v.id].member_id,
      proponenteId: perVoto[v.id].proposed_by,
    }))
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
