import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiClassifica, leggiEventi, leggiScoperte } from '../lib/punti.js'
import { descriviErrore } from '../lib/errori.js'

export function useGioco() {
  const [classifica, setClassifica] = useState([])
  const [eventi, setEventi] = useState([])
  const [scoperte, setScoperte] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const ricarica = useCallback(async () => {
    const [c, e, s] = await Promise.all([leggiClassifica(), leggiEventi(), leggiScoperte()])
    setClassifica(c)
    setEventi(e)
    setScoperte(s)
  }, [])

  useEffect(() => {
    let vivo = true

    ricarica()
      .then(() => vivo && setStato('pronto'))
      .catch((err) => {
        if (!vivo) return
        setErrore(descriviErrore(err))
        setStato('guasto')
      })

    // La classifica si muove sotto gli occhi di tutti: un punto assegnato
    // da un telefono si vede sugli altri senza ricaricare. Si ricarica
    // tutto invece di aggiornare a pezzi perché punteggio, storico e
    // Leggi cambiano insieme e devono restare d'accordo.
    const canale = supabase
      .channel('gioco')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'point_events' }, () =>
        ricarica().catch(() => {})
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leggi' }, () =>
        ricarica().catch(() => {})
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  return { classifica, eventi, scoperte, stato, errore, ricarica }
}
