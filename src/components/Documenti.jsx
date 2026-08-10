import { useEffect, useRef, useState } from 'react'
import './Documenti.css'
import { useDocumenti } from '../hooks/useDocumenti.js'
import { caricaDocumento, eUnPdf } from '../lib/documenti.js'
import { MAX_BYTE, TIPI_ACCETTATI } from '../config/documenti.js'
import { descriviErrore } from '../lib/errori.js'
import { urlAvatar } from '../config/avatar.js'
import FotoGrande from './FotoGrande.jsx'
import BottoneElimina from './BottoneElimina.jsx'
import FoglioDocumento from './FoglioDocumento.jsx'
import Foglio from './Foglio.jsx'
import Rotella from './Rotella.jsx'

// I documenti del viaggio: QR dell'escursione, biglietti, prenotazioni.
//
// ⚠️ Non è un'area personale e non si chiama così. Con auth anonima e
// codice di accesso "privato" non è realmente privato: il "solo per me"
// toglie il documento dalla vista degli altri, non lo mette al sicuro.
//
// ⚠️ **Questo avvertimento non è sparito: ha cambiato momento.**
//
// Stava scritto qui che "la riga in fondo lo dice, e deve restarci". La
// riga in fondo però la leggeva chi stava guardando i documenti, non chi
// stava per caricarne uno — e quando poi caricava, dieci schermate dopo,
// se l'era scordata. Adesso compare mentre si preme "Aggiungi", che è
// l'unico istante in cui serve.
//
// E compare **una volta sola**. Alla terza si preme senza guardare, e un
// avvertimento che si impara a saltare vale come non averlo scritto: è la
// stessa ragione per cui il banner della posizione non ricompare.
const CHIAVE_AVVISO = 'all41.documenti.avvisato'

