import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { eliminaVocale, leggiVocali, segnaImportante, TETTO_VOCALI } from '../lib/vocali.js'
import { leggiMembri } from '../lib/membri.js'
import { descriviErrore } from '../lib/errori.js'

export function useVocali() {
  const [vocali, setVocali] = useState([])
  const [membri, setMembri] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)

  const inserisci = useCallback((vocale) => {
    setVocali((precedenti) =>
      precedenti.some((v) => v.id === vocale.id)
        ? precedenti
        : [vocale, ...precedenti].slice(0, TETTO_VOCALI)
    )
  }, [])

  const ricaricaMembri = useCallback(async () => {
    const elenco = await leggiMembri()
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
  }, [])

  useEffect(() => {
    let vivo = true

    Promise.all([leggiVocali(), ricaricaMembri()])
      .then(([elenco]) => {
        if (!vivo) return
        setVocali(elenco)
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    // Un walkie-talkie che consegna fra due minuti non serve a niente.
    const canale = supabase
      .channel('vocali')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_messages' },
        ({ new: riga }) =>
          inserisci({
            id: riga.id,
            autoreId: riga.author_id,
            url: riga.url,
            percorso: riga.path,
            tipo: riga.mime_type,
            durata: riga.durata_sec,
            importante: Boolean(riga.importante),
            eliminato: false,
            creatoIl: riga.created_at,
          })
      )
      // ⚠️ Anche gli UPDATE, che qui vuol dire le eliminazioni:
      // `eliminaVocale` è una cancellazione morbida, cioè scrive
      // `deleted_at`.
      //
      // Senza questo, un vocale cancellato dal suo autore restava
      // ascoltabile su tutti i telefoni che avevano l'app aperta, per
      // tutta la sera, finché qualcuno non ricaricava: la cancellazione
      // funzionava solo per chi apriva l'app DOPO, cioè proprio per chi
      // non stava guardando. Chi lo aveva cancellato credeva di averlo
      // ritirato, e gli altri sette continuavano a poterlo riascoltare.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voice_messages' },
        ({ new: riga }) => {
          if (riga?.deleted_at) {
            setVocali((precedenti) => precedenti.filter((v) => v.id !== riga.id))
            return
          }
          // ⚠️ E l'altro UPDATE che esiste: «segnalo importante», che si
          // preme un secondo dopo l'invio. Senza questo il bordo rosso
          // compariva solo sul telefono di chi l'ha premuto, e sugli
          // altri sette il vocale restava uno qualunque — cioè proprio
          // quello che segnarlo doveva evitare. Stesso difetto delle
          // eliminazioni, e stessa correzione.
          setVocali((precedenti) =>
            precedenti.map((v) =>
              v.id === riga.id ? { ...v, importante: Boolean(riga.importante) } : v
            )
          )
        }
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [inserisci, ricaricaMembri])

  // ⚠️ Se la cancellazione non riesce, il vocale TORNA a schermo.
  //
  // Prima spariva dal proprio elenco e l'errore finiva in un `catch`
  // vuoto: credevi di aver ritirato il vocale imbarazzante, e agli altri
  // sette restava. E ricaricando l'app ti ricompariva, senza che niente
  // avesse mai detto che non era andata. Un'interfaccia che afferma il
  // falso su un gesto che non si può disfare.
  const togli = useCallback(async (id) => {
    let tolto = null
    setVocali((precedenti) => {
      tolto = precedenti.find((v) => v.id === id) ?? null
      return precedenti.filter((v) => v.id !== id)
    })

    try {
      await eliminaVocale(id)
      return true
    } catch (e) {
      if (tolto) {
        setVocali((precedenti) =>
          precedenti.some((v) => v.id === id)
            ? precedenti
            : [...precedenti, tolto].sort(
                (a, b) => Date.parse(a.creatoIl) - Date.parse(b.creatoIl)
              )
        )
      }
      console.warn('[all41] il vocale non si è tolto:', e?.message ?? e)
      return false
    }
  }, [])

  // ⚠️ Come `togli`: se non riesce, il bollino TORNA indietro.
  //
  // Segnare un vocale importante è una promessa fatta agli altri sette —
  // «guardate questo prima degli altri». Un bollino che compare solo sul
  // telefono di chi l'ha premuto è la stessa bugia dell'eliminazione che
  // spariva solo a te, e va detta allo stesso modo: se non è andata,
  // sparisce e si vede che non è andata.
  const segna = useCallback(async (id) => {
    setVocali((precedenti) =>
      precedenti.map((v) => (v.id === id ? { ...v, importante: true } : v))
    )
    try {
      await segnaImportante(id)
      return true
    } catch (e) {
      setVocali((precedenti) =>
        precedenti.map((v) => (v.id === id ? { ...v, importante: false } : v))
      )
      console.warn('[all41] il vocale non si è segnato:', e?.message ?? e)
      return false
    }
  }, [])

  return { vocali, membri, stato, errore, inserisci, togli, segna }
}
