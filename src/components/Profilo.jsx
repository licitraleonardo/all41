import { urlAvatar } from '../config/avatar.js'
import { VIAGGIO } from '../config/viaggio.js'

// Segnaposto: qui al punto 3 arriva l'itinerario e la struttura a tab.
export default function Profilo({ membro }) {
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

      <p className="allan">Sei dentro. Per ora non c&rsquo;è altro da fare.</p>
    </div>
  )
}
