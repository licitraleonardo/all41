import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { tieniAggiornata } from './lib/aggiornamento.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Fuori da React: non dipende da nessuna schermata e deve girare anche
// mentre l'app sta ancora partendo.
tieniAggiornata()
