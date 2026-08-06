import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { IMPOSTORE } from '../config/impostore.js'
import {
  avanza,
  chiPuoTentare,
  premi,
  preparaPartita,
  schedePerId,
  stessaParola,
} from './impostore.js'
import { faiScattareLegge } from './punti.js'

// Le partite dell'Impostore sul database. Il mazziere vero — chi e'
// impostore, che parola gli tocca, chi parla adesso — sta in
// impostore.js, che non sa cosa sia Supabase e si puo' provare.

const CAMPI =
  'id, parola_gruppo, parola_impostore, impostori, giocatori, assegnazioni, ordine, turno, giro, giri_totali, vote_id, stato, rivela_chiesta, setup_vote_id, tentativo, tentato_da, created_at'

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
    votoAperturaId: riga.setup_vote_id ?? null,
    tentativo: riga.tentativo ?? null,
    tentatoDa: riga.tentato_da ?? null,
    stato: riga.stato,
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
      question: 'Quanti impostori?',
      options: IMPOSTORE.sceltePerImpostori.map(String),
      anonymous: false,
      tally: IMPOSTORE.sceltePerImpostori.map(() => 0),
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
export async function avviaPartita(partita, quantiImpostori, casuale) {
  const preparata = preparaPartita({
    giocatori: partita.giocatori,
    coppia: [partita.parolaGruppo, partita.parolaImpostore],
    quantiImpostori,
    casuale,
  })

  const { data, error } = await supabase.rpc('avvia_impostore', {
    p_partita: partita.id,
    p_impostori: preparata.impostori,
    p_assegnazioni: preparata.assegnazioni,
    p_ordine: preparata.ordine,
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

export async function apriVoto(partita) {
  const scade = new Date(Date.now() + IMPOSTORE.minutiVoto * 60000).toISOString()

  const { data: voto, error: erroreVoto } = await supabase
    .from('votes')
    .insert({
      trip_id: VIAGGIO.id,
      category: 'impostore',
      question: 'Chi e’ l’impostore?',
      options: partita.giocatori,
      // Mai anonimo: senza sapere chi ha votato chi non si puo' dare il
      // punto a chi ha indovinato.
      anonymous: false,
      tally: partita.giocatori.map(() => 0),
      expires_at: scade,
    })
    .select('id')
    .single()

  if (erroreVoto) throw erroreVoto

  const { data, error } = await supabase
    .from('impostore_games')
    .update({ vote_id: voto.id })
    .eq('id', partita.id)
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
export async function paga(partita, schedeGrezze) {
  const { assegnazioni } = premi({
    impostori: partita.impostori,
    giocatori: partita.giocatori,
    schede: schedePerId(schedeGrezze, partita.giocatori),
    colpoRiuscito: stessaParola(partita.tentativo, partita.parolaGruppo),
  })

  for (const { membroId, leggeId } of assegnazioni) {
    await faiScattareLegge(leggeId, membroId, `impostore:${partita.id}:${leggeId}:${membroId}`)
  }

  return assegnazioni
}

// Fine del voto: se il gruppo ha beccato qualcuno, quel qualcuno ha
// un'ultima carta prima che si chiuda. Se non hanno beccato nessuno non
// c'e' niente da tentare e si va dritti al finale.
export async function apriColpo(partita, schedeGrezze) {
  const puo = chiPuoTentare({
    impostori: partita.impostori,
    giocatori: partita.giocatori,
    schede: schedePerId(schedeGrezze, partita.giocatori),
  })

  if (puo.length === 0) return chiudiPartita(partita, schedeGrezze)

  const { data, error } = await supabase
    .from('impostore_games')
    .update({ stato: 'colpo' })
    .eq('id', partita.id)
    .eq('stato', 'voto')
    .select(CAMPI)
    .maybeSingle()

  if (error) throw error
  return data ? daRiga(data) : leggiPartita()
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
