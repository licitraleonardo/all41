import { useEffect, useState } from 'react'

// La × piccolina nell'angolo, che è la cosa più sobria che ci sia. Ma un
// tocco solo su una cosa irreversibile è troppo poco: al primo tocco
// diventa "Sicuro?" e serve il secondo.
//
// Si disarma da sola dopo tre secondi: una × rimasta accesa a metà, in
// tasca, sarebbe peggio del problema che risolve.
export default function BottoneElimina({ onElimina, etichetta = 'Elimina' }) {
  const [armato, setArmato] = useState(false)
  const [inCorso, setInCorso] = useState(false)

  useEffect(() => {
    if (!armato) return undefined
    const timer = setTimeout(() => setArmato(false), 3000)
    return () => clearTimeout(timer)
  }, [armato])

  async function tocca(e) {
    // La cella sotto apre la foto grande: qui non deve arrivarci niente.
    e.stopPropagation()

    if (!armato) {
      setArmato(true)
      return
    }

    setInCorso(true)
    try {
      await onElimina()
    } finally {
      setInCorso(false)
      setArmato(false)
    }
  }

  return (
    <button
      type="button"
      className={armato ? 'cella-elimina armato' : 'cella-elimina'}
      onClick={tocca}
      disabled={inCorso}
      aria-label={armato ? 'Tocca di nuovo per eliminare' : etichetta}
    >
      {armato ? 'Sicuro?' : '×'}
    </button>
  )
}
