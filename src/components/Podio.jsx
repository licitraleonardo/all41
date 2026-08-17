import { useEffect, useState } from 'react'
import './Podio.css'
import { PODIO } from '../config/podio.js'
import { ordineDiScoperta, quantiScoperti } from '../lib/podio.js'
import { urlAvatar } from '../config/avatar.js'

// La premiazione: i primi tre si scoprono uno alla volta, dal terzo.
//
// ⚠️ Chi sale lo decide `lib/podio.js` e non questo componente, perché
// deve venire uguale su tutti e otto i telefoni. Qui si disegna soltanto.
export default function Podio({ tre, onChiudi }) {
  const [scoperti, setScoperti] = useState(1)

  useEffect(() => {
    if (!tre) return

    const inizio = Date.now()

    // ⚠️ Un intervallo che ricalcola dal tempo trascorso, e non tre
    // `setTimeout` in fila. Sul telefono l'app viene congelata quando
    // passa in secondo piano: con i timer in fila, chi torna dopo dieci
    // secondi si vedrebbe scoprire i posti uno alla volta da lì in poi,
    // come se la premiazione ricominciasse.
    const battito = setInterval(() => {
      setScoperti(quantiScoperti(Date.now() - inizio))
    }, 200)

    const chiusura = setTimeout(onChiudi, PODIO.passo * 2 + PODIO.restaDopo)

    return () => {
      clearInterval(battito)
      clearTimeout(chiusura)
    }
  }, [tre, onChiudi])

  if (!tre) return null

  const ordine = ordineDiScoperta(tre)

  return (
    <div className="podio" role="alert" onClick={onChiudi}>
      <p className="podio-occhiello">{PODIO.occhiello}</p>
      <h2 className="podio-titolo">{PODIO.titolo}</h2>

      <ol className="podio-gradini">
        {ordine.map((chi, i) => (
          <li
            key={chi.id}
            className={`podio-gradino posto-${chi.posto} ${i < scoperti ? 'visibile' : ''}`}
          >
            <span className="podio-medaglia" aria-hidden="true">
              {PODIO.medaglie[chi.posto - 1]}
            </span>
            <img
              className="podio-faccia"
              src={urlAvatar(chi.avatarStyle, chi.avatarSeed)}
              alt=""
              width="72"
              height="72"
            />
            <span className="podio-nome">{chi.nome}</span>
            <span className="podio-punti">{chi.punteggio}</span>
          </li>
        ))}
      </ol>

      {/* Compare per ultima, quando i tre ci sono tutti: prima
          toglierebbe l'attenzione alla premiazione per dare una notizia
          amministrativa. */}
      {scoperti >= 3 && <p className="podio-chiusura">{PODIO.chiusura}</p>}
    </div>
  )
}
