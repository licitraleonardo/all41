import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  cambiaVisibilita,
  eliminaDocumento,
  leggiDocumenti,
} from '../lib/documenti.js'
import { leggiMembri } from '../lib/membri.js'
import { descriviErrore } from '../lib/errori.js'

export function useDocumenti(ioId) {
  const [tutti, setTutti] = useState([])
  const [membri, setMembri] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const ricarica = useCallback(async () => {
    const [elenco, gente] = await Promise.all([leggiDocumenti(), leggiMembri()])
    setTutti(elenco)
    setMembri(Object.fromEntries(gente.map((m) => [m.id, m])))
  }, [])

  useEffect(() => {
    let vivo = true

    ricarica()
      .then(() => vivo && setStato('pronto'))
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    // Chi carica il biglietto della barca lo vede comparire sugli altri
    // telefoni: è tutto il senso di metterlo qui invece che in chat.
    const canale = supabase
      .channel('documenti')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  // Il "solo per me" è un filtro, non una serratura: toglie il documento
  // dalla vista degli altri e basta.
  const visibili = useMemo(
    () => tutti.filter((d) => !d.soloPerMe || d.proprietarioId === ioId),
    [tutti, ioId]
  )

  const inserisci = useCallback((documento) => {
    setTutti((precedenti) =>
      precedenti.some((d) => d.id === documento.id)
        ? precedenti
        : [documento, ...precedenti]
    )
  }, [])

  const togli = useCallback(async (id) => {
    setTutti((precedenti) => precedenti.filter((d) => d.id !== id))
    try {
      await eliminaDocumento(id)
    } catch (e) {
      await ricarica().catch(() => {})
      throw e
    }
  }, [ricarica])

  const commutaVisibilita = useCallback(async (documento) => {
    const aggiornato = await cambiaVisibilita(documento.id, !documento.soloPerMe)
    setTutti((precedenti) =>
      precedenti.map((d) => (d.id === aggiornato.id ? aggiornato : d))
    )
  }, [])

  return { documenti: visibili, membri, stato, errore, inserisci, togli, commutaVisibilita }
}
