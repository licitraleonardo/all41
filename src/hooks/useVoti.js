import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiVoti, vota as votaSulDatabase } from '../lib/voti.js'

export function useVoti(azioni) {
  const [voti, setVoti] = useState({})
  const richiesti = useRef(new Set())

  const ids = useMemo(
    () =>
      azioni
        .filter((a) => a.tipo === 'poll' && a.payload?.voteId)
        .map((a) => a.payload.voteId),
    [azioni]
  )

  const aggiorna = useCallback((voto) => {
    setVoti((precedenti) => ({ ...precedenti, [voto.id]: voto }))
  }, [])

  // Carica solo quelli non ancora chiesti: il feed cambia a ogni messaggio,
  // e senza questo si rileggerebbero tutti ogni volta.
  useEffect(() => {
    const mancanti = ids.filter((id) => !richiesti.current.has(id))
    if (mancanti.length === 0) return

    mancanti.forEach((id) => richiesti.current.add(id))
    leggiVoti(mancanti)
      .then((elenco) =>
        setVoti((precedenti) => ({
          ...precedenti,
          ...Object.fromEntries(elenco.map((v) => [v.id, v])),
        }))
      )
      .catch(() => mancanti.forEach((id) => richiesti.current.delete(id)))
  }, [ids])

  useEffect(() => {
    const canale = supabase
      .channel('voti')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes' },
        ({ new: riga }) =>
          aggiorna({
            id: riga.id,
            categoria: riga.category,
            domanda: riga.question,
            opzioni: riga.options,
            anonimo: riga.anonymous,
            conteggi: riga.tally,
            hannoVotato: riga.voted ?? [],
            schede: riga.ballots ?? {},
            scadeIl: riga.expires_at,
            chiusoIl: riga.closed_at,
          })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canale)
    }
  }, [aggiorna])

  const vota = useCallback(
    async (votoId, memberId, opzione) => {
      const aggiornato = await votaSulDatabase(votoId, memberId, opzione)
      aggiorna(aggiornato)
    },
    [aggiorna]
  )

  return { voti, vota, aggiorna }
}
