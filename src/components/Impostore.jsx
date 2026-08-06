import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Impostore.css'
import { useImpostore } from '../hooks/useImpostore.js'
import {
  bastaPerRivelare,
  chiPuoTentare,
  diTurno,
  stessaParola,
  esito,
  quantiMancano,
  quantiPerRivelare,
  schedePerId,
  tuttiHannoVotato,
} from '../lib/impostore.js'
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
    storico,
    stato,
    errore,
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
              nome={nome}
              membri={membri}
              onChiudi={() => chiudiRivelazione(partita.id)}
            />
          )}
          <Apparecchia membro={membro} membri={membri} onCrea={nuova} />
          <Storico partite={storico} ioId={membro.id} onApri={setDaStorico} />
        </>
      )}

      {partita?.stato === 'in-corso' && inGioco && (
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

      {partita?.stato === 'in-corso' && !inGioco && (
        <p className="imp-fuori">
          C’è una partita in corso e tu non ci sei dentro. Goditela da fuori.
        </p>
      )}

      {/* Una partita vecchia riaperta dallo storico: stessa finestra del
          finale, perché è la stessa cosa — un resoconto che si legge e si
          chiude. */}
      {daStorico && (
        <FinestraFinale
          partita={daStorico}
          voto={{ schede: daStorico.schede }}
          nome={nome}
          membri={membri}
          onChiudi={() => setDaStorico(null)}
        />
      )}

      {partita?.stato === 'preparazione' && (
        <Preparazione
          partita={partita}
          voto={voto}
          membro={membro}
          onVotato={setVoto}
          onAvvia={avvia}
        />
      )}

      {partita?.stato === 'colpo' && (
        <Colpo
          partita={partita}
          voto={voto}
          membro={membro}
          nome={nome}
          onTenta={tenta}
          onChiudi={chiudi}
        />
      )}

      {partita?.stato === 'voto' && (
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

  // Quando hanno votato tutti si parte, e lo fa il primo telefono che se
  // ne accorge. Il freno serve perche' l'effetto rigira a ogni voto che
  // arriva, e partire due volte non si puo'.
  useEffect(() => {
    if (!voto || quanti < tutti || partito.current) return
    partito.current = true
    const vincente = conteggi.indexOf(Math.max(...conteggi))
    onAvvia(scelte[vincente < 0 ? 0 : vincente])
  }, [voto, quanti, tutti, conteggi, scelte, onAvvia])

  async function vota(i) {
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
        Lo decidete voi, prima di sapere chi sono. Hanno votato {quanti} su {tutti}.
      </p>

      {avviso && <p className="imp-guasto">{avviso}</p>}

      <div className="imp-scelte">
        {scelte.map((n, i) => (
          <button
            key={n}
            type="button"
            className={i === conteggi.indexOf(Math.max(...conteggi)) && quanti > 0
              ? 'imp-scelta avanti'
              : 'imp-scelta'}
            onClick={() => vota(i)}
            disabled={hoVotato || inCorso}
          >
            <span className="imp-scelta-numero">{n}</span>
            <span className="imp-scelta-nome">
              {n === 1 ? 'impostore' : 'impostori'}
              {n === consigliata && ' · consigliato'}
            </span>
            <span className="imp-scelta-voti">{conteggi[i] ?? 0}</span>
          </button>
        ))}
      </div>

      <p className="imp-nota">
        {hoVotato
          ? 'Hai votato. Si parte quando hanno votato tutti.'
          : 'Tocca il numero che preferisci.'}
      </p>
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
        Dopo due giri si vota chi sembra fuori posto.
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
function FinestraFinale({ partita, voto, nome, membri, onChiudi }) {
  return (
    <div
      className="imp-sfondo"
      role="dialog"
      aria-modal="true"
      aria-label="Com’è andata"
      onClick={onChiudi}
    >
      <div className="imp-finestra" onClick={(e) => e.stopPropagation()}>
        <Rivelazione partita={partita} voto={voto} nome={nome} membri={membri} />
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
          const r = esito({
            impostori: p.impostori,
            giocatori: p.giocatori,
            schede: schedePerId(p.schede, p.giocatori),
          })
          const scampati = r.impuniti.length > 0
          const mie = p.impostori.includes(ioId)

          return (
            <li key={p.id}>
              <button
                type="button"
                className="imp-storico-riga"
                onClick={() => onApri(p)}
              >
                <span className="imp-storico-quando">{quando(p.creataIl)}</span>
                <span className={scampati ? 'imp-storico-esito franca' : 'imp-storico-esito preso'}>
                  {scampati ? 'L’ha fatta franca' : 'Beccato'}
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
  const tocca = diTurno(partita)
  const mancano = quantiMancano(partita)

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
            <div className={mia === NESSUNA_PAROLA ? 'imp-carta-su niente' : 'imp-carta-su'}>
              <span className="imp-carta-etichetta">La tua parola</span>
              <p className={mia === NESSUNA_PAROLA ? 'imp-parola niente' : 'imp-parola'}>
                {mia === NESSUNA_PAROLA ? 'Nessuna' : mia}
              </p>
              {mia === NESSUNA_PAROLA && (
                <p className="imp-carta-nota">Sei l’impostore. Inventa e non farti sgamare.</p>
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

      <p className="imp-giro">
        Giro {partita.giro} di {partita.giriTotali}
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

      <p className="imp-spiega">
        {mancano === 1 ? 'Ultimo, poi si vota.' : `Ancora ${mancano} prima del voto.`}
      </p>

      <button type="button" className="imp-comincia" onClick={fatto} disabled={inCorso}>
        {inCorso ? '…' : 'Fatto, avanti'}
      </button>
      <p className="imp-nota">Può premerlo chiunque, non solo chi è di turno.</p>

      <button
        type="button"
        className={scoperta ? 'imp-ripassa aperta' : 'imp-ripassa'}
        onPointerDown={() => setScoperta(true)}
        onPointerUp={() => setScoperta(false)}
        onPointerLeave={() => setScoperta(false)}
        onPointerCancel={() => setScoperta(false)}
      >
        {scoperta ? (mia === NESSUNA_PAROLA ? 'Nessuna parola' : mia) : '👁 Tieni premuto: la tua parola'}
      </button>
    </section>
  )
}

// ----------------------------------------------------------------- voto

function Accusa({ partita, voto, membro, membri, nome, onApri, onChiedi, onRivela, onVotato }) {
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [scelti, setScelti] = useState([])

  const quanti = partita.impostori.length

  const gia = useRef(null)
  useEffect(() => {
    if (partita.votoId || gia.current === partita.id) return
    gia.current = partita.id
    onApri()
  }, [partita.id, partita.votoId, onApri])

  const chiesta = partita.rivelaChiesta ?? []
  const serve = quantiPerRivelare(partita.giocatori.length)
  const bastano = bastaPerRivelare(partita, chiesta)
  const hoChiesto = chiesta.includes(membro.id)
  const tuttiDentro = tuttiHannoVotato(partita, voto?.hannoVotato ?? [])

  const hoVotato = voto?.hannoVotato?.includes(membro.id)
  const mieScelte = voto?.schede?.[membro.id]
  const quantiHannoVotato = voto?.hannoVotato?.length ?? 0
  const tutti = partita.giocatori.length

  function alterna(id) {
    const i = partita.giocatori.indexOf(id)
    setScelti((prima) => {
      if (prima.includes(i)) return prima.filter((x) => x !== i)
      // Non piu' di quanti sono gli impostori: indicarne cinque non e'
      // votare, e' fare la lista della spesa.
      if (prima.length >= quanti) return prima
      return [...prima, i]
    })
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
        {partita.giocatori
          .filter((id) => id !== membro.id)
          .map((id) => {
            const i = partita.giocatori.indexOf(id)
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

      {/* Finche' non ne hai indicati quanti servono non si conferma: con
          due impostori votarne uno solo vuol dire buttare mezzo voto. */}
      {!hoVotato && (
        <button
          type="button"
          className="imp-comincia"
          onClick={conferma}
          disabled={scelti.length !== quanti || inCorso}
        >
          {inCorso
            ? '…'
            : scelti.length !== quanti
              ? `Indicane ${quanti - scelti.length} ancora`
              : 'Conferma il voto'}
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
function Colpo({ partita, voto, membro, nome, onTenta, onChiudi }) {
  const [scritto, setScritto] = useState('')
  const [inCorso, setInCorso] = useState(false)

  const puo = useMemo(
    () =>
      chiPuoTentare({
        impostori: partita.impostori,
        giocatori: partita.giocatori,
        schede: schedePerId(voto?.schede, partita.giocatori),
      }),
    [partita, voto?.schede]
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
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------- rivelazione

function Rivelazione({ partita, voto, nome, membri }) {
  const r = useMemo(
    () =>
      esito({
        impostori: partita.impostori,
        giocatori: partita.giocatori,
        schede: schedePerId(voto?.schede, partita.giocatori),
      }),
    [partita, voto?.schede]
  )

  const colpo = stessaParola(partita.tentativo, partita.parolaGruppo)
  const scampati = r.impuniti.length > 0

  return (
    <section className={colpo ? 'imp-rivelazione ribaltata' : 'imp-rivelazione'}>
      <h2 className="imp-titolo">
        {colpo ? 'Ribaltata all’ultimo' : scampati ? 'L’ha fatta franca' : 'Beccato'}
      </h2>

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
            <small>
              {r.scoperti.includes(id)
                ? 'scoperto'
                : `impunito +${PER_ID['impostore-impunito'].punti}`}
            </small>
          </div>
        ))}
      </div>

      {r.indovini.length > 0 ? (
        <p className="imp-spiega">
          {r.indovini.map(nome).join(', ')} {r.indovini.length === 1 ? 'ha' : 'hanno'} indovinato:{' '}
          +{PER_ID['smascheratore'].punti} a testa.
        </p>
      ) : (
        <p className="imp-spiega">Nessuno ha indovinato. Complimenti a nessuno.</p>
      )}

    </section>
  )
}
