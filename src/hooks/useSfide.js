import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiPartecipazioni, leggiSfideVinte } from '../lib/sfide.js'
import { leggiMembri } from '../lib/membri.js'
import { SFIDE, sfideDaMostrare } from '../config/sfide.js'

export function useSfide() {
  const [vinte, setVinte] = useState({})
  const [partecipazioni, setPartecipazioni] = useState({})
  const [membri, setMembri] = useState({})

  const ricarica = useCallback(async () => {
    const [v, elenco] = await Promise.all([leggiSfideVinte(), leggiMembri()])
    setVinte(v)
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
    setPartecipazioni(await leggiPartecipazioni(SFIDE.map((s) => s.id)))
  }, [])

  useEffect(() => {
    let vivo = true
    ricarica().catch(() => {})

    // Una sfida vinta da un altro telefono si vede subito, e le foto
    // mandate in gara pure.
    const canale = supabase
      .channel('sfide')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () =>
        vivo && ricarica().catch(() => {})
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, () =>
        vivo && ricarica().catch(() => {})
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  const { diOggi, conquistate } = useMemo(() => sfideDaMostrare(vinte), [vinte])
  const membriIds = useMemo(() => Object.keys(membri), [membri])

  return { vinte, partecipazioni, membri, membriIds, diOggi, conquistate, ricarica }
}
