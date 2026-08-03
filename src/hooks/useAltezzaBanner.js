import { useEffect } from 'react'

// Quello che sta fisso in cima occupa spazio vero: le schermate si
// spostano giù invece di finirci sotto. L'altezza si misura e non si
// indovina — un motivo lungo manda il banner a due righe, e con un numero
// fisso il contenuto finirebbe nascosto proprio nei casi peggiori.
//
// Vale per il banner delle proposte e per la striscia senza rete: due
// cose diverse nello stesso posto, con lo stesso spostamento.

// La classe su body è una sola per due componenti, quindi si conta chi la
// sta usando. Senza il conteggio, quello che si smonta la toglierebbe
// anche all'altro: montati insieme, l'effetto del secondo cancella la
// classe appena messa dal primo e la schermata finisce sotto la striscia.
let quanti = 0

export function useAltezzaBanner(riquadro, attivo) {
  useEffect(() => {
    if (!attivo || !riquadro) return undefined

    quanti += 1
    document.body.classList.add('con-banner')

    const misura = () => {
      const alto = Math.ceil(riquadro.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--altezza-banner', `${alto}px`)
    }

    // Subito, senza aspettare l'osservatore: ResizeObserver consegna al
    // prossimo fotogramma, e una scheda che non sta disegnando non ne ha.
    misura()

    const osserva = new ResizeObserver(misura)
    osserva.observe(riquadro)

    return () => {
      osserva.disconnect()
      quanti -= 1
      if (quanti > 0) return

      document.body.classList.remove('con-banner')
      document.documentElement.style.removeProperty('--altezza-banner')
    }
  }, [attivo, riquadro])
}
