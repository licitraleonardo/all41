import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Impostore.css'
import { useImpostore } from '../hooks/useImpostore.js'
import {
  bastaPerCominciare,
  bastaPerRivelare,
  eFuori,
  impostoriVivi,
  vivi,
  chiPuoTentare,
  diTurno,
  puoAvanzare,
  secondiDelTestimone,
  raccontaFinale,
  esito,
  quantiMancano,
  quantiPerRivelare,
  ALTRO_GIRO,
  maggioranza,
  sceltaVincente,
  conteggioAffidabile,
  schedePerId,
  tuttiHannoVotato,
} from '../lib/impostore.js'
import { giriTuttiNoti } from '../lib/giriImpostore.js'
import { IMPOSTORE, NESSUNA_PAROLA, VARIANTI } from '../config/impostore.js'
import { PER_ID } from '../config/leggi.js'
import { urlAvatar } from '../config/avatar.js'
import FacciaAllan from './FacciaAllan.jsx'
import { votaImpostore } from '../lib/voti.js'
import { descriviErrore } from '../lib/errori.js'
import Rotella from './Rotella.jsx'

// Quale finale e' gia' stato letto su questo telefono.
const VISTA_FINALE = 'impostore-finale-visto'

// Quanto resta in piedi il finale prima di togliersi da solo.
const DURATA_FINALE = 7000

// L'app fa il mazziere e basta. Il gioco vero — dire la propria parola,
// accusarsi, difendersi — succede a voce nella stanza, quindi ogni
// schermata qui dentro deve poter essere guardata di sfuggita e poi
// lasciata stare. Niente timer: un countdown trasforma una cosa
// rilassata in ansia da prestazione.
export default function Impostore({ membro, membri }) {
  const {
    partita,
    voto,
    schedeDeiGiri,
    storico,
    stato,
    errore,
    arrivatoSecondo,
    nuova,
    avanti,
    avviaVoto,
    avvia,
    abbandona,
    chiedi,
    rivela,
    tenta,
    chiudi,
    setVoto,
  } = useImpostore(membro.id)
  const nome = (id) => membri[id]?.nome ?? 'Qualcuno'

  // Quale finale hai già letto: sta su questo telefono, perché è una
  // cosa tua — un altro che apre l'app dopo deve poterlo vedere lui.
  const [letteVia, setLetteVia] = useState(() => localStorage.getItem(VISTA_FINALE) ?? '')
  const [daStorico, setDaStorico] = useState(null)
  const chiusa = partita?.id && letteVia === partita.id

  const chiudiRivelazione = useCallback((id) => {
    localStorage.setItem(VISTA_FINALE, id)
    setLetteVia(id)
  }, [])

  // Sette secondi e si toglie da sola: il tempo di leggere chi era e con
  // che parola, non abbastanza da restare li' a occupare la schermata.
  // La × serve a chi ha gia' letto e non vuole aspettare.
  useEffect(() => {
    if (partita?.stato !== 'finita' || chiusa) return
    const via = setTimeout(() => chiudiRivelazione(partita.id), DURATA_FINALE)
    return () => clearTimeout(via)
  }, [partita?.stato, partita?.id, chiusa, chiudiRivelazione])

  if (stato === 'caricamento') return <Rotella />
  if (stato === 'guasto') return <p className="imp-guasto">{errore}</p>

  const finita = !partita || partita.stato === 'finita' || partita.stato === 'annullata'
  const inCorsoOra = Boolean(partita) && !finita
  const inGioco = inCorsoOra && partita.giocatori.includes(membro.id)

  return (
    <div className="impostore">
      {errore && <p className="imp-guasto">{errore}</p>}

      {/* Non se ne va da sola: è l'unica spiegazione del perché il finale
          parla di una parola che non hai scritto tu. Resta finché non
          comincia la partita dopo. */}
      {arrivatoSecondo && (
        <p className="imp-avviso" role="status">
          Ha risposto prima {nome(arrivatoSecondo.chi)}, con «{arrivatoSecondo.parola}»:
          vale la sua. La tua non è partita.
        </p>
      )}

      {inCorsoOra && <Abbandona onAbbandona={abbandona} />}

      {(!partita || partita.stato === 'finita' || partita.stato === 'annullata') && (
        <>
          {/* La rivelazione si vede una volta e si chiude. Restava
              appesa in cima per sempre, davanti al tasto per giocare
              ancora: chi arriva un'ora dopo trovava il finale di una
              partita che non ha giocato. Da lì in poi sta nello storico,
              che è il posto dei finali vecchi. */}
          {partita?.stato === 'finita' && !chiusa && (
            <FinestraFinale
              partita={partita}
              voto={voto}
              schedeDeiGiri={schedeDeiGiri}
              // Lo stesso conto dello storico: le schede in mano contro i
              // giri che ci sono stati. Finche' la lettura non e' tornata
              // sono zero, e il finale non dice "nessuno".
              giriNoti={giriTuttiNoti(partita, schedeDeiGiri)}
              nome={nome}
              membri={membri}
              onChiudi={() => chiudiRivelazione(partita.id)}
            />
          )}
          <Apparecchia membro={membro} membri={membri} onCrea={nuova} />
          <Storico partite={storico} ioId={membro.id} onApri={setDaStorico} />
        </>
      )}

      {/* Non nello stato 'colpo': lì l'impostore beccato deve indovinare
          la parola del gruppo, e dopoAccusa l'ha appena messo fra i
          fuori. La schermata "Sei fuori — vedi le parole di tutti"
          gliela serviva scritta due centimetri sopra il campo dove
          doveva scriverla. */}
      {inCorsoOra && inGioco && partita.stato !== 'colpo' && eFuori(partita, membro.id) && (
        <Fuori partita={partita} membri={membri} nome={nome} />
      )}

      {partita?.stato === 'in-corso' && inGioco && !eFuori(partita, membro.id) && (
        // La chiave sull'id: "ho gia' letto la mia parola" e' uno stato
        // interno, e senza rimontare resterebbe acceso anche sulla
        // partita dopo — saltando la schermata della parola nuova. Capita
        // se in due premono "Comincia" nello stesso momento.
        <Giro
          key={partita.id}
          partita={partita}
          membro={membro}
          membri={membri}
          nome={nome}
          onAvanti={avanti}
        />
      )}

      {inCorsoOra && !inGioco && (
        <p className="imp-fuori">
          C’è una partita in corso e tu non ci sei dentro. Goditela da fuori.
        </p>
      )}

      {/* Una partita vecchia riaperta dallo storico: stessa finestra del
          finale, perché è la stessa cosa — un resoconto che si legge e si
          chiude. */}
      {daStorico && (
        // ⚠️ `opzioni` e non solo `schede`. Senza, la finestra ricadeva
        // sull'elenco intero dei giocatori mentre la riga dello storico
        // usava quelle vere: la stessa partita raccontata in due modi, e
        // dal secondo giro d'accusa in poi con ogni numero spostato di un
        // posto. Quarta volta che questo progetto inciampa sulle
        // posizioni.
        <FinestraFinale
          partita={daStorico}
          voto={{ schede: daStorico.schede, opzioni: daStorico.opzioniVoto }}
          schedeDeiGiri={daStorico.schedeDeiGiri ?? []}
          // Non piu' un'ipotesi ma un conto: `giro` dice quanti giri
          // d'accusa ci sono stati, e le schede in mano si contano. Se sono
          // almeno tante, non ne manca nessuna e il finale puo' parlare.
          giriNoti={giriTuttiNoti(daStorico, daStorico.schedeDeiGiri)}
          nome={nome}
          membri={membri}
          onChiudi={() => setDaStorico(null)}
        />
      )}

      {/* inGioco su tutte e tre: chi guarda dal bancone si ritrovava la
          schermata "Quanti impostori?" o "Vota l'impostore", e i suoi
          tocchi contavano davvero — il database non controlla che chi
          vota sia in partita. Un voto di troppo poteva decidere chi
          veniva eliminato. */}
      {partita?.stato === 'preparazione' && inGioco && (
        <Preparazione
          partita={partita}
          voto={voto}
          membro={membro}
          onVotato={setVoto}
          onAvvia={avvia}
        />
      )}

      {partita?.stato === 'colpo' && inGioco && (
        <Colpo
          partita={partita}
          voto={voto}
          membro={membro}
          nome={nome}
          onTenta={tenta}
          onChiedi={chiedi}
          onChiudi={chiudi}
        />
      )}

      {partita?.stato === 'voto' && inGioco && !eFuori(partita, membro.id) && (
        <Accusa
          partita={partita}
          voto={voto}
          membro={membro}
          membri={membri}
          nome={nome}
          onApri={avviaVoto}
          onChiedi={chiedi}
          onRivela={rivela}
          onVotato={setVoto}
        />
      )}
    </div>
  )
}

