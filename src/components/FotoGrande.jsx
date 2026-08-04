import { useEffect, useState } from 'react'
import './FotoGrande.css'
import { urlAvatar } from '../config/avatar.js'

// La foto a schermo pieno. In una griglia da tre colonne su un telefono
// una foto è larga cento pixel: si capisce che c'è qualcuno in spiaggia e
// basta, e le facce non si distinguono.
//
// Serve a guardarla meglio e a scaricarla, niente altro: eliminare resta
// sulla × della miniatura, dov'è più sobrio e dove non ci si finisce per
// sbaglio mentre si sfoglia.
export default function FotoGrande({ foto, autore, onChiudi }) {
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

  return (
    <div className="foto-grande" role="dialog" aria-modal="true" aria-label="Foto">
      <button type="button" className="foto-sfondo" onClick={onChiudi} aria-label="Chiudi" />

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
          <button type="button" className="foto-tasto" onClick={onChiudi}>
            Chiudi
          </button>
        </div>
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
