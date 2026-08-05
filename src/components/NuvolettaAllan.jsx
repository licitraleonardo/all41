import { useEffect, useState } from 'react'
import './NuvolettaAllan.css'
import { NUVOLETTE } from '../config/guida.js'

// Allan dice una cosa sola, la prima volta che entri in un tab, e poi non
// la ripete mai piu'.
//
// E' il tutorial dello spec fatto al momento giusto: un tutorial che
// sbarra l'ingresso viene saltato senza leggerlo, e una guida in fondo a
// un menu non la apre nessuno. Qui invece arriva quando sei appena
// entrato da qualche parte, che e' l'unico momento in cui ti interessa
// sapere cosa ci si fa.
//
// Il segnalibro contiene l'id della persona: chi entra dopo su questo
// telefono si merita le sue, di spiegazioni.
function chiave(membroId, tab) {
  return `allan:${membroId}:${tab}`
}

export function nuvolettaGiaVista(membroId, tab) {
  try {
    return localStorage.getItem(chiave(membroId, tab)) === 'si'
  } catch {
    return true
  }
}

export default function NuvolettaAllan({ membroId, tab }) {
  const [chiusa, setChiusa] = useState(true)

  useEffect(() => {
    if (!membroId || !NUVOLETTE[tab]) return
    setChiusa(nuvolettaGiaVista(membroId, tab))
  }, [membroId, tab])

  if (chiusa || !NUVOLETTE[tab]) return null

  function via() {
    try {
      localStorage.setItem(chiave(membroId, tab), 'si')
    } catch {
      // Navigazione privata: la rivedra' la prossima volta. Peggio per
      // lui, non e' un motivo per rompere la schermata.
    }
    setChiusa(true)
  }

  return (
    <div className="nuvoletta-fondo" onClick={via} role="presentation">
      <div className="nuvoletta" role="alert">
        <p className="nuvoletta-chi">Allan</p>
        <p className="nuvoletta-testo">{NUVOLETTE[tab]}</p>
        <button type="button" className="nuvoletta-ok" onClick={via}>
          Va bene
        </button>
      </div>
    </div>
  )
}
