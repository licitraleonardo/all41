import { useState } from 'react'
import Foglio from './Foglio.jsx'
import { MOTIVI_SOS } from '../config/azioni.js'

// Testi piani, nessuna battuta, nessuna emoji decorativa: è l'unica
// funzione di sicurezza dell'app. Due tap per inviare, così non parte da
// solo in tasca, ma nessun limite e nessuna penalità, mai.
export default function FoglioSOS({ onInvia, onAnnulla, inCorso, errore, scaduto = false }) {
  const [motivo, setMotivo] = useState('')
  const [libero, setLibero] = useState('')

  const scelto = libero.trim() || motivo
  const puoInviare = scelto.length > 0 && !inCorso

  return (
    // ⚠️ Non si chiude toccando fuori: è l'unica funzione di sicurezza
    // dell'app, e chi la sta usando ha il telefono in mano mentre
    // cammina. Il tasto indietro invece la chiude, perché quello si preme
    // apposta. Stessa ragione dei due tocchi per mandarla.
    <Foglio
      etichetta="Richiesta di aiuto"
      chiudibileFuori={false}
      sporco={scelto.length > 0}
      onChiudi={onAnnulla}
    >
      <>
        <h2 className="foglio-titolo">Cosa succede?</h2>

        <div className="motivi">
          {MOTIVI_SOS.map((m) => (
            <button
              key={m}
              type="button"
              className={m === motivo && !libero.trim() ? 'motivo scelto' : 'motivo'}
              onClick={() => {
                setMotivo(m)
                setLibero('')
              }}
              aria-pressed={m === motivo && !libero.trim()}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="campo">
          <span>Oppure scrivi</span>
          <input
            type="text"
            value={libero}
            onChange={(e) => setLibero(e.target.value)}
            maxLength={120}
            placeholder="Cosa serve"
          />
        </label>

        {/* L'errore sta QUI dentro, sopra il bottone, e non se ne va da
            solo. Prima finiva nell'avviso della barra di scrittura, che
            sta sotto il velo di questo foglio e si cancella dopo cinque
            secondi: chi chiedeva aiuto senza segnale vedeva il bottone
            tornare com'era e se ne andava convinto di aver chiamato.
            È l'unica funzione di sicurezza dell'app: qui un fallimento
            silenzioso è il difetto peggiore possibile.

            Scaduto ha un testo suo, e non è pignoleria: se la richiesta
            non ha risposto in tempo nessuno può dire se sia partita o no,
            e scrivere "non è partita" sarebbe inventarsi una certezza che
            non c'è. La riga sotto invece è la stessa nei due casi, perché
            la cosa da fare è la stessa. */}
        {errore && (
          <p className="sos-errore" role="alert">
            {scaduto ? (
              <>
                <strong>Non ha risposto.</strong> Forse è partita, forse no: da qui
                non si può sapere.
              </>
            ) : (
              <>
                <strong>Non è partita.</strong> {errore}
              </>
            )}
            <span>Riprova, o chiama qualcuno al telefono.</span>
          </p>
        )}

        <button
          type="button"
          className="sos-conferma"
          onClick={() => onInvia(scelto)}
          disabled={!puoInviare}
        >
          {inCorso ? 'Invio…' : errore ? 'Riprova' : 'Manda la richiesta'}
        </button>

        {/* «Lascia stare» ovunque nell'app: è la stessa cosa che
            succedeva con «Annulla», «Chiudi» e la ×, detta con la stessa
            parola dappertutto. Uno esce da un foglio senza doverci
            pensare. */}
        <button type="button" className="secondario" onClick={onAnnulla}>
          Lascia stare
        </button>
      </>
    </Foglio>
  )
}
