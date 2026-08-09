import { useState } from 'react'
import Foglio from './Foglio.jsx'
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
    <Foglio etichetta={persona.nome} onChiudi={onChiudi}>
      <>
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

        {/* Qui non si sta facendo niente, si sta guardando: «Chiudi» e
            non «Lascia stare», che vuol dire abbandonare qualcosa. Sono
            le due sole parole rimaste in tutta l'app. */}
        <button type="button" className="secondario-foglio" onClick={onChiudi}>
          Chiudi
        </button>
      </>
    </Foglio>
  )
}
