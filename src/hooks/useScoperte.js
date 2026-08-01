import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { PER_ID } from '../config/leggi.js'

// Sta a livello di shell come il soundboard: una Legge scoperta si
// celebra su tutti i telefoni, qualunque tab sia aperta.
export function useScoperte(attivo) {
  const [celebrazione, setCelebrazione] = useState(null)

  const chiudi = useCallback(() => setCelebrazione(null), [])

  useEffect(() => {
    if (!attivo) return

    const canale = supabase
      .channel('scoperte')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leggi' },
        async ({ new: riga }) => {
          const legge = PER_ID[riga.legge_id]
          if (!legge) return

          let chi = 'Qualcuno'
          if (riga.discovered_by) {
            const { data } = await supabase
              .from('members')
              .select('name')
              .eq('id', riga.discovered_by)
              .maybeSingle()
            if (data?.name) chi = data.name
          }

          setCelebrazione({ legge, chi })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canale)
    }
  }, [attivo])

  return { celebrazione, chiudi }
}
