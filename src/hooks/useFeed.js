import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiFeed, TETTO_FEED } from '../lib/azioni.js'
import { leggiMembri } from '../lib/membri.js'
import { descriviErrore } from '../lib/errori.js'

export function useFeed() {
  const [azioni, setAzioni] = useState([])
  const [membri, setMembri] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)
  const autoriIgnoti = useRef(false)

  // Aggiunge in cima senza duplicare: la stessa azione arriva due volte,
  // una dalla risposta dell'invio e una dal realtime.
  const inserisci = useCallback((azione) => {
    setAzioni((precedenti) => {
      if (precedenti.some((a) => a.id === azione.id)) return precedenti
      return [azione, ...precedenti].slice(0, TETTO_FEED)
    })
  }, [])

  const sostituisci = useCallback((azione) => {
    setAzioni((precedenti) =>
      precedenti.map((a) => (a.id === azione.id ? { ...a, ...azione } : a))
    )
  }, [])

  const ricaricaMembri = useCallback(async () => {
    const elenco = await leggiMembri()
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
    return elenco
  }, [])

  // ⚠️ Rileggere il feed dopo un buco. Il realtime consegna quello che
  // succede MENTRE si è collegati: se il socket cade — si passa sotto un
  // ponte, il telefono va in tasca, la wifi del villaggio fa una delle sue
  // — quello che è passato in quei venti secondi **non arriva mai più** su
  // quel telefono. E sullo schermo la conversazione risulta ferma e
  // completa: non c'è nessun segno che manchi qualcosa.
  //
  // Nel caso peggiore a cadere nel buco è un SOS. E lì il buco non si
  // richiude da solo, perché quando uno si perde gli altri smettono di
  // scrivere in chat e cominciano a telefonare: non arriva nessun evento
  // successivo che faccia accorgere di niente.
  //
  // ⚠️ `.fresca()`: se qui uscisse la copia locale, il riallineamento
  // riporterebbe la conversazione INDIETRO invece che avanti. Se non si
  // riesce a leggere fresco si lascia a schermo quello che c'è.
  const riallinea = useCallback(async () => {
    const feed = await leggiFeed.fresca()
    setAzioni(feed)
  }, [])

  useEffect(() => {
    let vivo = true

    Promise.all([leggiFeed(), ricaricaMembri()])
      .then(([feed]) => {
        if (!vivo) return
        setAzioni(feed)
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    // La prima iscrizione non è un ritorno: si rilegge dalla seconda in
    // poi, che è quando il canale si è ricollegato dopo essere caduto.
    let giaCollegato = false

    const canale = supabase
      .channel('feed-quick-actions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quick_actions' },
        ({ new: riga }) => inserisci(normalizza(riga))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quick_actions' },
        ({ new: riga }) => sostituisci(normalizza(riga))
      )
      .subscribe((statoCanale) => {
        if (statoCanale !== 'SUBSCRIBED') return
        if (giaCollegato && vivo) riallinea().catch(() => {})
        giaCollegato = true
      })

    // Il ritorno del canale non basta da solo: dentro una PWA messa in
    // tasca il socket può morire senza che nessuno lo dichiari, e ci si
    // accorge di essere tornati solo quando lo schermo si riaccende.
    const alRitorno = () => {
      if (!vivo || document.visibilityState !== 'visible') return
      riallinea().catch(() => {})
    }
    document.addEventListener('visibilitychange', alRitorno)
    window.addEventListener('online', alRitorno)

    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', alRitorno)
      window.removeEventListener('online', alRitorno)
      supabase.removeChannel(canale)
    }
  }, [inserisci, sostituisci, ricaricaMembri, riallinea])

  // Se compare un autore che non conosciamo è entrato qualcuno di nuovo:
  // si rileggono i membri una volta sola, non a ogni messaggio.
  useEffect(() => {
    const mancante = azioni.some((a) => !membri[a.autoreId])
    if (!mancante || autoriIgnoti.current) return
    autoriIgnoti.current = true
    ricaricaMembri()
      .catch(() => {})
      .finally(() => {
        autoriIgnoti.current = false
      })
  }, [azioni, membri, ricaricaMembri])

  return { azioni, membri, stato, errore, inserisci, sostituisci }
}

// Il realtime consegna la riga grezza del database, non quella già
// tradotta da lib/azioni.
function normalizza(riga) {
  return {
    id: riga.id,
    autoreId: riga.author_id,
    tipo: riga.kind,
    payload: riga.payload ?? {},
    importante: Boolean(riga.importante),
    eliminato: Boolean(riga.deleted_at),
    creatoIl: riga.created_at,
  }
}
