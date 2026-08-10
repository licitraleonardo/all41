import { useEffect, useMemo, useRef, useState } from 'react'
import './Vocali.css'
import { useVocali } from '../hooks/useVocali.js'
import { mandaVocale } from '../lib/vocali.js'
import { avviaRegistrazione, spiegaErroreMicrofono } from '../lib/registratore.js'
import { registrazioneDisponibile } from '../lib/formatoAudio.js'
import { tieniOccupato } from '../lib/aggiornamento.js'
import BottoneElimina from './BottoneElimina.jsx'
import { LIMITI } from '../config/limiti.js'
import { coloreNome, urlAvatar } from '../config/avatar.js'
import { descriviErrore } from '../lib/errori.js'
import { dopoVocale } from '../lib/regole.js'
import Rotella from './Rotella.jsx'

// Per quanti secondi resta offerto «segnalo importante» dopo l'invio.
// Abbastanza da accorgersene e decidere, non tanto da restare li' a
// ingombrare la barra mentre uno ne registra un altro.
const SECONDI_PER_SEGNARE = 8

// Il sostituto del walkie-talkie. Un tocco parte, un tocco ferma.
//
// ⚠️ Prima si teneva premuto, e trascinando in su il vocale partiva
// segnato come importante. Due cose sbagliate in un gesto solo: tenere
// premuto un minuto col telefono all'orecchio non si puo' fare, e il
// trascinamento chiedeva di decidere «e' importante?» **mentre stavi
// ancora parlando**, con un movimento che non era scritto da nessuna
// parte tranne che in un suggerimento sotto il tasto.
//
// Adesso: un tocco parte, un tocco ferma, e la domanda arriva quando ha
// senso — dopo. Il vocale pero' parte SUBITO: la domanda non tiene in
// ostaggio l'audio, e' una correzione che si puo' fare nei secondi
// successivi. Vedi il commento su `segnaImportante` in lib/vocali.js.
//
// Impaginato come una chat, perché è una chat: i tuoi a destra, quelli
// degli altri a sinistra con avatar e nome, l'ultimo in fondo e si
// scorre da sola quando arriva roba nuova.
//
// Il formato non è scritto nel codice: lo sceglie il browser e si salva
// quello vero insieme al file. È la verifica bloccante n.3 dello spec.
export default function Vocali({ membro }) {
  const { vocali, membri, stato, errore, inserisci, togli, segna } = useVocali()

  const sessione = useRef(null)
  const fondo = useRef(null)
  const [registrando, setRegistrando] = useState(false)
  const [secondi, setSecondi] = useState(0)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [suona, setSuona] = useState(null)
  // L'ultimo mandato, finche' si puo' ancora segnare importante.
  const [daSegnare, setDaSegnare] = useState(null)

  const puoRegistrare = registrazioneDisponibile()

  // Dal database arrivano dal più recente: qui si legge dall'alto in
  // basso come una conversazione.
  const inOrdine = useMemo(() => [...vocali].reverse(), [vocali])

  // Stesso difetto della chat, qui ancora addormentato: l'elenco si
  // ferma a TETTO_VOCALI, quindi da li' in poi un vocale nuovo ne fa
  // cadere uno vecchio e il numero non cambia. Si guarda l'id
  // dell'ultimo. E senza animazione, che non arriva mai in fondo se
  // intanto la pagina cresce.
  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [vocali[0]?.id])

  // Se si cambia scheda mentre si tiene premuto, il microfono resta
  // acceso: su iPhone l'indicatore arancione non si spegne piu' e sembra
  // che l'app stia ascoltando di nascosto. `annulla` esisteva apposta e
  // non la chiamava nessuno.
  useEffect(() => {
    return () => {
      sessione.current?.annulla()
      sessione.current = null
    }
  }, [])

  // L'offerta di segnarlo si ritira da sola. Non è un pentimento
  // permanente: è il secondo subito dopo, quando uno si accorge di aver
  // detto una cosa che gli altri devono sentire prima delle altre.
  useEffect(() => {
    if (!daSegnare) return undefined
    const t = setTimeout(() => setDaSegnare(null), SECONDI_PER_SEGNARE * 1000)
    return () => clearTimeout(t)
  }, [daSegnare])

  // Mentre si registra o si manda, l'app non si ricarica da sola: quella
  // ricarica si porterebbe via l'audio, che è l'unica copia che esiste.
  useEffect(() => {
    if (!registrando && !inCorso) return undefined
    return tieniOccupato('vocale')
  }, [registrando, inCorso])

  // ⚠️ Restava anche col tocco singolo, e serve ancora.
  //
  // Fra il tocco e `setRegistrando(true)` c'e' un await — il permesso del
  // microfono — e in quel buco `registrando` e' ancora falso. Due tocchi
  // ravvicinati passavano tutti e due il controllo e partivano due
  // registrazioni: la seconda sovrascriveva `sessione`, e la prima
  // restava aperta e orfana **col microfono acceso**. Su iPhone e' il
  // pallino arancione, e si spegneva da solo solo allo scadere del
  // minuto.
  //
  // Col tocco singolo il rischio e' persino piu' alto di prima: adesso
  // «tocca» e «tocca di nuovo» sono lo stesso gesto, e due tocchi
  // nervosi sul tasto sono la cosa piu' naturale del mondo.
  const staPartendo = useRef(false)

  async function avvia() {
    // ⚠️ `staPartendo` è un ref e non uno stato, e serve proprio per
    // quello: fra il tocco e `setRegistrando(true)` c'è un await — il
    // permesso del microfono — e in quel buco `registrando` è ancora
    // falso. Due tocchi ravvicinati passavano tutti e due il controllo, e
    // partivano due registrazioni: la seconda sovrascriveva `sessione`, e
    // la prima restava aperta e orfana **col microfono acceso**. Su iPhone
    // è il pallino arancione che il commento qui sopra dice esplicitamente
    // di voler evitare, e si spegneva da solo solo allo scadere del minuto.
    if (registrando || inCorso || staPartendo.current) return
    staPartendo.current = true
    setAvviso(null)
    setSecondi(0)
    // Si registra qualcosa di nuovo: l'offerta sul vocale di prima
    // sparisce, o si finirebbe per segnare quello sbagliato.
    setDaSegnare(null)

    try {
      const avviata = await avviaRegistrazione({
        onSecondi: setSecondi,
        onFermato: () => setRegistrando(false),
      })

      sessione.current = avviata
      setRegistrando(true)
    } catch (e) {
      setAvviso(spiegaErroreMicrofono(e))
    } finally {
      // Solo l'avvio è finito, non la registrazione: da qui in poi a
      // fermare un secondo tocco basta `registrando`.
      staPartendo.current = false
    }
  }

  async function ferma() {
    const corrente = sessione.current
    if (!corrente) return
    sessione.current = null

    corrente.ferma()
    setRegistrando(false)

    const registrato = await corrente.chiusura

    // Sotto il secondo è un tocco per sbaglio, non un messaggio.
    if (registrato.durata < 1 || registrato.blob.size < 500) {
      setAvviso(null)
      return
    }

    setInCorso(true)
    try {
      // Parte sempre normale. Se era importante lo si dice fra un attimo,
      // e il vocale intanto è già al sicuro sul server.
      const esito = await mandaVocale(registrato, membro.id)
      if (!esito.ok) {
        setAvviso(`Aspetta ${esito.attesa}s.`)
        return
      }
      inserisci(esito.vocale)
      setDaSegnare(esito.vocale.id)
      setAvviso(null)
      // Le due Leggi della durata: il vocale da due secondi e quello da
      // un minuto. In silenzio — si scoprono nel Testamento, non qui.
      dopoVocale(membro.id, registrato.durata).catch(() => {})
    } catch (e) {
      setAvviso(`Non è partito. ${descriviErrore(e)}`)
    } finally {
      setInCorso(false)
      setSecondi(0)
    }
  }

  return (
    <div className="vocali">
      {stato === 'caricamento' && <Rotella />}
      {stato === 'guasto' && <p className="voc-guasto">{errore}</p>}

      {stato === 'pronto' && vocali.length === 0 && (
        <p className="voc-vuoto">
          Nessuno ha ancora detto niente. Tieni premuto qui sotto e parla.
        </p>
      )}

      <ul className="voc-elenco">
        {inOrdine.map((v) => (
          <Vocale
            key={v.id}
            vocale={v}
            autore={membri[v.autoreId]}
            mio={v.autoreId === membro.id}
            inAscolto={suona === v.id}
            onAscolta={setSuona}
            onElimina={() => togli(v.id)}
          />
        ))}
        <li ref={fondo} className="voc-fine" />
      </ul>

      {avviso && <p className="voc-avviso">{avviso}</p>}

      {!puoRegistrare ? (
        <p className="voc-guasto">
          Questo browser non sa registrare. Serve una connessione sicura (https).
        </p>
      ) : (
        <div className="voc-barra">
          {/* ⚠️ La domanda sta SOPRA il tasto e non dentro un foglio.
              Un foglio in sovrimpressione fermerebbe tutto per una cosa
              che si può benissimo ignorare — e il vocale è già partito,
              quindi ignorarla è una risposta legittima: vuol dire «no».
              Sparisce da sola dopo qualche secondo. */}
          {daSegnare && !registrando && (
            <div className="voc-segna" role="status">
              {/* Un tasto solo, e dice cosa fa. Prima erano una domanda
                  («Era importante?») e una risposta («❗ Segnalo»): due
                  righe, due letture e un punto esclamativo, per un
                  bottone che si preme o si ignora. Ignorarlo resta una
                  risposta legittima — sparisce da solo. */}
              <button
                type="button"
                className="voc-segna-si"
                onClick={() => {
                  segna(daSegnare)
                  setDaSegnare(null)
                }}
              >
                Segna come importante
              </button>
            </div>
          )}

          <div className="voc-tasti">
            <button
              type="button"
              className={registrando ? 'voc-premi attivo' : 'voc-premi'}
              // Un tocco parte, un tocco ferma. Niente `onPointerLeave`:
              // col gesto vecchio serviva a non lasciare il microfono
              // acceso se il dito scivolava via, adesso allontanare il
              // dito non vuol dire più niente — e se lo fermasse, non si
              // potrebbe posare il telefono mentre si parla.
              onClick={registrando ? ferma : avvia}
              disabled={inCorso}
              aria-label={registrando ? 'Tocca per fermare e mandare' : 'Tocca per parlare'}
            >
              <Microfono grande={!registrando && !inCorso} />
              {/* Da fermo: solo il microfono. «Parla» sotto un disegno di
                  microfono e' la didascalia di un'icona che si capisce da
                  sola. Mentre registra invece resta il conto alla
                  rovescia, che e' l'unica cosa che vale la pena leggere
                  li': dice quanto tempo ti rimane. */}
              {inCorso ? 'Mando…' : registrando ? `${LIMITI.voice.durataMax - secondi}s` : null}
            </button>
          </div>

          {registrando && (
            <p className="voc-gesto">Tocca di nuovo per mandarlo</p>
          )}

          {registrando && (
            <div className="voc-avanzamento" role="presentation">
              <span style={{ width: `${(secondi / LIMITI.voice.durataMax) * 100}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Vocale({ vocale, autore, mio, inAscolto, onAscolta, onElimina }) {
  const suono = useRef(null)

  useEffect(() => {
    return () => suono.current?.pause()
  }, [])

  // Quando parte un altro vocale questo deve tacere. Senza, il secondo
  // tocco ne fa suonare due insieme: il primo non lo ferma nessuno,
  // perche' il suo bottone non viene piu' toccato.
  useEffect(() => {
    if (inAscolto || !suono.current) return
    suono.current.pause()
    suono.current = null
  }, [inAscolto])

  function ascolta() {
    if (inAscolto) {
      suono.current?.pause()
      onAscolta(null)
      return
    }

    // Si crea al tocco, quindi dentro un gesto dell'utente: è l'unico
    // modo perché iOS lo lasci partire.
    const audio = new Audio(vocale.url)
    suono.current = audio
    audio.onended = () => onAscolta(null)
    audio.onerror = () => onAscolta(null)
    audio.play().catch(() => onAscolta(null))
    onAscolta(vocale.id)
  }

  const classi = ['voc-riga']
  if (mio) classi.push('mio')
  if (vocale.importante) classi.push('importante')

  return (
    <li className={classi.join(' ')}>
      {!mio && (
        <img
          className="voc-avatar"
          src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
          alt=""
          width="30"
          height="30"
        />
      )}

      <div className="voc-bolla">
        {!mio && (
          <span className="voc-autore" style={{ color: coloreNome(vocale.autoreId) }}>
            {autore?.nome ?? 'Qualcuno'}
          </span>
        )}

        <div className="voc-dentro">
          <button
            type="button"
            className="voc-play"
            onClick={ascolta}
            aria-label={inAscolto ? 'Ferma' : 'Ascolta'}
          >
            {inAscolto ? '⏸' : '▶'}
          </button>

          <span className="voc-onda" aria-hidden="true">
            {ONDA.map((h, i) => (
              <span key={i} style={{ height: `${h}px` }} />
            ))}
          </span>

          <span className="voc-durata">{vocale.durata}s</span>
        </div>

        <span className="voc-piede">
          {vocale.importante && <span className="voc-bollino">❗ importante</span>}
          {quando(vocale.creatoIl)}
          {/* ⚠️ Due tocchi, come per le foto e per la coda. Era l'unico
              contenuto dell'app che si distruggeva con un gesto solo: uno
              sfioramento mentre si scorre la conversazione cancellava un
              vocale per tutto il gruppo, senza chiedere niente e senza
              modo di tornare indietro. */}
          {mio && (
            <BottoneElimina
              classe="voc-elimina"
              etichetta="Elimina questo vocale"
              onElimina={onElimina}
            />
          )}
        </span>
      </div>
    </li>
  )
}

// Un microfono disegnato invece dell'emoji: sul tasto grande l'emoji
// resta multicolore anche quando il tasto diventa corallo, e stona.
// Così prende il colore del testo che ha accanto.
function Microfono({ grande = false }) {
  const lato = grande ? 26 : 20
  return (
    <svg
      className="voc-mic"
      viewBox="0 0 24 24"
      width={lato}
      height={lato}
      aria-hidden="true"
    >
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" fill="currentColor" />
      <path
        d="M5 11a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 0 1 2 0 7 7 0 0 1-6 6.93V20h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.07A7 7 0 0 1 5 11Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Un'onda finta: disegnare quella vera vorrebbe dire decodificare
// l'audio di ogni messaggio all'apertura della scheda, per un dettaglio
// che nessuno guarda davvero. Serve solo a dire "questo è un audio".
const ONDA = [6, 11, 17, 9, 20, 14, 8, 16, 11, 19, 7, 13, 10, 15, 6]

function quando(iso) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
