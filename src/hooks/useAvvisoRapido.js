import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AVVISI_RAPIDI } from '../config/azioni.js'

// Il messaggio rapido che arriva mentre stai guardando un altro tab.
//
// ⚠️ Solo realtime, nessuna lettura all'apertura, ed è voluto: questo
// cartello serve a dire «sta succedendo adesso». All'apertura dell'app
// quello che è successo prima lo si trova in chat, e ripescarlo qui
// vorrebbe dire aprire l'app e trovarsi addosso un «si riparte fra 5
// minuti» di venti minuti fa.
//
// Se cade il socket se ne perde qualcuno: è il prezzo giusto per questa
// cosa qui. Quello che non si può perdere è l'SOS, che infatti ha la sua
// striscia e si riallinea da sola in tre modi diversi.
export function useAvvisoRapido(membroId, attivo) {
  const [azione, setAzione] = useState(null)

  const zittisci = useCallback(() => setAzione(null), [])

  useEffect(() => {
    if (!attivo || !membroId) return undefined

    const canale = supabase
      .channel('avvisi-rapidi')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quick_actions' },
        ({ new: riga }) => {
          if (!AVVISI_RAPIDI.tipi.includes(riga?.kind)) return
          if (riga.author_id === membroId) return
          setAzione({
            id: riga.id,
            autoreId: riga.author_id,
            tipo: riga.kind,
            payload: riga.payload ?? {},
            eliminato: Boolean(riga.deleted_at),
            creatoIl: riga.created_at,
          })
        }
      )
      // Ritirato entro i cinque minuti: il cartello se ne va con lui,
      // invece di restare a chiamare a una riunione annullata.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quick_actions' },
        ({ new: riga }) => {
          if (!riga?.deleted_at) return
          setAzione((precedente) => (precedente?.id === riga.id ? null : precedente))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(canale)
  }, [attivo, membroId])

  // Si ritira da solo quando scade la freschezza, senza aspettare che
  // qualcuno lo tocchi: chi ha il telefono in tasca non lo chiude, e
  // riaccendendo lo schermo si troverebbe un cartello scaduto.
  useEffect(() => {
    if (!azione) return undefined
    const restano =
      AVVISI_RAPIDI.minutiFreschi * 60000 - (Date.now() - Date.parse(azione.creatoIl))
    if (!Number.isFinite(restano)) return undefined
    const t = setTimeout(() => setAzione(null), Math.max(0, restano))
    return () => clearTimeout(t)
  }, [azione])

  return { azione, zittisci }
}
