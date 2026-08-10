import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './ChatRapida.css'
import Feed from './Feed.jsx'
import FoglioSOS from './FoglioSOS.jsx'
import Foglio from './Foglio.jsx'
import Posizioni from './Posizioni.jsx'
import FoglioFeedback from './FoglioFeedback.jsx'
import { useFeed } from '../hooks/useFeed.js'
import { useVoti } from '../hooks/useVoti.js'
import { eliminaAzione, inviaAzione } from '../lib/azioni.js'
import { descriviErrore } from '../lib/errori.js'
import { conScadenza, eScaduta } from '../lib/scadenza.js'
import {
  dopoInvioRiuscito,
  dopoRifiuto,
  dopoSuono,
  dopoSuonoPremuto,
  dopoTesto,
  soundboardSpenta,
} from '../lib/regole.js'
import { LUNGHEZZA_MAX_TESTO, MINUTI_RIPARTENZA, SECONDI_ATTESA } from '../config/azioni.js'
import { SONDAGGI } from '../config/sondaggi.js'
import { SUONI } from '../config/suoni.js'
import { suona } from '../lib/audio.js'
import { creaSondaggio } from '../lib/voti.js'
import Rotella from './Rotella.jsx'

export default function ChatRapida({ membro, suoniDisponibili = {}, senzaCornice = false }) {
  const { azioni, membri, stato, errore, inserisci, sostituisci } = useFeed()
  const { voti, vota, aggiorna: aggiornaVoto } = useVoti(azioni)
  const [foglio, setFoglio] = useState(null)
  const [testo, setTesto] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  // Scaduto è diverso da fallito, e all'SOS lo si dice: fallito vuol dire
  // "non è partita", scaduto vuol dire "non lo so". Prometterne una per
  // l'altra è il difetto che stiamo togliendo, non un dettaglio di stile.
  const [scaduto, setScaduto] = useState(false)
  // Non piu' un elenco di suoni spenti: o la soundboard e' spenta tutta,
  // o si suona. Qui dentro c'e' l'ora in cui riapre.
  const [spentaFino, setSpentaFino] = useState(null)
  // ⚠️ I suoni sono dentro il ＋, ed erano un tocco piu' vicini prima.
  // E' il prezzo dichiarato di aver separato «mando al gruppo» da «apro
  // una cosa per me»: se durante il viaggio da' fastidio, si tira fuori
  // il solo 🔊 e non cambia niente di quello che c'e' sotto.
  const [suoniAperti, setSuoniAperti] = useState(false)
  const [mappaAperta, setMappaAperta] = useState(false)
  const [feedbackAperto, setFeedbackAperto] = useState(false)
  const fondo = useRef(null)
  const barra = useRef(null)
  const schermo = useRef(null)

  // Gli avvisi se ne vanno da soli. Restavano appesi sopra la barra
  // finché non ne arrivava un altro, e dopo dieci secondi non dicono più
  // niente: dicono solo che qualcosa era andato storto, chissà quando.
  // Tranne quello dell'SOS: lì l'avviso è la prova che la richiesta non
  // è partita, e deve restare finché il foglio è aperto.
  useEffect(() => {
    if (!avviso || foglio === 'sos') return
    const via = setTimeout(() => setAvviso(null), 5000)
    return () => clearTimeout(via)
  }, [avviso, foglio])

  // Un suono spento resta spento anche ricaricando: si deduce dalle
  // penalità nel database, non da uno stato in memoria.
  useEffect(() => {
    soundboardSpenta(membro.id)
      .then(setSpentaFino)
      .catch(() => {})
  }, [membro.id])

  // La barra si misura, non si indovina: il CSS ne dichiarava 112px fissi
  // mentre ne è alta 103, e cambia ancora quando compare un avviso o si
  // apre un menu. Ogni volta che cresce, l'ultimo messaggio le finisce
  // sotto e non si capisce perché.
  //
  // Senza array di dipendenze, quindi a ogni disegno: è esattamente
  // quando l'altezza può essere cambiata, e costa una lettura. Prima
  // c'era un ResizeObserver, ma non serviva un osservatore per una cosa
  // che cambia solo quando questo componente si ridisegna.
  useLayoutEffect(() => {
    const b = barra.current
    const s = schermo.current
    if (b && s) s.style.setProperty('--altezza-scrittura', `${Math.ceil(b.offsetHeight)}px`)
  })

  // Si arriva in fondo sempre di colpo, mai con l'animazione. Lo
  // scorrimento morbido qui non arriva mai a destinazione: la pagina
  // cresce di una bolla mentre l'animazione e' in corso, e resta a meta'.
  // E' il difetto per cui "la chat non va giu'" quando mandi un
  // messaggio. Le chat vere fanno lo stesso: quando mandi tu, sbatte in
  // fondo e basta.
  //
  // In un layout effect e non dentro un requestAnimationFrame: il rAF non
  // gira quando la scheda non sta disegnando.
  useLayoutEffect(() => {
    if (stato !== 'pronto') return

    const scendi = () => fondo.current?.scrollIntoView({ block: 'end', behavior: 'auto' })
    scendi()

    // Un ripasso subito dopo: gli avatar arrivano dalla rete e le bolle
    // si alzano, quindi il fondo di un attimo fa non e' piu' il fondo.
    const ripasso = setTimeout(scendi, 250)
    return () => clearTimeout(ripasso)
    // Si guarda l'id dell'ultimo arrivato, non quanti sono. Il feed si
    // ferma a TETTO_FEED: a elenco pieno, un messaggio nuovo ne fa
    // cadere uno vecchio e il numero resta identico — quindi contarli
    // voleva dire non accorgersi mai di niente, esattamente dal
    // trentesimo messaggio in poi.
  }, [stato, azioni[0]?.id])

  async function manda(tipo, payload = {}, importante = false) {
    setInCorso(true)
    setAvviso(null)
    setScaduto(false)
    try {
      // Quasi tutti gli invii aspettano all'infinito: se tardano si vede
      // che non sono comparsi. L'SOS no — vedi SECONDI_ATTESA.
      const secondi = SECONDI_ATTESA[tipo]
      const esito = await conScadenza(
        inviaAzione({ tipo, payload, memberId: membro.id, importante }),
        secondi ? secondi * 1000 : 0
      )
      if (!esito.ok) {
        // Legge XIX: insistere su un bottone bloccato costa, con la scala
        // che perdona i primi due tentativi.
        const scala = await dopoRifiuto(membro.id, tipo).catch(() => null)
        setAvviso(
          (esito.attesa ? `Aspetta ${esito.attesa}s.` : 'Per oggi hai finito.') +
            (scala?.penalita ? ' E ti costa -1.' : '')
        )
        return false
      }
      dopoInvioRiuscito(membro.id, tipo)
      inserisci(esito.azione)
      setFoglio(null)
      return esito.azione
    } catch (e) {
      setScaduto(eScaduta(e))
      setAvviso(descriviErrore(e))
      return null
    } finally {
      setInCorso(false)
    }
  }

  async function mandaTesto(e) {
    e.preventDefault()
    const pulito = testo.trim()
    if (!pulito || inCorso) return
    const azione = await manda('free_text', { testo: pulito })
    if (!azione) return
    setTesto('')

    dopoTesto(membro.id, pulito, azione.id)
      .then((r) => r.scattata && setAvviso('Quella parola ti costa -2.'))
      .catch(() => {})
  }

  // Il suono parte subito e riparte da capo: il bottone non ha freni, e
  // il menu resta aperto per poterne premere un altro. A regolare gli
  // eccessi ci pensa la Legge XXVII, che spegne il bottone abusato.
  async function lanciaSuono(s) {
    if (spentaFino && spentaFino > new Date()) {
      setAvviso(`Soundboard spenta fino alle ${oraDi(spentaFino)}.`)
      return
    }

    suona(s.file)
    const azione = await manda('soundboard', { file: s.file, etichetta: s.etichetta })
    if (!azione) return

    dopoSuono(membro.id).catch(() => {})
    dopoSuonoPremuto(membro.id)
      .then((r) => {
        if (!r.abuso) return
        const fine = new Date(Date.now() + r.minuti * 60000)
        setSpentaFino(fine)
        setFoglio(null)
        setAvviso(
          r.recidiva
            ? `Di nuovo. Soundboard spenta per ${r.minuti / 60} ore.`
            : `Basta. Soundboard spenta per ${r.minuti} minuti.`
        )
      })
      .catch(() => {})
  }

  async function apriSondaggio(modello) {
    setInCorso(true)
    setAvviso(null)
    try {
      const nuovo = await creaSondaggio(modello)
      aggiornaVoto(nuovo)
      const esito = await inviaAzione({
        tipo: 'poll',
        payload: { voteId: nuovo.id },
        memberId: membro.id,
      })
      if (!esito.ok) {
        setAvviso(`Aspetta ${esito.attesa}s.`)
        return
      }
      inserisci(esito.azione)
      setFoglio(null)
    } catch (e) {
      setAvviso(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  async function elimina(id) {
    sostituisci({ id, eliminato: true })
    try {
      await eliminaAzione(id)
    } catch {
      sostituisci({ id, eliminato: false })
      setAvviso('Non è riuscito a togliersi. Riprova.')
    }
  }

  function alterna(quale) {
    setFoglio((f) => (f === quale ? null : quale))
  }

  return (
    // `senzaCornice` quando vive dentro il tab Gruppo, che la schermata
    // la mette già lui insieme alle due schede.
    <div className={senzaCornice ? 'chat-dentro' : 'gruppo-schermo'} ref={schermo}>
      {/* Fuori dalla conversazione e appiccicato in cima: un SOS non deve
          dipendere da quanti messaggi sono arrivati dopo. */}

      <div className="conversazione">
        {stato === 'caricamento' && <Rotella />}
        {stato === 'guasto' && <p className="feed-guasto">{errore}</p>}
        {stato === 'pronto' && (
          <Feed
            azioni={azioni}
            membri={membri}
            ioId={membro.id}
            onElimina={elimina}
            voti={voti}
            onVota={(votoId, opzione) => vota(votoId, membro.id, opzione)}
          />
        )}

        <div ref={fondo} className="fine-chat" />
      </div>

      {/* ------------------------------------------ barra di scrittura */}
      <div className="barra-scrittura" ref={barra}>
        {avviso && <p className="avviso">{avviso}</p>}

        {/* Attaccati alla barra e non in cima alla chat: è dov'è il
            pollice, e non fanno scorrere via la conversazione. Col menu
            dei suoni aperto spariscono: due file di pillole diverse una
            sopra l'altra si confondono. */}
        {foglio !== 'suoni' && (
        <div className="azioni-rapide">
          <button type="button" className="bottone-sos" onClick={() => setFoglio('sos')}>
            🆘 SOS
          </button>
          <button
            type="button"
            className="azione"
            onClick={() => manda('dove_siete', { posizione: null })}
            disabled={inCorso}
          >
            📍 Dove siete
          </button>
          <button
            type="button"
            className={foglio === 'riparte' ? 'azione aperta' : 'azione'}
            onClick={() => alterna('riparte')}
            disabled={inCorso}
          >
            🚗 Si riparte
          </button>
          <button
            type="button"
            className={foglio === 'sondaggio' ? 'azione aperta' : 'azione'}
            onClick={() => alterna('sondaggio')}
            disabled={inCorso}
          >
            📊 Sondaggio
          </button>
        </div>
        )}

        {foglio === 'riparte' && (
          <div className="menu-su">
            {MINUTI_RIPARTENZA.map((m) => (
              <button
                key={m}
                type="button"
                className="voce-menu"
                onClick={() => manda('si_riparte', { minuti: m })}
                disabled={inCorso}
              >
                {m} min
              </button>
            ))}
          </div>
        )}

        {foglio === 'sondaggio' && (
          <div className="menu-su colonna">
            {SONDAGGI.map((s) => (
              <button
                key={s.id}
                type="button"
                className="voce-menu larga"
                onClick={() => apriSondaggio(s)}
                disabled={inCorso}
              >
                {s.domanda}
              </button>
            ))}
          </div>
        )}

        {/* ⚠️ Le tre cose che aprono qualcosa **per te**, contro i quattro
            tasti rapidi qui sopra che **mandano qualcosa al gruppo**.
            Sono due famiglie diverse, e mescolarle farebbe sembrare il
            mondino della stessa specie dell'SOS — mentre quella fila
            esiste apposta per essere premuta di corsa senza leggere. */}
        {foglio === 'piu' && (
          <div className="menu-su">
            <button type="button" className="voce-menu" onClick={() => setSuoniAperti((s) => !s)}>
              🔊 Suoni
            </button>
            {suoniAperti &&
              SUONI.map((s) => (
                <button
                  key={s.file}
                  type="button"
                  className="voce-menu voce-suono"
                  onClick={() => lanciaSuono(s)}
                  disabled={suoniDisponibili[s.file] === false}
                >
                  {s.etichetta}
                </button>
              ))}
            <button
              type="button"
              className="voce-menu"
              onClick={() => {
                setFoglio(null)
                setMappaAperta(true)
              }}
            >
              🌍 Dove siamo
            </button>
            <button
              type="button"
              className="voce-menu"
              onClick={() => {
                setFoglio(null)
                setFeedbackAperto(true)
              }}
            >
              ✨ Dimmi com’è che va
            </button>
          </div>
        )}

        {/* Megafono e invio stanno DENTRO la casella, non ai suoi lati:
            fuori erano tre oggetti staccati che si contendevano la riga,
            dentro sono una cosa sola con due estremi. */}
        {mappaAperta && (
          <Foglio
            etichetta="Dove siamo"
            className="foglio-mappa"
            onChiudi={() => setMappaAperta(false)}
          >
            <>
              <Posizioni membro={membro} />
              <button
                type="button"
                className="secondario-foglio"
                onClick={() => setMappaAperta(false)}
              >
                Chiudi
              </button>
            </>
          </Foglio>
        )}

        {feedbackAperto && (
          <FoglioFeedback
            membroId={membro?.id}
            dove="chat"
            onChiudi={() => setFeedbackAperto(false)}
          />
        )}

        <form className="riga-scrittura" onSubmit={mandaTesto}>
          {/* Il megafono sparisce quando è aperto un altro menu: sopra hai
              già "Si riparte" o il sondaggio, e un terzo bottone che apre
              una terza cosa è solo un invito a sbagliare. */}
          {(!foglio || foglio === 'piu') && (
            <button
              type="button"
              className={foglio === 'piu' ? 'tasto-suoni aperto' : 'tasto-suoni'}
              onClick={() => alterna('piu')}
              aria-label={foglio === 'piu' ? 'Chiudi' : 'Altre cose'}
              aria-expanded={foglio === 'piu'}
            >
              {/* Aperto diventa la × che lo chiude: il suggerimento
                  scritto "tocca di nuovo per chiudere" era una didascalia
                  al posto di un bottone che si spiega da solo. */}
              {foglio === 'piu' ? '×' : '＋'}
            </button>
          )}

          {!foglio && (
            <>
              <input
                type="text"
                value={testo}
                onChange={(e) => setTesto(e.target.value)}
                maxLength={LUNGHEZZA_MAX_TESTO}
                placeholder="Scrivi qualcosa di breve"
                aria-label="Messaggio"
              />

              <button
                type="submit"
                className="tasto-invio"
                disabled={!testo.trim() || inCorso}
                aria-label="Manda"
              >
                ➤
              </button>
            </>
          )}
        </form>
      </div>

      {foglio === 'sos' && (
        <FoglioSOS
          onInvia={(motivo) => manda('sos', { motivo })}
          onAnnulla={() => {
            setFoglio(null)
            setAvviso(null)
            setScaduto(false)
          }}
          inCorso={inCorso}
          errore={avviso}
          scaduto={scaduto}
        />
      )}
    </div>
  )
}

function oraDi(data) {
  return data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
