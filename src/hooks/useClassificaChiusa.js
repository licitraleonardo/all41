import { useEffect, useState } from 'react'
import { classificaChiusa } from '../lib/classificaChiusa.js'

// La classifica è chiusa? Lo chiede al database una volta, all'apertura.
//
// ⚠️ Sta in un hook e non in una catena di proprietà passate da App a
// Gioco ad Allbo a Classifica: la risposta serve in un posto solo, e
// tre livelli di prop per un booleano sono tre posti dove dimenticarselo.
//
// ⚠️ Parte da «aperta», e il verso è scelto. Sbagliando così si mostra un
// tasto in più, e chi lo preme si sente rispondere di no dal database, con
// la sua frase. Sbagliando al contrario si direbbe a tutti che il gioco è
// finito perché una lettura è andata storta.
export function useClassificaChiusa() {
  const [chiusa, setChiusa] = useState(false)

  useEffect(() => {
    let vivo = true
    classificaChiusa()
      .then((v) => {
        if (vivo) setChiusa(v === true)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  return chiusa
}
