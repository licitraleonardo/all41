import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  assegnaPremioCaccia,
  assicuraVotoSfida,
  leggiPartecipazioni,
  leggiSfideVinte,
  leggiVotiSfide,
  risolviCaccia,
} from '../lib/sfide.js'
import { leggiMembri } from '../lib/membri.js'
import { vota as votaSulDatabase } from '../lib/voti.js'
import { SFIDE, sfideDaMostrare } from '../config/sfide.js'
import { votiAperti } from '../lib/cacciaFinale.js'
import { dataDiOggi } from '../lib/giorni.js'

export function useSfide(memberId) {
  const [vinte, setVinte] = useState({})
  const [partecipazioni, setPartecipazioni] = useState({})
  const [voti, setVoti] = useState({})
  const [membri, setMembri] = useState({})

  // `fresche` distingue le due cose che questa lettura serve a fare.
  //
  // Per DISEGNARE la scheda va benissimo la copia locale: è tutto il senso
  // dell'offline, e senza rete si guardano le sfide lo stesso.
  //
  // Per DECIDERE no. ⚠️ Da qui passano tre cose definitive: quali foto
  // entrano fra le opzioni del voto (chi manca resta fuori gara e non può
  // rientrarci), se una sfida si chiude a un «solitario» che solo non era,
  // e il premio finale da dieci punti — che ha la chiave `caccia-finale`
  // senza data, cioè si assegna una volta per tutto il viaggio. Con una
  // copia di due giorni prima, una gara che ha due foto ne mostra una, e
  // la sfida viene assegnata senza gara alla persona sbagliata, per sempre.
  const ricarica = useCallback(async (fresche = false) => {
    const leggi = fresche
      ? [
          leggiSfideVinte.fresca(),
          leggiMembri.fresca(),
          leggiPartecipazioni.fresca(SFIDE.map((s) => s.id)),
          leggiVotiSfide.fresca(),
        ]
      : [leggiSfideVinte(), leggiMembri(), leggiPartecipazioni(SFIDE.map((s) => s.id)), leggiVotiSfide()]

    const [v, elenco, p, vt] = await Promise.all(leggi)
    setVinte(v)
    setMembri(Object.fromEntries(elenco.map((m) => [m.id, m])))
    setPartecipazioni(p)
    setVoti(vt)
    return { vinte: v, partecipazioni: p, voti: vt }
  }, [])

  // Risoluzione all'apertura, come per i sondaggi: non c'è nessun server
  // a cui dire di fare qualcosa il 17 e il 20.
  useEffect(() => {
    if (!memberId) return
    let vivo = true

    // Il 17 si aprono i voti, il 20 si chiude e si assegna il premio:
    // niente succede durante il viaggio, e quello che succede dopo lo
    // muove il primo che apre l'app.
    // ⚠️ Tutte e tre `fresche`: da qui si assegnano sfide e il premio
    // finale, e sono decisioni che non si tornano indietro. Se la rete non
    // risponde non si decide niente e ci riprova la prossima apertura —
    // il che è esattamente il modello, visto che qui non succede niente
    // fino al 17.
    //
    // La rilettura di mezzo dev'essere fresca per lo stesso motivo scritto
    // in `assegnaPremioCaccia`, che si aspetta le vittorie GIÀ assegnate:
    // con la copia si ritrovava le stesse di due secondi prima.
    ricarica(true)
      .then(async ({ vinte: v, partecipazioni: p, voti: vt }) => {
        await risolviCaccia(p, v, vt, memberId).catch(() => {})
        const dopo = vivo ? await ricarica(true) : null
        if (dopo) await assegnaPremioCaccia(dopo.vinte).catch(() => {})
        if (vivo) await ricarica()
      })
      .catch(() => {})

    const canale = supabase
      .channel('sfide')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [memberId, ricarica])

  // Dopo un caricamento: durante il viaggio non succede niente, si
  // raccoglie e basta. Dal 17, se il voto è già aperto, la foto appena
  // arrivata si accoda a quello invece di restare fuori dalla gara.
  const aggiornaGara = useCallback(
    async (sfidaId) => {
      if (votiAperti(dataDiOggi())) {
        const p = await leggiPartecipazioni([sfidaId])
        const foto = p[sfidaId] ?? []
        if (foto.length >= 2) {
          await assicuraVotoSfida(
            sfidaId,
            foto.map((f) => f.id),
            memberId
          ).catch(() => {})
        }
      }
      await ricarica()
    },
    [memberId, ricarica]
  )

  const vota = useCallback(
    async (votoId, opzione) => {
      await votaSulDatabase(votoId, memberId, opzione)
      await ricarica()
    },
    [memberId, ricarica]
  )

  const { diOggi, aperte, conquistate } = useMemo(() => sfideDaMostrare(vinte), [vinte])
  const membriIds = useMemo(() => Object.keys(membri), [membri])

  return {
    vinte,
    partecipazioni,
    voti,
    membri,
    membriIds,
    diOggi,
    aperte,
    conquistate,
    ricarica,
    aggiornaGara,
    vota,
  }
}
