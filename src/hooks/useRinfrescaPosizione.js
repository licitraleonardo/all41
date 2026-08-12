import { useCallback, useEffect, useState } from 'react'
import { chiediPosizione, condividiPosizione, leggiPosizioni } from '../lib/posizione.js'
import { rifiutatoIl, segnaRifiuto, vaChiesto } from '../lib/rinfrescaPosizione.js'
import { dataDiOggi, statoDelViaggio } from '../lib/giorni.js'
import { eUnNoDefinitivo, permessoGiaDato } from '../lib/posizioneAutomatica.js'

export function useRinfrescaPosizione(membroId, attivo) {
  const [mia, setMia] = useState(null)
  // "Non ora" vive in memoria di proposito: vale per questa apertura.
  const [rimandato, setRimandato] = useState(false)
  // Quando è ripartita da sola: serve solo a far comparire la scritta,
  // e cambia valore a ogni giro così il messaggio si rivede.
  const [appenaAggiornata, setAppenaAggiornata] = useState(0)
  // ⚠️ Un no del telefono vale per questa apertura, non per sempre:
  // riprovare a ogni ritorno in primo piano sarebbe un errore silenzioso
  // quaranta volte al giorno.
  const [telefonoHaDettoNo, setTelefonoHaDettoNo] = useState(false)

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

  // ⚠️ Si riaggiorna da sola a ogni apertura, per chi l'ha già
  // condivisa. Nessuna preferenza da accendere: averla condivisa **è**
  // la scelta, e il tasto per smettere sta sulla mappa.
  useEffect(() => {
    if (!attivo || !membroId || !mia?.quando || telefonoHaDettoNo) return undefined

    let vivo = true
    let ultima = 0

    const forse = async () => {
      if (document.visibilityState !== 'visible') return
      // Una volta per apertura, non a ogni sfarfallio di `focus`.
      if (Date.now() - ultima < 60000) return
      ultima = Date.now()

      if (!(await permessoGiaDato())) return
      try {
        const dove = await chiediPosizione()
        const posizione = await condividiPosizione(membroId, dove)
        if (!vivo) return
        setMia((precedente) => ({ ...(precedente ?? {}), ...posizione, id: membroId }))
        setAppenaAggiornata(Date.now())
      } catch (e) {
        if (vivo && eUnNoDefinitivo(e)) setTelefonoHaDettoNo(true)
        // Un errore passeggero — GPS lento, niente campo — non dice
        // niente: si riprova alla prossima apertura.
      }
    }

    document.addEventListener('visibilitychange', forse)
    window.addEventListener('focus', forse)
    forse()

    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', forse)
      window.removeEventListener('focus', forse)
    }
    // `mia?.quando` e non `mia`: l'oggetto cambia a ogni aggiornamento, e
    // guardando lui questo effetto si rimonterebbe all'infinito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivo, membroId, Boolean(mia?.quando), telefonoHaDettoNo])

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
      // ⚠️ Il cartello resta solo per chi **non** può aggiornarsi da
      // solo, cioè chi ha detto di no al telefono. Per tutti gli altri
      // chiedere di fare a mano una cosa che sta già succedendo era il
      // difetto: si vedeva il cartello e nel frattempo la posizione era
      // già ripartita.
      automatica: !telefonoHaDettoNo,
    })

  return { mia, daChiedere, aggiorna, no, nonOra, appenaAggiornata }
}
