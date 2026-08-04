import { useCallback, useEffect, useRef, useState } from 'react'
import './Pecora.css'
import { CHIAVE_RECORD, MONDO, NAVICELLA, NUVOLE, SAGOME, TEMA } from '../config/pecora.js'
import { avvia, nuovoMondo, passo, punteggio, salta } from '../lib/pecora.js'
import { useRecordPecora } from '../hooks/useRecordPecora.js'

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
  // Alan e basta: draghetto verde, niente vestiti. A questa dimensione
  // ogni dettaglio in più diventa una macchia, e quello che si deve
  // riconoscere è la sagoma.
  alan(ctx, x, y, l, a, fase) {
    const avanti = Math.sin(fase) > 0
    const cx = x + l / 2

    // Coda
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.moveTo(x + 5, y + a - 13)
    ctx.quadraticCurveTo(x - 9, y + a - 17, x - 5, y + a - 27)
    ctx.quadraticCurveTo(x + 3, y + a - 18, x + 12, y + a - 10)
    ctx.fill()

    // Zampe, alternate: si vede che corre invece di scivolare
    ctx.fillStyle = VERDE_SCURO
    ctx.fillRect(x + 10, y + a - (avanti ? 10 : 5), 7, avanti ? 10 : 5)
    ctx.fillRect(x + l - 20, y + a - (avanti ? 5 : 10), 7, avanti ? 5 : 10)

    // Ala
    ctx.fillStyle = CORNO
    ctx.beginPath()
    ctx.moveTo(cx - 3, y + 13)
    ctx.lineTo(cx - 15, y + 1)
    ctx.lineTo(cx - 12, y + 12)
    ctx.lineTo(cx + 4, y + 9)
    ctx.closePath()
    ctx.fill()

    // Corpo
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.ellipse(cx - 2, y + a - 16, 15, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = PANCIA
    ctx.beginPath()
    ctx.ellipse(cx - 1, y + a - 11, 10, 7, 0, 0, Math.PI * 2)
    ctx.fill()

    // Le punte sulla schiena, al posto del vello
    ctx.fillStyle = CORNO
    for (let i = 0; i < 3; i += 1) {
      const px = cx - 9 + i * 8
      const py = y + a - 26 + i * 1.5
      ctx.beginPath()
      ctx.moveTo(px - 3, py + 5)
      ctx.lineTo(px, py)
      ctx.lineTo(px + 3, py + 5)
      ctx.closePath()
      ctx.fill()
    }

    // Testa
    ctx.fillStyle = VERDE
    ctx.beginPath()
    ctx.ellipse(x + l - 11, y + 13, 11, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + l - 3, y + 16, 6, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Corno
    ctx.fillStyle = CORNO
    ctx.beginPath()
    ctx.moveTo(x + l - 16, y + 5)
    ctx.lineTo(x + l - 12, y - 3)
    ctx.lineTo(x + l - 9, y + 5)
    ctx.closePath()
    ctx.fill()

    // Narice e occhio semichiuso: è svogliato, e si deve vedere anche a
    // trenta pixel
    ctx.fillStyle = VERDE_SCURO
    ctx.fillRect(x + l - 2, y + 15, 2, 2)
    ctx.fillStyle = SCURO
    ctx.fillRect(x + l - 12, y + 10, 6, 2)
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

  // Il raggio: un proiettile allungato in orizzontale, con la scia che
  // punta indietro verso la navicella da cui è partito.
  raggio: (ctx, x, y, l, a, fase) => {
    const pulsa = 0.7 + Math.abs(Math.sin(fase * 4)) * 0.3
    const cy = y + a / 2

    // Scia verso destra, cioè verso la navicella
    const scia = ctx.createLinearGradient(x + l, cy, x + l + 46, cy)
    scia.addColorStop(0, `rgba(232, 96, 74, ${0.5 * pulsa})`)
    scia.addColorStop(1, 'rgba(232, 96, 74, 0)')
    ctx.fillStyle = scia
    ctx.fillRect(x + l, cy - 4, 46, 8)

    ctx.fillStyle = `rgba(232, 96, 74, ${0.3 * pulsa})`
    ctx.fillRect(x - 4, y - 4, l + 8, a + 8)

    ctx.fillStyle = LASER
    ctx.beginPath()
    ctx.ellipse(x + l / 2, cy, l / 2, a / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(247, 244, 236, ${pulsa})`
    ctx.beginPath()
    ctx.ellipse(x + l / 2, cy, l / 2 - 5, a / 2 - 7, 0, 0, Math.PI * 2)
    ctx.fill()
  },

  // Ferma sul bordo destro, come Alan lo è sul sinistro. Si disegna dopo
  // gli ostacoli: così il raggio appena sparato le esce da sotto invece
  // di comparirle accanto.
  navicella: (ctx, x, y, l, a, fase, lampo) => {
    const su = Math.sin(fase * 0.35) * 2.5
    const cy = y + a / 2 + su

    ctx.fillStyle = 'rgba(22, 35, 44, 0.16)'
    ctx.beginPath()
    ctx.ellipse(x + l / 2, y + a + 2 + su, l * 0.34, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Scafo
    ctx.fillStyle = PIETRA
    ctx.beginPath()
    ctx.ellipse(x + l / 2, cy, l / 2, a * 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(22, 35, 44, 0.18)'
    ctx.beginPath()
    ctx.ellipse(x + l / 2, cy + 3, l / 2 - 3, a * 0.14, 0, 0, Math.PI * 2)
    ctx.fill()

    // Cupola
    ctx.fillStyle = 'rgba(247, 244, 236, 0.85)'
    ctx.beginPath()
    ctx.ellipse(x + l * 0.52, cy - 3, l * 0.2, a * 0.3, 0, Math.PI, 0)
    ctx.fill()

    // Bocca da fuoco, rivolta a sinistra: è da lì che escono i raggi
    ctx.fillStyle = VERDE_SCURO
    ctx.fillRect(x - 3, cy - 3, 12, 6)

    if (lampo > 0) {
      ctx.fillStyle = `rgba(232, 96, 74, ${Math.min(1, lampo * 4)})`
      ctx.beginPath()
      ctx.arc(x - 2, cy, 9 * Math.min(1, lampo * 4), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(247, 244, 236, ${Math.min(1, lampo * 3)})`
      ctx.beginPath()
      ctx.arc(x - 2, cy, 4 * Math.min(1, lampo * 4), 0, Math.PI * 2)
      ctx.fill()
    }

    // Le lucine, a turno
    for (let i = 0; i < 3; i += 1) {
      const acceso = Math.floor(fase * 1.5) % 3 === i
      ctx.fillStyle = acceso ? LASER : 'rgba(22, 35, 44, 0.3)'
      ctx.beginPath()
      ctx.arc(x + l * (0.3 + i * 0.2), cy + 4, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  },
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

export default function Pecora({ membroId = null, compatta = false }) {
  const tela = useRef(null)
  const [record, setRecord] = useState(leggiRecord)
  const gruppo = useRecordPecora(membroId)
  // Il ciclo dei fotogrammi parte una volta sola e non deve ripartire a
  // ogni aggiornamento dei record: legge da qui, che è sempre l'ultimo.
  const gruppoOra = useRef(gruppo)
  gruppoOra.current = gruppo
  const mondo = useRef(nuovoMondo(Date.now()))
  const finitoIl = useRef(0)
  const [vista, setVista] = useState('pronto')
  const [ultimoPunteggio, setUltimoPunteggio] = useState(0)
  const [nuovoRecord, setNuovoRecord] = useState(null)

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

    for (const o of m.ostacoli) {
      const disegno = DISEGNI[o.tipo]
      if (disegno) {
        disegno(ctx, o.x, lineaTerra - o.quota - o.altezza, o.larghezza, o.altezza, fase)
      }
    }

    // Dopo gli ostacoli, di proposito: il raggio appena sparato le esce
    // da sotto invece di comparirle accanto. È tutta lì l'illusione.
    if (m.navicella.arrivata) {
      const s = SAGOME[TEMA.navicella]
      DISEGNI.navicella(
        ctx,
        NAVICELLA.x,
        lineaTerra - m.navicella.quota - s.altezza,
        s.larghezza,
        s.altezza,
        fase,
        m.navicella.lampo
      )
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
      mondo.current = avvia(nuovoMondo(Date.now()))
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

        // Il primato di giornata batte quello personale: se li hai
        // superati entrambi si annuncia il più grosso.
        const daBattere = gruppoOra.current.delGiorno?.punteggio ?? 0
        if (punti > daBattere && daBattere > 0) setNuovoRecord('giorno')
        else if (punti > leggiRecord()) setNuovoRecord('tuo')
        else setNuovoRecord(null)

        if (punti > leggiRecord()) {
          salvaRecord(punti)
          setRecord(punti)
        }

        gruppoOra.current.segna(punti)
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
            {nuovoRecord === 'giorno' && <p className="pecora-nuovo">Record del giorno.</p>}
            {nuovoRecord === 'tuo' && <p className="pecora-nuovo">Record tuo.</p>}
            <button type="button" className="pecora-ancora" onClick={tocca}>
              Ancora
            </button>
          </div>
        )}
      </div>

      <dl className="pecora-record">
        <div>
          <dt>Record del viaggio</dt>
          <dd>
            {gruppo.delViaggio ? gruppo.delViaggio.punteggio : record || '—'}
            {gruppo.delViaggio && (
              <span className="pecora-chi">
                {gruppo.membri[gruppo.delViaggio.membroId]?.nome ?? ''}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>La navicella arriva a</dt>
          <dd>{NAVICELLA.soglia}</dd>
        </div>
      </dl>

      {/* La classifica di tutti, come chiesto. È quella di oggi: domani
          riparte da zero, ed è il record di giornata che vale i punti
          della Legge XX. */}
      {membroId && gruppo.pronto && (
        <>
          <h4 className="pecora-titolo">Oggi</h4>
          {gruppo.classifica.length === 0 ? (
            <p className="pecora-vuoto">Nessuno ha ancora giocato.</p>
          ) : (
            <ol className="pecora-classifica">
              {gruppo.classifica.map((riga, posto) => (
                <li
                  key={riga.membroId}
                  className={riga.membroId === membroId ? 'io' : undefined}
                >
                  <span className="pecora-posto">{posto + 1}</span>
                  <span className="pecora-nome">
                    {gruppo.membri[riga.membroId]?.nome ?? 'Qualcuno'}
                  </span>
                  <span className="pecora-punteggio">{riga.punteggio}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}
