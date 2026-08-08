import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { IMPOSTORE } from '../config/impostore.js'
import {
  avanza,
  dopoAccusa,
  premi,
  preparaPartita,
  schedePerId,
  stessaParola,
  vivi,
} from './impostore.js'
import { faiScattareLegge } from './punti.js'

// Le partite dell'Impostore sul database. Il mazziere vero — chi e'
// impostore, che parola gli tocca, chi parla adesso — sta in
// impostore.js, che non sa cosa sia Supabase e si puo' provare.

const CAMPI =
  'id, parola_gruppo, parola_impostore, impostori, giocatori, assegnazioni, ordine, turno, giro, giri_totali, vote_id, stato, rivela_chiesta, setup_vote_id, fuori, tentativo, tentato_da, turno_da, created_at'

export function daRiga(riga) {
  if (!riga) return null
  return {
    id: riga.id,
    parolaGruppo: riga.parola_gruppo,
    parolaImpostore: riga.parola_impostore,
    impostori: riga.impostori ?? [],
    giocatori: riga.giocatori ?? [],
    assegnazioni: riga.assegnazioni ?? {},
    ordine: riga.ordine ?? [],
    turno: riga.turno,
    giro: riga.giro,
    giriTotali: riga.giri_totali,
    votoId: riga.vote_id,
    rivelaChiesta: riga.rivela_chiesta ?? [],
    fuori: riga.fuori ?? [],
    votoAperturaId: riga.setup_vote_id ?? null,
    tentativo: riga.tentativo ?? null,
    tentatoDa: riga.tentato_da ?? null,
    stato: riga.stato,
    // Quando e' cominciato il turno in corso: da qui il testimone.
    // Le partite aperte prima della colonna non ce l'hanno, e in quel
    // caso il testimone non blocca nessuno.
    turnoDa: riga.turno_da ?? null,
    creataIl: riga.created_at,
  }
}

// Una partita per volta: quella aperta piu' recente. Verifica bloccante
// n.4, il limit c'e' anche qui.
export async function leggiPartita() {
  const { data, error } = await supabase
    .from('impostore_games')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return daRiga(data[0])
}

// Le partite finite, dalla piu' recente. Con le schede del voto, che
// servono a dire chi aveva indovinato: senza, lo storico direbbe solo
// chi era l'impostore, che e' meta' della storia.
export async function leggiStorico(quante = 20) {
  const { data, error } = await supabase
    .from('impostore_games')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .eq('stato', 'finita')
    .order('created_at', { ascending: false })
    .limit(quante)

  if (error) throw error
  const partite = data.map(daRiga)

  const voti = partite.map((p) => p.votoId).filter(Boolean)
  if (voti.length === 0) return partite.map((p) => ({ ...p, schede: {} }))

  const { data: righe, error: erroreVoti } = await supabase
    .from('votes')
    .select('id, ballots')
    .in('id', voti)
    .limit(voti.length)

  if (erroreVoti) throw erroreVoti
  const perId = Object.fromEntries((righe ?? []).map((r) => [r.id, r.ballots ?? {}]))
  return partite.map((p) => ({ ...p, schede: perId[p.votoId] ?? {} }))
}

// La partita nasce in preparazione: le parole si pescano subito — non
// dicono niente a nessuno finche' non si distribuiscono — ma chi e'
// impostore lo si sa solo dopo che il gruppo ha votato quanti ne vuole.
export async function creaPartita({ giocatori, variante = 'parola-simile', casuale }) {
  const preparata = preparaPartita({ giocatori, variante, casuale })
  const scade = new Date(Date.now() + IMPOSTORE.minutiVoto * 60000).toISOString()

  const { data: voto, error: erroreVoto } = await supabase
    .from('votes')
    .insert({
      trip_id: VIAGGIO.id,
      category: 'impostore',
      question: 'Come giochiamo?',
      options: IMPOSTORE.aperture.map((a) => a.id),
      anonymous: false,
      tally: IMPOSTORE.aperture.map(() => 0),
      expires_at: scade,
    })
    .select('id')
    .single()

  if (erroreVoto) throw erroreVoto

  const { data, error } = await supabase
    .from('impostore_games')
    .insert({
      trip_id: VIAGGIO.id,
      parola_gruppo: preparata.parolaGruppo,
      parola_impostore: preparata.parolaImpostore,
      // Ancora nessuno: si decide col voto.
      impostori: [],
      giocatori,
      assegnazioni: {},
      ordine: preparata.ordine,
      giri_totali: IMPOSTORE.giriTotali,
      stato: 'preparazione',
      setup_vote_id: voto.id,
    })
    .select(CAMPI)
    .single()

  if (error) throw error
  return daRiga(data)
}

