import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  aggiungiRimborso,
  aggiungiSpesa,
  eliminaRimborso,
  eliminaSpesa,
  leggiRimborsi,
  leggiSpese,
} from '../lib/spese.js'
import { inCache } from '../lib/cache.js'
import { leggiMembri } from '../lib/membri.js'
import { calcolaSaldi, chiDeveAChi, dettaglioSaldo } from '../lib/saldi.js'
import { descriviErrore } from '../lib/errori.js'

// Il `catch` che c'era qui era vuoto. Una ricarica che fallisce non deve
// prendersi lo schermo — i dati che si stanno guardando restano buoni — ma
// deve almeno lasciare una traccia: senza, il difetto della spesa che
// sparisce non aveva nemmeno una riga in console da cui partire.
function guastoRicarica(e) {
  console.warn('[all41] la ricarica delle spese non è riuscita:', e?.message ?? e)
}

export function useSpese(ioId) {
  const [spese, setSpese] = useState([])
  const [rimborsi, setRimborsi] = useState([])
  const [membri, setMembri] = useState([])
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const ricarica = useCallback(async () => {
    const [s, r, m] = await Promise.all([leggiSpese(), leggiRimborsi(), leggiMembri()])
    setSpese(s)
    setRimborsi(r)
    setMembri(m)
  }, [])

  useEffect(() => {
    let vivo = true

    ricarica()
      .then(() => vivo && setStato('pronto'))
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    // Chi paga il ristorante la registra al tavolo: sugli altri telefoni
    // deve comparire senza ricaricare. Si rilegge tutto invece di
    // aggiornare a pezzi, perché i saldi dipendono da ogni riga.
    const canale = supabase
      .channel('spese')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () =>
        vivo ? ricarica().catch(guastoRicarica) : null
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () =>
        vivo ? ricarica().catch(guastoRicarica) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  const membriPerId = useMemo(
    () => Object.fromEntries(membri.map((m) => [m.id, m])),
    [membri]
  )

  const saldi = useMemo(
    () => calcolaSaldi(spese, rimborsi, membri.map((m) => m.id)),
    [spese, rimborsi, membri]
  )

  const passaggi = useMemo(() => chiDeveAChi(saldi), [saldi])

  // Da dove viene il proprio saldo, riga per riga. Le righe sommano
  // esattamente al saldo — c'è una prova che lo tiene fermo — ed è tutto il
  // senso della cosa: un numero che non si può rifare, sui soldi, vale come
  // un numero sbagliato.
  const dettaglio = useMemo(
    () => dettaglioSaldo(spese, rimborsi, membri.map((m) => m.id), ioId),
    [spese, rimborsi, membri, ioId]
  )

  // ⚠️ Ogni modifica aggiorna ANCHE la copia locale, non solo lo schermo.
  //
  // Senza, la copia su disco restava sempre un passo indietro, e bastava
  // questo: segni la cena, l'inserimento riesce, il foglio si chiude. Lo
  // stesso inserimento fa scattare il realtime anche sul TUO telefono,
  // riparte `ricarica()`, quella lettura incappa in un blip di segnale e
  // `conCache` risolve — non fallisce: risolve — con la copia scritta
  // PRIMA del tuo inserimento. La tua cena spariva dall'elenco e dal
  // totale, i saldi tornavano indietro, e il `catch` vuoto qui sotto
  // garantiva che nessuno lo dicesse.
  //
  // Poi la rimetti, perché non la vedi più. E adesso ce ne sono due, anche
  // sui telefoni degli altri sette.
  const aggiornaSpese = useCallback((cambia) => {
    setSpese((precedenti) => {
      const dopo = cambia(precedenti)
      inCache('spese', dopo)
      return dopo
    })
  }, [])

  const aggiornaRimborsi = useCallback((cambia) => {
    setRimborsi((precedenti) => {
      const dopo = cambia(precedenti)
      inCache('rimborsi', dopo)
      return dopo
    })
  }, [])

  const registra = useCallback(
    async (spesa) => {
      const nuova = await aggiungiSpesa(spesa)
      aggiornaSpese((precedenti) =>
        precedenti.some((s) => s.id === nuova.id) ? precedenti : [nuova, ...precedenti]
      )
    },
    [aggiornaSpese]
  )

  const registraRimborso = useCallback(
    async (rimborso) => {
      const nuovo = await aggiungiRimborso(rimborso)
      aggiornaRimborsi((precedenti) =>
        precedenti.some((r) => r.id === nuovo.id) ? precedenti : [nuovo, ...precedenti]
      )
    },
    [aggiornaRimborsi]
  )

  const togliSpesa = useCallback(
    async (id) => {
      await eliminaSpesa(id)
      aggiornaSpese((precedenti) => precedenti.filter((s) => s.id !== id))
    },
    [aggiornaSpese]
  )

  const togliRimborso = useCallback(
    async (id) => {
      await eliminaRimborso(id)
      aggiornaRimborsi((precedenti) => precedenti.filter((r) => r.id !== id))
    },
    [aggiornaRimborsi]
  )

  // Nei conti entrano anche le righe eliminate — calcolaSaldi le salta da
  // sé — ma a schermo no.
  const speseVive = useMemo(() => spese.filter((s) => !s.eliminata), [spese])
  const rimborsiVivi = useMemo(() => rimborsi.filter((r) => !r.eliminato), [rimborsi])

  return {
    spese: speseVive,
    rimborsi: rimborsiVivi,
    membri,
    membriPerId,
    saldi,
    passaggi,
    dettaglio,
    stato,
    errore,
    registra,
    registraRimborso,
    togliSpesa,
    togliRimborso,
  }
}
