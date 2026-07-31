import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { precarica, sbloccaAudio, suona } from '../lib/audio.js'
import { SUONI } from '../config/suoni.js'

// Vive a livello di shell, non dentro la Chat Rapida: il suono lanciato da
// un altro deve sentirsi qualunque tab sia aperta, come dice lo spec.
export function useSoundboard(ioId) {
  const [disponibili, setDisponibili] = useState({})

  // Sblocco al primo gesto dell'utente, qualunque esso sia.
  useEffect(() => {
    let fatto = false
    function sblocca() {
      if (fatto) return
      fatto = true
      sbloccaAudio()
    }
    document.addEventListener('pointerdown', sblocca, { once: true })
    document.addEventListener('touchstart', sblocca, { once: true })
    document.addEventListener('keydown', sblocca, { once: true })
    return () => {
      document.removeEventListener('pointerdown', sblocca)
      document.removeEventListener('touchstart', sblocca)
      document.removeEventListener('keydown', sblocca)
    }
  }, [])

  // Un file mancante spegne il suo bottone e basta: gli altri restano.
  useEffect(() => {
    let vivo = true
    Promise.all(
      SUONI.map((s) =>
        precarica(s.file)
          .then(() => [s.file, true])
          .catch(() => [s.file, false])
      )
    ).then((esiti) => vivo && setDisponibili(Object.fromEntries(esiti)))
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (!ioId) return

    const canale = supabase
      .channel('soundboard-globale')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quick_actions',
          filter: 'kind=eq.soundboard',
        },
        ({ new: riga }) => {
          // Il proprio suono è già partito al tap: non si sente due volte.
          if (riga.author_id === ioId) return
          if (riga.payload?.file) suona(riga.payload.file)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canale)
    }
  }, [ioId])

  return { disponibili }
}
