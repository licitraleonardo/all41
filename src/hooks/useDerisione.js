import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Chi si propone punti da solo lo scopre tutto il gruppo, subito e
// dovunque sia. Sta a livello di shell come la celebrazione delle Leggi
// e come il soundboard: il momento va visto mentre succede, non trovato
// dopo scorrendo lo storico.
//
// Ascolta solo gli inserimenti nuovi, quindi riaprendo l'app non
// ricompaiono le figuracce di ieri.
export function useDerisione(attivo, ioId) {
  const [derisione, setDerisione] = useState(null)

  const chiudi = useCallback(() => setDerisione(null), [])

  useEffect(() => {
    if (!attivo) return undefined

    const canale = supabase
      .channel('autoproposte')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'point_events' },
        async ({ new: riga }) => {
          if (riga.rule_id !== 'self-praise') return

          let chi = 'Qualcuno'
          if (riga.member_id) {
            const { data } = await supabase
              .from('members')
              .select('name')
              .eq('id', riga.member_id)
              .maybeSingle()
            if (data?.name) chi = data.name
          }

          setDerisione({
            chi,
            punti: riga.points,
            sonoIo: riga.member_id === ioId,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canale)
    }
  }, [attivo, ioId])

  return { derisione, chiudi }
}
