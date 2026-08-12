import { useState } from 'react'
import './InterruttorePosizione.css'
import {
  eUnNoDefinitivo,
  impostaPosizioneAutomatica,
  posizioneAutomatica,
} from '../lib/posizioneAutomatica.js'
import { chiediPosizione, condividiPosizione } from '../lib/posizione.js'

// L'interruttore della posizione automatica, sotto le notifiche.
//
// ⚠️ Spento di default, e non è un dettaglio: è la condizione che tiene
// insieme questa funzione con la regola scritta il 10 agosto — «la
// posizione si condivide con un tasto, mai da sola». Da sola sì, ma solo
// se l'hai acceso tu, e dicendotelo ogni volta.
//
// Accendendolo chiede subito il permesso e manda la posizione una prima
// volta: se il telefono dice di no, si scopre adesso e non alla prossima
// apertura, quando nessuno sarebbe lì a guardare.
export default function InterruttorePosizione({ membroId }) {
  const [acceso, setAcceso] = useState(posizioneAutomatica)
  const [inCorso, setInCorso] = useState(false)
  const [esito, setEsito] = useState(null)

  async function cambia() {
    if (inCorso) return
    setEsito(null)

    if (acceso) {
      setAcceso(impostaPosizioneAutomatica(false))
      return
    }

    setInCorso(true)
    try {
      const dove = await chiediPosizione()
      await condividiPosizione(membroId, dove)
      // ⚠️ Niente messaggio quando va bene: la leva si sposta, e si vede.
      // Un «Fatto!» sotto un interruttore che ha appena cambiato colore è
      // esattamente il suggerimentino di troppo. Resta il messaggio
      // quando **non** va, che quello non si vede da nessun'altra parte.
      setAcceso(impostaPosizioneAutomatica(true))
    } catch (e) {
      // Resta spento. ⚠️ Accenderlo comunque vorrebbe dire un
      // interruttore che dice «acceso» mentre non succede niente.
      setAcceso(impostaPosizioneAutomatica(false))
      setEsito(
        eUnNoDefinitivo(e)
          ? 'Il telefono non dà la posizione. Va sbloccata nelle impostazioni.'
          : 'Non è arrivata: riprova fra un attimo.'
      )
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="posizione-auto">
      <button
        type="button"
        className="posizione-riga"
        onClick={cambia}
        aria-pressed={acceso}
        disabled={inCorso}
      >
        {/* ⚠️ Solo il titolo: niente sottotitolo che spiega.
            Un interruttore con due righe di didascalia sotto si legge una
            volta e poi diventa rumore, e questa schermata è stata rifatta
            apposta per smettere di spiegare. Cosa fa lo dice il nome, e
            se non parte lo dice l'errore qui sotto — che invece resta,
            perché quello non è un suggerimento, è un fatto. */}
        <span className="posizione-testo">
          <strong>Posizione all’apertura</strong>
        </span>
        <span className={acceso ? 'posizione-leva accesa' : 'posizione-leva'} aria-hidden="true">
          <span className="posizione-pallina" />
        </span>
      </button>

      {inCorso && <p className="posizione-esito">Chiedo al telefono…</p>}
      {esito && !inCorso && (
        <p className="posizione-esito" role="status">
          {esito}
        </p>
      )}
    </div>
  )
}
