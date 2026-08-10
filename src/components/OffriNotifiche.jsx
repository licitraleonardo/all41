import { useEffect, useState } from 'react'
import './OffriNotifiche.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import {
  installataSullaHome,
  iscriviti,
  notifichePossibili,
  statoIscrizione,
  suIPhone,
} from '../lib/notifiche.js'
import {
  rimandatoIl,
  segnaRimandato,
  vaOffertoIlPermesso,
} from '../lib/quandoChiedereNotifiche.js'

// «Vuoi attivare le notifiche?», aprendo l'app.
//
// ⚠️ Questa riga esiste per non bruciare il cartello del browser.
//
// Quel cartello si può mostrare una volta sola: un «Blocca» è quasi
// definitivo — il browser smette di chiedere, e per tornare indietro
// bisogna entrare nelle impostazioni del sito. Chiedendo prima qui, un
// «Non ora» costa zero e si può richiedere domani; al cartello vero ci
// arriva solo chi ha già detto di sì, cioè quando la risposta è quasi
// certa.
//
// ⚠️ **Fisso in cima come i suoi cinque fratelli, e non è un dettaglio
// di stile.**
//
// La prima versione era un riquadro nel flusso normale, e siccome in
// `App.jsx` i banner stanno dopo tutto il resto, finiva **in fondo al
// documento**: nelle Info — la schermata più lunga — si vedeva spuntare
// laggiù, dove non c'entrava niente. Qui si riusa la stessa impaginazione
// degli altri (`.banner-dentro` e compagnia nascono in
// BannerProposta.css) e lo stesso `useAltezzaBanner`, che misura quanto
// occupa e fa scendere la schermata invece di lasciarcela finire sotto.
//
// ⚠️ «Consigliato» è vero, e va tolto il giorno in cui smette di
// esserlo: l'SOS è l'unica funzione di sicurezza dell'app, e senza
// notifiche arriva solo a chi ha l'app aperta in quel momento.
export default function OffriNotifiche({ membroId }) {
  const [mostra, setMostra] = useState(false)
  const [inCorso, setInCorso] = useState(false)
  const [riquadro, setRiquadro] = useState(null)
  useAltezzaBanner(riquadro, mostra)

  useEffect(() => {
    if (!membroId) return
    let vivo = true
    ;(async () => {
      // Lo stato vero, non solo il permesso: chi è già iscritto non deve
      // vedere niente. Confondere le due cose ci era già costato un
      // vicolo cieco.
      const stato = await statoIscrizione().catch(() => null)
      if (!vivo || stato === 'accese') return

      if (
        vaOffertoIlPermesso({
          permesso: notifichePossibili() ? Notification.permission : 'denied',
          possibili: notifichePossibili(),
          suIPhone: suIPhone(),
          installataSullaHome: installataSullaHome(),
          rimandatoIl: rimandatoIl(),
        })
      ) {
        setMostra(true)
      }
    })()
    return () => {
      vivo = false
    }
  }, [membroId])

  if (!mostra) return null

  async function attiva() {
    setInCorso(true)
    // ⚠️ Solo qui parte il cartello del browser, e ci arriva chi ha
    // appena detto di sì. Comunque vada la riga sparisce: se ha
    // funzionato non serve più, se ha detto «Blocca» riproporla non
    // riaprirebbe nessuna porta.
    await iscriviti(membroId).catch(() => null)
    setMostra(false)
  }

  function nonOra() {
    segnaRimandato()
    setMostra(false)
  }

  return (
    <div
      className="banner-notifiche"
      role="region"
      aria-label="Attivare le notifiche"
      ref={setRiquadro}
    >
      <div className="banner-dentro">
        <p className="banner-testo">
          <strong>Vuoi attivare le notifiche?</strong>
          <span className="banner-motivo">
            SOS e «si riparte» ti arrivano anche con l’app chiusa. Consigliato.
          </span>
        </p>

        <div className="banner-scelte">
          <button type="button" className="banner-si" onClick={attiva} disabled={inCorso}>
            {inCorso ? 'Un attimo…' : 'Attiva'}
          </button>
          <button type="button" className="banner-dopo" onClick={nonOra} disabled={inCorso}>
            Non ora
          </button>
        </div>
      </div>
    </div>
  )
}
