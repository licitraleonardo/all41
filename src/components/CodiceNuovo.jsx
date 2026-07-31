import { useState } from 'react'

export default function CodiceNuovo({ membro, onAvanti }) {
  const [copiato, setCopiato] = useState(false)

  async function copia() {
    if (await negliAppunti(membro.codice)) {
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    }
    // Se fallisce anche il ripiego, il codice resta comunque leggibile a
    // schermo: non è un errore che valga un messaggio.
  }

  return (
    <div className="pannello">
      <h1 className="titolo">Il tuo codice</h1>
      <p className="allan">
        Segnatelo da qualche parte. Serve se cambi telefono o svuoti la cache.
        Senza, non ti ritrovo più.
      </p>

      <p className="codice-grande">{membro.codice}</p>

      <button type="button" className="secondario" onClick={copia}>
        {copiato ? 'Copiato' : 'Copia'}
      </button>

      <button type="button" className="primario" onClick={onAvanti}>
        Fatto, l&rsquo;ho segnato
      </button>
    </div>
  )
}

// navigator.clipboard esiste solo in contesto sicuro: aprendo l'app dal
// telefono su http://192.168.x.x non c'è, e il bottone non farebbe niente.
async function negliAppunti(testo) {
  try {
    await navigator.clipboard.writeText(testo)
    return true
  } catch {
    // Ripiego vecchio stile, che funziona anche senza HTTPS.
  }

  try {
    const campo = document.createElement('textarea')
    campo.value = testo
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const riuscito = document.execCommand('copy')
    campo.remove()
    return riuscito
  } catch {
    return false
  }
}
