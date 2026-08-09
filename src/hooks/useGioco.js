import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiClassifica, leggiEventi, leggiScoperte } from '../lib/punti.js'
import { eventiDelGiorno } from '../lib/mvpStorico.js'
import { dataDiOggi } from '../lib/giorni.js'
import { leggiVoti, vota as votaSulDatabase } from '../lib/voti.js'
import { descriviErrore } from '../lib/errori.js'

export function useGioco() {
  const [classifica, setClassifica] = useState([])
  const [eventi, setEventi] = useState([])
  // Gli eventi della giornata in corso, interi: servono all'MVP e alla
  // Maglia Nera, che sono decisioni sul giorno e non sulle ultime righe.
  const [diOggi, setDiOggi] = useState([])
  const [scoperte, setScoperte] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const [voti, setVoti] = useState({})

  const ricarica = useCallback(async () => {
    const [c, e, s, g] = await Promise.all([
      leggiClassifica(),
      leggiEventi(),
      leggiScoperte(),
      // ⚠️ Gli eventi di OGGI, letti a parte. `leggiEventi` si ferma ai
      // quaranta più recenti del viaggio: dopo una serata piena, quello
      // che si era guadagnato in mattinata esce dalla finestra. L'MVP di
      // giornata calcolato lì incoronava chi aveva fatto qualcosa
      // nell'ultima ora, e la mattina dopo `chiudiGiornate` — che legge
      // la giornata intera — ne scriveva un altro. Due schermate della
      // stessa app con due vincitori diversi.
      eventiDelGiorno(dataDiOggi()).catch(() => []),
    ])
    setClassifica(c)
    setEventi(e)
    setScoperte(s)
    setDiOggi(g)

    // I voti delle proposte in attesa: si vota direttamente dalla
    // classifica, dove la proposta è già in bella vista.
    const ids = e.filter((x) => x.stato === 'pending' && x.votoId).map((x) => x.votoId)
    if (ids.length > 0) {
      // I conteggi di un voto aperto non si tengono da parte: senza rete
      // non si può votare comunque, e una copia vecchia direbbe il falso
      // su quanti hanno già deciso. Se non arrivano, classifica e
      // storico si vedono lo stesso.
      const elenco = await leggiVoti(ids).catch(() => [])
      setVoti(Object.fromEntries(elenco.map((v) => [v.id, v])))
    } else {
      setVoti({})
    }
  }, [])

  const vota = useCallback(async (votoId, memberId, opzione) => {
    const aggiornato = await votaSulDatabase(votoId, memberId, opzione)
    setVoti((precedenti) => ({ ...precedenti, [aggiornato.id]: aggiornato }))
  }, [])

  useEffect(() => {
    let vivo = true

    ricarica()
      .then(() => vivo && setStato('pronto'))
      .catch((err) => {
        if (!vivo) return
        setErrore(descriviErrore(err))
        setStato('guasto')
      })

    // La classifica si muove sotto gli occhi di tutti: un punto assegnato
    // da un telefono si vede sugli altri senza ricaricare. Si ricarica
    // tutto invece di aggiornare a pezzi perché punteggio, storico e
    // Leggi cambiano insieme e devono restare d'accordo.
    const canale = supabase
      .channel('gioco')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'point_events' }, () =>
        ricarica().catch(() => {})
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leggi' }, () =>
        ricarica().catch(() => {})
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  return { classifica, eventi, diOggi, scoperte, voti, vota, stato, errore, ricarica }
}
