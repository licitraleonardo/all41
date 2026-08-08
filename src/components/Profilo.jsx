import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'

// Segnaposto: qui al punto 3 arriva l'itinerario e la struttura a tab.
// Modifica e uscita traslocheranno nel tab Altro quando esisterà.
export default function Profilo({ membro, onModifica, onEsci, onIndietro }) {
  const [confermaUscita, setConfermaUscita] = useState(false)

  if (confermaUscita) {
    return (
      <div className="pannello">
        <h1 className="titolo">Sicuro?</h1>
        <p className="allan">
          Questo dispositivo si dimentica di te. Per rientrare serve il codice, e
          l&rsquo;unico modo per riaverlo è questo:
        </p>

        {/* Il codice resta scritto grande anche se lo copiamo noi: la
            copia può fallire — permesso negato, telefono su http — e
            questa è l'unica azione dell'app che non si può disfare. Una
            rete di sicurezza che costa una riga. */}
        <p className="codice-grande">{membro.codice}</p>

        <p className="istruzioni">Uscendo te lo copio negli appunti.</p>

        <button type="button" className="primario" onClick={onEsci}>
          Copia ed esci
        </button>
        <button
          type="button"
          className="secondario"
          onClick={() => setConfermaUscita(false)}
        >
          Lascia stare
        </button>
      </div>
    )
  }

  return (
    <div className="pannello">
      {/* Si cambia faccia toccando la faccia. Prima era un bottone in
          fondo, in mezzo agli altri due: la cosa che uno viene a fare qui
          stava sotto quella che non vuole fare mai. */}
      <button
        type="button"
        className="avatar-modifica"
        onClick={onModifica}
        aria-label="Cambia nome e avatar"
      >
        <img
          className="avatar-grande"
          src={urlAvatar(membro.avatarStyle, membro.avatarSeed)}
          alt=""
          width="96"
          height="96"
        />
        <span className="avatar-matita" aria-hidden="true">
          ✏️
        </span>
      </button>

      <h1 className="titolo">{membro.nome}</h1>
      <p className="sottotitolo">Tocca la faccia per cambiare nome e avatar</p>

      <dl className="targa">
        <div>
          <dt>Codice</dt>
          <dd>{membro.codice}</dd>
        </div>
        <div>
          <dt>Punti</dt>
          <dd>{membro.punteggio}</dd>
        </div>
      </dl>

      <button type="button" className="primario" onClick={onIndietro}>
        Torna al viaggio
      </button>

      {/* In rosso perché è l'unica cosa in questa schermata che si può
          rimpiangere: senza il codice non si rientra. */}
      <button
        type="button"
        className="pericolo"
        onClick={() => setConfermaUscita(true)}
      >
        Esci da questo dispositivo
      </button>
    </div>
  )
}