// Finito il voto d'apertura si sorteggia chi e' impostore e si parte.
// Passa da una funzione: due telefoni che assegnano insieme darebbero
// due partite diverse alla stessa gente.
export async function avviaPartita(partita, apertura, casuale) {
  // Regge sia { impostori, giri } sia il numero secco di prima: le
  // partite aperte con la versione vecchia dell'app passano ancora di
  // qui, e farle esplodere a meta' serata non serve a niente.
  const quanti = typeof apertura === 'number' ? apertura : apertura?.impostori
  const giri = typeof apertura === 'number' ? null : (apertura?.giri ?? null)

  const preparata = preparaPartita({
    giocatori: partita.giocatori,
    coppia: [partita.parolaGruppo, partita.parolaImpostore],
    quantiImpostori: quanti,
    casuale,
  })

  const { data, error } = await supabase.rpc('avvia_impostore', {
    p_partita: partita.id,
    p_impostori: preparata.impostori,
    p_assegnazioni: preparata.assegnazioni,
    p_ordine: preparata.ordine,
    p_giri: giri,
  })

  if (error) throw error
  return daRiga(data)
}

// Passa da una funzione del database e non da un update: due persone che
// premono "fatto" insieme salterebbero un turno.
export async function avanzaTurno(partita) {
  const prossimo = avanza(partita)

  const { data, error } = await supabase.rpc('avanza_impostore', {
    p_partita: partita.id,
    p_turno_atteso: partita.turno,
    p_ordine: prossimo.ordine,
    p_turno: prossimo.turno,
    p_giro: prossimo.giro,
    p_stato: prossimo.stato,
  })

  if (error) throw error
  return daRiga(data)
}

// Il voto d'accusa. Si apre a ogni giro, e le opzioni sono solo chi e'
// ancora in gioco: dal secondo giro in poi votare chi e' gia' uscito non
// avrebbe senso, e lascerebbe accusare un fantasma.
export async function apriVoto(partita) {
  const inGioco = vivi(partita)
  const scade = new Date(Date.now() + IMPOSTORE.minutiVoto * 60000).toISOString()

  const { data: voto, error: erroreVoto } = await supabase
    .from('votes')
    .insert({
      trip_id: VIAGGIO.id,
      category: 'impostore',
      question: 'Chi e’ l’impostore?',
      options: inGioco,
      // Mai anonimo: senza sapere chi ha votato chi non si puo' dare il
      // punto a chi ha indovinato.
      anonymous: false,
      tally: inGioco.map(() => 0),
      expires_at: scade,
    })
    .select('id')
    .single()

  if (erroreVoto) throw erroreVoto

  const { data, error } = await supabase
    .from('impostore_games')
    .update({ vote_id: voto.id })
    .eq('id', partita.id)
    .eq('stato', 'voto')
    .is('vote_id', null)
    .select(CAMPI)
    .maybeSingle()

  if (error) throw error
  // Se un altro telefono ha aperto il voto nello stesso istante, il
  // nostro update non trova niente: vince il suo, si rilegge il vero.
  return data ? daRiga(data) : leggiPartita()
}

