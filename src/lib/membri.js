import { supabase } from './supabase.js'
import { generaCodice } from './codice.js'
import { conCache, inCache } from './cache.js'
import { VIAGGIO } from '../config/viaggio.js'

const CAMPI =
  'id, name, avatar_seed, avatar_style, access_code, score, last_seen_at, phone'

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
    // Facoltativo: chi non l'ha lasciato ha `null`, e le Info lo saltano
    // invece di mostrare una riga vuota.
    telefono: riga.phone ?? null,
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

// Il codice che si sta provando a usare, messo da parte prima di mandarlo.
//
// ⚠️ Serve a non creare due profili per la stessa persona, ed è il difetto
// peggiore che potesse capitare la sera del 12: la scrittura parte, la rete
// non risponde, la persona ritocca «Inizia viaggio» — e adesso in `members`
// ci sono due righe sue. La prima ha un codice che **non ha mai visto**,
// perché il codice si legge solo nel messaggio dopo la creazione riuscita:
// è un fantasma irrecuperabile che compare in «Divisa fra» delle Spese,
// nella classifica e fra le opzioni dell'Impostore. Otto persone, nove
// profili, e i saldi divisi per nove.
//
// Siccome il codice lo genera il telefono, il telefono può anche chiedere
// «quello di prima è arrivato?» invece di mandarne un altro.
const CHIAVE_TENTATO = 'all41.codiceTentato'

function ricordaTentativo(codice) {
  try {
    localStorage.setItem(CHIAVE_TENTATO, codice)
  } catch {
    // Safari in navigazione privata: si perde la rete di sicurezza, non il
    // profilo. Al massimo si torna al comportamento di prima.
  }
}

function scordaTentativo() {
  try {
    localStorage.removeItem(CHIAVE_TENTATO)
  } catch {
    // vedi sopra
  }
}

export async function creaMembro({ nome, avatarStyle, telefono = null }) {
  // Prima di crearne uno nuovo: c'era un tentativo rimasto in sospeso? Se
  // quel codice adesso esiste sul database, la scrittura di prima era
  // arrivata — solo che la risposta non è tornata indietro. Si adotta
  // quello invece di aggiungere un doppione.
  const inSospeso = (() => {
    try {
      return localStorage.getItem(CHIAVE_TENTATO)
    } catch {
      return null
    }
  })()

  if (inSospeso) {
    const gia = await trovaPerCodice(inSospeso).catch(() => null)
    if (gia) {
      scordaTentativo()
      inCache(`membro.${gia.id}`, gia)
      return gia
    }
  }

  // Il codice è casuale su 31^5 combinazioni: una collisione è improbabile
  // ma non impossibile, e il vincolo unique la fa fallire. Si riprova.
  for (let tentativo = 0; tentativo < 5; tentativo += 1) {
    const codice = generaCodice()
    ricordaTentativo(codice)

    const { data, error } = await supabase
      .from('members')
      .insert({
        trip_id: VIAGGIO.id,
        name: nome,
        avatar_seed: nome,
        avatar_style: avatarStyle,
        access_code: codice,
        last_seen_at: new Date().toISOString(),
        phone: telefono,
      })
      .select(CAMPI)
      .single()

    if (!error) {
      scordaTentativo()
      const nuovo = daRiga(data)
      // Chi si iscrive e resta subito senza segnale deve poter riaprire
      // l'app lo stesso: senza copia, alla riapertura non ci sarebbe
      // nessun profilo da trovare.
      inCache(`membro.${nuovo.id}`, nuovo)
      return nuovo
    }

    // Codice già preso: si riprova con un altro, e quello tentato non
    // serve più a niente.
    if (error.code === '23505') {
      scordaTentativo()
      continue
    }

    // Qualunque altro guasto — rete appesa compresa — lascia il codice
    // tentato dov'è: è quello che al prossimo tocco eviterà il doppione.
    throw error
  }

  scordaTentativo()
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
