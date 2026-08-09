import { useState } from 'react'
import './BannerRapido.css'
import { useAltezzaBanner } from '../hooks/useAltezzaBanner.js'
import { descriviAvviso } from '../lib/avvisiRapidi.js'

// «Leo ha lanciato un sondaggio», «Si riparte fra 5 minuti».
//
// Prima queste cose le vedeva solo chi era nel Gruppo: dagli altri quattro
// tab restava un pallino sull'icona, identico a quello di un «che si
// mangia». Un «si riparte fra 5 minuti» letto venti minuti dopo è la
// differenza fra partire insieme e trovare il parcheggio vuoto.
//
// Due scelte e nessuna ×: «Mostra» porta in chat, «Vedo dopo» lo toglie.
// Chi non risponde lo perde comunque dopo dieci minuti — un cartello che
// si impara a scacciare senza leggere smette di funzionare anche quando
// conta.
export default function BannerRapido({ azione, nome, onMostra, onDopo }) {
  const [riquadro, setRiquadro] = useState(null)
  useAltezzaBanner(riquadro, Boolean(azione))

  if (!azione) return null

  const { icona, forte, piano } = descriviAvviso(azione, nome)

  return (
    <div
      className="banner-rapido"
      role="region"
      aria-label="Un messaggio dal gruppo"
      ref={setRiquadro}
    >
      <div className="banner-dentro">
        <p className="banner-testo">
          <strong>
            <span aria-hidden="true">{icona}</span> {forte}
          </strong>
          {piano && <span className="banner-motivo">{piano}</span>}
        </p>

        <div className="banner-scelte">
          <button type="button" className="banner-si" onClick={onMostra}>
            Mostra
          </button>
          <button type="button" className="banner-dopo" onClick={onDopo}>
            Vedo dopo
          </button>
        </div>
      </div>
    </div>
  )
}
