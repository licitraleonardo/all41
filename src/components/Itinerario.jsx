import { useEffect, useRef } from 'react'
import './Itinerario.css'
import Giorno from './Giorno.jsx'
import Meteo from './Meteo.jsx'
import RigaAttesa from './RigaAttesa.jsx'
import { GIORNI } from '../config/itinerario.js'
import { giornoPerData } from '../lib/giorni.js'
import { useDataDiOggi } from '../hooks/useDataDiOggi.js'
import { urlAvatar } from '../config/avatar.js'
import { VIAGGIO } from '../config/viaggio.js'

export default function Itinerario({ membro, onProfilo }) {
  const data = useDataDiOggi()
  const oggi = giornoPerData(data)
  const rifOggi = useRef(null)

  // Durante il viaggio la scheda di oggi può essere due schermate più in
  // basso. Senza animazione: all'apertura una pagina che scorre da sola dà
  // fastidio. Il primo giorno non si scorre, sarebbe movimento per niente.
  useEffect(() => {
    if (!oggi || oggi.giorno === GIORNI[0].giorno) return
    rifOggi.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [oggi])

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
        <RigaAttesa />
        <Meteo dataOggi={data} />

        <div className="timeline">
          {GIORNI.map((g) => {
            const eOggi = oggi?.giorno === g.giorno
            return (
              <Giorno
                key={g.giorno}
                giorno={g}
                oggi={eOggi}
                ref={eOggi ? rifOggi : null}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
