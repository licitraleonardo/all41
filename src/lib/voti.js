import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { CATEGORIE_CHE_SCADONO, DURATA_MINUTI } from '../config/sondaggi.js'

const CAMPI =
  'id, category, question, options, anonymous, tally, voted, ballots, expires_at, closed_at, created_at'

function daRiga(riga) {
  return {
    id: riga.id,
    categoria: riga.category,
    domanda: riga.question,
    opzioni: riga.options,
    anonimo: riga.anonymous,
    conteggi: riga.tally,
    hannoVotato: riga.voted ?? [],
    schede: riga.ballots ?? {},
    scadeIl: riga.expires_at,
    chiusoIl: riga.closed_at,
  }
}

export async function creaSondaggio({ domanda, opzioni }) {
  const scade = new Date(Date.now() + DURATA_MINUTI * 60000).toISOString()

  const { data, error } = await supabase
    .from('votes')
    .insert({
      trip_id: VIAGGIO.id,
      category: 'logistics',
      question: domanda,
      options: opzioni,
      anonymous: false,
      tally: opzioni.map(() => 0),
      expires_at: scade,
    })
    .select(CAMPI)
    .single()

  if (error) throw error
  return daRiga(data)
}

export async function leggiVoti(ids) {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('votes')
    .select(CAMPI)
    .in('id', ids)
    .limit(ids.length)

  if (error) throw error
  return data.map(daRiga)
}

// Passa dalla funzione del database, non da un update: così il conteggio
// non si perde se due persone votano nello stesso istante.
export async function vota(votoId, memberId, opzione) {
  const { data, error } = await supabase.rpc('vota', {
    p_voto: votoId,
    p_membro: memberId,
    p_opzione: opzione,
  })
  if (error) throw error
  return daRiga(data)
}

export async function chiudiVoto(votoId) {
  const { data, error } = await supabase.rpc('chiudi_voto', { p_voto: votoId })
  if (error) throw error
  return daRiga(data)
}

// Senza un server, un sondaggio scaduto alle 23:59 mentre tutti dormono
// resterebbe appeso per sempre: lo chiude il primo che apre l'app.
//
// Ma solo le categorie che hanno una scadenza vera — vedi
// CATEGORIE_CHE_SCADONO, dove c'è scritto perché l'Impostore non è fra
// quelle. Chiudergli il voto d'accusa gli piantava la partita, e il
// filtro sta qui nella lettura anche per non fargli occupare i venti
// posti della ricerca.
export async function chiudiScaduti() {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('trip_id', VIAGGIO.id)
    .in('category', CATEGORIE_CHE_SCADONO)
    .is('closed_at', null)
    .lt('expires_at', new Date().toISOString())
    .limit(20)

  if (error) throw error
  await Promise.all(data.map((v) => chiudiVoto(v.id).catch(() => {})))
  return data.length
}

// Il voto dell'Impostore: piu' accuse in una scheda sola. Passa da una
// funzione sua e non da `vota`, che per i sondaggi normali deve
// continuare ad accettare una preferenza e basta.
export async function votaImpostore(votoId, memberId, opzioni) {
  const { data, error } = await supabase.rpc('vota_impostore', {
    p_voto: votoId,
    p_membro: memberId,
    p_opzioni: opzioni,
  })
  if (error) throw error
  return daRiga(data)
}
