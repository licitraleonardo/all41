import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { verificaLimite } from './limiti.js'

const CAMPI = 'id, author_id, kind, payload, deleted_at, created_at'

// Verifica bloccante n.4 dello spec: ogni lettura ha un tetto. Senza, otto
// persone che aprono l'app cinquanta volte al giorno bruciano la quota a
// metà viaggio, e non è ovvio capire perché.
export const TETTO_FEED = 30

function daRiga(riga) {
  return {
    id: riga.id,
    autoreId: riga.author_id,
    tipo: riga.kind,
    payload: riga.payload ?? {},
    eliminato: Boolean(riga.deleted_at),
    creatoIl: riga.created_at,
  }
}

export const leggiFeed = conCache(
  // Solo il feed intero: una lettura più corta non deve sostituire una
  // copia più lunga già buona.
  (limite = TETTO_FEED) => (limite === TETTO_FEED ? 'feed' : null),
  async function leggiFeed(limite = TETTO_FEED) {
    const { data, error } = await supabase
      .from('quick_actions')
      .select(CAMPI)
      .eq('trip_id', VIAGGIO.id)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (error) throw error
    return data.map(daRiga)
  }
)

// Restituisce { ok } oppure { ok: false, attesa } senza sollevare: un
// limite raggiunto non è un errore, è una risposta.
export async function inviaAzione({ tipo, payload = {}, memberId }) {
  const esito = await verificaLimite(tipo, memberId)
  if (!esito.consentito) return { ok: false, ...esito }

  const { data, error } = await supabase
    .from('quick_actions')
    .insert({ trip_id: VIAGGIO.id, author_id: memberId, kind: tipo, payload })
    .select(CAMPI)
    .single()

  if (error) throw error
  return { ok: true, azione: daRiga(data) }
}

// Cancellazione morbida: il feed di chi era offline non deve avere buchi,
// e l'autore deve poter rimediare a una foto sbagliata o a un messaggio
// partito per errore.
export async function eliminaAzione(id) {
  const { error } = await supabase
    .from('quick_actions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
