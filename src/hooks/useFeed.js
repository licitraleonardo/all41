import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiFeed, TETTO_FEED } from '../lib/azioni.js'
import { leggiMembri } from '../lib/membri.js'
import { descriviErrore } from '../lib/errori.js'

export function useFeed() {
  const [azioni, setAzioni] = useState([])
  const [membri, setMembri] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)
  const autoriIgnoti = useRef(false)

  // Aggiunge in cima senza duplicare: la stessa azione arriva due volte,
  // una dalla risposta dell'invio e una dal realtime.
  const inserisci = useCallback((azione) => {
    setAzioni((precedenti) => {
      if (precedenti.some((a) => a.id === azione.id)) return precedenti
      return [azione, ...precedenti].slice(0, TETTO_FEED)
    })
  }, [])

  const sostituisci = useCallback((azione) => {
    setAzioni((precedenti) =>
      precedenti.map((a) => (a.id === azione.id ? { ...a, ...azione } : a))
    )
  }, [])

  const ricaricaMembri = useCallback(async () => {
    const elenco = await leggiMembri()
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
    return elenco
  }, [])

  useEffect(() => {
    let vivo = true

    Promise.all([leggiFeed(), ricaricaMembri()])
      .then(([feed]) => {
        if (!vivo) return
        setAzioni(feed)
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    const canale = supabase
      .channel('feed-quick-actions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quick_actions' },
        ({ new: riga }) => inserisci(normalizza(riga))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quick_actions' },
        ({ new: riga }) => sostituisci(normalizza(riga))
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [inserisci, sostituisci, ricaricaMembri])

  // Se compare un autore che non conosciamo è entrato qualcuno di nuovo:
  // si rileggono i membri una volta sola, non a ogni messaggio.
  useEffect(() => {
    const mancante = azioni.some((a) => !membri[a.autoreId])
    if (!mancante || autoriIgnoti.current) return
    autoriIgnoti.current = true
    ricaricaMembri()
      .catch(() => {})
      .finally(() => {
        autoriIgnoti.current = false
      })
  }, [azioni, membri, ricaricaMembri])

  return { azioni, membri, stato, errore, inserisci, sostituisci }
}

// Il realtime consegna la riga grezza del database, non quella già
// tradotta da lib/azioni.
function normalizza(riga) {
  return {
    id: riga.id,
    autoreId: riga.author_id,
    tipo: riga.kind,
    payload: riga.payload ?? {},
    importante: Boolean(riga.importante),
    eliminato: Boolean(riga.deleted_at),
    creatoIl: riga.created_at,
  }
}
