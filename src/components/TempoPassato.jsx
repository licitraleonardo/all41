import { useEffect, useState } from 'react'
import { TORNATI } from '../config/prossimoViaggio.js'
import { scomponi, inParole } from '../lib/tempoPassato.js'

const UN_MINUTO = 60000

function adesso() {
  return inParole(scomponi(Date.now() - new Date(TORNATI.fine).getTime()))
}

// Componente a sé, come `RigaAttesa`, e per lo stesso motivo: batte da
// solo, quindi si ridisegna questa riga e non tutto l'itinerario sotto.
export default function TempoPassato() {
  const [parole, setParole] = useState(adesso)

  useEffect(() => {
    function aggiorna() {
      setParole((prima) => {
        const dopo = adesso()
        // Stesso testo, stesso oggetto: niente ridisegno inutile.
        if (!dopo || !prima) return dopo
        return dopo.elenco === prima.elenco && dopo.verbo === prima.verbo ? prima : dopo
      })
    }

    // Al minuto: il pezzo più piccolo che si vede sono i minuti, e
    // battere al secondo vorrebbe dire 59 ridisegni per niente.
    const timer = setInterval(aggiorna, UN_MINUTO)

    // ⚠️ Sul telefono l'app viene congelata quando è in secondo piano, e
    // l'intervallo non scatta: senza questi due, chi riapre l'app dopo
    // mezza giornata legge il tempo di quando l'aveva chiusa. Lo stesso
    // rimedio che ha già `RigaAttesa`.
    function alRitorno() {
      if (document.visibilityState === 'visible') aggiorna()
    }
    document.addEventListener('visibilitychange', alRitorno)
    window.addEventListener('focus', aggiorna)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', alRitorno)
      window.removeEventListener('focus', aggiorna)
    }
  }, [])

  // Prima della fine del viaggio non c'è niente da dire, e si tace invece
  // di mostrare una riga vuota.
  if (!parole) return null

  return (
    <p className="tempo-passato">
      {parole.elenco ? (
        <>
          {TORNATI.prima} {parole.verbo} {TORNATI.rinforzo}{' '}
          <strong>{parole.elenco}</strong> {TORNATI.dopo}
        </>
      ) : (
        TORNATI.appena
      )}
    </p>
  )
}
