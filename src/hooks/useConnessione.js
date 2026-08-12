import { useEffect, useState } from 'react'

// navigator.onLine dice solo se c'è una scheda di rete attiva, non se
// internet risponde davvero. Basta per distinguere "aereo mode" da
// "Supabase è configurato male", che è l'unica cosa che serve qui.
export function useConnessione() {
  const [inLinea, setInLinea] = useState(() => navigator.onLine !== false)

  useEffect(() => {
    const su = () => setInLinea(true)
    const giu = () => setInLinea(false)

    window.addEventListener('online', su)
    window.addEventListener('offline', giu)

    return () => {
      window.removeEventListener('online', su)
      window.removeEventListener('offline', giu)
    }
  }, [])

  return inLinea
}
