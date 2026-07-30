import { useState } from 'react'

export default function CodiceNuovo({ membro, onAvanti }) {
  const [copiato, setCopiato] = useState(false)

  async function copia() {
    try {
      await navigator.clipboard.writeText(membro.codice)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch {
      // Senza permesso appunti resta la lettura a schermo: non è un errore
      // che valga un messaggio.
    }
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
