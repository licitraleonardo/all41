import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Installa from './components/Installa.jsx'
import { controllaNelleOreMorte, tieniAggiornata } from './lib/aggiornamento.js'
import { tieniPulite } from './lib/notificheAperte.js'

// /installa è una pagina a sé: la guida per mettersi l'app sulla home, e
// nient'altro. Niente codice, niente onboarding, niente database.
//
// Il corto circuito sta qui e non dentro App perché non è una schermata
// dell'app: non deve montare i suoi hook, non deve aprire una sessione
// anonima su Supabase, non deve fare niente. È il link che si condivide
// nel gruppo, e chi lo apre spesso non ha ancora un profilo.
const installazione = window.location.pathname.replace(/\/+$/, '') === '/installa'

createRoot(document.getElementById('root')).render(
  <StrictMode>{installazione ? <Installa /> : <App />}</StrictMode>
)

// Fuori da React: non dipende da nessuna schermata e deve girare anche
// mentre l'app sta ancora partendo.
//
// Non sulla pagina di installazione: lì il service worker serve solo a
// registrarsi, e cercare aggiornamenti di un'app che non è ancora
// installata non ha senso.
if (!installazione) {
  tieniAggiornata()
  // ⚠️ E le notifiche gia' lette si chiudono quando torni nell'app.
  // Senza, la prima notifica non letta zittisce tutte quelle dopo: vedi
  // il commento in `lib/notificheAperte.js`.
  tieniPulite()
  // E l'altra meta': due volte al giorno, nelle ore in cui una ricarica
  // non porta via niente a nessuno, l'app controlla da sola di non essere
  // rimasta indietro. Vedi lib/finestreAggiornamento.js.
  controllaNelleOreMorte()
}
