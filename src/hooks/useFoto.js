import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { leggiFoto } from '../lib/foto.js'
import { leggiMembri } from '../lib/membri.js'
import { descriviErrore } from '../lib/errori.js'
import { PER_PAGINA } from '../config/foto.js'

export function useFoto() {
  const [foto, setFoto] = useState([])
  const [membri, setMembri] = useState({})
  const [stato, setStato] = useState('caricamento')
  const [errore, setErrore] = useState(null)
  const [altre, setAltre] = useState(false)
  const [inArrivo, setInArrivo] = useState(false)

  const inserisci = useCallback((nuova) => {
    setFoto((precedenti) =>
      precedenti.some((f) => f.id === nuova.id) ? precedenti : [nuova, ...precedenti]
    )
  }, [])

  const rimuovi = useCallback((id) => {
    setFoto((precedenti) => precedenti.filter((f) => f.id !== id))
  }, [])

  useEffect(() => {
    let vivo = true

    Promise.all([leggiFoto(), leggiMembri()])
      .then(([pagina, elenco]) => {
        if (!vivo) return
        setFoto(pagina)
        setAltre(pagina.length === PER_PAGINA)
        setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        setErrore(descriviErrore(e))
        setStato('guasto')
      })

    const canale = supabase
      .channel('album-foto')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos' },
        ({ new: riga }) =>
          inserisci({
            id: riga.id,
            autoreId: riga.author_id,
            url: riga.url,
            percorso: riga.path,
            larghezza: riga.width,
            altezza: riga.height,
            // Senza questo una foto di una sfida arrivata dal realtime
            // sembrerebbe una foto d'album, e consumerebbe il tetto
            // giornaliero di chi l'ha mandata.
            sfidaId: riga.challenge_id,
            eliminata: false,
            creataIl: riga.created_at,
          })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        ({ new: riga }) => riga.deleted_at && rimuovi(riga.id)
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [inserisci, rimuovi])

  // Caricamento incrementale: si chiede la pagina successiva a partire
  // dalla foto più vecchia che si ha già.
  const caricaAltre = useCallback(async () => {
    if (inArrivo || foto.length === 0) return
    setInArrivo(true)
    try {
      const pagina = await leggiFoto({ primaDi: foto[foto.length - 1].creataIl })
      setFoto((precedenti) => [...precedenti, ...pagina])
      setAltre(pagina.length === PER_PAGINA)
    } catch (e) {
      setErrore(descriviErrore(e))
    } finally {
      setInArrivo(false)
    }
  }, [foto, inArrivo])

  return { foto, membri, stato, errore, altre, inArrivo, caricaAltre, inserisci, rimuovi }
}
