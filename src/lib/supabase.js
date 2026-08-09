import { createClient } from '@supabase/supabase-js'
import { SECONDI_RETE } from '../config/rete.js'
import { conScadenza } from './scadenza.js'

const url = import.meta.env.VITE_SUPABASE_URL
const chiave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Quale tetto tocca a questa chiamata. Si guarda il percorso e non il metodo
// HTTP: `.rpc()` è una POST, e certe letture con elenchi lunghi lo diventano
// anche loro, quindi il metodo non distingue niente di utile.
function tettoPer(indirizzo) {
  const s = String(indirizzo ?? '')
  if (s.includes('/storage/v1/')) return SECONDI_RETE.storage
  if (s.includes('/auth/v1/')) return SECONDI_RETE.auth
  return SECONDI_RETE.rest
}

// ⚠️ Il pavimento di tutta l'app: una `fetch` col tempo massimo, passata al
// client. Copre auth, PostgREST e storage in un punto solo — comprese le
// chiamate che nessuno andrebbe a cercare, che sono quelle che fanno il
// danno peggiore: la sessione anonima all'avvio (senza la quale non entra
// nessuno), il conteggio dei limiti che gira prima di ogni scrittura, la
// lettura degli SOS aperti sugli altri sette telefoni.
//
// Perché qui e non punto per punto: sono una sessantina di chiamate in
// sedici file, e la via puntuale ha già fallito una volta su un file scritto
// apposta per non fallire.
//
// Tre cose da NON cambiare senza sapere cosa si sta facendo:
//
// 1. Rifiuta con `conScadenza`, quindi con `code: 'scaduta'`. È la forma che
//    `cache.js` riconosce per servire la copia locale: con un errore di
//    un'altra forma la copia offline smetterebbe di uscire proprio nel caso
//    per cui è stata scritta.
// 2. NIENTE `AbortController`, e per lo stesso motivo niente `db.timeout`
//    di supabase-js: quello annulla. Qui scaduta vuol dire "non lo so", non
//    "non è partita" — la richiesta continua a correre e se arriva, arriva.
//    Vedi il commento in cima a `scadenza.js`.
// 3. Il realtime non passa di qui: usa un WebSocket, non `fetch`. I canali
//    non sono toccati, e non devono esserlo — un canale ha da restare aperto.
function fetchColTetto(indirizzo, opzioni) {
  const quale = typeof indirizzo === 'string' ? indirizzo : (indirizzo?.url ?? '')
  return conScadenza(globalThis.fetch(indirizzo, opzioni), tettoPer(quale) * 1000)
}

// Se mancano le variabili l'app non deve esplodere con un errore oscuro:
// lo dice in chiaro a schermo. Vedi App.jsx.
export const supabaseConfigurato = Boolean(url && chiave)

export const supabase = supabaseConfigurato
  ? createClient(url, chiave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: { fetch: fetchColTetto },
    })
  : null

// Identità tecnica anonima: nessun attrito per l'utente, ma le regole di
// sicurezza possono pretendere una sessione. Non identifica la persona —
// quello lo fa il memberId applicativo.
export async function assicuraSessione() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session

  const { data: nuova, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return nuova.session
}
