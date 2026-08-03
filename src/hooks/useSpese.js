import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  aggiungiRimborso,
  aggiungiSpesa,
  eliminaRimborso,
  eliminaSpesa,
  leggiRimborsi,
  leggiSpese,
} from '../lib/spese.js'
import { leggiMembri } from '../lib/membri.js'
import { calcolaSaldi, chiDeveAChi } from '../lib/saldi.js'
import { descriviErrore } from '../lib/errori.js'

export function useSpese() {
  const [spese, setSpese] = useState([])
  const [rimborsi, setRimborsi] = useState([])
  const [membri, setMembri] = useState([])
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const ricarica = useCallback(async () => {
    const [s, r, m] = await Promise.all([leggiSpese(), leggiRimborsi(), leggiMembri()])
    setSpese(s)
    setRimborsi(r)
    setMembri(m)
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

    // Chi paga il ristorante la registra al tavolo: sugli altri telefoni
    // deve comparire senza ricaricare. Si rilegge tutto invece di
    // aggiornare a pezzi, perché i saldi dipendono da ogni riga.
    const canale = supabase
      .channel('spese')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  const membriPerId = useMemo(
    () => Object.fromEntries(membri.map((m) => [m.id, m])),
    [membri]
  )

  const saldi = useMemo(
    () => calcolaSaldi(spese, rimborsi, membri.map((m) => m.id)),
    [spese, rimborsi, membri]
  )

  const passaggi = useMemo(() => chiDeveAChi(saldi), [saldi])

  const registra = useCallback(
    async (spesa) => {
      const nuova = await aggiungiSpesa(spesa)
      setSpese((precedenti) =>
        precedenti.some((s) => s.id === nuova.id) ? precedenti : [nuova, ...precedenti]
      )
    },
    []
  )

  const registraRimborso = useCallback(async (rimborso) => {
    const nuovo = await aggiungiRimborso(rimborso)
    setRimborsi((precedenti) =>
      precedenti.some((r) => r.id === nuovo.id) ? precedenti : [nuovo, ...precedenti]
    )
  }, [])

  const togliSpesa = useCallback(async (id) => {
    await eliminaSpesa(id)
    setSpese((precedenti) => precedenti.filter((s) => s.id !== id))
  }, [])

  const togliRimborso = useCallback(async (id) => {
    await eliminaRimborso(id)
    setRimborsi((precedenti) => precedenti.filter((r) => r.id !== id))
  }, [])

  // Nei conti entrano anche le righe eliminate — calcolaSaldi le salta da
  // sé — ma a schermo no.
  const speseVive = useMemo(() => spese.filter((s) => !s.eliminata), [spese])
  const rimborsiVivi = useMemo(() => rimborsi.filter((r) => !r.eliminato), [rimborsi])

  return {
    spese: speseVive,
    rimborsi: rimborsiVivi,
    membri,
    membriPerId,
    saldi,
    passaggi,
    stato,
    errore,
    registra,
    registraRimborso,
    togliSpesa,
    togliRimborso,
  }
}
