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
import { accoda, leggiCoda, salvaCoda, togli } from '../lib/codaPecora.js'

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

  // Consegna quello che è rimasto indietro. Si chiama all'avvio e al
  // ritorno della rete: senza, la coda sarebbe solo un posto dove i
  // punteggi vanno a morire ordinatamente.
  const svuotaCoda = useCallback(async () => {
    const coda = leggiCoda()
    if (coda.length === 0) return

    const consegnate = []
    for (const voce of coda) {
      try {
        await segnaPunteggio(voce.membroId, voce.punti, voce.giorno)
        consegnate.push(voce)
      } catch {
        // Ancora niente rete: si riprova al prossimo giro, e le voci
        // rimaste restano in coda.
        break
      }
    }

    if (consegnate.length > 0) {
      salvaCoda(togli(leggiCoda(), consegnate))
      await ricarica().catch(() => {})
    }
  }, [ricarica])

  // Senza rete la partita non si perde: si tiene da parte e riparte al
  // primo momento buono, come gli upload delle foto.
  const segna = useCallback(
    async (punti) => {
      if (!membroId || punti <= 0) return
      try {
        await segnaPunteggio(membroId, punti, oggi)
        await ricarica()
        // Se questa è passata, è tornata la rete: si prova a consegnare
        // anche quelle di prima.
        await svuotaCoda()
      } catch {
        // Adesso l'elenco locale esiste per davvero.
        salvaCoda(accoda(leggiCoda(), { membroId, giorno: oggi, punti }))
      }
    },
    [membroId, oggi, ricarica, svuotaCoda]
  )

  // All'avvio e ogni volta che il browser dice che la rete è tornata.
  useEffect(() => {
    if (!membroId) return undefined
    svuotaCoda().catch(() => {})

    const alRitorno = () => svuotaCoda().catch(() => {})
    window.addEventListener('online', alRitorno)
    return () => window.removeEventListener('online', alRitorno)
  }, [membroId, svuotaCoda])

  const classifica = useMemo(() => classificaDelGiorno(righe, oggi), [righe, oggi])
  const delGiorno = useMemo(() => recordDelGiorno(righe, oggi), [righe, oggi])
  const delViaggio = useMemo(() => recordDelViaggio(righe), [righe])
  const mio = useMemo(() => tuoRecord(righe, membroId, oggi), [righe, membroId, oggi])

  return { righe, membri, classifica, delGiorno, delViaggio, mio, pronto, segna }
}
