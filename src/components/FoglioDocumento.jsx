import { useEffect, useState } from 'react'
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
    <div className="foglio-sfondo" role="dialog" aria-modal="true" aria-label="Nuovo documento">
      <div className="foglio foglio-alto">
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
      </div>
    </div>
  )
}
