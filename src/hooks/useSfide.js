import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  assicuraVotoSfida,
  leggiPartecipazioni,
  leggiSfideVinte,
  leggiVotiSfide,
  risolviSfideSenzaVoto,
  risolviVotiSfide,
} from '../lib/sfide.js'
import { leggiMembri } from '../lib/membri.js'
import { vota as votaSulDatabase } from '../lib/voti.js'
import { SFIDE, sfideDaMostrare } from '../config/sfide.js'

export function useSfide(memberId) {
  const [vinte, setVinte] = useState({})
  const [partecipazioni, setPartecipazioni] = useState({})
  const [voti, setVoti] = useState({})
  const [membri, setMembri] = useState({})

  const ricarica = useCallback(async () => {
    const [v, elenco, p, vt] = await Promise.all([
      leggiSfideVinte(),
      leggiMembri(),
      leggiPartecipazioni(SFIDE.map((s) => s.id)),
      leggiVotiSfide(),
    ])
    setVinte(v)
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
    setPartecipazioni(p)
    setVoti(vt)
    return { vinte: v, partecipazioni: p }
  }, [])

  // Risoluzione all'apertura, come per i sondaggi: le giornate passate si
  // chiudono da sole al primo che apre l'app, altrimenti una sfida del 13
  // resterebbe appesa per sempre.
  useEffect(() => {
    if (!memberId) return
    let vivo = true

    ricarica()
      .then(async ({ vinte: v, partecipazioni: p }) => {
        await risolviVotiSfide(p).catch(() => {})
        await risolviSfideSenzaVoto(p, v).catch(() => {})
        if (vivo) await ricarica()
      })
      .catch(() => {})

    const canale = supabase
      .channel('sfide')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [memberId, ricarica])

  // Dopo un caricamento in gara: con due o più foto il voto si apre da
  // solo, e quelle che arrivano dopo si accodano a quello già aperto.
  const aggiornaGara = useCallback(
    async (sfidaId) => {
      const p = await leggiPartecipazioni([sfidaId])
      const foto = p[sfidaId] ?? []
      if (foto.length >= 2) {
        await assicuraVotoSfida(
          sfidaId,
          foto.map((f) => f.id),
          memberId
        ).catch(() => {})
      }
      await ricarica()
    },
    [memberId, ricarica]
  )

  const vota = useCallback(
    async (votoId, opzione) => {
      await votaSulDatabase(votoId, memberId, opzione)
      await ricarica()
    },
    [memberId, ricarica]
  )

  const { diOggi, aperte, conquistate } = useMemo(() => sfideDaMostrare(vinte), [vinte])
  const membriIds = useMemo(() => Object.keys(membri), [membri])

  return {
    vinte,
    partecipazioni,
    voti,
    membri,
    membriIds,
    diOggi,
    aperte,
    conquistate,
    ricarica,
    aggiornaGara,
    vota,
  }
}
