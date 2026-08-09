import { useEffect, useRef, useState } from 'react'
import './Foglio.css'
import { apriLivello, chiudiLivello, quandoTornaIndietroDaUnFoglio } from '../lib/navigazione.js'

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

  // Il tasto indietro del telefono.
  //
  // ⚠️ La cronologia non la tocca piu' questo componente: la tiene
  // `lib/navigazione.js`, che ha un ascoltatore solo e sempre vivo.
  //
  // Prima ci provava da solo, e non reggeva. `history.back()` non fa
  // niente sul momento: mette in coda un evento che arriva dopo, quando
  // il foglio che l'ha chiesto non c'e' piu'. A raccoglierlo era chi
  // capitava — il foglio aperto nel frattempo, che credeva fosse il tasto
  // indietro e si chiudeva appena nato. Un contatore dentro il componente
  // era peggio ancora: finiva per ingoiare la prima pressione VERA.
  //
  // La conseguenza era un compromesso scritto e accettato: la voce non si
  // toglieva mai, e chi chiudeva un foglio col bottone si pagava una
  // pressione a vuoto. **Adesso quel compromesso non c'e' piu'**, perche'
  // il conto sta in un posto che non se ne va.
  useEffect(() => {
    apriLivello()

    // Premuto indietro mentre questo foglio era aperto.
    const stacca = quandoTornaIndietroDaUnFoglio(() => {
      if (!tenta()) {
        // Rifiutato perche' c'e' roba scritta: la voce l'ha gia'
        // consumata il telefono, quindi se ne rimette una, o il secondo
        // «indietro» uscirebbe dalla schermata invece di chiudere il
        // foglio.
        apriLivello()
      }
    })

    const daTastiera = (e) => {
      if (e.key !== 'Escape') return
      if (tenta()) chiudiLivello()
    }
    document.addEventListener('keydown', daTastiera)

    return () => {
      stacca()
      document.removeEventListener('keydown', daTastiera)
      // Chiuso in un modo che non passa dalla cronologia (il bottone, il
      // tocco fuori, o il foglio smontato da chi lo conteneva): si
      // rimette a posto.
      chiudiLivello()
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
