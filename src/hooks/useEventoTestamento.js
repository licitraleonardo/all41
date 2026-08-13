import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { leggiClassifica } from '../lib/punti.js'
import { TESTAMENTO_ARRABBIATO, chiaveVisto } from '../config/eventi.js'

// L'arrabbiatura del Testamento: si prende lo schermo una volta a testa.
//
// ⚠️ L'evento non lo decide l'app: lo trova. Sul database c'è una riga di
// punti per persona con `rule_id = 'testamento-arrabbiato'`, scritta una
// volta sola da `supabase/testamento-arrabbiato.sql`. Qui si guarda solo
// se esiste.
//
// È la stessa ragione per cui il rimescolamento sta in SQL e non qui: se
// i punti nuovi li estraesse ogni telefono, otto persone vedrebbero otto
// classifiche diverse e ognuna sarebbe convinta della sua — senza che
// nessun errore lo dica, perché ogni telefono sarebbe coerente con sé
// stesso.
//
// Il «l'ho già visto» invece sta sul telefono: è una cosa di questo
// schermo, e chi apre l'app dal portatile ha diritto di vederlo lì.
export function useEventoTestamento(attivo) {
  const [evento, setEvento] = useState(null)

  const chiudi = useCallback(() => {
    try {
      window.localStorage.setItem(chiaveVisto(TESTAMENTO_ARRABBIATO.id), 'si')
    } catch {
      // Spazio finito o navigazione privata: si rivedrà. Meglio uno
      // schermo di troppo che un annuncio che non è arrivato.
    }
    setEvento(null)
  }, [])

  useEffect(() => {
    if (!attivo) return undefined

    let gia = false
    try {
      gia = window.localStorage.getItem(chiaveVisto(TESTAMENTO_ARRABBIATO.id)) === 'si'
    } catch {
      gia = false
    }
    if (gia) return undefined

    let vivo = true

    // Una riga sola: serve sapere **se** è successo, non quante volte.
    // Verifica bloccante n.4 dello spec — ogni lettura ha il suo tetto.
    supabase
      .from('point_events')
      .select('id')
      .eq('trip_id', VIAGGIO.id)
      .eq('rule_id', TESTAMENTO_ARRABBIATO.id)
      .limit(1)
      .then(({ data, error }) => {
        if (error || !vivo || !data?.length) return
        return leggiClassifica().then((righe) => {
          if (!vivo) return
          setEvento({ classifica: righe })
        })
      })
      .catch(() => {})

    return () => {
      vivo = false
    }
  }, [attivo])

  return { evento, chiudi }
}
