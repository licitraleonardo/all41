import { useEffect } from 'react'
import './Derisione.css'

// Piccolo, in cima, e se ne va da solo: è una figuraccia, non un
// annuncio di servizio. Compare su tutti i telefoni, perché il punto è
// esattamente quello.
export default function Derisione({ derisione, onChiudi }) {
  useEffect(() => {
    if (!derisione) return undefined
    const timer = setTimeout(onChiudi, 5000)
    return () => clearTimeout(timer)
  }, [derisione, onChiudi])

  if (!derisione) return null

  return (
    <button type="button" className="derisione" onClick={onChiudi} role="status">
      <span className="derisione-punti">{derisione.punti}</span>
      <span className="derisione-testo">
        {derisione.sonoIo ? (
          <>
            Ti sei proposto punti da solo.
            <span className="derisione-sotto">Lo sanno tutti.</span>
          </>
        ) : (
          <>
            <strong>{derisione.chi}</strong> si è proposto punti da solo.
            <span className="derisione-sotto">Il Testamento se n&rsquo;è accorto.</span>
          </>
        )}
      </span>
    </button>
  )
}
