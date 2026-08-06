import { useEffect, useMemo, useRef, useState } from 'react'
import './Impostore.css'
import { useImpostore } from '../hooks/useImpostore.js'
import { diTurno, esito, quantiMancano, schedePerId } from '../lib/impostore.js'
import { IMPOSTORE, NESSUNA_PAROLA, VARIANTI } from '../config/impostore.js'
import { PER_ID } from '../config/leggi.js'
import { urlAvatar } from '../config/avatar.js'
import { vota } from '../lib/voti.js'
import { descriviErrore } from '../lib/errori.js'
import Rotella from './Rotella.jsx'

// L'app fa il mazziere e basta. Il gioco vero — dire la propria parola,
// accusarsi, difendersi — succede a voce nella stanza, quindi ogni
// schermata qui dentro deve poter essere guardata di sfuggita e poi
// lasciata stare. Niente timer: un countdown trasforma una cosa
// rilassata in ansia da prestazione.
export default function Impostore({ membro, membri }) {
  const { partita, voto, stato, errore, nuova, avanti, avviaVoto, rivela, setVoto } =
    useImpostore()
  const nome = (id) => membri[id]?.nome ?? 'Qualcuno'

  if (stato === 'caricamento') return <Rotella />
  if (stato === 'guasto') return <p className="imp-guasto">{errore}</p>

  const inGioco = partita && partita.stato !== 'finita' && partita.giocatori.includes(membro.id)

  return (
    <div className="impostore">
      {errore && <p className="imp-guasto">{errore}</p>}

      {(!partita || partita.stato === 'finita') && (
        <>
          {partita?.stato === 'finita' && (
            <Rivelazione partita={partita} voto={voto} nome={nome} membri={membri} />
          )}
          <Apparecchia membro={membro} membri={membri} onCrea={nuova} />
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

      {partita?.stato === 'voto' && (
        <Accusa
          partita={partita}
          voto={voto}
          membro={membro}
          membri={membri}
          nome={nome}
          onApri={avviaVoto}
          onRivela={rivela}
          onVotato={setVoto}
        />
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
              <span className="imp-carta-dorso" aria-hidden="true">
                ?
              </span>
              <span className="imp-carta-invito">Scopri la tua parola</span>
            </button>
          </>
        ) : (
          <>
            <p className="imp-etichetta">La tua parola è</p>
            <div className={mia === NESSUNA_PAROLA ? 'imp-carta-su niente' : 'imp-carta-su'}>
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

function Accusa({ partita, voto, membro, membri, nome, onApri, onRivela, onVotato }) {
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)

  // Il voto lo apre il primo telefono che arriva qui: nessuno deve fare
  // l'operatore. Una volta sola per partita, pero': `onApri` cambia a
  // ogni aggiornamento della partita, e senza il freno questo effetto
  // rifarebbe partire l'apertura prima che il primo voto sia tornato,
  // lasciando in giro sondaggi orfani.
  const gia = useRef(null)
  useEffect(() => {
    if (partita.votoId || gia.current === partita.id) return
    gia.current = partita.id
    onApri()
  }, [partita.id, partita.votoId, onApri])

  const hoVotato = voto?.hannoVotato?.includes(membro.id)
  const mioVoto = voto?.schede?.[membro.id]
  const quantiHannoVotato = voto?.hannoVotato?.length ?? 0
  const tutti = partita.giocatori.length

  async function accusa(id) {
    setInCorso(true)
    setAvviso(null)
    try {
      // La riga aggiornata torna gia' dalla chiamata: usarla invece di
      // aspettare l'eco del realtime fa vedere subito il proprio voto,
      // invece di lasciare il dito a mezz'aria per un secondo.
      onVotato(await vota(voto.id, membro.id, partita.giocatori.indexOf(id)))
    } catch (e) {
      setAvviso(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  if (!voto) return <p className="imp-vuoto">Apro il voto…</p>

  return (
    <section className="imp-voto">
      <h2 className="imp-titolo">Chi è l’impostore?</h2>
      {avviso && <p className="imp-guasto">{avviso}</p>}

      <div className="imp-gente">
        {partita.giocatori
          .filter((id) => id !== membro.id)
          .map((id) => (
            <button
              key={id}
              type="button"
              className={
                mioVoto === partita.giocatori.indexOf(id)
                  ? 'imp-tessera dentro'
                  : 'imp-tessera'
              }
              onClick={() => accusa(id)}
              disabled={hoVotato || inCorso}
            >
              <img
                src={urlAvatar(membri[id]?.avatarStyle, membri[id]?.avatarSeed || id)}
                alt=""
                width="34"
                height="34"
              />
              <span>{nome(id)}</span>
            </button>
          ))}
      </div>

      <p className="imp-spiega">
        {hoVotato ? 'Hai votato.' : 'Tocca chi sospetti.'} Hanno votato {quantiHannoVotato} su{' '}
        {tutti}.
      </p>

      {/* Non si aspetta l'ultimo: se uno e' andato a dormire col telefono
          in tasca, il gruppo non resta ostaggio. */}
      <button type="button" className="imp-comincia" onClick={onRivela}>
        {quantiHannoVotato >= tutti ? 'Rivela' : 'Rivela lo stesso'}
      </button>
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

  const scampati = r.impuniti.length > 0

  return (
    <section className="imp-rivelazione">
      <h2 className="imp-titolo">{scampati ? 'L’ha fatta franca' : 'Beccato'}</h2>

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
