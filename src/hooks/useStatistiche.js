import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { VIAGGIO } from '../config/viaggio.js'
import { leggiMembri } from '../lib/membri.js'
import { contaPerMembro, massimoPerMembro, tabella, titoli } from '../lib/statistiche.js'
import { descriviErrore } from '../lib/errori.js'

// Una query per tabella, non una per persona. Otto persone per quattro
// tabelle farebbero trentadue viaggi al database per una schermata che si
// apre due volte a vacanza: qui si chiede solo la colonna dell'autore e
// si conta sul telefono, che e' un lavoro da niente.
//
// Il tetto c'e' lo stesso, come su ogni lettura dell'app: sopra questi
// numeri le statistiche restano vere abbastanza, e nessuno si scarica
// mezzo database per sapere chi ha parlato di piu'.
const TETTI = {
  azioni: 4000,
  foto: 1000,
  vocali: 1000,
  pecora: 500,
}

async function colonna(tabella_, campi, tetto, filtri = (q) => q) {
  const { data, error } = await filtri(
    supabase.from(tabella_).select(campi).eq('trip_id', VIAGGIO.id)
  ).limit(tetto)

  if (error) throw error
  return data ?? []
}

export function useStatistiche(attivo) {
  const [dati, setDati] = useState({ righe: [], premi: [] })
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const carica = useCallback(async () => {
    const [membri, azioni, foto, vocali, partite] = await Promise.all([
      leggiMembri(),
      colonna('quick_actions', 'author_id, kind', TETTI.azioni, (q) => q.is('deleted_at', null)),
      colonna('photos', 'author_id', TETTI.foto, (q) => q.is('deleted_at', null)),
      colonna('voice_messages', 'author_id', TETTI.vocali, (q) => q.is('deleted_at', null)),
      colonna('sheep_records', 'member_id, punteggio', TETTI.pecora),
    ])

    // Le Leggi scattate si contano dai punti: ogni evento con una regola
    // dietro e' una Legge che e' scattata addosso a qualcuno.
    const { data: eventi, error } = await supabase
      .from('point_events')
      .select('member_id, rule_id')
      .eq('trip_id', VIAGGIO.id)
      .not('rule_id', 'is', null)
      .limit(2000)
    if (error) throw error

    const conteggi = {
      messaggi: contaPerMembro(azioni.filter((a) => a.kind === 'free_text')),
      suoni: contaPerMembro(azioni.filter((a) => a.kind === 'soundboard')),
      foto: contaPerMembro(foto),
      vocali: contaPerMembro(vocali),
      leggi: contaPerMembro(eventi ?? [], 'member_id'),
      pecora: massimoPerMembro(partite, 'member_id', 'punteggio'),
    }

    const righe = tabella({ membri, conteggi }).sort((a, b) => b.punti - a.punti)
    return { righe, premi: titoli(righe) }
  }, [])

  useEffect(() => {
    if (!attivo) return
    let vivo = true

    carica()
      .then((d) => {
        if (!vivo) return
        setDati(d)
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    return () => {
      vivo = false
    }
  }, [attivo, carica])

  return { ...dati, stato, errore }
}
