import { useEffect, useState } from 'react'
import { classificaChiusa } from '../lib/classificaChiusa.js'
import { leggiClassifica } from '../lib/punti.js'
import { primiTre } from '../lib/podio.js'

const CHIAVE = 'all41.podioVisto'

// La premiazione parte una volta sola per telefono, quando la classifica
// è chiusa.
//
// ⚠️ Il segno si scrive **quando la festa parte**, non quando finisce.
// Chi chiude l'app a metà premiazione non deve ritrovarsela addosso alla
// prossima apertura: l'ha già vista, e una cosa che torna dopo che l'hai
// chiusa smette di essere una festa e diventa un cartello.
export function usePodio() {
  const [tre, setTre] = useState(null)

  useEffect(() => {
    let vivo = true

    async function guarda() {
      try {
        if (localStorage.getItem(CHIAVE)) return
      } catch {
        // Safari in navigazione privata: si tira dritto, al massimo la
        // festa si rivede.
      }

      // ⚠️ `.fresca()` e non la copia: decide se fare partire una cosa
      // che si vede una volta sola. Con una copia vecchia potrebbe
      // partire prima della chiusura, o coi punteggi di ieri — cioè
      // premiare la persona sbagliata, una volta sola e per sempre.
      const chiusa = await classificaChiusa.fresca().catch(() => false)
      if (!chiusa || !vivo) return

      const gente = await leggiClassifica.fresca().catch(() => null)
      const podio = primiTre(gente)
      if (!podio || !vivo) return

      try {
        localStorage.setItem(CHIAVE, new Date().toISOString())
      } catch {
        // vedi sopra
      }
      setTre(podio)
    }

    guarda()
    return () => {
      vivo = false
    }
  }, [])

  return { tre, chiudi: () => setTre(null) }
}
