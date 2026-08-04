import { useCallback, useEffect, useState } from 'react'
import { chiediPosizione, condividiPosizione, leggiPosizioni } from '../lib/posizione.js'
import { vaChiesto } from '../lib/rinfrescaPosizione.js'
import { dataDiOggi, statoDelViaggio } from '../lib/giorni.js'

const CHIAVE_NO = 'all41.posizione.no'

// Il "no" vale per la giornata e sta in localStorage: in memoria
// tornerebbe a ogni ricaricamento, cioè esattamente la seccatura che
// quel bottone deve togliere. È lo stesso ragionamento del "voto dopo".
function rifiutatoIl() {
  try {
    return localStorage.getItem(CHIAVE_NO)
  } catch {
    return null
  }
}

function segnaRifiuto() {
  try {
    localStorage.setItem(CHIAVE_NO, dataDiOggi())
  } catch {
    // Safari in navigazione privata può rifiutare: pazienza, si richiede.
  }
}

export function useRinfrescaPosizione(membroId, attivo) {
  const [mia, setMia] = useState(null)
  // "Non ora" vive in memoria di proposito: vale per questa apertura.
  const [rimandato, setRimandato] = useState(false)

  useEffect(() => {
    if (!attivo || !membroId) return
    let vivo = true

    leggiPosizioni()
      .then((tutte) => {
        if (vivo) setMia(tutte.find((p) => p.id === membroId) ?? null)
      })
      .catch(() => {})

    return () => {
      vivo = false
    }
  }, [attivo, membroId])

  const aggiorna = useCallback(async () => {
    const dove = await chiediPosizione()
    const posizione = await condividiPosizione(membroId, dove)
    setMia((precedente) => ({ ...(precedente ?? {}), ...posizione, id: membroId }))
    setRimandato(true)
  }, [membroId])

  const no = useCallback(() => {
    segnaRifiuto()
    setRimandato(true)
  }, [])

  const nonOra = useCallback(() => setRimandato(true), [])

  const daChiedere =
    attivo &&
    vaChiesto({
      mia,
      rimandato,
      rifiutatoIl: rifiutatoIl(),
      dentroIlViaggio: statoDelViaggio(dataDiOggi()) === 'durante',
    })

  return { mia, daChiedere, aggiorna, no, nonOra }
}
