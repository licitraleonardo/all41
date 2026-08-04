import { useEffect, useState } from 'react'
import './FotoGrande.css'
import { urlAvatar } from '../config/avatar.js'

// La foto a schermo pieno. In una griglia da tre colonne su un telefono
// una foto è larga cento pixel: si capisce che c'è qualcuno in spiaggia
// e basta, e le facce non si distinguono.
export default function FotoGrande({ foto, autore, mia, onChiudi, onElimina }) {
  const [conferma, setConferma] = useState(false)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)

  // Esc chiude, come ci si aspetta da qualunque cosa a schermo pieno.
  useEffect(() => {
    const daTasto = (e) => e.key === 'Escape' && onChiudi()
    window.addEventListener('keydown', daTasto)
    return () => window.removeEventListener('keydown', daTasto)
  }, [onChiudi])

  // L'attributo download non basta: la foto arriva da un altro dominio e
  // il browser lo ignora, aprendola in una scheda invece di salvarla.
  // Si scarica il file e si salva quello.
  async function esporta() {
    setAvviso(null)
    try {
      const risposta = await fetch(foto.url)
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`)

      const blob = await risposta.blob()
      const indirizzo = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = indirizzo
      a.download = `all41-${foto.creataIl?.slice(0, 10) ?? 'foto'}-${foto.id.slice(0, 6)}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(indirizzo)
    } catch {
      // Senza rete non si scarica niente, ed è meglio dirlo che lasciare
      // un tasto che non fa niente.
      setAvviso('Non è partita. Serve la rete.')
    }
  }

  async function elimina() {
    setInCorso(true)
    try {
      await onElimina(foto)
      onChiudi()
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="foto-grande" role="dialog" aria-modal="true" aria-label="Foto">
      <button
        type="button"
        className="foto-sfondo"
        onClick={onChiudi}
        aria-label="Chiudi"
      />

      <img className="foto-piena" src={foto.url} alt="" />

      <div className="foto-barra">
        <div className="foto-chi">
          <img
            src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
            alt=""
            width="26"
            height="26"
          />
          <span>
            {autore?.nome ?? 'Qualcuno'}
            <span className="foto-quando">{quando(foto.creataIl)}</span>
          </span>
        </div>

        {avviso && <p className="foto-avviso">{avviso}</p>}

        <div className="foto-azioni">
          <button type="button" className="foto-tasto" onClick={esporta}>
            ⬇ Esporta
          </button>

          {mia &&
            (conferma ? (
              <>
                <button
                  type="button"
                  className="foto-tasto pericolo"
                  onClick={elimina}
                  disabled={inCorso}
                >
                  {inCorso ? 'Tolgo…' : 'Sì, elimina'}
                </button>
                <button
                  type="button"
                  className="foto-tasto"
                  onClick={() => setConferma(false)}
                  disabled={inCorso}
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className="foto-tasto"
                onClick={() => setConferma(true)}
              >
                Elimina
              </button>
            ))}

          <button type="button" className="foto-tasto" onClick={onChiudi}>
            Chiudi
          </button>
        </div>

        {conferma && <p className="foto-domanda">Sicuro di volerla eliminare?</p>}
      </div>
    </div>
  )
}

function quando(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
