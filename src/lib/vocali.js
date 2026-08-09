import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { uuid } from './id.js'
import { estensioneDi } from './formatoAudio.js'
import { verificaLimite } from './limiti.js'
import { faiSuonare } from './notifiche.js'

const BUCKET = 'vocali'
const CAMPI =
  'id, author_id, url, path, mime_type, durata_sec, importante, deleted_at, created_at'

// Verifica bloccante n.4: ogni lettura ha un tetto.
export const TETTO_VOCALI = 30

function daRiga(riga) {
  return {
    id: riga.id,
    autoreId: riga.author_id,
    url: riga.url,
    percorso: riga.path,
    tipo: riga.mime_type,
    durata: riga.durata_sec,
    importante: Boolean(riga.importante),
    eliminato: Boolean(riga.deleted_at),
    creatoIl: riga.created_at,
  }
}

export const leggiVocali = conCache('vocali', async function leggiVocali() {
  const { data, error } = await supabase
    .from('voice_messages')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(TETTO_VOCALI)

  if (error) throw error
  return data.map(daRiga)
})

// Restituisce { ok: false, attesa } senza sollevare: un limite raggiunto
// non è un errore, è una risposta.
export async function mandaVocale({ blob, mimeType, durata, importante = false }, membroId) {
  const esito = await verificaLimite('voice', membroId)
  if (!esito.consentito) return { ok: false, ...esito }

  const percorso = `${VIAGGIO.id}/${membroId}/${uuid()}.${estensioneDi(mimeType)}`

  const { error: erroreUpload } = await supabase.storage
    .from(BUCKET)
    .upload(percorso, blob, { contentType: mimeType, cacheControl: '31536000' })
  if (erroreUpload) throw erroreUpload

  const { data: pubblico } = supabase.storage.from(BUCKET).getPublicUrl(percorso)

  const { data, error } = await supabase
    .from('voice_messages')
    .insert({
      trip_id: VIAGGIO.id,
      author_id: membroId,
      path: percorso,
      url: pubblico.publicUrl,
      // Il tipo vero, salvato accanto al file: chi lo riproduce non deve
      // indovinare cosa gli è arrivato.
      mime_type: mimeType,
      durata_sec: durata,
      importante,
    })
    .select(CAMPI)
    .single()

  if (error) throw error

  // Come per le azioni: si fa suonare e non si aspetta. Vedi il commento
  // in `lib/azioni.js`.
  faiSuonare(data.id, 'vocale')

  return { ok: true, vocale: daRiga(data) }
}

// ⚠️ Si segna DOPO che il vocale è già partito, e non prima.
//
// Il gesto vecchio — tieni premuto e trascina in su — chiedeva di
// decidere «è importante?» mentre stavi ancora parlando, con un
// movimento che non si vede da nessuna parte. Adesso la domanda arriva
// quando ha senso, cioè quando hai finito.
//
// Ma la domanda **non tiene in ostaggio l'audio**: il vocale parte
// subito, e questa è una correzione che arriva dopo. Se la domanda
// venisse prima dell'invio, un minuto di registrazione resterebbe
// appeso in memoria in attesa di un tocco — e chi si distrae, o a cui
// si blocca il telefono, lo perderebbe. In questa app un vocale perso
// è già il difetto n.3, e non ne serve un secondo modo.
//
// Si può solo accendere, non spegnere: è un ripensamento di un secondo
// dopo, non un interruttore.
export async function segnaImportante(id) {
  const { error } = await supabase
    .from('voice_messages')
    .update({ importante: true })
    .eq('id', id)
  if (error) throw error
}

// Morbida come nel resto dell'app.
export async function eliminaVocale(id) {
  const { error } = await supabase
    .from('voice_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
