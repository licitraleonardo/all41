import { useEffect, useState } from 'react'
import './Info.css'
import { DOVE, EMERGENZE, UTILI } from '../config/info.js'
import { leggiMembri } from '../lib/membri.js'
import { daComporre } from '../lib/telefono.js'
import Targhetta from './Targhetta.jsx'
import ChiediNotifiche from './ChiediNotifiche.jsx'
import Guida from './Guida.jsx'

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

      {/* ⚠️ Le emergenze erano riquadri rossi col numero in cifre da 26
          px, cioè un terzo stile di riga in una schermata che ne aveva
          già due. Adesso sono righe come tutte le altre.

          Erano grandi apposta — quella lista si scorre con gli occhi
          mentre sta succedendo qualcosa — e quel lavoro adesso lo fa
          l'ordine: restano **prime**, sopra tutto il resto. Chi scorre
          dall'alto le trova per prime senza che debbano gridare.

          Si tocca e parte la chiamata, come prima: in emergenza nessuno
          copia un numero a mano. */}
      <p className="info-etichetta">Se serve aiuto</p>
      <ul className="info-numeri">
        {EMERGENZE.map((e) => (
          <li key={e.numero}>
            <a className="info-numero" href={`tel:${e.numero}`}>
              <strong>{e.cosa}</strong>
              <span className="info-cifre">{e.numero}</span>
              <small>{e.dettaglio}</small>
              {e.quando && <small className="info-quando">{e.quando}</small>}
            </a>
          </li>
        ))}
      </ul>

      <p className="info-etichetta">Numeri utili</p>
      <ul className="info-numeri">
        {UTILI.map((u) => (
          <li key={u.numero}>
            <a className="info-numero" href={`tel:${u.numero.replace(/\s/g, '')}`}>
              <strong>{u.cosa}</strong>
              <span className="info-cifre">{u.numero}</span>
              <small>{u.dettaglio}</small>
              {/* Gli orari restano: un numero che non risponde alle tre di
                  notte è peggio di uno che dice "chiuso". È un fatto, non
                  un commento. */}
              {u.quando && <small className="info-quando">{u.quando}</small>}
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
          <ul className="info-numeri">
            {gruppo.map((m) => (
              <li key={m.id}>
                <a className="info-numero" href={`tel:${daComporre(m.telefono)}`}>
                  <strong>{m.nome}</strong>
                  <span className="info-cifre">{m.telefono}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}


      {/* ⚠️ La Guida sta qui dentro, e non e' piu' una sezione sua.
          E' consultazione: si guarda una volta all'inizio, e poi solo
          quando qualcuno chiede «ma come si fa a...». Una scheda tutta
          per lei, in una barra da sei, la faceva sembrare una parte
          dell'app invece che il libretto delle istruzioni. */}
      <p className="info-etichetta">Come funziona</p>
      <Guida membroId={membroId} />

      {/* ⚠️ Le impostazioni sono l'ultima cosa, ed e' voluto: sopra c'e'
          quello che serve durante il viaggio, qui quello che si tocca una
          volta e non si guarda piu'. */}
      <p className="info-etichetta">Impostazioni</p>
      <ChiediNotifiche membroId={membroId} />

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

    </div>
  )
}
