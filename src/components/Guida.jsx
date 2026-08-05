import { useState } from 'react'
import './Guida.css'
import { APERTURA, FINALE, VOCI } from '../config/guida.js'

const CHIAVE = 'guida-chiusa'

// Lo spec e' netto su una cosa: un tutorial obbligatorio all'ingresso
// viene saltato senza leggerlo. Quindi si entra subito nell'app e la
// guida sta qui, richiudibile e ritrovabile in Altro.
export function guidaGiaChiusa() {
  return localStorage.getItem(CHIAVE) === 'si'
}

export default function Guida({ compatta = false, onChiudi = null }) {
  // Da compatta parte piegata: e' un invito, non un muro di testo in
  // cima alla schermata piu' usata del tab.
  const [aperta, setAperta] = useState(!compatta)

  function chiudiPerSempre() {
    localStorage.setItem(CHIAVE, 'si')
    onChiudi?.()
  }

  return (
    <section className={compatta ? 'guida compatta' : 'guida'}>
      <header className="guida-testa">
        <div>
          <h2 className="guida-titolo">Come funziona</h2>
          <p className="guida-apertura">{APERTURA}</p>
        </div>

        {compatta && (
          <button
            type="button"
            className="guida-via"
            onClick={chiudiPerSempre}
            aria-label="Non mostrare più"
            title="Non mostrare più"
          >
            ×
          </button>
        )}
      </header>

      {compatta && !aperta && (
        <button type="button" className="guida-apri" onClick={() => setAperta(true)}>
          Leggi la guida
        </button>
      )}

      {aperta && (
        <>
          <ul className="guida-voci">
            {VOCI.map((v) => (
              <li key={v.titolo} className="guida-voce">
                <span className="guida-icona" aria-hidden="true">
                  {v.icona}
                </span>
                <div>
                  <p className="guida-voce-titolo">{v.titolo}</p>
                  <p className="guida-voce-testo">{v.testo}</p>
                  {v.gesto && <p className="guida-gesto">{v.gesto}</p>}
                </div>
              </li>
            ))}
          </ul>

          <div className="guida-finale">
            <p className="guida-voce-titolo">{FINALE.titolo}</p>
            <p className="guida-voce-testo">{FINALE.testo}</p>
          </div>

          {compatta && (
            <button type="button" className="guida-apri" onClick={chiudiPerSempre}>
              Ho capito, togli questa card
            </button>
          )}
        </>
      )}
    </section>
  )
}
