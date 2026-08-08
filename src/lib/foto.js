import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { PER_PAGINA } from '../config/foto.js'
import { conCache } from './cache.js'
import { comprimi } from './compressione.js'
import { verificaLimite } from './limiti.js'
import { uuid } from './id.js'

const BUCKET = 'foto'
const CAMPI =
  'id, author_id, url, path, width, height, challenge_id, deleted_at, created_at'

function daRiga(riga) {
  return {
    id: riga.id,
    autoreId: riga.author_id,
    url: riga.url,
    percorso: riga.path,
    larghezza: riga.width,
    altezza: riga.height,
    sfidaId: riga.challenge_id,
    eliminata: Boolean(riga.deleted_at),
    creataIl: riga.created_at,
  }
}

// Caricamento a pagine: si legge una finestra per volta invece di tutta
// la collezione, altrimenti la quota si brucia a metà viaggio.
export const leggiFoto = conCache(
  // Si copia solo la prima pagina: le successive scriverebbero un pezzo
  // di mezzo sopra l'inizio dell'album.
  ({ primaDi = null } = {}) => (primaDi ? null : 'foto'),
  async function leggiFoto({ primaDi = null, limite = PER_PAGINA } = {}) {
    let query = supabase
      .from('photos')
      .select(CAMPI)
      .eq('trip_id', VIAGGIO.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (primaDi) query = query.lt('created_at', primaDi)

    const { data, error } = await query
    if (error) throw error
    return data.map(daRiga)
  }
)

export async function caricaFoto(file, memberId, { onStato, sfidaId = null } = {}) {
  const esito = await verificaLimite('photo', memberId)
  if (!esito.consentito) return { ok: false, ...esito }

  // "Cambia la tua" deve cambiarla davvero. Prima inseriva e basta: chi
  // sostituiva un tuffo venuto male si ritrovava DUE foto in gara, cioè
  // due opzioni nel voto, il doppio delle possibilità degli altri e la
  // foto brutta lì in mezzo. Si toglie la precedente per questa sfida,
  // e si toglie prima di caricare: se il caricamento fallisce, resta
  // quella che c'era.
  const precedenti = sfidaId ? await mieInSfida(memberId, sfidaId) : []

  const { blob, width, height, primaByte, dopoByte } = await comprimi(file, { onStato })

  const percorso = `${VIAGGIO.id}/${memberId}/${uuid()}.jpg`
  const { error: erroreUpload } = await supabase.storage
    .from(BUCKET)
    .upload(percorso, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })

  if (erroreUpload) throw erroreUpload

  const { data: pubblico } = supabase.storage.from(BUCKET).getPublicUrl(percorso)

  const { data, error } = await supabase
    .from('photos')
    .insert({
      trip_id: VIAGGIO.id,
      author_id: memberId,
      path: percorso,
      url: pubblico.publicUrl,
      width,
      height,
      challenge_id: sfidaId,
    })
    .select(CAMPI)
    .single()

  if (error) throw error

  // Adesso che la nuova c'è, la vecchia se ne può andare. In questo
  // ordine e non prima: se fallisse il caricamento, toglierla lascerebbe
  // fuori gara chi voleva solo cambiare foto.
  for (const vecchia of precedenti) {
    await eliminaFoto(vecchia.id).catch(() => {})
  }

  return { ok: true, foto: daRiga(data), primaByte, dopoByte, sostituite: precedenti.length }
}

// Le mie foto ancora in gara per una sfida. Serve solo alla sostituzione,
// quindi legge il minimo: verifica bloccante n.4, il limit c'è.
async function mieInSfida(memberId, sfidaId) {
  const { data, error } = await supabase
    .from('photos')
    .select('id')
    .eq('trip_id', VIAGGIO.id)
    .eq('author_id', memberId)
    .eq('challenge_id', sfidaId)
    .is('deleted_at', null)
    .limit(10)
  if (error) throw error
  return data ?? []
}

// Morbida come per le azioni: la riga resta, sparisce dalla griglia.
export async function eliminaFoto(id) {
  const { error } = await supabase
    .from('photos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
