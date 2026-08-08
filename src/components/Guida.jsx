import { useEffect } from 'react'
import './Guida.css'
import { APERTURA, FINALE, VOCI } from '../config/guida.js'
import { dopoGuida } from '../lib/regole.js'

// La guida intera, e vive solo in Altro.
//
// Stava anche in cima al tab Gioco, richiudibile: era troppo invadente
// per la schermata più usata di quel tab. Adesso all'ingresso ci pensa
// Allan con due righe per volta, e qui resta il posto dove si viene
// apposta quando qualcuno chiede "ma come si fa a...".
export default function Guida({ membroId }) {
  // Chi arriva qui non ha ascoltato il tutorial, e l'ammissione vale un
  // punto. Una volta a testa, in silenzio: la sorpresa è trovarselo nel
  // Testamento, non un cartello che dice "bravo, hai letto".
  useEffect(() => {
    if (membroId) dopoGuida(membroId).catch(() => {})
  }, [membroId])

  return (
    <section className="guida">
      <header className="guida-testa">
        <div>
          <h2 className="guida-titolo">Come funziona</h2>
          <p className="guida-apertura">{APERTURA}</p>
        </div>
      </header>

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
    </section>
  )
}
