import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { daRiga, leggiPartite } from '../lib/partiteDama.js'
import { sfideDaAccettare } from '../lib/classificaDama.js'

// Le sfide a dama che aspettano una risposta. Vive in App e non dentro
// il tab Gioco: una sfida arriva mentre stai guardando le foto, e deve
// raggiungerti lì — come le proposte di punti.
//
// "Dopo" sta sul dispositivo, come il "voto dopo" delle proposte: la
// sfida resta aperta per tutti, sparisce solo dal banner di chi l'ha
// rimandata. E resta rimandata anche ricaricando, che è il punto.
const CHIAVE = 'all41.sfideRimandate'

function leggiRimandate() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHIAVE) ?? '[]'))
  } catch {
    return new Set()
  }
}

function salvaRimandate(insieme) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify([...insieme]))
  } catch {
    // Navigazione privata: tornerà. Pazienza.
  }
}

export function useSfideDama(membroId) {
  const [partite, setPartite] = useState([])
  const [rimandate, setRimandate] = useState(leggiRimandate)

  const ricarica = useCallback(async () => {
    const elenco = await leggiPartite()
    setPartite(elenco)

    // Pulizia: una partita chiusa non deve restare per sempre
    // nell'elenco dei rimandati.
    setRimandate((precedenti) => {
      const vive = new Set(elenco.map((p) => p.id))
      const puliti = new Set([...precedenti].filter((id) => vive.has(id)))
      if (puliti.size !== precedenti.size) salvaRimandate(puliti)
      return puliti
    })
  }, [])

  useEffect(() => {
    if (!membroId) return undefined
    let vivo = true

    // La tabella può non esserci ancora (dama.sql non lanciato): non è
    // un guasto dell'app, e il banner semplicemente non compare.
    ricarica().catch(() => {})

    const canale = supabase
      .channel('sfide-dama')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dama_games' }, ({ new: riga }) => {
        const nuova = daRiga(riga)
        if (!nuova || !vivo) return
        setPartite((precedenti) => [nuova, ...precedenti.filter((p) => p.id !== nuova.id)])
      })
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [membroId, ricarica])

  const rimanda = useCallback((partitaId) => {
    setRimandate((precedenti) => {
      const nuovo = new Set(precedenti).add(partitaId)
      salvaRimandate(nuovo)
      return nuovo
    })
  }, [])

  const daAccettare = sfideDaAccettare(partite, membroId).filter((p) => !rimandate.has(p.id))

  return { daAccettare, rimanda, ricarica }
}
