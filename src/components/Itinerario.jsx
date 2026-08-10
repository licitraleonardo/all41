import { useEffect, useRef, useState } from 'react'
import './Itinerario.css'
import Foglio from './Foglio.jsx'
import Posizioni from './Posizioni.jsx'
import Giorno from './Giorno.jsx'
import Meteo from './Meteo.jsx'
import RigaAttesa from './RigaAttesa.jsx'
import { GIORNI } from '../config/itinerario.js'
import { giornoPerData } from '../lib/giorni.js'
import { useDataDiOggi } from '../hooks/useDataDiOggi.js'
import { urlAvatar } from '../config/avatar.js'
import { VIAGGIO } from '../config/viaggio.js'

export default function Itinerario({ membro, onProfilo }) {
  // ⚠️ La mappa sta qui e non piu' in una sezione sua.
  //
  // «Dove siete» e' una domanda che ci si fa guardando il programma della
  // giornata — «a che ora ci si trova, e dove sono adesso gli altri» sono
  // la stessa domanda. Nascosta dentro un tab chiamato «Altro» non la
  // trovava nessuno.
  //
  // Si apre a schermo pieno dentro `Foglio`, che ha gia' le tre uscite:
  // tocco fuori, tasto indietro ed Esc.
  const [mappaAperta, setMappaAperta] = useState(false)
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
      {/* Senza "Sardegna · 12–16 agosto": in una barra fissa alta 44px
          quella riga rubava spazio al marchio e all'avatar per dire una
          cosa che non cambia mai. Adesso sta accanto al conto alla
          rovescia, dove ha un senso leggerla. */}
      <header className="barra-alta">
        <div className="barra-marchio">ALL41</div>
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
        <p className="oggi-viaggio">{VIAGGIO.etichetta}</p>
        <RigaAttesa />
        <Meteo dataOggi={data} />

        {/* Il mondino: sta in fondo al programma, dove uno arriva dopo
            aver letto cosa si fa oggi. */}
        <button type="button" className="oggi-mondo" onClick={() => setMappaAperta(true)}>
          <span className="oggi-mondo-icona" aria-hidden="true">
            🌍
          </span>
          <span className="oggi-mondo-testo">
            <strong>Dove siamo</strong>
            <small>La mappa del gruppo</small>
          </span>
          <span className="oggi-mondo-freccia" aria-hidden="true">
            ›
          </span>
        </button>

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

      {mappaAperta && (
        <Foglio etichetta="Dove siamo" className="foglio-mappa" onChiudi={() => setMappaAperta(false)}>
          <>
            <Posizioni membro={membro} />
            <button
              type="button"
              className="secondario-foglio"
              onClick={() => setMappaAperta(false)}
            >
              Chiudi
            </button>
          </>
        </Foglio>
      )}
    </div>
  )
}
