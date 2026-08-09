import { useEffect, useRef, useState } from 'react'
import './Foglio.css'

// Il foglio che si alza dal basso, e i tre modi di uscirne.
//
// Prima ogni foglio si disegnava il velo per conto suo, e ognuno usciva
// a modo suo: chi con «Annulla», chi con «Lascia stare», chi con
// «Chiudi», chi con una ×. Toccare fuori non faceva niente da nessuna
// parte, e il tasto indietro del telefono chiudeva **l'app** invece del
// foglio — che su Android è il modo più veloce per perdere quello che
// stavi scrivendo.
//
// Adesso le tre uscite stanno qui dentro, in un posto solo:
//
//   1. toccare fuori dal foglio
//   2. il tasto indietro del telefono (o la strisciata dal bordo su iPhone)
//   3. Esc, per chi prova dal computer
//
// ⚠️ Toccare fuori e premere indietro non sono la stessa cosa, e il
// codice qui sotto li tratta diversi apposta: **fuori si tocca per
// sbaglio, indietro si preme apposta.** Per questo un foglio può
// rifiutare il tocco fuori (`chiudibileFuori={false}`) e continuare a
// rispondere al tasto indietro: quello che deve difendersi è il gesto
// distratto, non la volontà.
export default function Foglio({
  etichetta,
  chiudibileFuori = true,
  // Quando c'è dentro roba scritta a mano che si perderebbe. Il primo
  // tentativo di uscire avvisa invece di buttare via.
  sporco = false,
  className = '',
  onChiudi,
  children,
}) {
  const [avvisato, setAvvisato] = useState(false)
  const sfondo = useRef(null)

  // ⚠️ Tenuti in un `ref` e non nelle dipendenze: se `onChiudi` è una
  // funzione nuova a ogni render — e lo è quasi sempre, sono tutte
  // scritte in linea — l'effetto qui sotto ripartirebbe a ogni render e
  // infilerebbe **una voce nuova nella cronologia ogni volta**. Il tasto
  // indietro poi andrebbe premuto venti volte per uscire da un foglio.
  const ultimo = useRef({ onChiudi, sporco, avvisato })
  ultimo.current = { onChiudi, sporco, avvisato }

  // Torna `true` se il foglio si è davvero chiuso. Chi chiama ha bisogno
  // di saperlo: il tasto indietro deve rimettere a posto la cronologia
  // quando l'uscita viene rifiutata.
  function tenta() {
    const { onChiudi: chiudi, sporco: c, avvisato: giaAvvisato } = ultimo.current
    if (c && !giaAvvisato) {
      setAvvisato(true)
      return false
    }
    chiudi?.()
    return true
  }

  // L'avviso si disarma da solo: se dopo qualche secondo uno non ha
  // insistito, vuol dire che voleva restare. Stessa idea della × delle
  // foto, che si spegne da sola dopo tre secondi.
  useEffect(() => {
    if (!avvisato) return
    const t = setTimeout(() => setAvvisato(false), 4000)
    return () => clearTimeout(t)
  }, [avvisato])

  // Il tasto indietro del telefono. All'apertura si mette una voce finta
  // nella cronologia, così «indietro» ha qualcosa da togliere che non è
  // l'app.
  //
  // ⚠️ **Qui dentro non si chiama mai `history.back()`, ed è una scelta.**
  //
  // La versione ovvia era: apri → `pushState`, chiudi col bottone →
  // `back()` per rimettere a posto. Non regge, e il motivo è che `back()`
  // non fa niente sul momento: mette in coda un `popstate` che arriva
  // dopo, quando il foglio che l'ha chiesto non c'è già più. A
  // raccoglierlo è chi capita — il foglio che si è aperto nel frattempo,
  // che crede sia il tasto indietro e si chiude appena nato. Provata, e
  // in sviluppo il foglio si apriva e spariva **ogni volta**.
  //
  // Ho provato a distinguerli con un contatore dei riordini: peggio.
  // Quando un foglio si chiude col bottone il riordino parte dalla sua
  // pulizia, cioè quando non c'è più nessuno ad aspettarsi quel
  // `popstate`; il conto restava alto e finiva per ingoiare la **prima
  // pressione vera** del tasto indietro. Il telefono sembrava impuntato
  // esattamente come nel difetto che stavo correggendo.
  //
  // Quindi: la voce non si toglie mai. Alla riapertura, se ce n'è già una
  // nostra si **riusa** invece di impilarne un'altra. Il prezzo è una
  // pressione a vuoto, una sola, e solo per chi chiude un foglio col
  // bottone e subito dopo preme indietro — e da lì in poi tutto torna
  // normale. Il prezzo dell'altra strada era un foglio che si chiude da
  // solo mentre ci scrivi dentro.
  useEffect(() => {
    if (window.history.state?.all41Foglio) {
      window.history.replaceState({ all41Foglio: true }, '')
    } else {
      window.history.pushState({ all41Foglio: true }, '')
    }

    const indietro = () => {
      if (!tenta()) {
        // Rifiutato perché c'è roba scritta: la voce l'ha già consumata
        // il telefono, quindi se ne rimette una, o il secondo «indietro»
        // chiuderebbe l'app invece del foglio.
        window.history.pushState({ all41Foglio: true }, '')
      }
    }

    const daTastiera = (e) => {
      if (e.key !== 'Escape') return
      tenta()
    }

    window.addEventListener('popstate', indietro)
    document.addEventListener('keydown', daTastiera)

    return () => {
      window.removeEventListener('popstate', indietro)
      document.removeEventListener('keydown', daTastiera)
    }
    // Apposta vuoto: si entra e si esce una volta sola per foglio. Vedi
    // il commento sul `ref` qui sopra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={sfondo}
      className="foglio-sfondo"
      role="dialog"
      aria-modal="true"
      aria-label={etichetta}
      // Solo il velo, non quello che ci sta sopra: senza questo controllo
      // un tocco su un tasto dentro al foglio chiuderebbe tutto, perché
      // l'evento risale fin qui.
      onClick={(e) => {
        if (!chiudibileFuori) return
        if (e.target !== sfondo.current) return
        tenta()
      }}
    >
      <div className={`foglio ${className}`.trim()}>
        {avvisato && (
          <p className="foglio-avviso" role="alert">
            Tocca ancora per uscire: quello che hai scritto va perso.
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
