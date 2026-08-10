import { useState } from 'react'
import './Pellicola.css'
import { COPERTO } from '../config/rilascio.js'

// Quello che si vede al posto di un gioco, prima che il viaggio cominci.
//
// ⚠️ **Sotto non c'è il gioco: c'è il niente.**
//
// La tentazione era stendere un velo sopra il gioco vero, che è quello
// che «pellicola» fa venire in mente. Ma l'Impostore e la Dama, appena
// montati, aprono ascoltatori sul database e possono creare partite: un
// velo sopra un gioco vivo lo lascerebbe girare, e basterebbe un errore
// di sovrapposizione — un `z-index`, un tocco che passa — per farci
// entrare un dito. Si vedrebbero partite create il 10 agosto.
//
// Quindi la pellicola **prende il posto** del gioco, che non viene
// costruito affatto. Quello che si vede è finto in tutto: è un disegno.
export default function Pellicola({ nome }) {
  const [toccata, setToccata] = useState(false)

  return (
    <button
      type="button"
      className={toccata ? 'pellicola toccata' : 'pellicola'}
      onClick={() => setToccata(true)}
      aria-label={`${nome} — ${COPERTO}`}
    >
      <span className="pellicola-nome">{nome}</span>
      {/* L'avviso compare toccando, non prima: una schermata che ti dice
          già tutto non lascia niente da toccare, e questa deve invitare a
          provare. Chi tocca sa cosa voleva fare. */}
      <span className="pellicola-quando" role={toccata ? 'status' : undefined}>
        {toccata ? COPERTO : '🔒'}
      </span>
    </button>
  )
}
