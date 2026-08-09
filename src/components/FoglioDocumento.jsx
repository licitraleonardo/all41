import { useEffect, useState } from 'react'
import Foglio from './Foglio.jsx'
import { MAX_TITOLO } from '../config/documenti.js'
import { nomeUtile } from '../lib/nomeDocumento.js'

// Dare un nome a un documento è una cosa sola e merita un foglio suo,
// come "Salda" e come la proposta di punti: un modulo in mezzo alla
// pagina, sopra un elenco, sembra un pezzo che si è staccato.
//
// E si vede quello che si sta nominando: senza anteprima si dà un nome a
// "IMG_2931.jpg" fidandosi della memoria.
export default function FoglioDocumento({ file, inCorso, avviso, onCarica, onAnnulla }) {
  const pdf = file.type === 'application/pdf'
  const [titolo, setTitolo] = useState(() => nomeUtile(file.name))
  const [soloPerMe, setSoloPerMe] = useState(false)
  const [anteprima, setAnteprima] = useState(null)

  // L'indirizzo temporaneo va restituito, o la foto resta in memoria
  // finché non si ricarica la pagina.
  useEffect(() => {
    if (pdf) return undefined
    const indirizzo = URL.createObjectURL(file)
    setAnteprima(indirizzo)
    return () => URL.revokeObjectURL(indirizzo)
  }, [file, pdf])

  return (
    // Un documento gia' scelto e' lavoro fatto: si e' aperta la
    // fotocamera o il gestore dei file, e ricominciare da capo per un
    // tocco storto sul velo da' fastidio piu' del solito. Per questo
    // parte gia' "sporco" — la prima uscita avvisa sempre.
    <Foglio
      etichetta="Nuovo documento"
      sporco={!inCorso}
      onChiudi={inCorso ? undefined : onAnnulla}
      className="foglio-alto"
    >
      <>
        <div className="doc-anteprima">
          {pdf ? (
            <span className="doc-anteprima-pdf" aria-hidden="true">
              📄
            </span>
          ) : (
            anteprima && <img src={anteprima} alt="" />
          )}
        </div>

        <p className="doc-nome-file">{file.name}</p>

        <label className="campo">
          <span>Cos&rsquo;è</span>
          <input
            type="text"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            maxLength={MAX_TITOLO}
            placeholder="Biglietto della barca"
            autoFocus
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

        {avviso && <p className="doc-guasto">{avviso}</p>}

        <button
          type="button"
          className="primario-doc"
          onClick={() => onCarica({ titolo: titolo.trim(), soloPerMe })}
          disabled={titolo.trim().length === 0 || inCorso}
        >
          {inCorso ? 'Un attimo…' : 'Metti nel viaggio'}
        </button>

        <button
          type="button"
          className="secondario-foglio"
          onClick={onAnnulla}
          disabled={inCorso}
        >
          Lascia stare
        </button>
      </>
    </Foglio>
  )
}
