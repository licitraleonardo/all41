import { useCallback, useEffect, useRef, useState } from 'react'
import { LEGGI, PUNIZIONI, TROFEI, etichetta, verso } from '../config/leggi.js'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import {
  daLeggere,
  useLetteTestamento,
  useSpegniGuardando,
} from '../hooks/useLetteTestamento.js'

// Il codice delle Leggi scoperte. Continua di proposito il tono
// legislativo: qui Allan non parla, custodisce e basta.
//
// Due schede, perché sono due cose diverse: i Trofei sono quello che si
// va a cercare, le Leggi quello in cui si inciampa. In un elenco solo si
// leggevano tutte come una lista di divieti.
//
// Niente parte rivelato: sapere in partenza cosa fa guadagnare punti
// trasformerebbe il gioco in un elenco di compiti.
export default function Testamento({ scoperte, membri, ioId, apriLegge, onLeggeAperta }) {
  // Terzo livello, stessa regola dei sotto-tab: ricaricare non deve
  // riportarti sui Trofei se stavi leggendo le Leggi.
  const [meta, setMeta] = useSchedaRicordata('scheda.testamento', 'trofei', ['trofei', 'leggi'])
  const { lette, segnaLetta } = useLetteTestamento(ioId)
  const [aperta, setAperta] = useState(null)

  // Arrivando dal banner si atterra sulla Legge giusta, gia' aperta e
  // nella sua scheda: senza, "Leggila" avrebbe portato su un elenco di
  // venticinque voci da spulciare, che e' quello che il banner doveva
  // evitare.
  useEffect(() => {
    if (!apriLegge) return
    const voce = LEGGI.find((l) => l.id === apriLegge)
    if (voce) {
      setMeta(verso(voce) === 'trofeo' ? 'trofei' : 'leggi')
      setAperta(apriLegge)
    }
    onLeggeAperta?.()
  }, [apriLegge, onLeggeAperta, setMeta])
  const rivelata = (l) => Boolean(scoperte[l.id])
  const quante = LEGGI.filter(rivelata).length
  const quota = Math.round((quante / LEGGI.length) * 100)

  const elenco = meta === 'trofei' ? TROFEI : PUNIZIONI

  return (
    <div className="gioco-corpo">
      <header className="testamento-testata">
        {/* Senza la faccia accanto al titolo: quella immagine adesso è
            di Allan che parla nel tutorial, e averla anche qui la
            trasformava in decorazione. Il Testamento è il posto dove
            Allan custodisce e sta zitto. */}
        <div className="testamento-custode-riga">
          <div>
            <h2 className="testamento-titolo">Testamento</h2>
            <p className="testamento-custode">Custodito da Allan</p>
          </div>
        </div>

        <p className="testamento-conto">
          Scoperte: <strong>{quante}</strong> / {LEGGI.length}
        </p>
        <div className="barra-scoperte" role="presentation">
          <span style={{ width: `${quota}%` }} />
        </div>
      </header>

      <div className="segmenti minori" role="tablist">
        {[
          ['trofei', 'Trofei', TROFEI],
          ['leggi', 'Leggi', PUNIZIONI],
        ].map(([id, nome, gruppo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={meta === id}
            className={meta === id ? 'segmento attivo' : 'segmento'}
            onClick={() => setMeta(id)}
          >
            {nome}
            <span className="segmento-conto">
              {gruppo.filter(rivelata).length}/{gruppo.length}
            </span>
            {/* Quante ne hai scoperte senza averle ancora aperte: è il
                numero che ti fa toccare la scheda. */}
            {daLeggere(gruppo, scoperte, lette) > 0 && (
              <span className="segmento-pallino">{daLeggere(gruppo, scoperte, lette)}</span>
            )}
          </button>
        ))}
      </div>

      <p className="testamento-sottotitolo">
        {meta === 'trofei' ? 'Quello che si va a cercare.' : 'Quello in cui si inciampa.'}
      </p>

      <ol className="leggi">
        {elenco.map((l) => {
          const scoperta = scoperte[l.id]
          if (!rivelata(l)) {
            return (
              <li key={l.id} className="legge oscurata">
                <span className="legge-numero">{etichetta(l)}</span>
                <span className="legge-buio" aria-label="non ancora scoperta">
                  ███████████
                </span>
              </li>
            )
          }

          return (
            <Voce
              key={l.id}
              legge={l}
              scoperta={scoperta}
              membri={membri}
              daAprire={!lette.has(l.id)}
              aperta={aperta === l.id}
              onApri={() => setAperta(aperta === l.id ? null : l.id)}
              onLetta={() => segnaLetta(l.id)}
            />
          )
        })}
      </ol>
    </div>
  )
}

// Una voce scoperta. Il pallino si spegne guardandola: mezzo secondo
// dentro lo schermo e basta, senza doverla toccare. Toccarla serve a
// un'altra cosa — aprire e vedere chi l'ha fatta scattare.
function Voce({ legge, scoperta, membri, daAprire, aperta, onApri, onLetta }) {
  const riga = useRef(null)

  // Aperta dal banner: si porta sotto gli occhi da sola. In fondo a
  // venticinque voci, "aperta" senza "visibile" non vuol dire niente.
  useEffect(() => {
    if (aperta && riga.current) {
      riga.current.scrollIntoView({ block: 'center' })
    }
  }, [aperta])
  // La chiamata deve restare la stessa fra un disegno e l'altro, o
  // l'osservatore si smonta e rimonta a ogni fotogramma e il mezzo
  // secondo non scade mai.
  const letta = useCallback(() => onLetta(), [onLetta])
  useSpegniGuardando(riga, daAprire, letta)

  return (
    <li ref={riga} className={daAprire ? 'legge nuova' : 'legge'}>
      <button type="button" className="legge-riga" aria-expanded={aperta} onClick={onApri}>
        <span className="legge-numero">
          {etichetta(legge)}
          {daAprire && <span className="legge-punto" aria-label="non ancora letta" />}
        </span>
        <p className="legge-testo">{legge.testo}</p>
        <span className="legge-punti">{punti(legge.punti)}</span>
      </button>

      {/* Chi l'ha fatta scattare e quando: è la parte che vale la pena
          andare a vedere, ed è quello che si guadagna toccando. */}
      {aperta && (
        <span className="legge-scoperta">
          scoperta da {membri[scoperta.chi]?.nome ?? 'qualcuno'}, {giorno(scoperta.quando)}
        </span>
      )}
    </li>
  )
}

function punti(p) {
  if (typeof p !== 'number') return p
  return p > 0 ? `+${p}` : String(p)
}

function giorno(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}
