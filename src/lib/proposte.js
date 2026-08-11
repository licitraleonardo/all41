import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { OPZIONI_PROPOSTA, PROPOSTA } from '../config/proposte.js'
import { assegnaPunti, faiScattareLegge } from './punti.js'
import { PER_ID, etichetta } from '../config/leggi.js'
import { dataDiOggi } from './giorni.js'
import { faiSuonare } from './notifiche.js'
import {
  contaNoConsecutivi,
  esitoProposta,
  leggiDellEsito as leggiPure,
  sogliaCoppia,
} from './punteggioProposte.js'

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

// Quante proposte ha fatto oggi il proponente PER questa persona: serve
// all'escalation — la seconda premia, la terza presenta il conto.
async function proposteVerso(proponenteId, destinatarioId, adesso = new Date()) {
  const inizio = new Date(adesso)
  inizio.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('point_events')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', VIAGGIO.id)
    .eq('proposed_by', proponenteId)
    .eq('member_id', destinatarioId)
    .eq('rule_id', 'poll-proposed')
    .gte('created_at', inizio.toISOString())

  if (error) throw error
  return count ?? 0
}

// Crea la proposta: un voto di un'ora più un evento punti "in attesa",
// che non muove la classifica finché il gruppo non ha deciso.
//
// Restituisce { ok: false, restano } se hai finito quelle di oggi, e
// { ok: false, motivo: 'in-voto' } se una tua proposta è ancora aperta:
// un limite raggiunto non è un errore, è una risposta. Chi insiste con
// `insisto` la crea lo stesso — e paga la Legge che non gli era stata
// annunciata. È il pattern trappola: il suggerimento invita ad
// aspettare, non rivela cosa costa non farlo.
export async function creaProposta({ proponenteId, destinatarioId, punti, motivo, insisto = false }) {
  const fatte = await proposteDiOggi(proponenteId)
  if (fatte >= PROPOSTA.alGiorno) return { ok: false, motivo: 'giorno', restano: 0 }

  // ⚠️ «Recente», non «aperta». Vedi `minutiPrimaDiRiproporre`: da quando
  // una proposta resta in voto un giorno intero, «ne hai già una aperta»
  // avrebbe bloccato le altre due proposte della giornata.
  const aperte = await leggiProposteAperte()
  const daQuando = Date.now() - PROPOSTA.minutiPrimaDiRiproporre * 60000
  const miaAperta = aperte.some(
    (p) => p.proponenteId === proponenteId && Date.parse(p.apertaIl) > daQuando
  )
  if (miaAperta && !insisto) {
    return { ok: false, motivo: 'in-voto', restano: PROPOSTA.alGiorno - fatte }
  }

  // Quante già fatte oggi verso questa persona, PRIMA di questa. Il
  // conto è sulle proposte, non sui voti: è la risposta al punto da
  // chiarire n.2 delle Specifiche.
  const versoLui =
    destinatarioId === proponenteId ? 0 : await proposteVerso(proponenteId, destinatarioId)

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
  // Le trappole che questa proposta fa scattare, da rivelare solo
  // adesso che l'azione è completa. Possono essere più d'una: la prima
  // si mostra, le altre restano nello storico, che tanto leggono tutti.
  const trappole = []
  const inTrappola = (legge, puntiEspliciti = null) =>
    trappole.push({
      punti: puntiEspliciti ?? legge.punti,
      testo: legge.testo,
      legge: etichetta(legge),
    })

  if (proponenteId === destinatarioId) {
    const legge = PER_ID['self-praise']
    const costo = punti > 0 ? -punti : -1
    inTrappola(legge, costo)
    await faiScattareLegge('self-praise', proponenteId, `self-praise_${voto.id}`, costo).catch(
      () => {}
    )
  }

  // Una proposta mentre la tua era ancora in voto: eri stato invitato ad
  // aspettare, hai insistito, adesso sai perché.
  if (miaAperta && insisto) {
    const legge = PER_ID['troppo-giudicante']
    inTrappola(legge)
    await faiScattareLegge(
      'troppo-giudicante',
      proponenteId,
      `troppo-giudicante_${voto.id}`
    ).catch(() => {})
  }

  // L'escalation verso la stessa persona: la seconda di oggi premia —
  // una volta per coppia in tutto il viaggio — la terza presenta il
  // conto, e può ripresentarlo domani.
  const soglia = sogliaCoppia(versoLui + 1)
  if (soglia === 'vera-amicizia') {
    await faiScattareLegge(
      'vera-amicizia',
      proponenteId,
      `vera-amicizia_${proponenteId}_${destinatarioId}`
    ).catch(() => {})
  }
  if (soglia === 'ci-nascondete-qualcosa') {
    const legge = PER_ID['ci-nascondete-qualcosa']
    inTrappola(legge)
    await faiScattareLegge(
      'ci-nascondete-qualcosa',
      proponenteId,
      `ci-nascondete_${proponenteId}_${destinatarioId}_${dataDiOggi()}`
    ).catch(() => {})
  }

  // ⚠️ E lo dice in chat, che e' l'unico modo di far suonare i telefoni.
  //
  // Una proposta non faceva suonare niente. Non era una notifica persa:
  // non e' mai partita. `proposte.js` scrive su `votes` e `point_events`
  // e non chiama niente; `api/notifica.js` sa leggere due tabelle sole, i
  // vocali e le azioni della chat; `_regole.js` non elenca le proposte; e
  // il service worker le scarterebbe comunque.
  //
  // I sondaggi sono esclusi apposta — hanno il cartello dentro l'app e
  // non vale la pena svegliare nessuno. Per le proposte lo stesso
  // ragionamento non regge: **una proposta scade in un'ora**. Chi non
  // apre l'app entro quell'ora non vota, e non lo sa nemmeno. Un
  // sondaggio ti aspetta, una proposta no.
  //
  // Passa da una riga di chat e non da un tipo di notifica nuovo: un
  // tipo nuovo `decidi()` lo scarta in silenzio sui telefoni fermi alla
  // versione di ieri, e il service worker si aggiorna solo con l'app.
  // Cosi' invece suona su tutti i telefoni come sono adesso.
  annunciaInChat({ proponenteId, destinatarioId, punti, votoId: voto.id }).catch(() => {})

  return {
    ok: true,
    votoId: voto.id,
    evento,
    trappole,
    // Il nome vecchio resta finché tutti i chiamanti non passano a
    // `trappole`: rompere un chiamante in silenzio è peggio di un alias.
    autoElogio: trappole[0] ?? null,
    restano: PROPOSTA.alGiorno - fatte - 1,
  }
}

