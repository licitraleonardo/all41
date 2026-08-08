import { useEffect, useState } from 'react'
import './Installa.css'
import { INSTALLA } from '../config/installa.js'
import { comeUscire, riconosci } from '../lib/dispositivo.js'
import { negliAppunti } from '../lib/appunti.js'

// La pagina di installazione, che vive a /installa e non c'entra niente
// con l'app: niente codice, niente onboarding, solo come mettersela sulla
// home. È il link che si condivide nel gruppo.
//
// Mostra UNA guida sola, quella giusta. Tre guide insieme sono un
// documento; una è un'istruzione.
export default function Installa() {
  const [dispositivo] = useState(() =>
    riconosci(navigator.userAgent, {
      standalone:
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true,
      tocco: navigator.maxTouchPoints > 1,
    })
  )
  const [invito, setInvito] = useState(null)
  const [copiato, setCopiato] = useState(false)
  const [fatto, setFatto] = useState(false)

  // ⚠️ Chi arriva qui con l'app già installata è quasi sempre finito
  // sull'icona sbagliata: su iOS "Aggiungi alla schermata Home" fissa
  // l'indirizzo della pagina corrente, quindi installando DA QUI l'icona
  // riaprirebbe per sempre la guida all'installazione. Si rimanda
  // all'app vera.
  useEffect(() => {
    if (dispositivo.installata) window.location.replace('/')
  }, [dispositivo.installata])

  // Android: il browser dice quando è disposto a installare. L'evento si
  // mette da parte, perché si può usare una volta sola e solo dopo un
  // gesto dell'utente.
  useEffect(() => {
    const prendi = (e) => {
      e.preventDefault()
      setInvito(e)
    }
    window.addEventListener('beforeinstallprompt', prendi)
    window.addEventListener('appinstalled', () => setFatto(true))
    return () => window.removeEventListener('beforeinstallprompt', prendi)
  }, [])

  const indirizzo = `${window.location.origin}/installa`

  async function copiaLink() {
    const riuscita = await negliAppunti(indirizzo)
    setCopiato(riuscita)
  }

  async function installaOra() {
    if (!invito) return
    invito.prompt()
    const esito = await invito.userChoice.catch(() => null)
    if (esito?.outcome === 'accepted') setFatto(true)
    setInvito(null)
  }

  if (fatto) {
    return (
      <main className="installa">
        <h1 className="installa-titolo">Ci siamo</h1>
        <p className="installa-testo">{INSTALLA.dopo}</p>
        <p className="installa-avviso">{INSTALLA.avvisoCodice}</p>
      </main>
    )
  }

  // Dentro WhatsApp e compagnia non c'è niente da spiegare: da lì non si
  // installa e basta. L'unica cosa utile è come uscirne.
  if (dispositivo.dentroUnAltraApp) {
    const uscita = comeUscire(dispositivo.sistema)
    return (
      <main className="installa">
        <h1 className="installa-titolo">Aprila in {uscita.browser}</h1>
        <p className="installa-testo">
          Stai guardando questa pagina dentro {dispositivo.dentroUnAltraApp}, e da qui
          l’app non si può installare. Non è colpa tua: quel browser non ha il tasto che
          serve.
        </p>
        <p className="installa-testo">{uscita.dove}</p>

        {/* Su iOS non si può forzare l'apertura in Safari da una pagina
            web — x-safari-https:// funziona solo dalle app native — e su
            Android l'intent:// non è affidabile. Copiare e incollare è
            l'unica strada che funziona ovunque, quindi è quella che si
            mette in grande invece di un bottone che a volte non fa
            niente. */}
        <button type="button" className="installa-primario" onClick={copiaLink}>
          {copiato ? 'Link copiato — incollalo là' : 'Copia il link'}
        </button>
        <p className="installa-indirizzo">{indirizzo}</p>
      </main>
    )
  }

  if (dispositivo.sistema === 'desktop') {
    return (
      <main className="installa">
        <h1 className="installa-titolo">{INSTALLA.desktop.titolo}</h1>
        <p className="installa-testo">{INSTALLA.desktop.testo}</p>
        <button type="button" className="installa-primario" onClick={copiaLink}>
          {copiato ? 'Link copiato' : 'Copia il link'}
        </button>
        <p className="installa-indirizzo">{indirizzo}</p>
      </main>
    )
  }

  const guida = INSTALLA[dispositivo.sistema]

  return (
    <main className="installa">
      <h1 className="installa-titolo">{INSTALLA.titolo}</h1>
      <p className="installa-testo">{INSTALLA.apertura}</p>
      <p className="installa-avviso">{INSTALLA.avvisoCodice}</p>

      {invito && (
        <button type="button" className="installa-primario" onClick={installaOra}>
          Installa app
        </button>
      )}

      <h2 className="installa-sotto">
        {invito ? 'Oppure a mano' : `Da ${guida.browser}, in tre passi`}
      </h2>
      <ol className="installa-passi">
        {guida.passi.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <p className="installa-nota">{guida.nota}</p>
    </main>
  )
}
