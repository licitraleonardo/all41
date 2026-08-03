import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiProposteAperte } from '../lib/proposte.js'
import { vota as votaProposta } from '../lib/voti.js'

const CHIAVE_RIMANDATE = 'all41.propostiRimandati'

// "Voto dopo" vive sul dispositivo: la proposta resta aperta per tutti,
// sparisce solo dal banner di chi l'ha rimandata. Sta in localStorage e
// non in memoria, altrimenti tornerebbe a ogni ricaricamento — che è
// esattamente la seccatura che quel bottone deve togliere.
function leggiRimandate() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHIAVE_RIMANDATE) ?? '[]'))
  } catch {
    return new Set()
  }
}

function salvaRimandate(insieme) {
  try {
    localStorage.setItem(CHIAVE_RIMANDATE, JSON.stringify([...insieme]))
  } catch {
    // Safari in navigazione privata può rifiutare: pazienza.
  }
}

export function useProposteAperte(memberId) {
  const [aperte, setAperte] = useState([])
  const [rimandate, setRimandate] = useState(leggiRimandate)

  const ricarica = useCallback(async () => {
    const elenco = await leggiProposteAperte()
    setAperte(elenco)

    // Pulizia: una proposta chiusa non deve restare per sempre
    // nell'elenco dei rimandati.
    setRimandate((precedenti) => {
      const vivi = new Set(elenco.map((p) => p.votoId))
      const puliti = new Set([...precedenti].filter((id) => vivi.has(id)))
      if (puliti.size !== precedenti.size) salvaRimandate(puliti)
      return puliti
    })
  }, [])

  useEffect(() => {
    if (!memberId) return
    let vivo = true

    ricarica().catch(() => {})

    const canale = supabase
      .channel('proposte-aperte')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => vivo && ricarica().catch(() => {})
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [memberId, ricarica])

  const vota = useCallback(
    async (votoId, opzione) => {
      await votaProposta(votoId, memberId, opzione)
      await ricarica()
    },
    [memberId, ricarica]
  )

  const rimanda = useCallback((votoId) => {
    setRimandate((precedenti) => {
      const nuovo = new Set(precedenti).add(votoId)
      salvaRimandate(nuovo)
      return nuovo
    })
  }, [])

  // Nel banner finisce solo quello su cui non hai ancora detto niente.
  const daDecidere = aperte.filter(
    (p) => !p.hannoVotato.includes(memberId) && !rimandate.has(p.votoId)
  )

  return { aperte, daDecidere, rimandate, vota, rimanda, ricarica }
}
