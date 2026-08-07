import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  abbandonaPartita,
  creaPartita,
  daRiga,
  giocaMossa,
  leggiPartite,
} from '../lib/partiteDama.js'
import { descriviErrore } from '../lib/errori.js'

// Le partite di Dama, tenute aggiornate in tempo reale: la mossa fatta
// su un telefono deve comparire sull'altro senza ricaricare, o il gioco
// diventa "aspetta che tiro giù".
export function useDama(membroId) {
  const [partite, setPartite] = useState([])
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)
  const vivo = useRef(true)

  const ricarica = useCallback(async () => {
    const elenco = await leggiPartite()
    if (vivo.current) setPartite(elenco)
  }, [])

  useEffect(() => {
    if (!membroId) return undefined
    vivo.current = true

    ricarica()
      .then(() => vivo.current && setStato('pronto'))
      .catch((e) => {
        if (!vivo.current) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    const canale = supabase
      .channel('dama')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dama_games' },
        ({ new: riga }) => {
          const nuova = daRiga(riga)
          if (!nuova) return
          setPartite((precedenti) => {
            const senza = precedenti.filter((p) => p.id !== nuova.id)
            // In testa le più recenti, come dalla query.
            return [nuova, ...senza].sort(
              (a, b) => Date.parse(b.creataIl) - Date.parse(a.creataIl)
            )
          })
        }
      )
      .subscribe()

    return () => {
      vivo.current = false
      supabase.removeChannel(canale)
    }
  }, [membroId, ricarica])

  const sfida = useCallback(
    async (avversarioId, comeNero = false) => {
      const nuova = comeNero
        ? await creaPartita(avversarioId, membroId)
        : await creaPartita(membroId, avversarioId)
      setPartite((precedenti) => [nuova, ...precedenti.filter((p) => p.id !== nuova.id)])
      return nuova
    },
    [membroId]
  )

  const muovi = useCallback(
    async (partita, testoMossa) => {
      try {
        const aggiornata = await giocaMossa(partita.id, membroId, testoMossa, partita.mosse.length)
        setPartite((precedenti) => precedenti.map((p) => (p.id === aggiornata.id ? aggiornata : p)))
        return aggiornata
      } catch (e) {
        // La mossa rifiutata perché è arrivata prima quella dell'altro
        // non è un guasto: si ricarica e si vede la scacchiera vera.
        await ricarica().catch(() => {})
        throw e
      }
    },
    [membroId, ricarica]
  )

  const abbandona = useCallback(
    async (partitaId) => {
      const chiusa = await abbandonaPartita(partitaId, membroId)
      setPartite((precedenti) => precedenti.map((p) => (p.id === chiusa.id ? chiusa : p)))
      return chiusa
    },
    [membroId]
  )

  return { partite, stato, errore, sfida, muovi, abbandona, ricarica }
}
