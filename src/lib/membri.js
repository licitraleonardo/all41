import { supabase } from './supabase.js'
import { generaCodice } from './codice.js'
import { conCache, inCache } from './cache.js'
import { VIAGGIO } from '../config/viaggio.js'

const CAMPI = 'id, name, avatar_seed, avatar_style, access_code, score, last_seen_at'

// Le colonne stanno in snake_case perché è la convenzione di Postgres;
// il resto dell'app vede i nomi dello spec.
function daRiga(riga) {
  if (!riga) return null
  return {
    id: riga.id,
    nome: riga.name,
    avatarSeed: riga.avatar_seed,
    avatarStyle: riga.avatar_style,
    codice: riga.access_code,
    punteggio: riga.score,
    ultimaVisita: riga.last_seen_at,
  }
}

// Senza copia, aprire l'app in aereo mode non passa nemmeno di qui: il
// profilo non si legge e si finisce sulla schermata di Allan invece che
// dentro l'app.
export const trovaPerId = conCache(
  (id) => `membro.${id}`,
  async function trovaPerId(id) {
    const { data, error } = await supabase
      .from('members')
      .select(CAMPI)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return daRiga(data)
  }
)

// Il gruppo è di otto persone: si leggono tutti in un colpo e si tengono
// in memoria per dare un nome agli autori del feed.
export const leggiMembri = conCache('membri', async function leggiMembri() {
  const { data, error } = await supabase
    .from('members')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .limit(50)
  if (error) throw error
  return data.map(daRiga)
})

export async function trovaPerCodice(codice) {
  const { data, error } = await supabase
    .from('members')
    .select(CAMPI)
    .eq('access_code', codice)
    .maybeSingle()
  if (error) throw error
  return daRiga(data)
}

export async function creaMembro({ nome, avatarStyle }) {
  // Il codice è casuale su 31^5 combinazioni: una collisione è improbabile
  // ma non impossibile, e il vincolo unique la fa fallire. Si riprova.
  for (let tentativo = 0; tentativo < 5; tentativo += 1) {
    const { data, error } = await supabase
      .from('members')
      .insert({
        trip_id: VIAGGIO.id,
        name: nome,
        avatar_seed: nome,
        avatar_style: avatarStyle,
        access_code: generaCodice(),
        last_seen_at: new Date().toISOString(),
      })
      .select(CAMPI)
      .single()

    if (!error) {
      const nuovo = daRiga(data)
      // Chi si iscrive e resta subito senza segnale deve poter riaprire
      // l'app lo stesso: senza copia, alla riapertura non ci sarebbe
      // nessun profilo da trovare.
      inCache(`membro.${nuovo.id}`, nuovo)
      return nuovo
    }
    if (error.code !== '23505') throw error // 23505 = unique_violation
  }
  throw new Error('Non sono riuscito a generare un codice libero.')
}

export async function aggiornaMembro(id, { nome, avatarStyle }) {
  const { data, error } = await supabase
    .from('members')
    .update({ name: nome, avatar_seed: nome, avatar_style: avatarStyle })
    .eq('id', id)
    .select(CAMPI)
    .single()
  if (error) throw error

  const aggiornato = daRiga(data)
  inCache(`membro.${id}`, aggiornato)
  return aggiornato
}

export async function segnaVisita(id) {
  const { error } = await supabase
    .from('members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
