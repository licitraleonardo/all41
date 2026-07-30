import { useEffect, useState } from 'react'
import { dataDiOggi } from '../lib/giorni.js'

// La data del dispositivo non è un valore fisso letto all'apertura: l'app
// può restare aperta oltre la mezzanotte, e sul telefono viene congelata e
// ripresa il giorno dopo invece che ricaricata. Senza questo, il 14 agosto
// la riga "oggi" resterebbe sul 13.
export function useDataDiOggi() {
  const [data, setData] = useState(dataDiOggi)

  useEffect(() => {
    let timer

    function ricalcola() {
      // Si aggiorna solo se la data è davvero cambiata, così un rientro
      // nell'app non ridisegna niente per niente.
      setData((precedente) => {
        const adesso = dataDiOggi()
        return precedente === adesso ? precedente : adesso
      })
      programmaMezzanotte()
    }

    // Per chi la lascia aperta e visibile, dove nessun evento scatterebbe.
    // Cinque secondi dopo la mezzanotte, per non arrivare un istante prima.
    function programmaMezzanotte() {
      clearTimeout(timer)
      const ora = new Date()
      const domani = new Date(ora.getFullYear(), ora.getMonth(), ora.getDate() + 1, 0, 0, 5)
      timer = setTimeout(ricalcola, Math.min(domani - ora, 2 ** 31 - 1))
    }

    function alRitorno() {
      if (document.visibilityState === 'visible') ricalcola()
    }

    programmaMezzanotte()
    document.addEventListener('visibilitychange', alRitorno)
    window.addEventListener('focus', ricalcola)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', alRitorno)
      window.removeEventListener('focus', ricalcola)
    }
  }, [])

  return data
}
