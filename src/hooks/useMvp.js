import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { chiudiGiornate, conteggioPerMembro, leggiStorico } from '../lib/mvpStorico.js'
import { ieriRispettoA } from '../lib/classifica.js'
import { dataDiOggi } from '../lib/giorni.js'

// I coriandoli non partono a mezzanotte. Partono quando apri l'app la
// prima volta dopo, che tipicamente e' la mattina dopo davanti al caffe':
// otto telefoni che esplodono alle 00:00 mentre siete al bar sono
// rumore, la stessa cosa al risveglio e' un momento.

const VISTA = 'mvp-celebrato'

export function useMvp(membroId, attivo) {
  const [storico, setStorico] = useState([])
  const [festa, setFesta] = useState(null)

  const chiudi = useCallback(() => setFesta(null), [])

  const forseCelebra = useCallback((giorno, membro, saldo) => {
    // Solo ieri: chiudendo l'app per tre giorni si recuperano anche le
    // giornate vecchie, ma quelle si guardano in classifica, non si
    // festeggiano una dietro l'altra.
    if (!membro || giorno !== ieriRispettoA(dataDiOggi())) return
    if (localStorage.getItem(VISTA) === giorno) return

    localStorage.setItem(VISTA, giorno)
    setFesta({ giorno, membroId: membro, saldo })
  }, [])

  useEffect(() => {
    if (!attivo || !membroId) return
    let vivo = true

    // Prima si chiude quello che c'e' da chiudere, poi si rilegge: cosi'
    // la classifica mostra subito anche la giornata appena fissata.
    chiudiGiornate()
      .then(async (chiuse) => {
        if (!vivo) return
        for (const c of chiuse) forseCelebra(c.giorno, c.membroId, c.saldo)
        const elenco = await leggiStorico()
        if (vivo) setStorico(elenco)
      })
      .catch(() => {
        // Una giornata non chiusa non e' un guasto da mostrare: si
        // riprova alla prossima apertura.
        leggiStorico()
          .then((elenco) => vivo && setStorico(elenco))
          .catch(() => {})
      })

    // Se a chiudere e' stato un altro telefono, i coriandoli devono
    // partire lo stesso su questo.
    const canale = supabase
      .channel('mvp')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mvp_days' },
        ({ new: riga }) => {
          setStorico((precedenti) =>
            precedenti.some((r) => r.giorno === riga.giorno)
              ? precedenti
              : [{ giorno: riga.giorno, membroId: riga.member_id, saldo: riga.saldo }, ...precedenti]
          )
          forseCelebra(riga.giorno, riga.member_id, riga.saldo)
        }
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [attivo, membroId, forseCelebra])

  return { storico, conteggi: conteggioPerMembro(storico), festa, chiudi }
}
