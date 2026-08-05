import './Info.css'
import { DA_TROVARE, DOVE, EMERGENZE } from '../config/info.js'

// Dove si dorme e chi si chiama. Sta nel codice, non sul database: è
// l'unico pezzo dell'app che potrebbe servire col telefono che non prende
// e uno che ha fretta.
//
// Quello che non è ancora stato verificato è scritto come mancante invece
// di essere riempito a occhio. Un numero inventato in una sezione che si
// chiama emergenze è peggio che non avere la sezione.
export default function Info() {
  return (
    <div className="info">
      <p className="info-etichetta">Dove siamo</p>
      <section className="info-scheda">
        <h3 className="info-nome">{DOVE.nome}</h3>
        <p className="info-riga">{DOVE.comune}</p>
        <p className="info-riga">{DOVE.quando}</p>
        <p className="info-riga">{DOVE.checkIn}</p>

        {DOVE.indirizzo ? (
          <p className="info-riga">{DOVE.indirizzo}</p>
        ) : (
          <p className="info-manca">Indirizzo esatto ancora da mettere</p>
        )}

        {DOVE.telefono ? (
          <a className="info-chiama" href={`tel:${DOVE.telefono.replace(/\s/g, '')}`}>
            📞 {DOVE.telefono}
          </a>
        ) : (
          <p className="info-manca">Telefono della struttura ancora da mettere</p>
        )}

        <a
          className="info-mappa"
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `${DOVE.nome} ${DOVE.comune}`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          📍 Aprilo su Maps
        </a>
      </section>

      <p className="info-etichetta">Se serve aiuto</p>
      <ul className="info-numeri">
        {EMERGENZE.map((e) => (
          <li key={e.numero}>
            {/* Si tocca e parte la chiamata: in emergenza nessuno copia un
                numero a mano. */}
            <a className="info-numero" href={`tel:${e.numero}`}>
              <span className="info-numero-cifre">{e.numero}</span>
              <span className="info-numero-cosa">
                <strong>{e.cosa}</strong>
                <small>{e.dettaglio}</small>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {DA_TROVARE.length > 0 && (
        <section className="info-mancanti">
          <p className="info-mancanti-titolo">Ancora da trovare</p>
          <ul>
            {DA_TROVARE.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="info-mancanti-nota">
            Scritti come mancanti apposta: un numero messo a occhio, qui dentro,
            farebbe più danni che comodo.
          </p>
        </section>
      )}
    </div>
  )
}
