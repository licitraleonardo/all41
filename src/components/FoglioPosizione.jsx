import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'
import { negliAppunti } from '../lib/appunti.js'

// Toccando una persona sulla mappa: dove sta, il link per aprirla
// nell'app di navigazione, e le coordinate copiabili.
//
// Il link a Maps conta più della mappa dentro l'app: quando devi
// raggiungere qualcuno ti serve chi ti dice dove girare, non un puntino
// da guardare.
export default function FoglioPosizione({ persona, onChiudi }) {
  const [copiato, setCopiato] = useState(false)

  const coordinate = `${persona.lat}, ${persona.lng}`
  const maps = `https://www.google.com/maps/search/?api=1&query=${persona.lat},${persona.lng}`

  async function copia() {
    if (await negliAppunti(coordinate)) {
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    }
    // Se fallisce anche il ripiego, le coordinate restano leggibili a
    // schermo: non è un errore che valga un messaggio.
  }

  return (
    <div className="foglio-sfondo" role="dialog" aria-modal="true" aria-label={persona.nome}>
      <div className="foglio">
        <div className="pos-foglio-testa">
          <img
            src={urlAvatar(persona.avatarStyle, persona.avatarSeed)}
            alt=""
            width="40"
            height="40"
          />
          <span>
            <strong>{persona.nome}</strong>
            <span className="pos-foglio-quando">{persona.detto}</span>
          </span>
        </div>

        <button type="button" className="pos-coordinate" onClick={copia}>
          {coordinate}
          <span className="pos-copia">{copiato ? 'copiate' : 'tocca per copiare'}</span>
        </button>

        <a className="pos-maps" href={maps} target="_blank" rel="noopener noreferrer">
          Aprilo in Maps
        </a>

        <button type="button" className="secondario-foglio" onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  )
}
