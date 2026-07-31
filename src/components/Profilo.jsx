import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'
import { VIAGGIO } from '../config/viaggio.js'

// Segnaposto: qui al punto 3 arriva l'itinerario e la struttura a tab.
// Modifica e uscita traslocheranno nel tab Altro quando esisterà.
export default function Profilo({ membro, onModifica, onEsci, onIndietro }) {
  const [confermaUscita, setConfermaUscita] = useState(false)

  if (confermaUscita) {
    return (
      <div className="pannello">
        <h1 className="titolo">Sicuro?</h1>
        <p className="allan">
          Questo dispositivo si dimentica di te. Per rientrare serve il codice,
          e l&rsquo;unico modo per riaverlo è questo:
        </p>

        <p className="codice-grande">{membro.codice}</p>

        <button type="button" className="primario" onClick={onEsci}>
          L&rsquo;ho segnato, esci
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
      <img
        className="avatar-grande"
        src={urlAvatar(membro.avatarStyle, membro.avatarSeed)}
        alt=""
        width="96"
        height="96"
      />
      <h1 className="titolo">{membro.nome}</h1>
      <p className="sottotitolo">{VIAGGIO.etichetta}</p>

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
        Indietro
      </button>

      <button type="button" className="secondario" onClick={onModifica}>
        Cambia nome e avatar
      </button>
      <button
        type="button"
        className="secondario"
        onClick={() => setConfermaUscita(true)}
      >
        Esci da questo dispositivo
      </button>
    </div>
  )
}