// La rivelazione paga: gli impostori che l'hanno fatta franca e chi ha
// indovinato. La dedupeKey e' obbligatoria perche' la rivelazione la puo'
// far scattare chiunque, e otto telefoni che rivelano insieme
// accrediterebbero gli stessi punti otto volte.
//
// Le schede si leggono con le opzioni di QUEL voto e non con l'elenco dei
// giocatori: dal secondo giro d'accusa in poi si vota solo fra i
// superstiti, e usare l'elenco intero sposterebbe ogni numero di un posto
// — cioe' darebbe i punti alle persone sbagliate, in silenzio.
export async function paga(partita, voto) {
  const opzioni = voto?.opzioni ?? partita.giocatori
  const { assegnazioni } = premi({
    impostori: partita.impostori,
    giocatori: partita.giocatori,
    schede: schedePerId(voto?.schede, opzioni),
    colpoRiuscito: stessaParola(partita.tentativo, partita.parolaGruppo),
  })

  for (const { membroId, leggeId } of assegnazioni) {
    await faiScattareLegge(leggeId, membroId, `impostore:${partita.id}:${leggeId}:${membroId}`)
  }

  return assegnazioni
}
// Fine di un giro d'accusa. Chi e' stato accusato esce: se era un
// impostore e' scoperto, se era innocente e' eliminato e il gruppo ha
// perso un voto. Poi la partita fa una di tre cose — si va al colpo di
// coda, finisce perche' gli impostori non sono piu' in minoranza, oppure
// si riparte con un altro giro fra i superstiti.
export async function chiudiAccusa(partita, voto, casuale) {
  // ⚠️ Vuole il VOTO, non l'esito del giro. Chiamandola con l'oggetto
  // sbagliato, `opzioni` e `schede` restavano vuote e il giro si chiudeva
  // senza accusare nessuno — in silenzio, senza errori: la partita
  // ripartiva da capo e l'impostore beccato tornava in gioco. Meglio
  // fermarsi che raccontare una partita che non e' successa.
  if (!voto?.opzioni) {
    throw new Error('chiudiAccusa vuole il voto del giro, con le sue opzioni.')
  }

  const esitoGiro = dopoAccusa(partita, schedePerId(voto.schede, voto.opzioni), casuale)

  const { data, error } = await supabase.rpc('chiudi_accusa', {
    p_partita: partita.id,
    p_fuori: esitoGiro.fuori,
    p_stato: esitoGiro.stato,
    p_ordine: esitoGiro.ordine ?? null,
    p_giri: esitoGiro.giriTotali ?? null,
    // Ripartendo, il voto vecchio non serve piu': il prossimo giro ne
    // apre uno suo, sui superstiti di allora.
    p_voto: esitoGiro.stato === 'in-corso' ? null : (partita.votoId ?? null),
  })

  if (error) throw error
  const dopo = daRiga(data)

  // Se e' gia' finita — hanno vinto gli impostori per numeri — i punti si
  // assegnano adesso. Se si va al colpo, si aspetta quello.
  if (dopo.stato === 'finita') await paga(dopo, voto)

  return dopo
}

// L'impostore beccato scrive la parola del gruppo. Una volta sola: due
// che tentano insieme non possono avere due finali diversi per la stessa
// partita, quindi la prima che arriva vale.
export async function tentaColpo(partita, membroId, parola) {
  const { data, error } = await supabase.rpc('tenta_colpo', {
    p_partita: partita.id,
    p_membro: membroId,
    p_parola: parola,
  })
  if (error) throw error
  return daRiga(data)
}

// L'uscita di sicurezza. Una partita che si pianta blocca tutti, perche'
// finche' ce n'e' una aperta non se ne puo' cominciare un'altra: deve
// esserci sempre un modo di chiuderla.
//
// Non serve il consenso del gruppo, e non e' una svista: se serve
// abbandonare e' perche' qualcuno se n'e' andato o ha il telefono morto,
// e chiedere una maggioranza ricrerebbe esattamente il blocco che si sta
// cercando di togliere. La conferma sta nell'interfaccia, che chiede due
// volte e dice che vale per tutti.
export async function abbandonaPartita(partita) {
  const { data, error } = await supabase
    .from('impostore_games')
    .update({ stato: 'annullata' })
    .eq('id', partita.id)
    .neq('stato', 'finita')
    .neq('stato', 'annullata')
    .select(CAMPI)
    .maybeSingle()

  if (error) throw error
  return data ? daRiga(data) : leggiPartita()
}

// Chiedere di rivelare prima che abbiano votato tutti. Passa da una
// funzione: due che la chiedono nello stesso istante si sovrascriverebbero
// a vicenda, e uno dei due voti sparirebbe.
export async function chiediRivelazione(partita, membroId) {
  const { data, error } = await supabase.rpc('chiedi_rivelazione', {
    p_partita: partita.id,
    p_membro: membroId,
  })
  if (error) throw error
  return daRiga(data)
}

export async function chiudiPartita(partita, schede) {
  // Prima i punti, poi la chiusura: se paga fallisce a meta', la partita
  // resta da rivelare e il prossimo tocco riprova. Le chiavi doppie
  // vengono rifiutate, quindi ripetere non raddoppia niente.
  await paga(partita, schede)

  const { data, error } = await supabase
    .from('impostore_games')
    .update({ stato: 'finita' })
    .eq('id', partita.id)
    .neq('stato', 'finita')
    .select(CAMPI)
    .maybeSingle()

  if (error) throw error
  return data ? daRiga(data) : leggiPartita()
}
