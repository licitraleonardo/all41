import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { comprimi } from './compressione.js'
import { uuid } from './id.js'
import {
  LATO_LUNGO_MAX,
  MAX_BYTE,
  QUALITA,
  TETTO_ELENCO,
} from '../config/documenti.js'

const BUCKET = 'documenti'
const CAMPI =
  'id, owner_id, titolo, path, url, mime_type, byte, solo_per_me, deleted_at, created_at'

function daRiga(riga) {
  return {
    id: riga.id,
    proprietarioId: riga.owner_id,
    titolo: riga.titolo,
    percorso: riga.path,
    url: riga.url,
    tipo: riga.mime_type,
    byte: riga.byte,
    soloPerMe: riga.solo_per_me,
    eliminato: Boolean(riga.deleted_at),
    creatoIl: riga.created_at,
  }
}

export function eUnPdf(documento) {
  return documento.tipo === 'application/pdf'
}

export const leggiDocumenti = conCache('documenti', async function leggiDocumenti() {
  const { data, error } = await supabase
    .from('documents')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(TETTO_ELENCO)

  if (error) throw error
  return data.map(daRiga)
})

// Le immagini si ridimensionano — ma molto meno delle foto dell'album,
// perché qui dentro c'è roba da leggere. I PDF passano com'è: non c'è
// niente da comprimere che non rischi di rovinarli.
export async function caricaDocumento(
  file,
  membroId,
  { titolo, soloPerMe = false, onStato } = {}
) {
  const pdf = file.type === 'application/pdf'

  let blob = file
  if (!pdf) {
    const esito = await comprimi(file, {
      onStato,
      latoLungo: LATO_LUNGO_MAX,
      qualita: QUALITA,
    })
    blob = esito.blob
  }

  if (blob.size > MAX_BYTE) {
    return { ok: false, motivo: 'peso', byte: blob.size }
  }

  const estensione = pdf ? 'pdf' : 'jpg'
  const percorso = `${VIAGGIO.id}/${membroId}/${uuid()}.${estensione}`

  const { error: erroreUpload } = await supabase.storage
    .from(BUCKET)
    .upload(percorso, blob, {
      contentType: pdf ? 'application/pdf' : 'image/jpeg',
      cacheControl: '31536000',
    })
  if (erroreUpload) throw erroreUpload

  const { data: pubblico } = supabase.storage.from(BUCKET).getPublicUrl(percorso)

  const { data, error } = await supabase
    .from('documents')
    .insert({
      trip_id: VIAGGIO.id,
      owner_id: membroId,
      titolo,
      path: percorso,
      url: pubblico.publicUrl,
      mime_type: pdf ? 'application/pdf' : 'image/jpeg',
      byte: blob.size,
      solo_per_me: soloPerMe,
    })
    .select(CAMPI)
    .single()

  if (error) throw error
  return { ok: true, documento: daRiga(data) }
}

// Morbida come nel resto dell'app.
export async function eliminaDocumento(id) {
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// Il biglietto della barca nasce "solo per me" per sbaglio e ci resta
// per tutto il viaggio: deve poter cambiare idea in un tocco.
export async function cambiaVisibilita(id, soloPerMe) {
  const { data, error } = await supabase
    .from('documents')
    .update({ solo_per_me: soloPerMe })
    .eq('id', id)
    .select(CAMPI)
    .single()

  if (error) throw error
  return daRiga(data)
}
