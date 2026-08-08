import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiScoperte } from '../lib/punti.js'
import { LEGGI } from '../config/leggi.js'
import { useLetteTestamento } from './useLetteTestamento.js'

// Le Leggi scoperte che non hai ancora letto, per il banner.
//
// La celebrazione con i coriandoli c'è già, ma dura sei secondi e scatta
// solo alla prima scoperta del gruppo: se in quel momento avevi il
// telefono in tasca, quella Legge non la vedi più — resta solo un
// pallino in fondo a due sotto-schede.
//
// Il banner è la stessa idea della sfida a dama: la notifica ti
// raggiunge dovunque, e toccandola ci arrivi. Senza, l'unica strada era
// "vai su Gioco, poi Testamento, poi cerca quella col pallino".
//
// Annunciate: quelle già passate dal banner. Sta sul dispositivo perché
// "l'ho già visto" è un fatto di questo telefono, come tutto il resto
// del non letto.
const CHIAVE = 'all41.leggiAnnunciate'

function leggiAnnunciate(membroId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(`${CHIAVE}.${membroId}`) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function useLeggiDaLeggere(membroId, attivo) {
  const [scoperte, setScoperte] = useState({})
  const [annunciate, setAnnunciate] = useState(() => new Set())
  const { lette } = useLetteTestamento(membroId)

  useEffect(() => {
    if (!membroId) return
    setAnnunciate(leggiAnnunciate(membroId))
  }, [membroId])

  const ricarica = useCallback(() => {
    leggiScoperte()
      .then(setScoperte)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!attivo || !membroId) return undefined
    ricarica()

    const canale = supabase
      .channel('leggi-da-leggere')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leggi' },
        () => ricarica()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canale)
    }
  }, [attivo, membroId, ricarica])

  // Da annunciare: scoperta, non letta, e non già passata dal banner.
  // Le tre condizioni insieme evitano il cartello permanente — che è
  // esattamente quello che rende un avviso una seccatura.
  const daAnnunciare = LEGGI.filter(
    (l) => scoperte[l.id] && !lette.has(l.id) && !annunciate.has(l.id)
  )

  const zittisci = useCallback(() => {
    if (!membroId) return
    setAnnunciate((precedenti) => {
      const nuovo = new Set(precedenti)
      for (const l of daAnnunciare) nuovo.add(l.id)
      try {
        localStorage.setItem(`${CHIAVE}.${membroId}`, JSON.stringify([...nuovo]))
      } catch {
        // Navigazione privata: tornerà una volta. Pazienza.
      }
      return nuovo
    })
  }, [membroId, daAnnunciare])

  return { daAnnunciare, zittisci }
}
