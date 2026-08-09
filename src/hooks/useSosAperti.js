import { useCallback, useEffect, useState } from 'react'
import { eliminaAzione, leggiSosAperti } from '../lib/azioni.js'
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
export function useSosAperti() {
  const [aperti, setAperti] = useState([])

  useEffect(() => {
    let vivo = true
    // La prima iscrizione non è un ritorno: si rilegge dalla seconda in
    // poi, cioè quando il canale si è ricollegato dopo essere caduto.
    let giaCollegato = false

    const carica = () =>
      leggiSosAperti()
        .then((elenco) => vivo && setAperti(elenco))
        .catch(() => {})

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

  // «Rientrato» lo può premere chiunque, non solo chi l'ha mandato: chi
  // si è perso ha il telefono in mano per orientarsi, non per chiudere
  // cartelli, e spesso è un altro ad averlo trovato. Stesso principio del
  // turno dell'Impostore, che può far avanzare chiunque.
  const rientrato = useCallback(async (id) => {
    try {
      await eliminaAzione(id)
      setAperti((precedenti) => precedenti.filter((a) => a.id !== id))
      return true
    } catch {
      // Resta lì: meglio un cartello di troppo che uno di meno.
      return false
    }
  }, [])

  return { aperti, rientrato }
}
