import { useEffect, useState } from 'react'
import './ChiediNotifiche.css'
import Toast from './Toast.jsx'
import {
  comeStaMesso,
  disiscriviti,
  installataSullaHome,
  iscriviti,
  notifichePossibili,
  statoIscrizione,
  suAndroid,
  suIPhone,
} from '../lib/notifiche.js'

// «Notifiche» con un interruttore, dentro le Impostazioni.
//
// ⚠️ Quello che c'era prima non è stato buttato: è stato nascosto.
//
// Le spiegazioni («SOS e si riparte sempre, messaggi e vocali una volta
// sola»), il messaggio di quando sono bloccate, la riga tecnica: sono
// costate cinque giri di messaggi a capire perché il tasto non
// funzionava, e serviranno di nuovo il giorno in cui succede a qualcun
// altro del gruppo.
//
// Ma chi accende e basta non deve leggersi niente di tutto questo.
// Quindi **compaiono solo quando qualcosa non va**: acceso e spento sono
// una riga sola con un interruttore.

// Ogni motivo ha la sua frase, e ognuna dice cosa fare. Prima c'era un
// «Non è andata. Riprova.» per tutto: chi lo leggeva non sapeva se fosse
// colpa sua, del telefono o dell'app.
const MOTIVI = {
  'non-installata':
    'Su iPhone devi prima mettere l’app sulla schermata home: tasto condividi, «Aggiungi a Home». Da Safari non si può proprio.',
  default: 'Hai chiuso il cartello senza rispondere. Riprova e premi «Consenti».',
  impossibile: 'Questo browser non sa mandare notifiche.',
  'non configurato':
    'Manca la chiave delle notifiche. È una cosa da sistemare qui, non sul tuo telefono.',
  'iscrizione-vuota':
    'Il telefono non ha dato un indirizzo valido. Prova a chiudere e riaprire l’app.',
}

// Dove si riaccendono, con le parole del telefono che uno ha in mano.
//
// ⚠️ Su Android questa frase mandava nel posto sbagliato, e l'ho visto
// succedere: nelle informazioni dell'app c'è scritto «Notifiche:
// Consentite», quindi sembra tutto a posto e non si capisce più niente.
// Sono due permessi diversi, e quello che manca è quello del **sito**.
function spiegaBlocco() {
  if (suAndroid()) {
    return 'Le hai bloccate per questo sito. Apri all41.vercel.app in Chrome, tocca l’icona a sinistra dell’indirizzo → Autorizzazioni → Notifiche → Consenti. ⚠️ Non è la voce «Notifiche» nelle informazioni dell’app: quella è un’altra cosa ed è già a posto.'
  }
  if (suIPhone()) {
    return 'Le hai bloccate. Impostazioni → Notifiche → All For One, e riaccendile.'
  }
  return 'Le hai bloccate per questo sito. Si riaccendono dalle impostazioni del browser, alla voce di questo indirizzo.'
}

export default function ChiediNotifiche({ membroId }) {
  // ⚠️ Lo stato è «sono iscritto?», non «ho dato il permesso?».
  //
  // Confonderli aveva bloccato tutto: il permesso resta concesso per
  // sempre, quindi il tasto diceva «Spegni» anche a chi non era iscritto
  // per niente — e non restava nessun modo di iscriversi.
  const [stato, setStato] = useState('spente')
  const [inCorso, setInCorso] = useState(false)
  const [esito, setEsito] = useState(null)
  const [diagnostica, setDiagnostica] = useState(null)
  const [toast, setToast] = useState(null)

  const rileggi = () => statoIscrizione().then(setStato)
  useEffect(() => {
    rileggi()
  }, [])

  const acceso = stato === 'accese'

  async function alterna() {
    if (inCorso) return
    setInCorso(true)
    setEsito(null)
    setDiagnostica(null)

    try {
      if (acceso) {
        await disiscriviti()
        await rileggi()
        setToast('Disattivate')
        return
      }

      const r = await iscriviti(membroId)
      await rileggi()
      if (r.ok) {
        setToast('Attivate')
        return
      }

      // Da qui in giù si entra solo quando qualcosa non va, ed è lì che
      // servono le spiegazioni lunghe.
      setDiagnostica(await comeStaMesso().catch(() => null))
      if (r.motivo === 'denied') {
        // ⚠️ Lo stato si mette a mano e non si rilegge:
        // `Notification.permission` non sempre si aggiorna subito dopo un
        // rifiuto, e una riga «Spente» accanto a un messaggio che dice
        // «bloccate» si smentiscono a vicenda. È successo, e in una
        // schermata così non ci si capisce più niente.
        setStato('bloccate')
        setEsito(spiegaBlocco())
      } else if (r.motivo === 'database') {
        setEsito(`Il database ha rifiutato: ${r.dettaglio ?? 'motivo sconosciuto'}`)
      } else {
        setEsito(MOTIVI[r.motivo] ?? `Non è andata (${r.motivo}).`)
      }
    } catch (e) {
      setDiagnostica(await comeStaMesso().catch(() => null))
      setEsito(`Non è andata: ${e?.name ?? 'errore'} — ${e?.message ?? ''}`)
    } finally {
      setInCorso(false)
    }
  }

  if (!notifichePossibili()) {
    return (
      <p className="notifiche-nota">
        Questo browser non sa mandare notifiche. Su iPhone funzionano solo con l’app messa
        sulla schermata home.
      </p>
    )
  }

  // Va storto qualcosa? Solo allora si spiega.
  const conProblemi = stato === 'bloccate' || Boolean(esito)

  return (
    <>
      <div className="notifiche">
        <div className="notifiche-riga">
          <span className="notifiche-nome">Notifiche</span>

          {/* L'interruttore: pieno quando è acceso, vuoto quando è spento.
              Un tasto che dice «Accendi» non dice come sei messo adesso —
              questo lo dice guardandolo. */}
          <button
            type="button"
            role="switch"
            aria-checked={acceso}
            aria-label="Notifiche"
            className={acceso ? 'interruttore acceso' : 'interruttore'}
            onClick={alterna}
            disabled={inCorso}
          >
            <span className="interruttore-pallino" />
          </button>
        </div>

        {conProblemi && (
          <div className="notifiche-guai">
            {/* Cosa arriva, se accese. Detto qui perché un permesso
                concesso senza sapere cosa aspettarsi si revoca alla terza
                notifica. */}
            <p className="notifiche-cosa">
              SOS e «si riparte» sempre. Messaggi e vocali:{' '}
              <strong>una notifica sola</strong> e poi più niente, finché non riapri.
            </p>

            {esito && <p className="notifiche-esito">{esito}</p>}

            {suIPhone() && !installataSullaHome() && (
              <p className="notifiche-esito">
                Sei nel browser, non nell’app. Su iPhone le notifiche funzionano solo
                dall’app messa sulla schermata home.
              </p>
            )}

            {/* La riga per chi ripara, non per chi usa: dice quale dei tre
                permessi che si chiamano tutti «Notifiche» sta dicendo di
                no. Si fotografa e si manda. */}
            {diagnostica && <p className="notifiche-diagnostica">{diagnostica}</p>}
          </div>
        )}
      </div>

      <Toast messaggio={toast} onChiudi={() => setToast(null)} secondi={2} />
    </>
  )
}