// La riga in chat che annuncia una proposta.
//
// ⚠️ Non passa da `inviaAzione`, e quindi non passa da `verificaLimite`.
// La chat ha tre secondi di attesa fra un messaggio e l'altro: chi ha
// appena scritto si vedrebbe rifiutare l'annuncio della propria
// proposta, e resterebbe una proposta di cui nessuno sa niente.
//
// ⚠️ E non solleva mai. Se questa riga non parte, la proposta e' aperta
// lo stesso e dentro l'app si vede: e' un di piu', mai la via
// principale — la stessa regola delle notifiche dell'SOS.
async function annunciaInChat({ proponenteId, destinatarioId, punti, votoId }) {
  // I nomi servono solo al testo di ripiego, quello che leggono i
  // telefoni con la versione vecchia. Se la lettura va storta si scrive
  // una frase generica invece di non scrivere niente.
  let testo = `🗳️ ha proposto ${segno(punti)} per qualcuno`
  let perNome = null
  const { data: nomi } = await supabase
    .from('members')
    .select('id, name')
    .in('id', [proponenteId, destinatarioId])
    .limit(2)

  if (nomi?.length) {
    perNome = nomi.find((n) => n.id === destinatarioId)?.name ?? null
    if (perNome) testo = `🗳️ ha proposto ${segno(punti)} per ${perNome}`
  }

  const { data, error } = await supabase
    .from('quick_actions')
    .insert({
      trip_id: VIAGGIO.id,
      author_id: proponenteId,
      kind: 'free_text',
      // ⚠️ `per` e' l'id e `perNome` il nome, e servono a due lettori
      // diversi: la chat risolve l'id — cosi' un nome cambiato si
      // aggiorna da solo — mentre il service worker non puo' risolvere
      // niente, non ha il database. Senza il nome scritto dentro, la
      // notifica non potrebbe dire per chi.
      payload: { propostaVoto: votoId, per: destinatarioId, perNome, punti, testo },
    })
    .select('id')
    .single()
  if (error) throw error

  // ⚠️ Questa riga era la cosa piu' importante del giro, ed e' mancata
  // per un'ora senza che niente lo dicesse.
  //
  // `inviaAzione` la chiama subito dopo l'inserimento; qui l'inserimento
  // e' scritto a mano per saltare il limite anti-spam della chat, e
  // insieme al limite si era portato via anche questa. Risultato: la
  // riga compariva in chat e i telefoni restavano muti — cioe' esattamente
  // la cosa che questo pezzo esiste per fare, e nessun errore da nessuna
  // parte. E' la famiglia dei difetti che non falliscono.
  faiSuonare(data.id)
}

