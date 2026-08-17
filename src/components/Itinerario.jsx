import { useEffect, useRef, useState } from 'react'
import './Itinerario.css'
import Foglio from './Foglio.jsx'
import Posizioni from './Posizioni.jsx'
import Giorno from './Giorno.jsx'
import Meteo from './Meteo.jsx'
import RigaAttesa from './RigaAttesa.jsx'
import ProssimoViaggio from './ProssimoViaggio.jsx'
import TempoPassato from './TempoPassato.jsx'
import { PROSSIMO } from '../config/prossimoViaggio.js'
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

  // Due schermate: il prossimo viaggio (dove l'app si apre) e
  // l'itinerario della Sardegna, che si raggiunge con la freccia.
  //
  // ⚠️ La scelta si ricorda in `sessionStorage` e non in `localStorage`, e
  // le due cose danno comportamenti opposti:
  //
  //   - **aprendo l'app** si torna sempre sul prossimo viaggio, che è
  //     quello che deve dare l'impressione di dove sta andando l'app
  //   - **dentro la stessa sessione** la scelta resta: chi sta leggendo
  //     l'itinerario, passa in chat e torna qui, ritrova l'itinerario
  //
  // Con `localStorage` si perdeva la prima; senza niente si perdeva la
  // seconda, ed è la più fastidiosa — essere sbattuti fuori da quello che
  // stavi guardando sembra un difetto, non una scelta.
  const [vista, setVista] = useState(() => {
    try {
      return sessionStorage.getItem('all41.vistaItinerario') ?? 'prossimo'
    } catch {
      // Safari in navigazione privata può rifiutare: si riparte dal
      // prossimo viaggio, che è il default comunque.
      return 'prossimo'
    }
  })

  function vaiA(quale) {
    setVista(quale)
    try {
      sessionStorage.setItem('all41.vistaItinerario', quale)
    } catch {
      // vedi sopra
    }
  }

  // ⚠️ Toccare il mondino apre la mappa e **non fa nient'altro**.
  //
  // Per un giorno ha anche aggiornato la posizione di chi lo toccava, e
  // la cosa era dichiarata a schermo mentre succedeva. Non bastava: in
  // `Posizioni.jsx` c'e' scritto dal primo giorno «la posizione si
  // condivide con un tasto, mai da sola», e questo era un tasto che
  // diceva «dove siamo» — uno lo toccava per guardare e come effetto
  // pubblicava dov'era a sette persone. La lettera della regola reggeva,
  // l'intenzione no.
  //
  // Dentro la mappa il tasto c'e' e dice «Aggiorna dove sono»: chi vuole
  // farsi vedere lo preme, e sa di averlo premuto.
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

      {vista === 'prossimo' ? (
        <div className="wrap">
          <ProssimoViaggio onIndietro={() => vaiA('sardegna')} />
        </div>
      ) : (
      <div className="wrap">
        <button
          type="button"
          className="torna-prossimo"
          onClick={() => vaiA('prossimo')}
        >
          <span aria-hidden="true">←</span> {PROSSIMO.titolo}
        </button>
        <TempoPassato />
        <p className="oggi-viaggio">{VIAGGIO.etichetta}</p>
        {/* Il mondino sta qui, accanto al conto alla rovescia, dove
            l'occhio passa gia'. Prima era un riquadro sotto, con cerchio
            scuro e due righe di testo: si prendeva una riga intera per
            dire una cosa che un mappamondo dice da solo. */}
        <div className="oggi-testa">
          <RigaAttesa />
          <button
            type="button"
            className="oggi-mondo"
            onClick={() => setMappaAperta(true)}
            aria-label="Dove siamo — la mappa del gruppo"
          >
            🌍
          </button>
        </div>
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
      )}

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
