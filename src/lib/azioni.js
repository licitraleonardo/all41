import { supabase } from './supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { conCache } from './cache.js'
import { verificaLimite } from './limiti.js'
import { faiSuonare } from './notifiche.js'

const CAMPI = 'id, author_id, kind, payload, importante, deleted_at, created_at'

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
    importante: Boolean(riga.importante),
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
export async function inviaAzione({ tipo, payload = {}, memberId, importante = false }) {
  const esito = await verificaLimite(tipo, memberId)
  if (!esito.consentito) return { ok: false, ...esito }

  const { data, error } = await supabase
    .from('quick_actions')
    .insert({ trip_id: VIAGGIO.id, author_id: memberId, kind: tipo, payload, importante })
    .select(CAMPI)
    .single()

  if (error) throw error

  // ⚠️ Dopo l'insert riuscito, e senza aspettare.
  //
  // Fa suonare i telefoni degli altri, se ci sono iscritti. Non si
  // attende e non si guarda com'e' andata: chi ha appena premuto SOS non
  // deve restare fermo davanti a una rotella perche' una notifica sta
  // partendo. Se fallisce, l'SOS e' partito lo stesso e dentro l'app si
  // vede — le notifiche sono un di piu', mai la via principale.
  faiSuonare(data.id)

  return { ok: true, azione: daRiga(data) }
}

// Cancellazione morbida: il feed di chi era offline non deve avere buchi,
// e l'autore deve poter rimediare a una foto sbagliata o a un messaggio
// partito per errore.
// Da quante ore in qua un SOS conta ancora come aperto. Oltre, o è
// rientrato e nessuno l'ha detto, o non è più una cosa di adesso.
export const ORE_SOS = 8

// Gli SOS ancora aperti, letti a parte dal feed.
//
// Il feed tiene trenta righe: un SOS delle 18 cadeva fuori dal limite
// entro un'ora di chiacchiere sulla cena, e chi apriva l'app alle 19 non
// lo vedeva proprio. Non c'era nessun "carica precedenti" e niente lo
// teneva in vista. È l'unica funzione di sicurezza dell'app: non può
// dipendere da quanti messaggi sono arrivati dopo.
export async function leggiSosAperti() {
  const da = new Date(Date.now() - ORE_SOS * 3600 * 1000).toISOString()

  const { data, error } = await supabase
    .from('quick_actions')
    .select(CAMPI)
    .eq('trip_id', VIAGGIO.id)
    .eq('kind', 'sos')
    .is('deleted_at', null)
    .gte('created_at', da)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) throw error
  return data.map(daRiga)
}

export async function eliminaAzione(id) {
  const { error } = await supabase
    .from('quick_actions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
