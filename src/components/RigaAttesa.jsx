import { useEffect, useState } from 'react'
import { frasiAttesa } from '../lib/attesa.js'

const UN_SECONDO = 1000
const UN_MINUTO = 60000

// Componente a sé, e non una riga dentro Itinerario, perché batte ogni
// secondo: così si ridisegna solo questa riga invece delle cinque schede.
export default function RigaAttesa() {
  const [frasi, setFrasi] = useState(frasiAttesa)

  const staContando = frasi?.tipo === 'conto'

  useEffect(() => {
    function aggiorna() {
      setFrasi((precedenti) => {
        const nuove = frasiAttesa()
        if (!nuove || !precedenti) return nuove
        // Stesso testo, stesso oggetto: niente ridisegno inutile.
        return nuove.orologio === precedenti.orologio &&
          nuove.commento === precedenti.commento &&
          nuove.testo === precedenti.testo
          ? precedenti
          : nuove
      })
    }

    // Al secondo solo mentre il cronometro scorre. Finito il conto basta
    // un battito lento per accorgersi del cambio di fase.
    const timer = setInterval(aggiorna, staContando ? UN_SECONDO : UN_MINUTO)

    // L'intervallo viene strozzato a scheda nascosta, e sul telefono l'app
    // viene proprio congelata: al rientro si ricalcola comunque.
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
  }, [staContando])

  if (!frasi) return null

  return (
    <div className="attesa">
      {frasi.tipo === 'conto' ? (
        <>
          <span className="attesa-etichetta">{frasi.etichetta}</span>
          <time className="attesa-orologio">{frasi.orologio}</time>
        </>
      ) : (
        <span className="attesa-chiuso">{frasi.testo}</span>
      )}
      <span className="attesa-commento">{frasi.commento}</span>
    </div>
  )
}
