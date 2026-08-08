import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiProposteAperte, risolviProposte } from '../lib/proposte.js'
import { leggiMembri } from '../lib/membri.js'
import { vota as votaProposta } from '../lib/voti.js'
import { faiScattareLegge } from '../lib/punti.js'
import { finestraSuspense } from '../lib/punteggioProposte.js'

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
      // La scadenza si legge prima di votare: dopo, la proposta può
      // essersi già chiusa e sparire dall'elenco.
      const proposta = aperte.find((p) => p.votoId === votoId)
      await votaProposta(votoId, memberId, opzione)

      // Chi vota nell'ultimo minuto si prende il Trofeo: aspettare fino
      // all'ultimo è una scelta, e va premiata invece che scoraggiata.
      if (proposta && finestraSuspense(proposta.scadeIl)) {
        faiScattareLegge('suspense', memberId, `suspense_${votoId}_${memberId}`).catch(() => {})
      }

      // Il tuo voto può essere quello che chiude la proposta: se non si
      // risolve adesso, i punti restano "in attesa" finché qualcuno non
      // riavvia l'app. Con otto persone che votano a cena e nessuno che
      // chiude e riapre, la classifica resta ferma per ore proprio nel
      // momento in cui la stanno guardando tutti.
      //
      // Costa una lettura dei membri, che è in cache, e la funzione del
      // database rifiuta da sola le proposte già risolte da un altro
      // telefono.
      await leggiMembri()
        .then((elenco) => risolviProposte(elenco.map((m) => m.id)))
        .catch(() => {})

      await ricarica()
    },
    [aperte, memberId, ricarica]
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
