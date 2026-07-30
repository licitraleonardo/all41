import './Itinerario.css'
import Giorno from './Giorno.jsx'
import { GIORNI } from '../config/itinerario.js'
import { giornoCorrente } from '../lib/giorni.js'
import { urlAvatar } from '../config/avatar.js'
import { VIAGGIO } from '../config/viaggio.js'

export default function Itinerario({ membro, onProfilo }) {
  const oggi = giornoCorrente()

  return (
    <div className="oggi-schermo">
      <header className="barra-alta">
        <div className="barra-marchio">ALL41</div>
        <div className="barra-titolo">{VIAGGIO.etichetta}</div>
        <button
          type="button"
          className="barra-avatar"
          onClick={onProfilo}
          aria-label="Il tuo profilo"
        >
          <img
            src={urlAvatar(membro.avatarStyle, membro.avatarSeed)}
            alt=""
            width="36"
            height="36"
          />
        </button>
      </header>

      <div className="wrap">
        <div className="timeline">
          {GIORNI.map((g) => (
            <Giorno key={g.giorno} giorno={g} oggi={oggi?.giorno === g.giorno} />
          ))}
        </div>
      </div>
    </div>
  )
}
