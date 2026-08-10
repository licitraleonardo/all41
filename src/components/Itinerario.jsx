import { useEffect, useRef, useState } from 'react'
import './Itinerario.css'
import Foglio from './Foglio.jsx'
import Posizioni from './Posizioni.jsx'
import { chiediPosizione, condividiPosizione } from '../lib/posizione.js'
import { haDettoNoOggi } from '../lib/rinfrescaPosizione.js'
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
  // «Aggiorno dove sei…» / «Aggiornata» / il motivo se non riesce.
  const [posizione, setPosizione] = useState(null)

  // ⚠️ La mappa si apre SUBITO, l'aggiornamento va per conto suo.
  //
  // Chi tocca il mondino voleva vedere, e vedere non deve dipendere
  // dall'essere visti: col permesso negato o senza segnale la mappa resta
  // utile con le posizioni di prima.
  //
  // ⚠️ E non e' silenzioso. In `Posizioni.jsx` c'e' scritto dal primo
  // giorno «la posizione si condivide con un tasto, mai da sola»: il
  // mondino **e'** un tasto, ma dice «dove siamo» e non «condividi dove
  // sono» — uno lo tocca per guardare e come effetto pubblica dov'e' a
  // sette persone. Per questo mentre aggiorna lo dice, e quando ha finito
  // lo scrive. Un aggiornamento che si vede e' un'altra cosa da uno di
  // nascosto.
  async function apriMappa() {
    setMappaAperta(true)
    if (!membro?.id) return

    // ⚠️ Chi oggi ha risposto «no» all'aggiornamento della posizione, no
    // ha detto. L'ha detto una volta sola, a un banner che allora era
    // l'unico modo di arrivarci: non vale di meno perché adesso c'è una
    // strada nuova. Qui la mappa si apre e basta, in silenzio — non
    // aggiornare è quello che uno si aspetta, e non va annunciato.
    if (haDettoNoOggi()) return

    setPosizione('in-corso')
    try {
      await condividiPosizione(membro.id, await chiediPosizione())
      setPosizione('fatta')
    } catch {
      setPosizione('no')
    }
  }
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
        {/* Il mondino sta qui, accanto al conto alla rovescia, dove
            l'occhio passa gia'. Prima era un riquadro sotto, con cerchio
            scuro e due righe di testo: si prendeva una riga intera per
            dire una cosa che un mappamondo dice da solo. */}
        <div className="oggi-testa">
          <RigaAttesa />
          <button
            type="button"
            className="oggi-mondo"
            onClick={apriMappa}
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

      {mappaAperta && (
        <Foglio etichetta="Dove siamo" className="foglio-mappa" onChiudi={() => setMappaAperta(false)}>
          <>
            {/* ⚠️ Questa riga non è un dettaglio: è quello che rende
                onesto il mondino. Toccandolo si pubblica dov'è uno a
                sette persone, e chi l'ha toccato voleva guardare, non
                farsi guardare. Detto mentre succede, è comodo; fatto in
                silenzio, sarebbe sgradevole. */}
            {posizione === 'in-corso' && (
              <p className="mappa-aggiorno" role="status">
                Aggiorno dove sei…
              </p>
            )}
            {posizione === 'fatta' && (
              <p className="mappa-aggiorno" role="status">
                Aggiornato anche dove sei tu.
              </p>
            )}
            {posizione === 'no' && (
              <p className="mappa-aggiorno guasto" role="status">
                Dove sei tu non si è aggiornato. Il resto della mappa vale lo stesso.
              </p>
            )}

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
