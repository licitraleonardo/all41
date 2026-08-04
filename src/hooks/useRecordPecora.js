import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiRecordPecora, segnaPunteggio } from '../lib/recordPecora.js'
import { leggiMembri } from '../lib/membri.js'
import {
  classificaDelGiorno,
  recordDelGiorno,
  recordDelViaggio,
  tuoRecord,
} from '../lib/classificaPecora.js'
import { dataDiOggi } from '../lib/giorni.js'

// I record di tutti. Senza membroId — la schermata senza rete, dove non
// si sa nemmeno chi sei — non tocca il database e il gioco funziona
// lo stesso: è tutto locale, ed è il senso di averlo messo lì.
export function useRecordPecora(membroId) {
  const [righe, setRighe] = useState([])
  const [membri, setMembri] = useState({})
  const [pronto, setPronto] = useState(false)
  const oggi = dataDiOggi()

  const ricarica = useCallback(async () => {
    const [elenco, gente] = await Promise.all([leggiRecordPecora(), leggiMembri()])
    setRighe(elenco)
    setMembri(Object.fromEntries(gente.map((m) => [m.id, m])))
  }, [])

  useEffect(() => {
    if (!membroId) return undefined
    let vivo = true

    ricarica()
      .then(() => vivo && setPronto(true))
      .catch(() => {})

    // Chi batte il record lo vede comparire sugli altri telefoni mentre
    // sono ancora in spiaggia.
    const canale = supabase
      .channel('pecora-record')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sheep_records' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [membroId, ricarica])

  // Senza rete la partita non si perde: si tiene da parte e riparte al
  // primo momento buono, come gli upload delle foto.
  const segna = useCallback(
    async (punti) => {
      if (!membroId || punti <= 0) return
      try {
        await segnaPunteggio(membroId, punti, oggi)
        await ricarica()
      } catch {
        // Il punteggio resta nell'elenco locale finché non torna la rete.
      }
    },
    [membroId, oggi, ricarica]
  )

  const classifica = useMemo(() => classificaDelGiorno(righe, oggi), [righe, oggi])
  const delGiorno = useMemo(() => recordDelGiorno(righe, oggi), [righe, oggi])
  const delViaggio = useMemo(() => recordDelViaggio(righe), [righe])
  const mio = useMemo(() => tuoRecord(righe, membroId, oggi), [righe, membroId, oggi])

  return { righe, membri, classifica, delGiorno, delViaggio, mio, pronto, segna }
}
