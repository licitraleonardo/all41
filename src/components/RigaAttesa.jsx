import { useEffect, useState } from 'react'
import { frasiAttesa } from '../lib/attesa.js'

const UN_MINUTO = 60000

// Componente a sé, e non una riga dentro Itinerario, perché batte ogni
// minuto: così si ridisegna solo questa riga invece delle cinque schede.
export default function RigaAttesa() {
  const [frasi, setFrasi] = useState(frasiAttesa)

  useEffect(() => {
    function aggiorna() {
      setFrasi((precedenti) => {
        const nuove = frasiAttesa()
        if (!nuove || !precedenti) return nuove
        // Stesso testo, stesso oggetto: niente ridisegno inutile.
        return nuove.conteggio === precedenti.conteggio &&
          nuove.commento === precedenti.commento
          ? precedenti
          : nuove
      })
    }

    // L'intervallo viene strozzato a scheda nascosta, e sul telefono l'app
    // viene proprio congelata: al rientro si ricalcola comunque.
    const timer = setInterval(aggiorna, UN_MINUTO)

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

  if (!frasi) return null

  return (
    <p className="attesa">
      <span className="attesa-conteggio">{frasi.conteggio}</span>
      <span className="attesa-commento">{frasi.commento}</span>
    </p>
  )
}
