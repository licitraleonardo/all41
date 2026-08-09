import { useEffect, useState } from 'react'
import './Info.css'
import { DA_TROVARE, DOVE, EMERGENZE, UTILI } from '../config/info.js'
import { leggiMembri } from '../lib/membri.js'
import { daComporre } from '../lib/telefono.js'
import Targhetta from './Targhetta.jsx'
import FoglioFeedback from './FoglioFeedback.jsx'

// Dove si dorme e chi si chiama. Sta nel codice, non sul database: è
// l'unico pezzo dell'app che potrebbe servire col telefono che non prende
// e uno che ha fretta.
//
// Quello che non è ancora stato verificato è scritto come mancante invece
// di essere riempito a occhio. Un numero inventato in una sezione che si
// chiama emergenze è peggio che non avere la sezione.
export default function Info({ membroId }) {
  // ⚠️ I numeri del gruppo arrivano dal database, al contrario di tutto il
  // resto di questa schermata. La promessa fatta a chi lascia il numero —
  // «resta raggiungibile dal gruppo anche senza rete» — la mantiene
  // `conCache`: una volta scaricato l'elenco resta in copia locale, e
  // questa lettura lo serve anche quando la rete non risponde.
  const [gruppo, setGruppo] = useState([])
  const [scriviFeedback, setScriviFeedback] = useState(false)

  useEffect(() => {
    let vivo = true
    leggiMembri()
      .then((elenco) => {
        if (vivo) setGruppo(elenco.filter((m) => m.telefono))
      })
      .catch(() => {
        // Senza rete e senza copia si mostra il resto: gli altri numeri
        // stanno nel codice apposta per non dipendere da questa lettura.
      })
    return () => {
      vivo = false
    }
  }, [])

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

      {/* Le emergenze stanno da sole, in rosso e grandi. Sono tre, e sono
          tre apposta: questa lista si scorre con gli occhi mentre succede
          qualcosa, e ogni riga in più è tempo. I numeri che si leggono con
          calma stanno nella lista sotto. */}
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
                {e.quando && <small className="info-quando">{e.quando}</small>}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="info-etichetta">Numeri utili</p>
      <ul className="info-numeri info-numeri-calmi">
        {UTILI.map((u) => (
          <li key={u.numero}>
            <a className="info-numero info-utile" href={`tel:${u.numero.replace(/\s/g, '')}`}>
              <span className="info-numero-cosa">
                <strong>{u.cosa}</strong>
                <span className="info-utile-cifre">{u.numero}</span>
                <small>{u.dettaglio}</small>
                {/* Gli orari contano quanto il numero: uno che non risponde
                    alle tre di notte è peggio di uno che dice "chiuso". */}
                {u.quando && <small className="info-quando">{u.quando}</small>}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Il gruppo. Sta dopo le emergenze e i numeri utili perché in un
          momento brutto si chiama il 112, non un amico — ma prima di
          «ancora da trovare», perché è roba che c'è. */}
      {gruppo.length > 0 && (
        <>
          <p className="info-etichetta">Il gruppo</p>
          <ul className="info-numeri info-numeri-calmi">
            {gruppo.map((m) => (
              <li key={m.id}>
                <a className="info-numero info-utile" href={`tel:${daComporre(m.telefono)}`}>
                  <span className="info-numero-cosa">
                    <strong>{m.nome}</strong>
                    <span className="info-utile-cifre">{m.telefono}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* L'ingresso fisso al «com'è che va»: il cartello arriva ogni
          tanto e da solo, ma chi ha qualcosa da dire adesso deve poterlo
          dire adesso, senza aspettare che gli venga chiesto. */}
      <p className="info-etichetta">Com’è che va</p>
      <button
        type="button"
        className="info-numero info-utile"
        onClick={() => setScriviFeedback(true)}
      >
        <span className="info-numero-cosa">
          <strong>Dimmi com’è che va</strong>
          <small>Qualsiasi cosa non torni, o manchi. Lo legge solo chi ha scritto l’app</small>
        </span>
      </button>

      {scriviFeedback && (
        <FoglioFeedback
          membroId={membroId}
          dove="info"
          onChiudi={() => setScriviFeedback(false)}
        />
      )}

      {/* ⚠️ La versione dell'app sta QUI, e non solo sulla schermata
          d'ingresso dov'era.
          Dentro una PWA installata sulla home non c'e' barra
          dell'indirizzo ne' tasto ricarica: se l'app resta indietro,
          questa riga e' l'unico posto in cui accorgersene, e il tasto
          accanto l'unico modo di rimediare. Chi e' gia' entrato la
          schermata d'ingresso non la rivede mai piu'.
          E questa e' la sezione che la nuvoletta di Allan annuncia come
          «versione dell'app, crediti e altre cose»: era l'unica cosa che
          prometteva e non c'era. */}
      <Targhetta />

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
