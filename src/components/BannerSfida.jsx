import { useState } from 'react'
import './BannerSfida.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'

// "Turi ti sfida a dama". Stesso posto e stesso meccanismo del banner
// delle proposte: in cima a tutta l'app, perché una sfida arriva mentre
// stai guardando le foto e deve raggiungerti lì.
//
// La differenza è che qui accettare non è votare: è andare. Il tasto
// porta dritto alla partita, con la scacchiera già aperta — senza,
// bisognerebbe spiegare a voce "vai su Gioco, poi Dama, poi tocca la
// riga con il mio nome", che è esattamente il motivo per cui una sfida
// lanciata non veniva raccolta.
export default function BannerSfida({ sfide, membri, onAccetta, onRimanda }) {
  const [riquadro, setRiquadro] = useState(null)
  const sfida = sfide[0]
  useAltezzaBanner(riquadro, sfida)

  if (!sfida) return null

  const chi = membri[sfida.bianco]?.nome ?? 'Qualcuno'

  return (
    <div
      className="banner-sfida"
      role="region"
      aria-label="Sfida a dama"
      ref={setRiquadro}
    >
      <div className="banner-dentro">
        <p className="banner-testo">
          <strong>{chi}</strong> ti sfida a <strong>dama</strong>
          <span className="banner-motivo">Muove lui per primo. Tu rispondi.</span>
        </p>

        <div className="banner-scelte">
          <button type="button" className="banner-si" onClick={() => onAccetta(sfida.id)}>
            Vediamo
          </button>
          {/* Come il "voto dopo" delle proposte: obbligare a decidere
              subito per far sparire un banner produce dei sì a caso, e
              la sfida resta lì comunque — non scade. */}
          <button type="button" className="banner-dopo" onClick={() => onRimanda(sfida.id)}>
            Dopo
          </button>
        </div>

        {sfide.length > 1 && (
          <p className="banner-piede">· altre {sfide.length - 1} in attesa</p>
        )}
      </div>
    </div>
  )
}