// Le proposte ancora aperte, con dentro tutto quello che serve a
// mostrarle: il voto e l'evento punti in attesa che gli è agganciato.
export async function leggiProposteAperte() {
  const { data: voti, error } = await supabase
    .from('votes')
    // `ballots` dice chi ha votato cosa. Le proposte nascono con
    // anonymous:false, quindi il database la riempie già da sempre: qui
    // si smette solo di ignorarla. Chi la mostra decide poi a chi e
    // quando — vedi PropostaInAttesa.
    // `created_at` serve a sapere **da quanto** è aperta, che non si
    // ricava da `expires_at` senza dare per scontata la durata: il giorno
    // che la durata cambia, il conto sarebbe sbagliato in silenzio.
    .select('id, question, options, tally, voted, ballots, created_at, expires_at, closed_at')
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
      schede: v.ballots ?? {},
      scadeIl: v.expires_at,
      apertaIl: v.created_at,
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
    // `ballots` serve alle Leggi che guardano i singoli voti: il NO alla
    // propria proposta si scopre solo lì.
    .select('id, tally, voted, ballots, closed_at, expires_at')
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

    await applicaLeggiDellEsito(v, evento, membriIds).catch(() => {})
    risolte.push(evento)
  }

  // Il NO sistematico si guarda solo quando qualcosa si è chiuso adesso:
  // la serie cambia solo lì, e la chiave sull'ultimo voto chiuso fa sì
  // che la stessa serie non paghi due volte.
  if (risolte.length > 0) await forseBastianContrario(membriIds).catch(() => {})

  return risolte
}

// La decisione su cosa scatta è in punteggioProposte.js, pura e provata:
// qui si traduce soltanto in chiamate al database.
async function applicaLeggiDellEsito(voto, evento, membriIds) {
  const esito = esitoProposta({
    si: voto.tally?.[0] ?? 0,
    no: voto.tally?.[1] ?? 0,
    votanti: voto.voted?.length ?? 0,
    totale: membriIds.length,
  })

  const scattano = leggiPure({
    esito,
    proponenteId: evento.proposed_by ?? null,
    membriIds,
    votoId: voto.id,
    schede: voto.ballots ?? {},
  })

  for (const s of scattano) {
    await faiScattareLegge(s.leggeId, s.memberId, s.dedupeKey).catch(() => {})
  }
}

// Quattro NO consecutivi nelle proposte concluse: il veto sistematico
// diventa una Legge invece che un sospetto. Da quando i voti sono palesi
// la serie si legge dalle schede, senza colonne nuove.
async function forseBastianContrario(membriIds) {
  const { data, error } = await supabase
    .from('votes')
    .select('id, ballots')
    .eq('trip_id', VIAGGIO.id)
    .eq('category', 'point-proposal')
    .not('closed_at', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(8)
  if (error) throw error
  if (!data || data.length === 0) return

  const schedePerVoto = data.map((v) => v.ballots ?? {})
  const ultimo = data[0].id

  for (const id of membriIds) {
    if (contaNoConsecutivi(schedePerVoto, id) >= 4) {
      await faiScattareLegge('bastian-contrario', id, `bastian_${id}_${ultimo}`).catch(() => {})
    }
  }
}

function segno(n) {
  return n > 0 ? `+${n}` : String(n)
}
