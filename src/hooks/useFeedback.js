import { useCallback, useState } from 'react'
import { prossimaVolta, vaChiestoFeedback } from '../lib/quandoChiedere.js'
import { dataDiOggi, statoDelViaggio } from '../lib/giorni.js'
import { VIAGGIO } from '../config/viaggio.js'

const CHIAVE = 'all41.feedback.prossima'

// ⚠️ `localStorage` e non `sessionStorage`, al contrario del «non ora»
// della posizione: due giorni non li attraversa una scheda del browser.
function leggiProssima() {
  try {
    return localStorage.getItem(CHIAVE)
  } catch {
    return null
  }
}

function scriviProssima(quando) {
  try {
    localStorage.setItem(CHIAVE, quando)
  } catch {
    // Navigazione privata: il cartello non tornerà più. Pazienza — è la
    // cosa meno importante dell'app, e non vale un errore a schermo.
  }
}

export function useFeedback() {
  const [prossima, setProssima] = useState(leggiProssima)
  const [aperto, setAperto] = useState(false)

  // Alla prima apertura non si chiede: si programma e basta. Chi arriva
  // deve poter usare l'app prima che gli si chieda com'è.
  if (prossima === null) {
    const quando = prossimaVolta().toISOString()
    scriviProssima(quando)
    setProssima(quando)
  }

  const riprogramma = useCallback(() => {
    const quando = prossimaVolta().toISOString()
    scriviProssima(quando)
    setProssima(quando)
  }, [])

  const oggi = dataDiOggi()
  const daChiedere = vaChiestoFeedback({
    prossima,
    dentroIlViaggio: statoDelViaggio(oggi) === 'durante',
    primoGiorno: oggi === VIAGGIO.dataInizio,
  })

  const apri = useCallback(() => {
    setAperto(true)
    riprogramma()
  }, [riprogramma])

  const chiudi = useCallback(() => setAperto(false), [])

  // «Dopo» riprogramma come se avesse risposto: chi lo rimanda ha detto
  // qualcosa, e insistere fra due ore è il modo di non farsi più leggere.
  const dopo = useCallback(() => riprogramma(), [riprogramma])

  return { daChiedere, aperto, apri, chiudi, dopo }
}
