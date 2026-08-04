import { useRef, useState } from 'react'
import './Documenti.css'
import { useDocumenti } from '../hooks/useDocumenti.js'
import { caricaDocumento, eUnPdf } from '../lib/documenti.js'
import { MAX_BYTE, TIPI_ACCETTATI } from '../config/documenti.js'
import { descriviErrore } from '../lib/errori.js'
import { urlAvatar } from '../config/avatar.js'
import FotoGrande from './FotoGrande.jsx'
import BottoneElimina from './BottoneElimina.jsx'
import FoglioDocumento from './FoglioDocumento.jsx'

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
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [grande, setGrande] = useState(null)

  function prendi(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvviso(null)
    setScelto(file)
  }

  async function carica({ titolo, soloPerMe }) {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await caricaDocumento(scelto, membro.id, {
        titolo,
        soloPerMe,
        onStato: setAvviso,
      })

      if (!esito.ok) {
        setAvviso(`Troppo pesante: ${peso(esito.byte)}. Il tetto è ${peso(MAX_BYTE)}.`)
        return
      }

      inserisci(esito.documento)
      setScelto(null)
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

      {avviso && !scelto && <p className="doc-avviso">{avviso}</p>}

      {scelto && (
        <FoglioDocumento
          file={scelto}
          inCorso={inCorso}
          avviso={avviso}
          onCarica={carica}
          onAnnulla={() => {
            setScelto(null)
            setAvviso(null)
          }}
        />
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
                  {/* Di chi è si vede prima di leggere: se il biglietto
                      della barca l'ha messo Turi, va saputo senza dover
                      chiedere in giro. */}
                  <span className="doc-sotto">
                    <img
                      className="doc-avatar"
                      src={urlAvatar(
                        membri[d.proprietarioId]?.avatarStyle,
                        membri[d.proprietarioId]?.avatarSeed || '?'
                      )}
                      alt=""
                      width="18"
                      height="18"
                    />
                    {membri[d.proprietarioId]?.nome ?? 'Qualcuno'}
                    {d.byte ? ` · ${peso(d.byte)}` : ''}
                    {d.soloPerMe && <span className="doc-privato">🔒 solo per te</span>}
                  </span>
                </span>
              </button>

              {d.proprietarioId === membro.id && (
                <div className="doc-azioni">
                  {/* Il tasto dice cosa succede se lo premi, non com'è
                      adesso: "Condividi" / "Solo per me" lasciava a
                      chiedersi se fosse lo stato o l'azione. */}
                  <button
                    type="button"
                    className="doc-tasto"
                    onClick={() => commutaVisibilita(d).catch(() => {})}
                  >
                    {d.soloPerMe ? 'Mostra a tutti' : 'Nascondi agli altri'}
                  </button>
                  <BottoneElimina onElimina={() => togli(d.id).catch(() => {})} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="doc-nota">
        Foto e PDF di biglietti, QR e prenotazioni. Chi ha il link li vede: non
        metteteci carte d&rsquo;identità o dati bancari.
      </p>

      {/* Fisso in fondo come "Segna una spesa": è l'azione principale
          della sezione e deve raggiungerti dove sei. */}
      <button
        type="button"
        className="doc-aggiungi"
        onClick={() => campo.current?.click()}
      >
        Aggiungi un documento
      </button>

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
