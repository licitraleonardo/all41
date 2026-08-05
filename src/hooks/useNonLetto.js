import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { VIAGGIO } from '../config/viaggio.js'

// I pallini sulle icone. Tiene una data per sezione — l'ultima cosa
// arrivata — e la confronta con l'ultima che hai guardato.
//
// Il segnalibro sta su questo dispositivo e non sul database: funziona in
// aereo mode, che e' meta' della vacanza, e non aggiunge una scrittura
// ogni volta che apri una scheda. La chiave contiene l'id della persona,
// quindi due profili sullo stesso telefono non si rubano le notifiche.

export const SEZIONI = ['chat', 'vocali', 'testamento']

function chiave(membroId, sezione) {
  return `visto:${membroId}:${sezione}`
}

function letto(membroId, sezione) {
  try {
    return localStorage.getItem(chiave(membroId, sezione))
  } catch {
    return null
  }
}

// L'ultima riga di ogni sezione, una query da una riga sola per ciascuna.
async function ultimaData(tabella, colonna = 'created_at') {
  const { data, error } = await supabase
    .from(tabella)
    .select(colonna)
    .eq('trip_id', VIAGGIO.id)
    .order(colonna, { ascending: false })
    .limit(1)

  if (error) throw error
  return data[0]?.[colonna] ?? null
}

export function useNonLetto(membroId, attivo) {
  const [ultime, setUltime] = useState({ chat: null, vocali: null, testamento: null })
  const [viste, setViste] = useState({ chat: null, vocali: null, testamento: null })

  // Si rileggono all'avvio e non si tengono solo in memoria: cosi'
  // riaprire l'app non riaccende tutti i pallini gia' spenti.
  useEffect(() => {
    if (!membroId) return
    setViste({
      chat: letto(membroId, 'chat'),
      vocali: letto(membroId, 'vocali'),
      testamento: letto(membroId, 'testamento'),
    })
  }, [membroId])

  const segna = useCallback(
    (sezione, quando = new Date().toISOString()) => {
      if (!membroId) return
      try {
        localStorage.setItem(chiave(membroId, sezione), quando)
      } catch {
        // Spazio pieno o navigazione privata: peggio per i pallini, non
        // e' un motivo per rompere la schermata.
      }
      setViste((precedenti) => ({ ...precedenti, [sezione]: quando }))
    },
    [membroId]
  )

  useEffect(() => {
    if (!attivo || !membroId) return
    let vivo = true

    Promise.all([
      ultimaData('quick_actions'),
      ultimaData('voice_messages'),
      ultimaData('leggi', 'discovered_at'),
    ])
      .then(([chat, vocali, testamento]) => {
        if (vivo) setUltime({ chat, vocali, testamento })
      })
      .catch(() => {})

    // Il pallino deve accendersi mentre guardi un'altra scheda: e' tutto
    // il suo mestiere.
    const segnala = (sezione) => (payload) => {
      const quando =
        payload.new?.created_at ?? payload.new?.discovered_at ?? new Date().toISOString()
      setUltime((precedenti) => ({ ...precedenti, [sezione]: quando }))
    }

    const canale = supabase
      .channel('non-letto')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quick_actions' },
        segnala('chat')
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_messages' },
        segnala('vocali')
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leggi' },
        segnala('testamento')
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [attivo, membroId])

  const dettaglio = useMemo(
    () =>
      Object.fromEntries(
        SEZIONI.map((s) => [s, Boolean(ultime[s]) && (!viste[s] || ultime[s] > viste[s])])
      ),
    [ultime, viste]
  )

  const novita = useMemo(
    () => ({
      gruppo: dettaglio.chat || dettaglio.vocali,
      gioco: dettaglio.testamento,
    }),
    [dettaglio]
  )

  return { novita, dettaglio, segna }
}
