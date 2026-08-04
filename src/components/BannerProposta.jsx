import { useEffect, useState } from 'react'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import './BannerProposta.css'

// Sta in cima a tutta l'app, come la celebrazione delle Leggi: una
// proposta scade in un'ora e riguarda tutti, quindi deve raggiungerti
// dove sei invece di aspettare che la cerchi.
export default function BannerProposta({ proposte, membri, onVota, onRimanda }) {
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)
  const proposta = proposte[0]
  const restano = useContoAllaRovescia(proposta?.scadeIl)

  // Il banner occupa spazio vero: le schermate si spostano giù invece di
  // finirci sotto. La misura sta nel hook, condivisa con la striscia
  // senza rete.
  const [riquadro, setRiquadro] = useState(null)
  useAltezzaBanner(riquadro, proposta)

  if (!proposta) return null

  const nome = (id) => membri[id]?.nome ?? 'Qualcuno'
  const segno = proposta.punti > 0 ? `+${proposta.punti}` : String(proposta.punti)

  async function scegli(opzione) {
    setInCorso(true)
    setErrore(null)
    try {
      await onVota(proposta.votoId, opzione)
    } catch (e) {
      setErrore(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div
      className="banner-proposta"
      role="region"
      aria-label="Proposta da votare"
      ref={setRiquadro}
    >
      <div className="banner-dentro">
        <div className="banner-testa">
          <span className={proposta.punti < 0 ? 'banner-punti meno' : 'banner-punti piu'}>
            {segno}
          </span>
          <p className="banner-testo">
            {/* Se se li è proposti da solo il gruppo lo deve sapere
                mentre vota, non dopo: è metà del divertimento. */}
            {proposta.proponenteId === proposta.destinatarioId ? (
              <>
                <strong>{nome(proposta.proponenteId)}</strong> si propone {segno}{' '}
                <strong>da solo</strong>
              </>
            ) : (
              <>
                <strong>{nome(proposta.proponenteId)}</strong> propone {segno} per{' '}
                <strong>{nome(proposta.destinatarioId)}</strong>
              </>
            )}
            <span className="banner-motivo">{proposta.motivo}</span>
          </p>
        </div>

        <div className="banner-scelte">
          <button
            type="button"
            className="banner-si"
            onClick={() => scegli(0)}
            disabled={inCorso}
          >
            Sì
          </button>
          <button
            type="button"
            className="banner-no"
            onClick={() => scegli(1)}
            disabled={inCorso}
          >
            No
          </button>
          {/* La terza scelta è il punto: obbligare fra sì e no per far
              sparire il banner produce voti a caso, e un voto a caso vale
              meno di un voto in meno. */}
          <button
            type="button"
            className="banner-dopo"
            onClick={() => onRimanda(proposta.votoId)}
            disabled={inCorso}
          >
            Voto dopo
          </button>
        </div>

        <p className="banner-piede">
          {errore ?? testoTempo(restano)}
          {proposte.length > 1 && !errore && ` · altre ${proposte.length - 1} in attesa`}
        </p>
      </div>
    </div>
  )
}

function useContoAllaRovescia(scadenza) {
  const [restano, setRestano] = useState(() => mancano(scadenza))

  useEffect(() => {
    setRestano(mancano(scadenza))
    const timer = setInterval(() => setRestano(mancano(scadenza)), 30000)
    return () => clearInterval(timer)
  }, [scadenza])

  return restano
}

function mancano(scadenza) {
  if (!scadenza) return null
  return Math.max(0, Date.parse(scadenza) - Date.now())
}

function testoTempo(ms) {
  if (ms === null) return ''
  const minuti = Math.ceil(ms / 60000)
  if (minuti <= 1) return 'Scade fra meno di un minuto'
  return `Scade fra ${minuti} minuti`
}
