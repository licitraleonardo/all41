import { useEffect, useState } from 'react'
import './NuvolettaAllan.css'
import { NUVOLETTE } from '../config/guida.js'
import FacciaAllan from './FacciaAllan.jsx'

// Allan dice una cosa sola la prima volta che apri un pezzo dell'app, e
// poi non la ripete mai più.
//
// È il tutorial dello spec fatto al momento giusto: uno che sbarra
// l'ingresso viene saltato senza leggerlo, e una guida in fondo a un
// menu non la apre nessuno. Qui invece arriva quando sei appena entrato
// da qualche parte, che è l'unico momento in cui ti interessa sapere
// cosa ci si fa.
//
// Il segnalibro contiene l'id della persona: chi entra dopo su questo
// telefono si merita le sue, di spiegazioni.
function chiave(membroId, passo) {
  return `allan:${membroId}:${passo}`
}

export function nuvolettaGiaVista(membroId, passo) {
  try {
    return localStorage.getItem(chiave(membroId, passo)) === 'si'
  } catch {
    return true
  }
}

function segnaVista(membroId, passo) {
  try {
    localStorage.setItem(chiave(membroId, passo), 'si')
  } catch {
    // Navigazione privata: la rivedrà la prossima volta. Peggio per lui,
    // non è un motivo per rompere la schermata.
  }
}

// Il guscio: il velo, Allan fuori dal fumetto e il fumetto che punta a
// lui ad altezza faccia.
function Guscio({ testo, posizione, azioni, onFondo }) {
  return (
    <div
      className={posizione === 'alto' ? 'nuvoletta-fondo in-alto' : 'nuvoletta-fondo'}
      onClick={onFondo}
      role="presentation"
    >
      <div className="nuvoletta-riga" onClick={(e) => e.stopPropagation()} role="presentation">
        <FacciaAllan espressione="giudica" lato={72} className="nuvoletta-allan" />
        <div className="nuvoletta" role="alert">
          <p className="nuvoletta-chi">Allan</p>
          <p className="nuvoletta-testo">{testo}</p>
          <div className="nuvoletta-azioni">{azioni}</div>
        </div>
      </div>
    </div>
  )
}

export default function NuvolettaAllan({ membroId, passo }) {
  const [chiusa, setChiusa] = useState(true)
  const voce = NUVOLETTE[passo]

  useEffect(() => {
    if (!membroId || !voce) return
    setChiusa(nuvolettaGiaVista(membroId, passo))
  }, [membroId, passo, voce])

  if (chiusa || !voce) return null

  function via() {
    segnaVista(membroId, passo)
    setChiusa(true)
  }

  return (
    <Guscio
      testo={voce.testo}
      posizione={voce.posizione}
      onFondo={via}
      azioni={
        <button type="button" className="nuvoletta-ok" onClick={via}>
          Va bene
        </button>
      }
    />
  )
}