// Il voto d'apertura: quanti impostori. Prima lo decideva una regola
// fissa sul numero di giocatori, e il gruppo se lo trovava deciso. Adesso
// e' una scelta, ed e' anche il primo momento in cui ci si guarda in
// faccia — quindi vale la pena farlo.
function Preparazione({ partita, voto, membro, onVotato, onAvvia }) {
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const partito = useRef(false)

  const scelte = IMPOSTORE.sceltePerImpostori
  const consigliata = IMPOSTORE.quantiImpostori(partita.giocatori.length)
  const hoVotato = voto?.hannoVotato?.includes(membro.id)
  const quanti = voto?.hannoVotato?.length ?? 0
  const tutti = partita.giocatori.length
  const conteggi = voto?.conteggi ?? scelte.map(() => 0)
  const serve = maggioranza(tutti)

  // Si parte quando ha votato piu' della meta', non quando hanno votato
  // tutti: aspettare l'ultimo vuol dire restare fermi per chi e' in
  // bagno, e l'ultimo non arriva mai. Lo fa il primo telefono che se ne
  // accorge, e il freno serve perche' l'effetto rigira a ogni voto che
  // arriva — partire due volte non si puo'.
  useEffect(() => {
    if (!voto || partito.current) return
    if (!bastaPerCominciare(quanti, tutti)) return
    // ⚠️ E aspetta che i numeri abbiano raggiunto i votanti. Questo
    // telefono puo' sapere che hanno votato in quattro e avere ancora i
    // conteggi a zero: partendo li', sceltaVincente non trova nessun
    // massimo e ripiega sul consigliato, buttando via la scelta del
    // gruppo. E' successo davvero — sei voti per "due impostori" e una
    // partita partita con uno solo.
    if (!conteggioAffidabile(conteggi, quanti)) return
    partito.current = true
    onAvvia(sceltaVincente(conteggi, scelte, consigliata))
  }, [voto, quanti, tutti, conteggi, scelte, consigliata, onAvvia])

  const proposta = IMPOSTORE.quantiImpostori(partita.giocatori.length)
  const [quantiImp, setQuantiImp] = useState(proposta)

  async function vota() {
    const i = IMPOSTORE.sceltePerImpostori.indexOf(quantiImp)
    if (i < 0) return
    setInCorso(true)
    setAvviso(null)
    try {
      onVotato(await votaImpostore(voto.id, membro.id, [i]))
    } catch (e) {
      setAvviso(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  if (!voto) return <Rotella testo="Preparo il voto" />

  return (
    <section className="imp-preparazione">
      <h2 className="imp-titolo">Quanti impostori?</h2>
      <p className="imp-spiega">
        Hanno votato {quanti} su {tutti} — si parte a {serve}.
      </p>

      {avviso && <p className="imp-guasto">{avviso}</p>}

      {/* I giri non si votano piu' qui: dopo ogni giro il gruppo decide
          se ne serve un altro, insieme all'accusa. "Ne sappiamo
          abbastanza?" e' una domanda che ha senso dopo aver sentito. */}
      <div className="imp-risposte">
        {IMPOSTORE.sceltePerImpostori.map((n, i) => (
          <button
            key={n}
            type="button"
            className={n === quantiImp ? 'imp-risposta scelta' : 'imp-risposta'}
            onClick={() => setQuantiImp(n)}
            disabled={hoVotato || inCorso}
            aria-pressed={n === quantiImp}
          >
            <span className="imp-risposta-numero">{n}</span>
            <span className="imp-risposta-nome">{n === 1 ? 'impostore' : 'impostori'}</span>
            {quanti > 0 && <span className="imp-risposta-voti">{conteggi[i] ?? 0}</span>}
          </button>
        ))}
      </div>

      {hoVotato ? (
        <p className="imp-nota">Si parte al {serve}º voto: non si aspetta chi manca.</p>
      ) : (
        <button type="button" className="imp-comincia" onClick={vota} disabled={inCorso}>
          {inCorso ? '…' : 'Vota'}
        </button>
      )}
    </section>
  )
}

// L'uscita di sicurezza. Una partita che si pianta — uno se n'e' andato,
// un telefono e' morto — blocca tutti, perche' finche' ce n'e' una aperta
// non se ne puo' cominciare un'altra.
//
// Chiede due volte e dice chiaramente che vale per tutti: non serve il
// consenso del gruppo, perche' chiedere una maggioranza ricrerebbe
// esattamente il blocco che si sta cercando di togliere.
function Abbandona({ onAbbandona }) {
  const [sicuro, setSicuro] = useState(false)
  const [inCorso, setInCorso] = useState(false)

  useEffect(() => {
    if (!sicuro) return
    // Se ci ripensa e non tocca niente, la domanda si richiude da sola.
    const via = setTimeout(() => setSicuro(false), 6000)
    return () => clearTimeout(via)
  }, [sicuro])

  async function davvero() {
    setInCorso(true)
    await onAbbandona()
    setInCorso(false)
  }

  return (
    <div className="imp-abbandona">
      {sicuro ? (
        <>
          <span className="imp-abbandona-domanda">Annulli la partita per tutti?</span>
          <button
            type="button"
            className="imp-abbandona-si"
            onClick={davvero}
            disabled={inCorso}
          >
            {inCorso ? '…' : 'Sì, annulla'}
          </button>
          <button type="button" className="imp-abbandona-no" onClick={() => setSicuro(false)}>
            No
          </button>
        </>
      ) : (
        <button type="button" className="imp-abbandona-tasto" onClick={() => setSicuro(true)}>
          Annulla la partita
        </button>
      )}
    </div>
  )
}

// ------------------------------------------------------- si apparecchia

function Apparecchia({ membro, membri, onCrea }) {
  const tutti = Object.values(membri)
  const [dentro, setDentro] = useState(() => new Set(tutti.map((m) => m.id)))
  const [variante, setVariante] = useState(VARIANTI[0].id)
  const [inCorso, setInCorso] = useState(false)

  const giocatori = tutti.filter((m) => dentro.has(m.id)).map((m) => m.id)
  const abbastanza = giocatori.length >= IMPOSTORE.minimoGiocatori

  function alterna(id) {
    setDentro((precedenti) => {
      const nuovi = new Set(precedenti)
      if (nuovi.has(id)) nuovi.delete(id)
      else nuovi.add(id)
      return nuovi
    })
  }

  async function comincia() {
    setInCorso(true)
    await onCrea(giocatori, variante)
    setInCorso(false)
  }

  return (
    <section className="imp-apparecchia">
      <h2 className="imp-titolo">L’Impostore</h2>
      <p className="imp-spiega">
        Ognuno riceve una parola in privato. A turno se ne dice una collegata, ad alta voce.
        Alla fine di ogni giro si vota: si accusa qualcuno, oppure si chiede un altro
        giro.
      </p>

      <p className="imp-etichetta">Chi gioca</p>
      <div className="imp-gente">
        {tutti.map((m) => (
          <button
            key={m.id}
            type="button"
            className={dentro.has(m.id) ? 'imp-tessera dentro' : 'imp-tessera'}
            onClick={() => alterna(m.id)}
            aria-pressed={dentro.has(m.id)}
          >
            <img
              src={urlAvatar(m.avatarStyle, m.avatarSeed || m.nome)}
              alt=""
              width="34"
              height="34"
            />
            <span>{m.id === membro.id ? 'Tu' : m.nome}</span>
          </button>
        ))}
      </div>

      <p className="imp-etichetta">Come gioca l’impostore</p>
      <div className="imp-varianti">
        {VARIANTI.map((v) => (
          <button
            key={v.id}
            type="button"
            className={variante === v.id ? 'imp-variante scelta' : 'imp-variante'}
            onClick={() => setVariante(v.id)}
            aria-pressed={variante === v.id}
          >
            <strong>{v.nome}</strong>
            <span>{v.spiega}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="imp-comincia"
        onClick={comincia}
        disabled={!abbastanza || inCorso}
      >
        {inCorso
          ? 'Distribuisco…'
          : abbastanza
            ? `Comincia in ${giocatori.length}`
            : `Servono almeno ${IMPOSTORE.minimoGiocatori} giocatori`}
      </button>

      {abbastanza && (
        <p className="imp-nota">
          {IMPOSTORE.quantiImpostori(giocatori.length) === 1
            ? 'Ci sarà un impostore.'
            : 'Ci saranno due impostori.'}{' '}
          Nessuno saprà chi.
        </p>
      )}
    </section>
  )
}

// La finestra del resoconto. La stessa a fine partita e riaprendo una
// partita vecchia: e' la stessa cosa, e due finestre diverse per dire lo
// stesso finale sarebbero due posti dove sbagliare.
// `schedeDeiGiri` arriva solo dalla partita appena finita: lo storico non
// li ha, e non e' una svista. Chi non li ha racconta l'ultimo giro, cioe'
// meno della verita' — mai il contrario, che sarebbe promettere punti a
// chi non li ha presi.
function FinestraFinale({
  partita,
  voto,
  schedeDeiGiri = [],
  giriNoti = true,
  nome,
  membri,
  onChiudi,
}) {
  return (
    <div
      className="imp-sfondo"
      role="dialog"
      aria-modal="true"
      aria-label="Com’è andata"
      onClick={onChiudi}
    >
      <div className="imp-finestra" onClick={(e) => e.stopPropagation()}>
        <Rivelazione
          partita={partita}
          voto={voto}
          schedeDeiGiri={schedeDeiGiri}
          giriNoti={giriNoti}
          nome={nome}
          membri={membri}
        />
        <button type="button" className="imp-chiudi-finestra" onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------- lo storico

// Le partite finite, sotto il tasto per cominciarne una nuova. Chiuse:
// aperte sarebbero un muro di roba vecchia davanti alla cosa che uno e'
// venuto a fare, che e' giocare adesso.
function Storico({ partite, ioId, onApri }) {
  const [tutte, setTutte] = useState(false)

  if (!partite || partite.length === 0) return null
  const mostrate = tutte ? partite : partite.slice(0, 5)

  return (
    <section className="imp-storico">
      <p className="imp-etichetta">Le partite di prima</p>

      <ul className="imp-storico-elenco">
        {mostrate.map((p) => {
          // ⚠️ Passa dalla stessa funzione della rivelazione: prima si
          // calcolava il finale qui dentro ignorando il colpo di coda, e
          // una partita ribaltata all'ultimo compariva come "Beccato".
          const f = raccontaFinale({
            impostori: p.impostori,
            giocatori: p.giocatori,
            // Le opzioni di QUEL voto, non l'elenco dei giocatori: dal
            // secondo giro d'accusa in poi sono solo i superstiti piu'
            // "un altro giro", e tradurre con l'elenco intero sposta
            // ogni numero di un posto.
            schede: schedePerId(p.schede, p.opzioniVoto?.length ? p.opzioniVoto : p.giocatori),
            schedeDeiGiri: p.schedeDeiGiri ?? [],
            tentativo: p.tentativo,
            parolaGruppo: p.parolaGruppo,
            fuori: p.fuori,
          })
          const mie = p.impostori.includes(ioId)

          return (
            <li key={p.id}>
              <button
                type="button"
                className="imp-storico-riga"
                onClick={() => onApri(p)}
              >
                <span className="imp-storico-quando">{quando(p.creataIl)}</span>
                <span
                  className={
                    f.vincitore === 'impostori'
                      ? 'imp-storico-esito franca'
                      : 'imp-storico-esito preso'
                  }
                >
                  {f.titolo}
                </span>
                <span className="imp-storico-parola">
                  {mie ? 'eri tu' : p.parolaGruppo}
                </span>
                <span className="imp-storico-freccia" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {partite.length > 5 && !tutte && (
        <button type="button" className="imp-storico-tutte" onClick={() => setTutte(true)}>
          Vedi tutte ({partite.length})
        </button>
      )}
    </section>
  )
}

function quando(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
    ' · ' +
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// ------------------------------------------------------- il giro di parole

function Giro({ partita, membro, membri, nome, onAvanti }) {
  const chiave = `impostore-letta-${partita.id}`
  const [letta, setLetta] = useState(() => localStorage.getItem(chiave) === 'si')
  const [scoperta, setScoperta] = useState(false)
  const [inCorso, setInCorso] = useState(false)

  const mia = partita.assegnazioni[membro.id]
  const sonoImpostore = partita.impostori.includes(membro.id)
  const tocca = diTurno(partita)
  const mancano = quantiMancano(partita)

  // Il testimone: per i primi trenta secondi il turno lo passa solo chi
  // sta parlando. Il conto si aggiorna ogni secondo e riparte da capo a
  // ogni cambio di turno — `turnoDa` arriva dal database, quindi sei
  // telefoni con sei orologi diversi vedono lo stesso numero.
  const [adesso, setAdesso] = useState(() => Date.now())
  useEffect(() => {
    const battito = setInterval(() => setAdesso(Date.now()), 1000)
    return () => clearInterval(battito)
  }, [partita.turnoDa])

  const restano = secondiDelTestimone(partita, adesso)
  const possoAvanzare = puoAvanzare(partita, membro.id, adesso)

  function hoLetto() {
    localStorage.setItem(chiave, 'si')
    setLetta(true)
    setScoperta(false)
  }

  async function fatto() {
    setInCorso(true)
    await onAvanti()
    setInCorso(false)
  }

  // Prima di tutto la parola, a schermo pieno: e' l'unico momento in cui
  // vale la pena guardare il telefono.
  if (!letta) {
    return (
      <section className="imp-segreto">
        {!scoperta ? (
          <>
            <p className="imp-spiega">Solo tu. Guarda che nessuno ti veda dietro.</p>
            {/* Una carta coperta, non un bottone: si capisce che sotto
                c'è qualcosa e che è roba tua. */}
            <button type="button" className="imp-carta" onClick={() => setScoperta(true)}>
              {/* Sul retro c'è Allan: è lui che tiene i segreti di questa
                  app, e una carta coperta è il posto dove sta meglio. */}
              <FacciaAllan espressione="sarcastico" lato={128} className="imp-carta-allan" />
              <span className="imp-carta-invito">Scopri la tua parola</span>
            </button>
          </>
        ) : (
          <>
            {/* Chi e' l'impostore deve saperlo, e vedersi da lontano. Con
                la parola simile non lo sapeva: si ritrovava "Lago" senza
                capire se era normale o no — e senza saperlo non puo'
                bluffare, che e' tutto il senso di quella variante. */}
            <div className={sonoImpostore ? 'imp-carta-su impostore' : 'imp-carta-su'}>
              {sonoImpostore && (
                <span className="imp-bollo">SEI TU L’IMPOSTORE</span>
              )}

              <span className="imp-carta-etichetta">
                {sonoImpostore ? 'La tua parola è' : 'La tua parola'}
              </span>
              <p className={mia === NESSUNA_PAROLA ? 'imp-parola niente' : 'imp-parola'}>
                {mia === NESSUNA_PAROLA ? 'Nessuna' : mia}
              </p>

              {sonoImpostore && (
                <p className="imp-carta-nota">
                  {mia === NESSUNA_PAROLA
                    ? 'Non hai niente in mano. Ascolta gli altri e inventa una parola che stia nel discorso.'
                    : 'Gli altri ne hanno un’altra. Di’ qualcosa che vada bene per tutte e due, e non farti sgamare.'}
                </p>
              )}
            </div>
            <button type="button" className="imp-comincia" onClick={hoLetto}>
              Ho letto, nascondi
            </button>
          </>
        )}
      </section>
    )
  }

  // Da qui in poi lo schermo deve dire una cosa sola, leggibile da tre
  // metri, perche' il gioco e' nella stanza e non qui dentro.
  const mioTurno = tocca === membro.id

  return (
    <section className={mioTurno ? 'imp-turno mio' : 'imp-turno'}>
      {/* I pallini del giro: quanti hanno gia' parlato e quanti mancano,
          senza far contare a nessuno. Uno sguardo e sai a che punto sei. */}
      <div className="imp-pallini" role="img" aria-label={`Giro ${partita.giro} di ${partita.giriTotali}`}>
        {partita.ordine.map((id, i) => (
          <span
            key={id}
            className={
              i < partita.turno ? 'imp-pallino fatto' : i === partita.turno ? 'imp-pallino ora' : 'imp-pallino'
            }
          />
        ))}
      </div>

      {/* Quanti impostori ci sono, sempre sotto gli occhi: e' la cosa
          che serve a ragionare, e stava solo nella schermata del voto
          d'apertura — che a meta' partita nessuno si ricorda. */}
      <p className="imp-giro">
        Giro {partita.giro} di {partita.giriTotali}
        {/* Quanti ne restano DA TROVARE, non quanti erano all'inizio:
            con due e uno gia' beccato, scrivere "2 impostori" mentre se
            ne cerca uno solo manda a caccia di un fantasma. */}
        <span className="imp-quanti">
          {(() => {
            const vivi = impostoriVivi(partita).length
            const tutti = partita.impostori.length
            const testo = vivi === 1 ? '1 impostore' : `${vivi} impostori`
            return vivi < tutti ? `${testo} · su ${tutti}` : testo
          })()}
        </span>
      </p>

      {/* La faccia prima del nome: da lontano si riconosce quella, e a
          quel punto il nome serve solo a confermare. */}
      <img
        className="imp-faccia"
        src={urlAvatar(membri[tocca]?.avatarStyle, membri[tocca]?.avatarSeed || tocca)}
        alt=""
        width="96"
        height="96"
      />

      <p className="imp-tocca-a">{mioTurno ? 'TOCCA A TE' : nome(tocca).toUpperCase()}</p>

      <button
        type="button"
        className="imp-comincia"
        onClick={fatto}
        disabled={inCorso || !possoAvanzare}
      >
        {inCorso ? '…' : possoAvanzare ? 'Fatto, avanti' : `Aspetta ${restano}s`}
      </button>
      {/* Resta solo quando il tasto e' spento: li' serve a spiegare
          perche' non si preme. Gli altri suggerimenti sono spariti — il
          gioco si capisce guardandolo. */}
      {!possoAvanzare && (
        <p className="imp-nota">Per mezzo minuto il turno lo passa solo chi parla.</p>
      )}

      <button
        type="button"
        className={scoperta ? 'imp-ripassa aperta' : 'imp-ripassa'}
        onPointerDown={() => setScoperta(true)}
        onPointerUp={() => setScoperta(false)}
        onPointerLeave={() => setScoperta(false)}
        onPointerCancel={() => setScoperta(false)}
      >
        {scoperta
          ? `${sonoImpostore ? '🎭 ' : ''}${mia === NESSUNA_PAROLA ? 'Nessuna parola' : mia}`
          : '👁 Tieni premuto: la tua parola'}
      </button>
    </section>
  )
}

// ----------------------------------------------------------------- voto

function Accusa({ partita, voto, membro, membri, nome, onApri, onChiedi, onRivela, onVotato }) {
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [scelti, setScelti] = useState([])

  // Tanti quanti sono gli impostori ANCORA in gioco: dal secondo giro
  // in poi ce ne puo' essere uno solo, e chiederne due sarebbe chiedere
  // di accusare per forza un innocente.
  const opzioni = voto?.opzioni ?? partita.giocatori
  // Fra le opzioni c'e' anche "un altro giro": non e' una persona e non
  // va nella griglia delle facce.
  const persone = opzioni.filter((x) => x !== ALTRO_GIRO)
  const indiceAltroGiro = opzioni.indexOf(ALTRO_GIRO)
  const quanti = impostoriVivi(partita).length
  const chiedoAncora = scelti.includes(indiceAltroGiro)

  const gia = useRef(null)
  useEffect(() => {
    if (partita.votoId || gia.current === partita.id) return
    gia.current = partita.id
    onApri()
  }, [partita.id, partita.votoId, onApri])

  const chiesta = partita.rivelaChiesta ?? []
  const serve = quantiPerRivelare(persone.length)
  const bastano = bastaPerRivelare(partita, chiesta)
  const hoChiesto = chiesta.includes(membro.id)
  const tuttiDentro = tuttiHannoVotato(partita, voto?.hannoVotato ?? [])

  const hoVotato = voto?.hannoVotato?.includes(membro.id)
  const mieScelte = voto?.schede?.[membro.id]
  const quantiHannoVotato = voto?.hannoVotato?.length ?? 0
  const tutti = persone.length

  function alterna(id) {
    const i = opzioni.indexOf(id)
    setScelti((prima) => {
      if (prima.includes(i)) return prima.filter((x) => x !== i)
      // ⚠️ Accusare esclude "un altro giro". Con due impostori il tetto
      // e' due, quindi si poteva chiedere di sentire ancora E accusare
      // qualcuno nella stessa scheda: due risposte opposte alla stessa
      // domanda, e il conteggio le prendeva per buone tutte e due.
      const pulita = prima.filter((x) => x !== indiceAltroGiro)
      // Non piu' di quanti sono gli impostori: indicarne cinque non e'
      // votare, e' fare la lista della spesa.
      if (pulita.length >= quanti) return pulita
      return [...pulita, i]
    })
  }

  // O accusi, o chiedi di sentire ancora: sono due risposte alla stessa
  // domanda, e mescolarle vorrebbe dire votare due cose in una volta.
  function chiediUnAltroGiro() {
    setScelti((prima) => (prima.includes(indiceAltroGiro) ? [] : [indiceAltroGiro]))
  }

  async function conferma() {
    setInCorso(true)
    setAvviso(null)
    try {
      onVotato(await votaImpostore(voto.id, membro.id, scelti))
    } catch (e) {
      setAvviso(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  if (!voto) return <Rotella testo="Apro il voto" />

  const scelteMostrate = hoVotato
    ? (Array.isArray(mieScelte) ? mieScelte : [mieScelte]).filter((x) => x !== undefined)
    : scelti

  return (
    <section className="imp-voto">
      <h2 className="imp-titolo">
        {quanti === 1 ? 'Vota l’impostore' : 'Vota i due impostori'}
      </h2>
      <p className="imp-spiega">
        {hoVotato
          ? 'Hai votato.'
          : quanti === 1
            ? 'Indica chi sospetti.'
            : `Indicane due: ne mancano ${quanti - scelti.length}.`}{' '}
        Hanno votato {quantiHannoVotato} su {tutti}.
      </p>

      {avviso && <p className="imp-guasto">{avviso}</p>}

      <div className="imp-gente">
        {persone
          .filter((id) => id !== membro.id)
          .map((id) => {
            const i = opzioni.indexOf(id)
            const preso = scelteMostrate.includes(i)
            return (
              <button
                key={id}
                type="button"
                className={preso ? 'imp-tessera dentro' : 'imp-tessera'}
                onClick={() => alterna(id)}
                disabled={hoVotato || inCorso}
                aria-pressed={preso}
              >
                <img
                  src={urlAvatar(membri[id]?.avatarStyle, membri[id]?.avatarSeed || id)}
                  alt=""
                  width="34"
                  height="34"
                />
                <span>{nome(id)}</span>
              </button>
            )
          })}
      </div>

      {/* L'alternativa all'accusa: non ne sappiamo abbastanza, si
          ascolta un altro giro. Vince se la chiedono piu' persone di
          quante ne ha il piu' accusato — a parita' si accusa, perche' in
          caso di dubbio il gioco deve andare avanti. */}
      {indiceAltroGiro >= 0 && !hoVotato && (
        <button
          type="button"
          className={chiedoAncora ? 'imp-altro-giro scelto' : 'imp-altro-giro'}
          onClick={chiediUnAltroGiro}
          disabled={inCorso}
          aria-pressed={chiedoAncora}
        >
          Non ne so abbastanza — un altro giro
        </button>
      )}

      {hoVotato && Array.isArray(mieScelte) && mieScelte.includes(indiceAltroGiro) && (
        <p className="imp-nota">Hai chiesto un altro giro.</p>
      )}

      {/* Finche' non ne hai indicati quanti servono non si conferma: con
          due impostori votarne uno solo vuol dire buttare mezzo voto. */}
      {!hoVotato && (
        <button
          type="button"
          className="imp-comincia"
          onClick={conferma}
          disabled={(chiedoAncora ? false : scelti.length !== quanti) || inCorso}
        >
          {inCorso
            ? '…'
            : chiedoAncora
              ? 'Vota'
              : scelti.length !== quanti
                ? `Indicane ${quanti - scelti.length} ancora`
                : 'Vota'}
        </button>
      )}

      {/* Rivelare in anticipo non e' di chi tocca il tasto per primo: un
          tocco per sbaglio brucerebbe la partita a tutti gli altri.
          Serve che lo chieda piu' della meta'. Quando hanno votato tutti
          invece non c'e' niente da chiedere. */}
      {tuttiDentro ? (
        <button type="button" className="imp-comincia" onClick={onRivela}>
          Rivela
        </button>
      ) : (
        <>
          <button
            type="button"
            className="imp-rivela"
            onClick={bastano ? onRivela : onChiedi}
            disabled={!bastano && hoChiesto}
          >
            {bastano
              ? 'Il gruppo ha deciso: rivela'
              : hoChiesto
                ? `Hai chiesto di rivelare — ${chiesta.length} su ${serve}`
                : `Chiedi di rivelare (${chiesta.length} su ${serve})`}
          </button>
          <p className="imp-nota">
            Manca ancora qualcuno. Per rivelare prima devono chiederlo in {serve}.
          </p>
        </>
      )}
    </section>
  )
}

// L'ultima carta dell'impostore beccato: scrive la parola del gruppo e,
// se la indovina, ribalta tutto. Per tutti gli altri e' un'attesa — ed e'
// giusto che sia un'attesa, perche' e' il momento in cui si trattiene il
// fiato.
function Colpo({ partita, voto, membro, nome, onTenta, onChiedi, onChiudi }) {
  const [scritto, setScritto] = useState('')
  const [inCorso, setInCorso] = useState(false)

  // La via d'uscita. Se chi e' stato beccato se n'e' andato, o ha il
  // telefono morto, o semplicemente non ha voglia di scrivere, la partita
  // resta appesa qui per sempre: nessuno prende punti — nemmeno chi aveva
  // indovinato — e finche' ce n'e' una aperta non se ne comincia un'altra.
  // C'era gia' "Abbandona", ma abbandonare butta via anche la vittoria
  // che il gruppo si era guadagnato.
  //
  // Stessa soglia del "rivela in anticipo", e per la stessa ragione: e' un
  // gesto che decide come finisce, quindi non puo' essere di chi tocca il
  // tasto per primo. Qui pero' funziona meglio, perche' chi si sta
  // aspettando e' stato beccato — quindi e' in `fuori`, quindi non conta
  // nella maggioranza. La persona che manca non puo' bloccare il conto che
  // serve a smettere di aspettarla.
  const chiesta = partita.rivelaChiesta ?? []
  const inGioco = vivi(partita)
  const serve = quantiPerRivelare(inGioco.length)
  const bastano = bastaPerRivelare(partita, chiesta)
  const hoChiesto = chiesta.includes(membro.id)

  const puo = useMemo(
    () =>
      chiPuoTentare({
        impostori: partita.impostori,
        giocatori: partita.giocatori,
        schede: schedePerId(voto?.schede, voto?.opzioni ?? partita.giocatori),
      }),
    [partita, voto?.schede, voto?.opzioni]
  )

  const tocca = puo.includes(membro.id)

  // Se il tentativo e' gia' arrivato da un altro telefono, la partita si
  // chiude: chi lo vede sistema il finale per tutti.
  useEffect(() => {
    if (partita.tentativo != null) onChiudi()
  }, [partita.tentativo, onChiudi])

  async function manda(e) {
    e.preventDefault()
    if (!scritto.trim() || inCorso) return
    setInCorso(true)
    await onTenta(scritto.trim())
    setInCorso(false)
  }

  return (
    <section className="imp-colpo">
      <p className="imp-etichetta">Ti hanno beccato</p>

      {tocca ? (
        <>
          <h2 className="imp-titolo">Ultima carta</h2>
          <p className="imp-spiega">
            Scrivi la parola che aveva il gruppo. Se la indovini vinci lo stesso, e
            tutta la loro indagine non è servita a niente.
          </p>

          {/* Detto PRIMA della casella, non dopo: se lo scopri quando hai
              già premuto, l'hai scoperto tardi. */}
          {puo.length > 1 && (
            <p className="imp-nota">
              Vi hanno beccati in due: vale la prima parola che parte, e vale per
              tutti e due. Mettetevi d’accordo prima di scrivere.
            </p>
          )}

          <form onSubmit={manda}>
            <input
              className="imp-tentativo"
              type="text"
              value={scritto}
              onChange={(e) => setScritto(e.target.value)}
              placeholder="La parola del gruppo"
              aria-label="La parola del gruppo"
              autoFocus
              autoComplete="off"
            />
            <button
              type="submit"
              className="imp-comincia"
              disabled={!scritto.trim() || inCorso}
            >
              {inCorso ? '…' : 'È questa'}
            </button>
          </form>
          <p className="imp-nota">Una sola volta. Maiuscole e accenti non contano.</p>
        </>
      ) : (
        <>
          <h2 className="imp-titolo">
            {puo.length === 1 ? `${nome(puo[0])} ci prova` : 'Ci provano'}
          </h2>
          <p className="imp-spiega">
            {puo.length === 1 ? 'Sta scrivendo' : 'Stanno scrivendo'} la parola che
            avevate voi. Se la indovina, avete perso lo stesso.
          </p>
          <Rotella testo="Un attimo di silenzio" />

          {/* Sotto la rotella e non accanto al titolo: l'attesa è il
              momento del gioco, e un tasto per saltarla messo in vista
              inviterebbe a saltarla sempre. Serve quando l'attesa non
              finisce, e allora si scorre. */}
          <button
            type="button"
            className="imp-rivela"
            onClick={bastano ? onChiudi : onChiedi}
            disabled={!bastano && hoChiesto}
          >
            {bastano
              ? 'Il gruppo ha deciso: chiudete senza'
              : hoChiesto
                ? `Hai chiesto di chiudere — ${chiesta.length} su ${serve}`
                : `Non risponde: chiudete (${chiesta.length} su ${serve})`}
          </button>
          <p className="imp-nota">
            Se se n’è andato o ha il telefono morto la partita non deve restare
            appesa. Chiudendo, la sua ultima carta salta e la vittoria resta
            vostra. Devono chiederlo in {serve}.
          </p>
        </>
      )}
    </section>
  )
}

// Chi e' uscito. Non parla e non vota, ma in cambio vede tutte le
// parole: e' la regola scelta per il viaggio — fuori dal gioco, dentro il
// segreto. Restare seduti venti minuti senza sapere niente sarebbe la
// parte peggiore di un gioco a eliminazione, cosi' invece diventa la piu'
// divertente da guardare.
function Fuori({ partita, membri, nome }) {
  const dentro = vivi(partita)
  const usciti = (partita.fuori ?? []).filter((id) => id !== undefined)

  return (
    <section className="imp-morto">
      <p className="imp-etichetta">Sei fuori</p>
      <h2 className="imp-titolo">Adesso guardi</h2>
      <p className="imp-spiega">
        Non parli e non voti. In compenso vedi tutto: sotto ci sono le parole di
        tutti. Buon divertimento, e niente facce strane.
      </p>

      <p className="imp-etichetta">Chi ha cosa</p>
      <ul className="imp-carte-scoperte">
        {partita.giocatori.map((id) => {
          const parola = partita.assegnazioni[id]
          const impostore = partita.impostori.includes(id)
          const ancoraDentro = dentro.includes(id)

          return (
            <li
              key={id}
              className={ancoraDentro ? 'imp-scoperta' : 'imp-scoperta uscito'}
            >
              <img
                src={urlAvatar(membri[id]?.avatarStyle, membri[id]?.avatarSeed || id)}
                alt=""
                width="26"
                height="26"
              />
              <span className="imp-scoperta-nome">{nome(id)}</span>
              <span className={impostore ? 'imp-scoperta-parola impostore' : 'imp-scoperta-parola'}>
                {parola === NESSUNA_PAROLA ? '—' : parola}
              </span>
              {impostore && <span className="imp-scoperta-bollo">impostore</span>}
              {!ancoraDentro && <span className="imp-scoperta-fuori">fuori</span>}
            </li>
          )
        })}
      </ul>

      <p className="imp-nota">
        {usciti.length === 1 ? 'È uscito uno.' : `Sono usciti in ${usciti.length}.`} In
        gioco restano {dentro.length}.
      </p>
    </section>
  )
}

// ---------------------------------------------------------- rivelazione

// `giriNoti` dice se questo racconto ha in mano tutti i giri d'accusa o
// solo l'ultimo. Serve a una cosa sola: non affermare quello che non si
// sa. "Nessuno ha indovinato" e' una frase che dice qualcosa, e su una
// partita finita in piu' giri, senza le schede dei giri vecchi, e' falsa
// — mentre in classifica quel +2 c'e'. Tacere e' peggio che dirlo male
// solo quando si sa.
function Rivelazione({ partita, voto, schedeDeiGiri = [], giriNoti = true, nome, membri }) {
  const r = useMemo(
    () =>
      raccontaFinale({
        impostori: partita.impostori,
        giocatori: partita.giocatori,
        schede: schedePerId(voto?.schede, voto?.opzioni ?? partita.giocatori),
        // Gli stessi nomi che `paga` sta accreditando: chi aveva
        // riconosciuto l'impostore al primo giro viene pagato, quindi
        // deve anche comparire qui.
        schedeDeiGiri,
        tentativo: partita.tentativo,
        parolaGruppo: partita.parolaGruppo,
        fuori: partita.fuori,
      }),
    [partita, voto?.schede, voto?.opzioni, schedeDeiGiri]
  )

  const colpo = r.colpoRiuscito
  const perNumeri = r.perNumeri

  // Chi e' stato eliminato per errore: e' meta' della storia di una
  // partita a eliminazione, e senza non si capisce come si e' arrivati
  // alla fine.
  const eliminati = (partita.fuori ?? []).filter((id) => !partita.impostori.includes(id))

  return (
    <section className={colpo ? 'imp-rivelazione ribaltata' : 'imp-rivelazione'}>
      <h2 className="imp-titolo">
        {r.titolo}
      </h2>

      {/* Il finale per numeri va detto, o non si capisce perche' la
          partita e' finita senza che nessuno fosse beccato. */}
      {perNumeri && (
        <p className="imp-colpo-esito riuscito">
          Sono rimasti in {impostoriVivi(partita).length} contro{' '}
          {partita.giocatori.length - (partita.fuori ?? []).length - impostoriVivi(partita).length}
          : da lì in poi il voto lo decidevano loro.
        </p>
      )}

      {/* Il colpo di coda va raccontato, o il finale non si spiega: uno
          scoperto che vince sembra un errore, non un colpo di scena. */}
      {partita.tentativo != null && (
        <p className={colpo ? 'imp-colpo-esito riuscito' : 'imp-colpo-esito fallito'}>
          {nome(partita.tentatoDa)} ha tentato <strong>«{partita.tentativo}»</strong>:{' '}
          {colpo ? 'era quella giusta.' : 'non era quella.'}
        </p>
      )}

      <div className="imp-parole">
        <div>
          <p className="imp-etichetta">Il gruppo aveva</p>
          <p className="imp-parola piccola">{partita.parolaGruppo}</p>
        </div>
        <div>
          <p className="imp-etichetta">L’impostore aveva</p>
          <p className="imp-parola piccola">
            {partita.parolaImpostore === NESSUNA_PAROLA ? 'Niente' : partita.parolaImpostore}
          </p>
        </div>
      </div>

      <p className="imp-etichetta">
        {partita.impostori.length === 1 ? 'L’impostore era' : 'Gli impostori erano'}
      </p>
      <div className="imp-gente">
        {partita.impostori.map((id) => (
          <div key={id} className={r.scoperti.includes(id) ? 'imp-tessera' : 'imp-tessera dentro'}>
            <img
              src={urlAvatar(membri[id]?.avatarStyle, membri[id]?.avatarSeed || id)}
              alt=""
              width="34"
              height="34"
            />
            <span>{nome(id)}</span>
            {/* Scoperto ma vincente: il colpo di coda l'ha ribaltata, e
                il punto se lo prende lo stesso. Dire solo "scoperto"
                raccontava la partita sbagliata. */}
            <small>
              {colpo
                ? `ribaltata +${PER_ID['impostore-impunito'].punti}`
                : r.scoperti.includes(id)
                  ? 'scoperto'
                  : `impunito +${PER_ID['impostore-impunito'].punti}`}
            </small>
          </div>
        ))}
      </div>

      {eliminati.length > 0 && (
        <p className="imp-spiega">
          Per strada ci hanno rimesso {eliminati.map(nome).join(', ')}.
        </p>
      )}

      {/* ⚠️ `premiati` e non `indovini`: col colpo di coda riuscito
          avevano indovinato ma non prendono niente, e annunciare punti
          che nessuno riceve e' peggio che tacere. */}
      {r.premiati.length > 0 ? (
        <p className="imp-spiega">
          {r.premiati.map(nome).join(', ')} {r.premiati.length === 1 ? 'ha' : 'hanno'} indovinato:{' '}
          +{PER_ID['smascheratore'].punti} a testa.
        </p>
      ) : colpo && r.indovini.length > 0 ? (
        <p className="imp-spiega">
          {r.indovini.map(nome).join(', ')} l’{r.indovini.length === 1 ? 'aveva' : 'avevano'}{' '}
          riconosciuto, e non è servito a niente: la parola l’ha indovinata lui.
        </p>
      ) : giriNoti ? (
        <p className="imp-spiega">Nessuno ha indovinato. Complimenti a nessuno.</p>
      ) : (
        <p className="imp-spiega">
          Chi aveva indovinato non si vede più da qui: i giri sono stati più d’uno. I
          punti però sono andati, guarda la classifica.
        </p>
      )}

    </section>
  )
}
