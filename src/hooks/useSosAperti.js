import { useCallback, useEffect, useMemo, useState } from 'react'
import { leggiRicevute, leggiSosAperti, mandaRicevuta } from '../lib/azioni.js'
import { supabase } from '../lib/supabase.js'

// Gli SOS aperti. Vive qui e non dentro la striscia perché **lo deve
// sapere tutta l'app**, non solo la chat.
//
// ⚠️ Prima la striscia stava dentro `ChatRapida`, cioè dentro il tab
// Gruppo, scheda Chat. Un SOS mandato mentre qualcuno guardava le foto,
// giocava a dama o divideva le spese non compariva da nessuna parte: su
// quel telefono restava un pallino sull'icona del Gruppo, identico a
// quello di chi scrive «che si mangia».
//
// È lo stesso difetto del buco del realtime corretto poche ore fa — l'SOS
// che non arriva a chi non sta guardando il posto giusto — ma senza
// bisogno che cada la rete: bastava essere in un altro tab. Ed è l'unica
// funzione di sicurezza dell'app.
export function useSosAperti(ioId) {
  const [tutti, setTutti] = useState([])
  const [ricevute, setRicevute] = useState([])

  useEffect(() => {
    let vivo = true
    // ⚠️ Le letture si numerano, e le risposte in ritardo si buttano.
    //
    // `carica()` parte a ogni evento su `quick_actions`, e durante un SOS
    // quegli eventi sono tanti e ravvicinati: sette ricevute piu' i
    // messaggi. Le letture partono in parallelo e vince **l'ultima che
    // arriva**, non l'ultima che parte. Bastava che una lettura vecchia —
    // partita prima che tu premessi «Ricevuto» — atterrasse dopo, e la
    // tua ricevuta spariva dallo stato: il cartello dell'SOS ti tornava
    // su gia' chiuso, lo ripremevi, e in chat comparivano due righe.
    let giro = 0
    // La prima iscrizione non è un ritorno: si rilegge dalla seconda in
    // poi, cioè quando il canale si è ricollegato dopo essere caduto.
    let giaCollegato = false

    const carica = () => {
      giro += 1
      const mio = giro
      // Solo la lettura piu' recente puo' scrivere: `mio === giro` e'
      // falso per tutte quelle che nel frattempo sono state superate.
      const attuale = () => vivo && mio === giro

      leggiSosAperti()
        .then((elenco) => attuale() && setTutti(elenco))
        .catch(() => {})
      // Separata: se la lettura delle ricevute va storta, gli SOS si
      // vedono lo stesso. La ricevuta e' un di piu', l'SOS no.
      leggiRicevute()
        .then((elenco) => attuale() && setRicevute(elenco))
        .catch(() => {})
    }

    carica()

    // Un SOS mandato da un altro telefono deve comparire subito: è il
    // caso in cui il ritardo pesa di più.
    const canale = supabase
      .channel('sos-aperti')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_actions' }, () =>
        carica()
      )
      // ⚠️ E si rilegge anche quando il canale torna su, o quando torna
      // su l'app. Il realtime consegna solo quello che passa MENTRE si è
      // collegati: se il socket cade — il telefono in tasca, un tratto
      // senza campo — l'SOS mandato in quei minuti non arriva mai più su
      // questo telefono.
      //
      // Qui il buco non si richiude da solo, ed è il motivo per cui
      // questo caso è peggiore di tutti gli altri: quando uno si perde,
      // gli altri smettono di scrivere in chat e cominciano a telefonare.
      // Non arriva nessun evento successivo che faccia ricaricare.
      .subscribe((statoCanale) => {
        if (statoCanale !== 'SUBSCRIBED') return
        if (giaCollegato && vivo) carica()
        giaCollegato = true
      })

    const alRitorno = () => {
      if (!vivo || document.visibilityState !== 'visible') return
      carica()
    }
    document.addEventListener('visibilitychange', alRitorno)
    window.addEventListener('online', alRitorno)

    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', alRitorno)
      window.removeEventListener('online', alRitorno)
      supabase.removeChannel(canale)
    }
  }, [])

  // ⚠️ La striscia mostra gli SOS che **tu** non hai ancora ricevuto.
  //
  // Prima c'era «Rientrato», che chiudeva il cartello per tutti e
  // cancellava l'SOS: chiunque poteva premerlo, non restava traccia da
  // nessuna parte, e chi si era perso non sapeva se qualcuno l'avesse
  // visto. Adesso ognuno chiude il suo, e il fatto di averlo visto resta
  // scritto in chat.
  //
  // Un SOS non si chiude piu': resta in chat per sempre e se ne va dalla
  // striscia da solo dopo `ORE_SOS`. ⚠️ Vuol dire che se nessuno preme
  // «Ricevuto» il cartello resta su otto ore — ed e' voluto: un cartello
  // su uno che si e' perso deve essere insistente.
  const miei = useMemo(() => {
    const s = new Set()
    for (const r of ricevute) {
      if (r.autoreId === ioId && r.payload?.ricevutaSos) s.add(r.payload.ricevutaSos)
    }
    return s
  }, [ricevute, ioId])

  const aperti = useMemo(() => tutti.filter((a) => !miei.has(a.id)), [tutti, miei])

  const ricevuto = useCallback(
    async (sos, nomeDi) => {
      // Sparisce subito dallo schermo: chi preme ha appena letto un SOS e
      // non deve restare a guardare una rotella. La riga vera arriva
      // dopo, e il realtime la rimette a posto su tutti i telefoni.
      const finto = {
        id: `locale-${sos.id}`,
        autoreId: ioId,
        payload: { ricevutaSos: sos.id },
      }
      setRicevute((p) => [finto, ...p])

      // ⚠️ La ricevuta si scrive **sempre**, anche sul proprio SOS.
      //
      // Prima il proprio si chiudeva e basta, senza scrivere niente: in
      // chat «Francy ha ricevuto l'SOS di Francy» non vuol dire niente,
      // e sembrava di risparmiare una riga inutile. Ma la riga era anche
      // l'unica **memoria** del fatto che l'avevi chiuso: la riga finta
      // vive solo dentro questo schermo, e la prima rilettura — un
      // evento dal database, l'app che torna avanti, la rete che
      // rientra — la spazzava via e il cartello tornava su. Chi aveva
      // mandato l'SOS non riusciva piu' a togliersi il proprio cartello.
      //
      // Adesso la riga si scrive sempre e a non farla vedere ci pensa la
      // chat, che salta le ricevute del proprio SOS (`Feed.jsx`).
      // Nascondere e non scrivere sono due cose diverse, e qui serviva
      // la prima.
      try {
        const vera = await mandaRicevuta({
          sosId: sos.id,
          sosDi: sos.autoreId,
          nomeDi,
          memberId: ioId,
        })
        // ⚠️ La riga vera prende subito il posto di quella finta, invece
        // di aspettare che torni dal realtime: fra l'una e l'altro c'e'
        // una finestra in cui una rilettura poteva non contenere ne' la
        // finta (l'ha tolta lei) ne' la vera (non era ancora scritta).
        if (vera?.id) {
          setRicevute((p) => [vera, ...p.filter((r) => r.id !== finto.id)])
        }
        return true
      } catch {
        // Non e' andata: il cartello torna su, cosi' si puo' ripremere.
        // Meglio un cartello di troppo che uno di meno.
        setRicevute((p) => p.filter((r) => r.id !== finto.id))
        return false
      }
    },
    [ioId]
  )

  return { aperti, ricevute, ricevuto }
}