export default function Documenti({ membro }) {
  const { documenti, membri, stato, errore, inserisci, togli, commutaVisibilita } =
    useDocumenti(membro.id)

  const campo = useRef(null)
  const [scelto, setScelto] = useState(null)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [grande, setGrande] = useState(null)
  const [daAvvisare, setDaAvvisare] = useState(false)

  // Il segnalibro sta in localStorage e non in memoria: in memoria
  // tornerebbe a ogni ricaricata, cioè sarebbe "una volta per apertura" e
  // non "una volta". Se il browser lo rifiuta — Safari in navigazione
  // privata — l'avviso ricompare: seccante, ma dalla parte giusta.
  function giaAvvisato() {
    try {
      return localStorage.getItem(CHIAVE_AVVISO) === 'sì'
    } catch {
      return false
    }
  }

  function scegliFile() {
    if (!giaAvvisato()) {
      setDaAvvisare(true)
      return
    }
    campo.current?.click()
  }

  function hoCapito() {
    try {
      localStorage.setItem(CHIAVE_AVVISO, 'sì')
    } catch {
      // Pazienza: si rivede la prossima volta.
    }
    setDaAvvisare(false)
    campo.current?.click()
  }

  function prendi(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvviso(null)
    setScelto(file)
  }

  async function carica({ titolo, soloPerMe }) {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await caricaDocumento(scelto, membro.id, {
        titolo,
        soloPerMe,
        onStato: setAvviso,
      })

      if (!esito.ok) {
        setAvviso(`Troppo pesante: ${peso(esito.byte)}. Il tetto è ${peso(MAX_BYTE)}.`)
        return
      }

      inserisci(esito.documento)
      setScelto(null)
      setAvviso(null)
    } catch (e) {
      setAvviso(`Non è partito. ${descriviErrore(e)}`)
    } finally {
      setInCorso(false)
    }
  }

  async function apri(d) {
    // I PDF li apre il browser, che ha già un lettore fatto bene. Le
    // immagini restano dentro l'app, dove si possono anche scaricare.
    if (!eUnPdf(d)) {
      setGrande(d)
      return
    }

    // Con la rete, la strada di sempre.
    if (navigator.onLine !== false) {
      window.open(d.url, '_blank', 'noopener')
      return
    }

    // Senza rete window.open è una navigazione verso il dominio dello
    // storage, e quella il service worker non la può intercettare: il
    // browser mostra la sua pagina d'errore proprio davanti a chi
    // controlla i biglietti. Il file però può essere già in cache, e
    // fetch ci passa: si tira fuori da lì e si apre come blob.
    try {
      const risposta = await fetch(d.url)
      if (!risposta.ok) throw new Error('non in cache')
      const indirizzo = URL.createObjectURL(await risposta.blob())
      const finestra = window.open(indirizzo, '_blank', 'noopener')
      if (!finestra) throw new Error('finestra bloccata')
      // Non subito: la finestra deve avere il tempo di leggerlo.
      setTimeout(() => URL.revokeObjectURL(indirizzo), 60000)
    } catch {
      setAvviso(
        'Senza rete questo PDF non si apre. Se ti serve all’imbarco, aprilo una volta adesso che hai campo: dopo resta sul telefono.'
      )
    }
  }

  // Si scaricano appena si guarda l'elenco, non quando si tocca il
  // biglietto: alle 7 in fila all'imbarco è troppo tardi per accorgersi
  // che non c'era. Uno alla volta e in silenzio — il service worker li
  // mette in cache passando, e se fallisce non è successo niente.
  useEffect(() => {
    if (documenti.length === 0 || navigator.onLine === false) return
    let vivo = true
    ;(async () => {
      for (const d of documenti.slice(0, 20)) {
        if (!vivo) return
        await fetch(d.url, { mode: 'cors' }).catch(() => {})
      }
    })()
    return () => {
      vivo = false
    }
  }, [documenti])

  return (
    <div className="documenti">
      <input
        ref={campo}
        type="file"
        accept={TIPI_ACCETTATI}
        onChange={prendi}
        hidden
      />

      {avviso && !scelto && <p className="doc-avviso">{avviso}</p>}

      {scelto && (
        <FoglioDocumento
          file={scelto}
          inCorso={inCorso}
          avviso={avviso}
          onCarica={carica}
          onAnnulla={() => {
            setScelto(null)
            setAvviso(null)
          }}
        />
      )}

      {stato === 'caricamento' && <Rotella />}
      {stato === 'guasto' && <p className="doc-guasto">{errore}</p>}

      {documenti.length > 0 && (
        <ul className="doc-elenco">
          {documenti.map((d) => (
            <li key={d.id} className={d.soloPerMe ? 'doc privato' : 'doc'}>
              <button
                type="button"
                className="doc-apri"
                onClick={() => apri(d)}
                aria-label={`Apri ${d.titolo}`}
              >
                <span className="doc-icona" aria-hidden="true">
                  {eUnPdf(d) ? '📄' : '🖼'}
                </span>
                <span className="doc-testo">
                  {d.titolo}
                  {/* Di chi è si vede prima di leggere: se il biglietto
                      della barca l'ha messo Turi, va saputo senza dover
                      chiedere in giro. */}
                  <span className="doc-sotto">
                    <img
                      className="doc-avatar"
                      src={urlAvatar(
                        membri[d.proprietarioId]?.avatarStyle,
                        membri[d.proprietarioId]?.avatarSeed || '?'
                      )}
                      alt=""
                      width="18"
                      height="18"
                    />
                    {membri[d.proprietarioId]?.nome ?? 'Qualcuno'}
                    {d.byte ? ` · ${peso(d.byte)}` : ''}

                    {/* Lo stato si dice solo sui propri documenti, ed è
                        l'unico posto dove può cambiare: quelli degli
                        altri che vedi sono condivisi per forza, e una
                        targhetta "nel viaggio" su ogni riga sarebbe
                        rumore che si smette di leggere. */}
                    {d.proprietarioId === membro.id && (
                      <span className={d.soloPerMe ? 'doc-stato privato' : 'doc-stato'}>
                        {d.soloPerMe ? '🔒 Solo per te' : '👥 Nel viaggio'}
                      </span>
                    )}
                  </span>
                </span>
              </button>

              {d.proprietarioId === membro.id && (
                <div className="doc-azioni">
                  {/* Il tasto dice cosa succede se lo premi, non com'è
                      adesso: "Condividi" / "Solo per me" lasciava a
                      chiedersi se fosse lo stato o l'azione. */}
                  <button
                    type="button"
                    className="doc-tasto"
                    onClick={() => commutaVisibilita(d).catch(() => {})}
                  >
                    {d.soloPerMe ? 'Mostra a tutti' : 'Nascondi agli altri'}
                  </button>
                  <BottoneElimina onElimina={() => togli(d.id).catch(() => {})} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Appiccicato in fondo: ti raggiunge dove sei mentre scorri, ma a
          sezione vuota resta attaccato al testo invece di piantarsi in
          fondo allo schermo. */}
      <button type="button" className="doc-aggiungi" onClick={scegliFile}>
        Aggiungi un documento
      </button>

      {/* ⚠️ Ferma il caricamento invece di affiancarlo, e non è
          pignoleria: il selettore di file del telefono si prende tutto lo
          schermo, quindi un avviso mostrato insieme a quello non lo legge
          nessuno. Prima si legge, poi si sceglie il file. */}
      {daAvvisare && (
        <Foglio etichetta="Prima di caricare" onChiudi={() => setDaAvvisare(false)}>
          <>
            <p className="doc-avviso-testo">
              Biglietti, QR e prenotazioni. Niente carte d&rsquo;identità o dati
              bancari.
            </p>
            <button type="button" className="primario-chiaro" onClick={hoCapito}>
              Ho capito, scelgo il file
            </button>
          </>
        </Foglio>
      )}

      {/* Il visore è lo stesso dell'album: cambia solo il nome del campo
          della data, che qui è al maschile. */}
      {grande && (
        <FotoGrande
          foto={{ ...grande, creataIl: grande.creatoIl }}
          autore={membri[grande.proprietarioId]}
          onChiudi={() => setGrande(null)}
        />
      )}
    </div>
  )
}

function peso(byte) {
  if (byte >= 1048576) return `${(byte / 1048576).toFixed(1)} MB`
  return `${Math.round(byte / 1024)} KB`
}
