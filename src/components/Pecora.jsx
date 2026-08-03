import { useCallback, useEffect, useRef, useState } from 'react'
import './Pecora.css'
import { CHIAVE_RECORD, MONDO, NUVOLE, SAGOME, TEMA } from '../config/pecora.js'
import { avvia, nuovoMondo, passo, punteggio, salta } from '../lib/pecora.js'

// Allan quando non c'è rete: si annoia, e tocca farlo saltare.
//
// Il motore sta in lib/pecora.js e non sa cosa disegna. Qui ci sono solo
// i disegni, presi per nome dal tema: cambiare ambientazione vuol dire
// aggiungere voci a questa mappa, non toccare la logica.

const VERDE = '#6B8E5A'
const VERDE_SCURO = '#4E6B42'
const PANCIA = '#E4DBBC'
const CORNO = '#C7B48A'
const LANA = '#F7F4EC'
const SCURO = '#16232C'
const PIETRA = '#9A9384'
const FICO = '#3F6E5C'
const LASER = '#E8604A'

const DISEGNI = {
  // Alan: dragone, non pecora. Il giubbotto di lana è quello che si mette
  // in Sardegna — altrove sarebbe un'altra voce di questa mappa, e il
  // motore non se ne accorgerebbe.
  'alan-sardegna'(ctx, x, y, l, a, fase) {
    const avanti = Math.sin(fase) > 0
    const cx = x + l / 2

    // Coda
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.moveTo(x + 4, y + a - 12)
    ctx.quadraticCurveTo(x - 8, y + a - 18, x - 4, y + a - 26)
    ctx.quadraticCurveTo(x + 2, y + a - 18, x + 10, y + a - 10)
    ctx.fill()

    // Zampe, alternate: si vede che corre invece di scivolare
    ctx.fillStyle = VERDE_SCURO
    ctx.fillRect(x + 9, y + a - (avanti ? 9 : 5), 6, avanti ? 9 : 5)
    ctx.fillRect(x + l - 19, y + a - (avanti ? 5 : 9), 6, avanti ? 5 : 9)

    // Ala dietro
    ctx.fillStyle = CORNO
    ctx.beginPath()
    ctx.moveTo(cx - 4, y + 12)
    ctx.lineTo(cx - 14, y + 2)
    ctx.lineTo(cx + 3, y + 8)
    ctx.closePath()
    ctx.fill()

    // Corpo
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.ellipse(cx - 2, y + a - 15, 14, 11, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = PANCIA
    ctx.beginPath()
    ctx.ellipse(cx - 1, y + a - 11, 9, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Il giubbotto di pecora, sulla schiena
    ctx.fillStyle = LANA
    ctx.beginPath()
    ctx.arc(cx - 10, y + a - 21, 6, 0, Math.PI * 2)
    ctx.arc(cx - 2, y + a - 24, 7, 0, Math.PI * 2)
    ctx.arc(cx + 6, y + a - 21, 6, 0, Math.PI * 2)
    ctx.fill()

    // Testa
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.ellipse(x + l - 10, y + 12, 10, 9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + l - 8, y + 12, 9, 7) // muso

    // Corna e cresta
    ctx.fillStyle = CORNO
    ctx.beginPath()
    ctx.moveTo(x + l - 14, y + 4)
    ctx.lineTo(x + l - 11, y - 3)
    ctx.lineTo(x + l - 8, y + 4)
    ctx.closePath()
    ctx.fill()

    // L'occhio semichiuso: è svogliato, e si deve vedere anche a 30 px
    ctx.fillStyle = SCURO
    ctx.fillRect(x + l - 10, y + 9, 5, 2)
  },

  'fico-india': (ctx, x, y, l, a) => {
    ctx.fillStyle = FICO
    ctx.beginPath()
    ctx.ellipse(x + l / 2, y + a - 11, l / 2, 13, 0, 0, Math.PI * 2)
    ctx.ellipse(x + l / 2 - 2, y + 10, l / 2.6, 11, -0.2, 0, Math.PI * 2)
    ctx.ellipse(x + l - 4, y + 16, 5, 8, 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(247, 244, 236, 0.55)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i += 1) {
      const sx = x + 5 + ((i * 7) % (l - 8))
      const sy = y + 8 + ((i * 11) % (a - 14))
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + 3, sy - 3)
      ctx.stroke()
    }
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
    ctx.fillStyle = 'rgba(22, 35, 44, 0.16)'
    ctx.fillRect(x + 4, y + a * 0.35, l - 8, 2)
    ctx.fillRect(x + 3, y + a * 0.68, l - 6, 2)
    ctx.fillStyle = SCURO
    ctx.fillRect(x + l / 2 - 4, y + a - 13, 8, 13)
  },

  muretto: (ctx, x, y, l, a) => {
    ctx.fillStyle = PIETRA
    ctx.fillRect(x, y, l, a)
    ctx.fillStyle = 'rgba(22, 35, 44, 0.16)'
    ctx.fillRect(x, y + a / 2 - 1, l, 2)
    for (let i = 1; i < 4; i += 1) ctx.fillRect(x + (l / 4) * i, y, 2, a / 2)
  },

  // Un gabbiano vero: corpo, due ali che battono, becco e occhio. Le due
  // righe incrociate di prima sembravano un errore di disegno.
  gabbiano: (ctx, x, y, l, a, fase) => {
    const su = Math.sin(fase * 1.4) > 0
    const cy = y + a / 2

    ctx.fillStyle = LANA
    ctx.beginPath()
    ctx.ellipse(x + l * 0.45, cy, l * 0.3, a * 0.34, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    if (su) {
      ctx.moveTo(x + l * 0.42, cy - 2)
      ctx.quadraticCurveTo(x + l * 0.18, y - 4, x + 1, y + 2)
      ctx.quadraticCurveTo(x + l * 0.2, y + 5, x + l * 0.45, cy + 2)
      ctx.moveTo(x + l * 0.5, cy - 2)
      ctx.quadraticCurveTo(x + l * 0.6, y - 3, x + l * 0.76, y + 1)
      ctx.quadraticCurveTo(x + l * 0.6, y + 6, x + l * 0.5, cy + 2)
    } else {
      ctx.moveTo(x + l * 0.42, cy)
      ctx.quadraticCurveTo(x + l * 0.2, y + a + 3, x + 2, y + a - 1)
      ctx.quadraticCurveTo(x + l * 0.22, y + a - 5, x + l * 0.45, cy - 1)
      ctx.moveTo(x + l * 0.5, cy)
      ctx.quadraticCurveTo(x + l * 0.62, y + a + 2, x + l * 0.78, y + a - 2)
      ctx.quadraticCurveTo(x + l * 0.62, y + a - 6, x + l * 0.5, cy - 1)
    }
    ctx.fill()

    ctx.fillStyle = '#E8A33B'
    ctx.beginPath()
    ctx.moveTo(x + l * 0.72, cy - 1)
    ctx.lineTo(x + l, cy + 1)
    ctx.lineTo(x + l * 0.72, cy + 3)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = SCURO
    ctx.fillRect(x + l * 0.64, cy - 3, 2, 2)
  },

  // I raggi. Nucleo chiaro dentro, alone fuori: a schermo piccolo un
  // rettangolo rosso e basta sembrerebbe un muretto colorato.
  'raggio-basso': (ctx, x, y, l, a, fase) => raggio(ctx, x, y, l, a, fase),
  'raggio-alto': (ctx, x, y, l, a, fase) => raggio(ctx, x, y, l, a, fase),

  navicella: (ctx, x, y, l, a, fase) => {
    const su = Math.sin(fase * 0.5) * 3

    ctx.fillStyle = 'rgba(22, 35, 44, 0.18)'
    ctx.beginPath()
    ctx.ellipse(x + l / 2, y + a - 2 + su, l * 0.42, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = PIETRA
    ctx.beginPath()
    ctx.ellipse(x + l / 2, y + a / 2 + su, l / 2, a * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(247, 244, 236, 0.8)'
    ctx.beginPath()
    ctx.arc(x + l / 2, y + a / 2 - 3 + su, l * 0.22, Math.PI, 0)
    ctx.fill()

    // Le lucine che lampeggiano a turno
    for (let i = 0; i < 3; i += 1) {
      const acceso = Math.floor(fase * 2) % 3 === i
      ctx.fillStyle = acceso ? LASER : 'rgba(22, 35, 44, 0.35)'
      ctx.beginPath()
      ctx.arc(x + l * (0.28 + i * 0.22), y + a / 2 + 3 + su, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  },
}

function raggio(ctx, x, y, l, a, fase) {
  const pulsa = 0.65 + Math.abs(Math.sin(fase * 3)) * 0.35
  ctx.fillStyle = `rgba(232, 96, 74, ${0.35 * pulsa})`
  ctx.fillRect(x - 3, y - 3, l + 6, a + 6)
  ctx.fillStyle = LASER
  ctx.fillRect(x, y, l, a)
  ctx.fillStyle = `rgba(247, 244, 236, ${pulsa})`
  if (l > a) ctx.fillRect(x, y + a / 2 - 2, l, 4)
  else ctx.fillRect(x + l / 2 - 2, y, 4, a)
}

function leggiRecord() {
  try {
    return Number(localStorage.getItem(CHIAVE_RECORD)) || 0
  } catch {
    return 0
  }
}

function salvaRecord(punti) {
  try {
    localStorage.setItem(CHIAVE_RECORD, String(punti))
  } catch {
    // Safari in navigazione privata può rifiutare: si gioca lo stesso.
  }
}

export default function Pecora({ compatta = false }) {
  const tela = useRef(null)
  const [record, setRecord] = useState(leggiRecord)
  const mondo = useRef(nuovoMondo(Date.now(), record))
  const finitoIl = useRef(0)
  const [vista, setVista] = useState('pronto')
  const [ultimoPunteggio, setUltimoPunteggio] = useState(0)
  const [nuovoRecord, setNuovoRecord] = useState(false)

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

    // Nuvole, più lente di tutto il resto: è la parallasse a dare la
    // distanza, e costa due moltiplicazioni.
    ctx.fillStyle = TEMA.nuvola
    for (let i = 0; i < NUVOLE.quante; i += 1) {
      const giro = L + 160
      const x = ((i * 137 - m.distanza * NUVOLE.lentezza) % giro + giro) % giro - 80
      const y = 22 + ((i * 37) % 60)
      const s = 0.7 + ((i * 13) % 7) / 10
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.arc(x, y, 13 * s, 0, Math.PI * 2)
      ctx.arc(x + 15 * s, y - 6 * s, 16 * s, 0, Math.PI * 2)
      ctx.arc(x + 32 * s, y, 12 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.fillStyle = TEMA.terra
    ctx.fillRect(0, lineaTerra, L, suolo)

    ctx.fillStyle = 'rgba(22, 35, 44, 0.22)'
    for (let i = 0; i < 14; i += 1) {
      const giro = L + 71
      const x = ((i * 71 - (m.distanza % giro)) % giro + giro) % giro
      ctx.fillRect(x, lineaTerra + 10 + ((i * 13) % 22), 6, 2)
    }

    const fase = m.distanza / 9

    // La navicella sta in alto e segue: non è un ostacolo, è la minaccia
    // che li manda.
    if (m.navicella) {
      DISEGNI.navicella(ctx, L * 0.62, 16, 78, 30, fase)
    }

    for (const o of m.ostacoli) {
      const disegno = DISEGNI[o.tipo]
      if (disegno) {
        disegno(ctx, o.x, lineaTerra - o.quota - o.altezza, o.larghezza, o.altezza, fase)
      }
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

    ctx.fillStyle = 'rgba(22, 35, 44, 0.75)'
    ctx.font = 'bold 16px ui-monospace, Consolas, monospace'
    ctx.textAlign = 'right'
    ctx.fillText(String(punteggio(m)).padStart(5, '0'), L - 14, 28)
  }, [])

  const tocca = useCallback(() => {
    const m = mondo.current
    if (m.stato === 'finita') {
      // Un tocco partito per la rabbia non deve far ricominciare e morire
      // subito: mezzo secondo di sordità.
      if (Date.now() - finitoIl.current < 450) return
      mondo.current = avvia(nuovoMondo(Date.now(), leggiRecord()))
      setNuovoRecord(false)
      setVista('corsa')
      return
    }
    mondo.current = salta(m)
    if (mondo.current.stato === 'corsa') setVista('corsa')
  }, [])

  // Il primo fotogramma si disegna subito, senza aspettare il ciclo: la
  // schermata deve mostrare Al fermo sul prato appena si apre.
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
        const punti = punteggio(mondo.current)
        finitoIl.current = Date.now()
        setUltimoPunteggio(punti)
        setVista('finita')
        if (punti > leggiRecord()) {
          salvaRecord(punti)
          setRecord(punti)
          setNuovoRecord(true)
        }
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

        {vista === 'pronto' && <p className="pecora-avviso">Tocca per farlo saltare.</p>}

        {vista === 'finita' && (
          <div className="pecora-fine">
            <p className="pecora-punti">{ultimoPunteggio}</p>
            {nuovoRecord && <p className="pecora-nuovo">Record tuo.</p>}
            <button type="button" className="pecora-ancora" onClick={tocca}>
              Ancora
            </button>
          </div>
        )}
      </div>

      {/* Sotto il gioco, come chiesto. Per ora è il record di questo
          dispositivo: quello di gruppo arriva con la seconda passata. */}
      <dl className="pecora-record">
        <div>
          <dt>Record</dt>
          <dd>{record || '—'}</dd>
        </div>
        <div>
          <dt>La navicella arriva a</dt>
          <dd>{mondo.current.daBattere}</dd>
        </div>
      </dl>
    </div>
  )
}
