import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { eliminaVocale, leggiVocali, TETTO_VOCALI } from '../lib/vocali.js'
import { leggiMembri } from '../lib/membri.js'
import { descriviErrore } from '../lib/errori.js'

export function useVocali() {
  const [vocali, setVocali] = useState([])
  const [membri, setMembri] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const inserisci = useCallback((vocale) => {
    setVocali((precedenti) =>
      precedenti.some((v) => v.id === vocale.id)
        ? precedenti
        : [vocale, ...precedenti].slice(0, TETTO_VOCALI)
    )
  }, [])

  const ricaricaMembri = useCallback(async () => {
    const elenco = await leggiMembri()
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
  }, [])

  useEffect(() => {
    let vivo = true

    Promise.all([leggiVocali(), ricaricaMembri()])
      .then(([elenco]) => {
        if (!vivo) return
        setVocali(elenco)
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    // Un walkie-talkie che consegna fra due minuti non serve a niente.
    const canale = supabase
      .channel('vocali')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_messages' },
        ({ new: riga }) =>
          inserisci({
            id: riga.id,
            autoreId: riga.author_id,
            url: riga.url,
            percorso: riga.path,
            tipo: riga.mime_type,
            durata: riga.durata_sec,
            importante: Boolean(riga.importante),
            eliminato: false,
            creatoIl: riga.created_at,
          })
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [inserisci, ricaricaMembri])

  const togli = useCallback(async (id) => {
    setVocali((precedenti) => precedenti.filter((v) => v.id !== id))
    await eliminaVocale(id).catch(() => {})
  }, [])

  return { vocali, membri, stato, errore, inserisci, togli }
}
