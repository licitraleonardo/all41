import { useRef, useState } from 'react'
import './Documenti.css'
import { useDocumenti } from '../hooks/useDocumenti.js'
import { caricaDocumento, eUnPdf } from '../lib/documenti.js'
import { MAX_BYTE, MAX_TITOLO, TIPI_ACCETTATI } from '../config/documenti.js'
import { descriviErrore } from '../lib/errori.js'
import FotoGrande from './FotoGrande.jsx'
import BottoneElimina from './BottoneElimina.jsx'

// I documenti del viaggio: QR dell'escursione, biglietti, prenotazioni.
//
// ⚠️ Non è un'area personale e non si chiama così. Con auth anonima e
// codice di accesso "privato" non è realmente privato: il "solo per me"
// toglie il documento dalla vista degli altri, non lo mette al sicuro.
// La riga in fondo lo dice, e deve restarci.
export default function Documenti({ membro }) {
  const { documenti, membri, stato, errore, inserisci, togli, commutaVisibilita } =
    useDocumenti(membro.id)

  const campo = useRef(null)
  const [scelto, setScelto] = useState(null)
  const [titolo, setTitolo] = useState('')
  const [soloPerMe, setSoloPerMe] = useState(false)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [grande, setGrande] = useState(null)

  function prendi(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setAvviso(null)
    setScelto(file)
    // Il nome del file è quasi sempre inutile (IMG_2931.jpg), ma quando è
    // buono risparmia di scriverlo.
    setTitolo(file.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITOLO))
  }

  async function carica() {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await caricaDocumento(scelto, membro.id, {
        titolo: titolo.trim(),
        soloPerMe,
        onStato: setAvviso,
      })

      if (!esito.ok) {
        setAvviso(`Troppo pesante: ${peso(esito.byte)}. Il tetto è ${peso(MAX_BYTE)}.`)
        return
      }

      inserisci(esito.documento)
      setScelto(null)
      setTitolo('')
      setSoloPerMe(false)
      setAvviso(null)
    } catch (e) {
      setAvviso(`Non è partito. ${descriviErrore(e)}`)
    } finally {
      setInCorso(false)
    }
  }

  function apri(d) {
    // I PDF li apre il browser, che ha già un lettore fatto bene. Le
    // immagini restano dentro l'app, dove si possono anche scaricare.
    if (eUnPdf(d)) window.open(d.url, '_blank', 'noopener')
    else setGrande(d)
  }

  return (
    <div className="documenti">
      <input
        ref={campo}
        type="file"
        accept={TIPI_ACCETTATI}
        onChange={prendi}
        hidden
      />

      {avviso && <p className="doc-avviso">{avviso}</p>}

      {scelto && (
        <div className="doc-nuovo">
          <p className="doc-nuovo-file">
            {eUnPdf({ tipo: scelto.type }) ? '📄' : '🖼'} {scelto.name}
          </p>

          <label className="campo-chiaro">
            <span>Cos&rsquo;è</span>
            <input
              type="text"
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              maxLength={MAX_TITOLO}
              placeholder="Biglietto della barca"
            />
          </label>

          <label className="doc-interruttore">
            <input
              type="checkbox"
              checked={soloPerMe}
              onChange={(e) => setSoloPerMe(e.target.checked)}
            />
            <span>
              Solo per me
              <span className="doc-interruttore-nota">
                Sparisce dall&rsquo;elenco degli altri. Non è una cassaforte.
              </span>
            </span>
          </label>

          <button
            type="button"
            className="primario-doc"
            onClick={carica}
            disabled={titolo.trim().length === 0 || inCorso}
          >
            {inCorso ? 'Un attimo…' : 'Metti nel viaggio'}
          </button>

          <button
            type="button"
            className="riga-secondaria"
            onClick={() => {
              setScelto(null)
              setAvviso(null)
            }}
          >
            Lascia stare
          </button>
        </div>
      )}

      {stato === 'caricamento' && <p className="doc-vuoto">Un attimo.</p>}
      {stato === 'guasto' && <p className="doc-guasto">{errore}</p>}

      {stato === 'pronto' && documenti.length === 0 && !scelto && (
        <p className="doc-vuoto">
          Niente qui dentro. Il biglietto della barca ce l&rsquo;ha uno solo, e non
          serve mai a lui.
        </p>
      )}

      {documenti.length > 0 && (
        <ul className="doc-elenco">
          {documenti.map((d) => (
            <li key={d.id} className="doc">
              <button
                type="button"
                className="doc-apri"
                onClick={() => apri(d)}
                aria-label={`Apri ${d.titolo}`}
              >
                <span className="doc-icona" aria-hidden="true">
                  {eUnPdf(d) ? '📄' : '🖼'}
                </span>
                <span className="doc-testo">
                  {d.titolo}
                  <span className="doc-sotto">
                    {membri[d.proprietarioId]?.nome ?? 'Qualcuno'}
                    {d.soloPerMe && ' · solo per te'}
                    {d.byte ? ` · ${peso(d.byte)}` : ''}
                  </span>
                </span>
              </button>

              {d.proprietarioId === membro.id && (
                <div className="doc-azioni">
                  <button
                    type="button"
                    className="doc-tasto"
                    onClick={() => commutaVisibilita(d).catch(() => {})}
                  >
                    {d.soloPerMe ? 'Condividi' : 'Solo per me'}
                  </button>
                  <BottoneElimina onElimina={() => togli(d.id).catch(() => {})} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!scelto && (
        <button type="button" className="doc-aggiungi" onClick={() => campo.current?.click()}>
          Aggiungi un documento
        </button>
      )}

      <p className="doc-nota">
        Foto e PDF di biglietti, QR e prenotazioni. Chi ha il link li vede: non
        metteteci carte d&rsquo;identità o dati bancari.
      </p>

      {/* Il visore è lo stesso dell'album: cambia solo il nome del campo
          della data, che qui è al maschile. */}
      {grande && (
        <FotoGrande
          foto={{ ...grande, creataIl: grande.creatoIl }}
          autore={membri[grande.proprietarioId]}
          onChiudi={() => setGrande(null)}
        />
      )}
    </div>
  )
}

function peso(byte) {
  if (byte >= 1048576) return `${(byte / 1048576).toFixed(1)} MB`
  return `${Math.round(byte / 1024)} KB`
}
