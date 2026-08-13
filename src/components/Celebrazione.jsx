import { useEffect, useRef } from 'react'
import './Celebrazione.css'
import { etichetta } from '../config/leggi.js'
import { TESTAMENTO_ARRABBIATO } from '../config/eventi.js'

const COLORI = ['#F2A93B', '#E8604A', '#3F6E5C', '#F7F4EC']
const DURATA = 3200

export default function Celebrazione({ celebrazione, onChiudi }) {
  const tela = useRef(null)

  useEffect(() => {
    if (!celebrazione) return

    // L'evento del Testamento resta più a lungo: sotto c'è una classifica
    // da leggere, non un nome solo.
    const chiusura = setTimeout(onChiudi, celebrazione.evento ? TESTAMENTO_ARRABBIATO.secondi * 1000 : 6000)
    const fermaCoriandoli = coriandoli(tela.current)

    return () => {
      clearTimeout(chiusura)
      fermaCoriandoli?.()
    }
  }, [celebrazione, onChiudi])

  if (!celebrazione) return null

  const { legge, chi, mvp, evento, classifica } = celebrazione

  return (
    <div className="celebrazione" role="alert" onClick={onChiudi}>
      <canvas ref={tela} className="coriandoli" aria-hidden="true" />

      {/* Tre cose, stessi coriandoli: una Legge scoperta, l'MVP della
          giornata, e l'arrabbiatura del Testamento — che non è una cosa
          da festeggiare ma va guardata da tutti allo stesso modo. */}
      {evento ? (
        <div className="pergamena">
          <p className="celebrazione-occhiello">{TESTAMENTO_ARRABBIATO.occhiello}</p>
          <p className="celebrazione-numero">{TESTAMENTO_ARRABBIATO.titolo}</p>
          <p className="celebrazione-testo">{TESTAMENTO_ARRABBIATO.testo}</p>

          {/* La classifica nuova qui dentro, o l'annuncio resta una
              frase: la cosa che si vuole vedere è chi è finito dove. */}
          {classifica?.length > 0 && (
            <ol className="evento-classifica">
              {classifica.slice(0, 8).map((r, i) => (
                <li key={r.id}>
                  <span className="evento-posto">{i + 1}</span>
                  <span className="evento-chi">{r.nome}</span>
                  <span className="evento-punti">{r.punteggio}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : mvp ? (
        <div className="pergamena">
          <p className="celebrazione-occhiello">👑 MVP di ieri</p>
          <p className="celebrazione-numero">{mvp.nome}</p>
          <p className="celebrazione-testo">
            {mvp.saldo > 0 ? `+${mvp.saldo} punti in un giorno solo` : 'La giornata è sua'}
          </p>
          <p className="celebrazione-chi">
            {mvp.quante > 1 ? (
              <>
                ed è la <strong>{mvp.quante}ª volta</strong>
              </>
            ) : (
              'nessuno ha fatto meglio'
            )}
          </p>
        </div>
      ) : (
        <div className="pergamena">
          <p className="celebrazione-occhiello">📜 Nuova Legge scoperta</p>
          <p className="celebrazione-numero">{etichetta(legge)}</p>
          <p className="celebrazione-testo">{legge.testo}</p>
          <p className="celebrazione-chi">
            svelata da <strong>{chi}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

// Coriandoli disegnati a mano: nessuna libreria per una cosa che dura tre
// secondi. Si fermano da soli quando sono usciti dallo schermo.
function coriandoli(canvas) {
  if (!canvas) return null
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null

  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const L = canvas.offsetWidth
  const A = canvas.offsetHeight
  canvas.width = L * dpr
  canvas.height = A * dpr
  ctx.scale(dpr, dpr)

  const pezzi = Array.from({ length: 90 }, () => ({
    x: Math.random() * L,
    y: -20 - Math.random() * A * 0.6,
    l: 5 + Math.random() * 6,
    vy: 1.6 + Math.random() * 2.6,
    vx: -0.8 + Math.random() * 1.6,
    giro: Math.random() * Math.PI,
    dGiro: -0.1 + Math.random() * 0.2,
    colore: COLORI[(Math.random() * COLORI.length) | 0],
  }))

  let fotogramma
  const inizio = performance.now()

  function disegna(ora) {
    ctx.clearRect(0, 0, L, A)
    let vivi = 0

    for (const p of pezzi) {
      p.y += p.vy
      p.x += p.vx
      p.giro += p.dGiro
      if (p.y < A + 20) vivi += 1

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.giro)
      ctx.fillStyle = p.colore
      ctx.fillRect(-p.l / 2, -p.l / 4, p.l, p.l / 2)
      ctx.restore()
    }

    if (vivi > 0 && ora - inizio < DURATA) {
      fotogramma = requestAnimationFrame(disegna)
    } else {
      ctx.clearRect(0, 0, L, A)
    }
  }

  fotogramma = requestAnimationFrame(disegna)
  return () => cancelAnimationFrame(fotogramma)
}
