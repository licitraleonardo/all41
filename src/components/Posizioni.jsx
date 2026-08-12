import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import './Posizioni.css'

// Leaflet pesa duecento kilobyte, e la mappa e' la sezione che lo spec
// stesso dice che si guarda meno di quanto sembri. Caricarlo con tutto
// il resto vorrebbe dire farlo scaricare a tutti, ogni volta, per una
// cosa che si apre due volte in cinque giorni: si carica quando si apre
// questa scheda e basta. Stessa idea del decodificatore HEIC.
const Mappa = lazy(() => import('./Mappa.jsx'))
import { supabase } from '../lib/supabase.js'
import {
  chiediPosizione,
  condividiPosizione,
  leggiPosizioni,
  smettiDiCondividere,
} from '../lib/posizione.js'
import { urlAvatar } from '../config/avatar.js'
import { descriviErrore } from '../lib/errori.js'
import { useConnessione } from '../hooks/useConnessione.js'
import FoglioPosizione from './FoglioPosizione.jsx'

// La mappa del gruppo. Due cose che lo spec chiede e che vanno tenute:
//
// 1. La posizione si condivide con un tasto, mai da sola. Quello che si
//    vede è "l'ultima volta che ha detto dov'era", non un tracciamento —
//    e l'interfaccia lo dice, perché la differenza è tutta lì.
// 2. Su iOS non c'è aggiornamento in secondo piano: la posizione si
//    aggiorna solo ad app aperta. È un limite del telefono, non un
//    difetto da nascondere.
export default function Posizioni({ membro }) {
  const [punti, setPunti] = useState([])
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [scelto, setScelto] = useState(null)
  const inLinea = useConnessione()

  const ricarica = useCallback(async () => {
    setPunti(await leggiPosizioni())
  }, [])

  useEffect(() => {
    let vivo = true
    ricarica().catch(() => {})

    const canale = supabase
      .channel('posizioni')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'members' }, () =>
        vivo ? ricarica().catch(() => {}) : null
      )
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [ricarica])

  const mia = punti.find((p) => p.id === membro.id) ?? null

  async function condividi() {
    setInCorso(true)
    setAvviso(null)
    try {
      const dove = await chiediPosizione()
      await condividiPosizione(membro.id, dove)
      await ricarica()

      // ⚠️ Non c'è niente da accendere: da qui in poi si riaggiorna da
      // sola perché **hai una posizione condivisa**, e basta quello. Lo
      // stato è dedotto, non salvato — vedi `lib/posizioneAutomatica.js`.
      setAvviso('Detto. Da adesso riparte a ogni apertura.')
    } catch (e) {
      setAvviso(e?.message ?? descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  async function smetti() {
    setInCorso(true)
    setAvviso(null)
    try {
      await smettiDiCondividere(membro.id)
      await ricarica()

      // ⚠️ E qui non c'è niente da spegnere: senza posizione condivisa
      // non c'è niente da riaggiornare, e l'automatismo si ferma da sé.
    } catch (e) {
      setAvviso(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="posizioni">
      {!inLinea && (
        <p className="pos-avviso">
          Senza rete la mappa resta grigia: le mattonelle arrivano da internet.
        </p>
      )}

      <Suspense fallback={<div className="mappa mappa-attesa" />}>
        <Mappa punti={punti} />
      </Suspense>

      <button
        type="button"
        className="pos-condividi"
        onClick={condividi}
        disabled={inCorso}
      >
        {inCorso ? 'Un attimo…' : mia ? 'Aggiorna dove sono' : 'Condividi la mia posizione'}
      </button>

      {avviso && <p className="pos-avviso">{avviso}</p>}

      {punti.length === 0 ? (
        <p className="pos-vuoto">
          Nessuno ha ancora detto dov&rsquo;è. Non succede da solo: si dice
          premendo il tasto, una volta per volta.
        </p>
      ) : (
        <ul className="pos-elenco">
          {punti.map((p) => (
            <li key={p.id}>
              {/* Si tocca e si apre il link a Maps con le coordinate:
                  quando devi raggiungere qualcuno ti serve chi ti dice
                  dove girare, non un puntino da guardare. */}
              <button
                type="button"
                className={p.id === membro.id ? 'pos io' : 'pos'}
                onClick={() => setScelto({ ...p, detto: quando(p.quando) })}
              >
                <img
                  src={urlAvatar(p.avatarStyle, p.avatarSeed)}
                  alt=""
                  width="30"
                  height="30"
                />
                <span className="pos-nome">
                  {p.nome}
                  <span className="pos-quando">{quando(p.quando)}</span>
                </span>
                <span className="pos-freccia" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {mia && (
        <button type="button" className="riga-secondaria pos-smetti" onClick={smetti}>
          Togli la mia posizione
        </button>
      )}

      {/* ⚠️ La nota cambia con l'interruttore, o dice una bugia.
          Diceva «non si aggiorna da sola» sempre: da quando esiste
          l'aggiornamento all'apertura, per chi ce l'ha acceso è falso. */}
      <p className="pos-nota">
        È l&rsquo;ultima posizione che ognuno ha condiviso, non dove si trova
        adesso.{' '}
        {mia
          ? 'La tua riparte a ogni apertura dell’app; quella degli altri quando la mandano loro.'
          : 'Si aggiorna solo quando la mandi, e su iPhone nemmeno con l’app chiusa.'}
      </p>

      {scelto && <FoglioPosizione persona={scelto} onChiudi={() => setScelto(null)} />}
    </div>
  )
}

// "Due ore fa" dice quanto fidarsi di quel puntino; un orario no.
function quando(iso) {
  if (!iso) return ''
  const minuti = Math.round((Date.now() - Date.parse(iso)) / 60000)

  if (minuti < 2) return 'adesso'
  if (minuti < 60) return `${minuti} minuti fa`

  const ore = Math.round(minuti / 60)
  if (ore < 24) return ore === 1 ? 'un’ora fa' : `${ore} ore fa`

  const giorni = Math.round(ore / 24)
  return giorni === 1 ? 'ieri' : `${giorni} giorni fa`
}
