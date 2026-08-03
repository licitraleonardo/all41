import { useCallback, useEffect, useRef, useState } from 'react'
import './Pecora.css'
import { MONDO, SAGOME, TEMA } from '../config/pecora.js'
import { avvia, nuovoMondo, passo, punteggio, salta } from '../lib/pecora.js'

// Allan quando non c'è rete: si annoia, e tocca farlo saltare.
//
// Il motore sta in lib/pecora.js e non sa cosa disegna. Qui ci sono solo
// i disegni, presi per nome dal tema: cambiare ambientazione vuol dire
// aggiungere voci a questa mappa, non toccare la logica.

const PELO = '#F7F4EC'
const SCURO = '#16232C'
const PIETRA = '#9A9384'
const VERDE = '#3F6E5C'

const DISEGNI = {
  // Il protagonista. Le zampe alternano col passo, così si vede che corre
  // invece di scivolare.
  pecora(ctx, x, y, l, a, fase) {
    const passo1 = Math.sin(fase) > 0

    ctx.fillStyle = SCURO
    ctx.fillRect(x + 6, y + a - 8, 4, 8)
    ctx.fillRect(x + l - 14, y + a - 8, 4, 8)
    ctx.fillRect(x + 11, y + a - (passo1 ? 8 : 4), 4, passo1 ? 8 : 4)
    ctx.fillRect(x + l - 19, y + a - (passo1 ? 4 : 8), 4, passo1 ? 4 : 8)

    // Il vello: tre gobbe invece di un rettangolo, e sembra lana.
    ctx.fillStyle = PELO
    ctx.beginPath()
    ctx.arc(x + 10, y + 12, 9, 0, Math.PI * 2)
    ctx.arc(x + 19, y + 9, 10, 0, Math.PI * 2)
    ctx.arc(x + 27, y + 13, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = SCURO
    ctx.beginPath()
    ctx.arc(x + l - 3, y + 9, 5.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + l - 6, y + 4, 3, 4) // orecchio
  },

  'fico-india': (ctx, x, y, l, a) => {
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.ellipse(x + l / 2, y + a - 10, l / 2, 12, 0, 0, Math.PI * 2)
    ctx.ellipse(x + l / 2 - 2, y + 9, l / 2.6, 10, -0.2, 0, Math.PI * 2)
    ctx.ellipse(x + l - 5, y + 15, 5, 8, 0.5, 0, Math.PI * 2)
    ctx.fill()
  },

  nuraghe: (ctx, x, y, l, a) => {
    ctx.fillStyle = PIETRA
    ctx.beginPath()
    ctx.moveTo(x, y + a)
    ctx.lineTo(x + 5, y)
    ctx.lineTo(x + l - 5, y)
    ctx.lineTo(x + l, y + a)
    ctx.closePath()
    ctx.fill()
    // Le pietre, appena accennate
    ctx.fillStyle = 'rgba(22, 35, 44, 0.16)'
    ctx.fillRect(x + 4, y + a * 0.35, l - 8, 2)
    ctx.fillRect(x + 3, y + a * 0.68, l - 6, 2)
    ctx.fillStyle = SCURO
    ctx.fillRect(x + l / 2 - 4, y + a - 12, 8, 12) // la porta
  },

  muretto: (ctx, x, y, l, a) => {
    ctx.fillStyle = PIETRA
    ctx.fillRect(x, y, l, a)
    ctx.fillStyle = 'rgba(22, 35, 44, 0.16)'
    ctx.fillRect(x, y + a / 2 - 1, l, 2)
    for (let i = 1; i < 4; i += 1) {
      ctx.fillRect(x + (l / 4) * i, y, 2, a / 2)
    }
  },

  gabbiano: (ctx, x, y, l, a, fase) => {
    const su = Math.sin(fase * 1.6) > 0
    ctx.strokeStyle = PELO
    ctx.lineWidth = 3
    ctx.beginPath()
    if (su) {
      ctx.moveTo(x, y + a)
      ctx.lineTo(x + l / 2, y)
      ctx.lineTo(x + l, y + a)
    } else {
      ctx.moveTo(x, y)
      ctx.lineTo(x + l / 2, y + a)
      ctx.lineTo(x + l, y)
    }
    ctx.stroke()
  },
}

export default function Pecora({ compatta = false }) {
  const tela = useRef(null)
  const mondo = useRef(nuovoMondo(Date.now()))
  const finitoIl = useRef(0)
  const [vista, setVista] = useState('pronto')
  const [ultimoPunteggio, setUltimoPunteggio] = useState(0)

  const disegna = useCallback(() => {
    const canvas = tela.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const m = mondo.current
    const { larghezza: L, altezza: A, suolo } = MONDO
    const lineaTerra = A - suolo

    ctx.clearRect(0, 0, L, A)

    ctx.fillStyle = TEMA.cielo
    ctx.fillRect(0, 0, L, A)

    ctx.fillStyle = TEMA.terra
    ctx.fillRect(0, lineaTerra, L, suolo)

    // Sassolini che scorrono: senza, a velocità costante sembra che la
    // pecora sia ferma e il mondo pure.
    ctx.fillStyle = 'rgba(22, 35, 44, 0.22)'
    for (let i = 0; i < 14; i += 1) {
      const x = (i * 71 - (m.distanza % (L + 71))) % (L + 71)
      ctx.fillRect(x, lineaTerra + 8 + ((i * 13) % 18), 6, 2)
    }

    const fase = m.distanza / 9

    for (const o of m.ostacoli) {
      const disegno = DISEGNI[o.tipo]
      if (disegno) disegno(ctx, o.x, lineaTerra - o.quota - o.altezza, o.larghezza, o.altezza, fase)
    }

    const sagoma = SAGOME[TEMA.protagonista]
    DISEGNI[TEMA.protagonista](
      ctx,
      MONDO.giocatoreX,
      lineaTerra - m.giocatore.y - sagoma.altezza,
      sagoma.larghezza,
      sagoma.altezza,
      m.giocatore.y > 0 ? 0 : fase
    )

    ctx.fillStyle = 'rgba(247, 244, 236, 0.85)'
    ctx.font = 'bold 15px ui-monospace, Consolas, monospace'
    ctx.textAlign = 'right'
    ctx.fillText(String(punteggio(m)).padStart(5, '0'), L - 12, 24)
  }, [])

  const tocca = useCallback(() => {
    const m = mondo.current
    if (m.stato === 'finita') {
      // Un tocco partito per la rabbia non deve far ricominciare e morire
      // subito: mezzo secondo di sordità.
      if (Date.now() - finitoIl.current < 450) return
      mondo.current = avvia(nuovoMondo(Date.now()))
      setVista('corsa')
      return
    }
    mondo.current = salta(m)
    if (mondo.current.stato === 'corsa') setVista('corsa')
  }, [])

  // Il primo fotogramma si disegna subito, senza aspettare il ciclo: la
  // schermata deve mostrare la pecora ferma sul prato appena si apre.
  useEffect(() => {
    const canvas = tela.current
    if (!canvas) return

    const adatta = () => {
      const scala = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = MONDO.larghezza * scala
      canvas.height = MONDO.altezza * scala
      canvas.getContext('2d')?.setTransform(scala, 0, 0, scala, 0, 0)
      disegna()
    }

    adatta()
    window.addEventListener('resize', adatta)
    return () => window.removeEventListener('resize', adatta)
  }, [disegna])

  useEffect(() => {
    let vivo = true
    let richiesta = 0
    let ultimo = performance.now()

    function giro(ora) {
      if (!vivo) return
      const dt = (ora - ultimo) / 1000
      ultimo = ora

      const prima = mondo.current.stato
      mondo.current = passo(mondo.current, dt)

      if (prima === 'corsa' && mondo.current.stato === 'finita') {
        finitoIl.current = Date.now()
        setUltimoPunteggio(punteggio(mondo.current))
        setVista('finita')
      }

      disegna()
      richiesta = requestAnimationFrame(giro)
    }

    richiesta = requestAnimationFrame(giro)
    return () => {
      vivo = false
      cancelAnimationFrame(richiesta)
    }
  }, [disegna])

  // Spazio e freccia su fanno saltare, e non fanno scorrere la pagina.
  useEffect(() => {
    const daTasto = (e) => {
      if (e.code !== 'Space' && e.code !== 'ArrowUp') return
      e.preventDefault()
      tocca()
    }
    window.addEventListener('keydown', daTasto)
    return () => window.removeEventListener('keydown', daTasto)
  }, [tocca])

  return (
    <div className={compatta ? 'pecora pecora-compatta' : 'pecora'}>
      <div className="pecora-tela" onPointerDown={tocca}>
        <canvas
          ref={tela}
          role="img"
          aria-label={`Al che salta. Punteggio ${punteggio(mondo.current)}`}
        />

        {vista === 'pronto' && (
          <p className="pecora-avviso">Tocca per farlo saltare.</p>
        )}

        {vista === 'finita' && (
          <div className="pecora-fine">
            <p className="pecora-punti">{ultimoPunteggio}</p>
            <button type="button" className="pecora-ancora" onClick={tocca}>
              Ancora
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
