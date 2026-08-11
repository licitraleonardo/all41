import { useEffect, useMemo, useState } from 'react'
import './Dama.css'
import { useDama } from '../hooks/useDama.js'
import {
  BIANCO,
  NERO,
  casellaScura,
  esito,
  mossaInTesto,
  mosseLegali,
  ricostruisci,
} from '../lib/dama.js'
import { classificaDama, comeEFinita, inCorsoPerMe } from '../lib/classificaDama.js'
import { scegliMossa } from '../lib/allanDama.js'
import { ALLAN, ALLAN_ID } from '../config/dama.js'
import { dopoUnaVittoria, eLaPrimaVittoria } from '../lib/puntiDama.js'
import { urlAvatar } from '../config/avatar.js'
import Rotella from './Rotella.jsx'

// La Dama: si sfida una persona, un telefono per uno. La scacchiera vera
// è la lista delle mosse sul database; qui si rigioca e si disegna.
// Chi non gioca può guardare: una partita a dama dopo cena ha sempre il
// capannello intorno.
export default function Dama({ membro, membri, apriPartita, onAperta }) {
  const { partite, stato, errore, sfida, muovi, abbandona } = useDama(membro.id)
  const [apertaId, setApertaId] = useState(null)
  const [sfidando, setSfidando] = useState(false)
  const [avviso, setAvviso] = useState(null)

  // ⚠️ La partita contro Allan vive QUI, in memoria, e non tocca il
  // database nemmeno per un istante.
  //
  // Non è pigrizia ed è la decisione che tiene in piedi il resto: se
  // finisse in `dama_games`, la coppa della Dama la vincerebbe chi ha più
  // tempo libero e una macchina da battere, e smetterebbe di voler dire
  // qualcosa. Per lo stesso motivo `Scacchiera` riceve `allenamento` e
  // non assegna punti.
  //
  // Effetto collaterale gradito: **funziona senza rete**. Non perché
  // qualcuno abbia scritto qualcosa per l'offline, ma perché non c'è
  // nessuna rete da cui dipendere.
  const [conAllan, setConAllan] = useState(null)

  // Accettando una sfida dal banner si arriva qui con la partita già
  // scelta: si apre quella e si dice al banner che è stata presa in
  // carico, o resterebbe acceso.
  useEffect(() => {
    if (!apriPartita) return
    setApertaId(apriPartita)
    onAperta?.()
  }, [apriPartita, onAperta])

  const nome = (id) => (id === ALLAN_ID ? 'Allan' : (membri[id]?.nome ?? 'Qualcuno'))

  function partitaControAllan() {
    return { id: ALLAN_ID, bianco: membro.id, nero: ALLAN_ID, mosse: [], stato: 'in-corso' }
  }

  // La mossa di chi gioca, e subito dopo la risposta di Allan.
  //
  // ⚠️ La pausa non è finta cortesia: una mossa che compare nell'istante
  // in cui stacchi il dito non sembra una risposta, sembra che il gioco
  // stia giocando da solo. Sta in `config/dama.js` con le altre manopole.
  async function muoviControAllan(partita, testo) {
    const dopoDiMe = { ...partita, mosse: [...partita.mosse, testo] }
    setConAllan(dopoDiMe)

    const stato = ricostruisci(dopoDiMe.mosse)
    if (esito(stato).finita) return

    await new Promise((r) => setTimeout(r, ALLAN.pausa))
    const sua = scegliMossa(stato)
    if (!sua) return
    setConAllan((p) =>
      p && p.mosse.length === dopoDiMe.mosse.length
        ? { ...p, mosse: [...p.mosse, mossaInTesto(sua)] }
        : p
    )
  }
  const aperta = partite.find((p) => p.id === apertaId) ?? null

  // ⚠️ Prima del caricamento e prima del guasto: contro Allan si gioca
  // anche se il database non risponde, ed è tutto il punto.
  if (conAllan) {
    return (
      <Scacchiera
        partita={conAllan}
        partite={[]}
        membro={membro}
        nome={nome}
        allenamento
        onMuovi={muoviControAllan}
        onAbbandona={() => setConAllan(null)}
        onSfida={() => setConAllan(partitaControAllan())}
        onApri={() => {}}
        onChiudi={() => setConAllan(null)}
      />
    )
  }

  if (stato === 'caricamento') return <Rotella />
  if (stato === 'guasto') {
    return (
      <div className="gioco-corpo">
        <p className="gioco-guasto">{errore}</p>
        <p className="dama-nota">
          Se è la prima volta: la Dama vuole il suo pezzo di database, si lancia{' '}
          <code>supabase/dama.sql</code> e si riapre.
        </p>
      </div>
    )
  }

  if (aperta) {
    return (
      <Scacchiera
        partita={aperta}
        partite={partite}
        membro={membro}
        nome={nome}
        onMuovi={muovi}
        onAbbandona={abbandona}
        onSfida={sfida}
        onApri={setApertaId}
        onChiudi={() => setApertaId(null)}
      />
    )
  }

  const mieAperte = inCorsoPerMe(partite, membro.id)
  const mieFinite = partite.filter(
    (p) => (p.bianco === membro.id || p.nero === membro.id) && comeEFinita(p).finita
  )
  const altrui = partite.filter((p) => p.bianco !== membro.id && p.nero !== membro.id)
  const avversari = Object.values(membri).filter((m) => m.id !== membro.id)
  const classifica = classificaDama(partite, Object.keys(membri)).filter(
    (r) => r.vinte + r.perse + r.patte > 0
  )

  async function lanciaSfida(avversarioId) {
    setAvviso(null)
    // Una partita aperta con la stessa persona si riapre, non si
    // raddoppia: due sfide parallele con lo stesso avversario sono quasi
    // sempre un dito scappato.
    const giaAperta = mieAperte.find(
      (p) => p.bianco === avversarioId || p.nero === avversarioId
    )
    if (giaAperta) {
      setApertaId(giaAperta.id)
      setSfidando(false)
      return
    }
    try {
      const nuova = await sfida(avversarioId)
      setApertaId(nuova.id)
      setSfidando(false)
    } catch (e) {
      setAvviso(e?.message ?? 'Non ha funzionato.')
    }
  }

  return (
    <div className="gioco-corpo dama">
      <h2 className="dama-titolo">Dama</h2>

      {/* L'azione principale, in grande e in cima: era un bottone
          grigetto di fianco al titolo, e sfidare qualcuno e' l'unica cosa
          che si viene a fare qui quando non hai partite aperte. */}
      <button type="button" className="dama-sfida" onClick={() => setSfidando((s) => !s)}>
        {sfidando ? 'Lascia stare' : '⚔ Sfida qualcuno'}
      </button>

      {/* Sotto la sfida vera e non sopra: l'avversario preferito resta una
          persona. Ma quando non c'è nessuno sveglio — in macchina, la
          mattina presto, in fila da qualche parte — questo è l'unico
          gioco a due che si può fare da soli. */}
      <button
        type="button"
        className="dama-allan"
        onClick={() => setConAllan(partitaControAllan())}
      >
        🤖 Gioca contro Allan
      </button>

      {sfidando && (
        <div className="dama-avversari">
          {avversari.map((m) => (
            <button
              key={m.id}
              type="button"
              className="dama-avversario"
              onClick={() => lanciaSfida(m.id)}
            >
              <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="34" height="34" />
              <span>{m.nome}</span>
            </button>
          ))}
          {avversari.length === 0 && <p className="dama-nota">Non c'è ancora nessuno da sfidare.</p>}
        </div>
      )}

      {avviso && <p className="dama-avviso">{avviso}</p>}

      {mieAperte.length > 0 && (
        <>
          <p className="dama-sezione">In corso</p>
          <ul className="dama-elenco">
            {mieAperte.map((p) => (
              <CartaPartita key={p.id} partita={p} ioId={membro.id} nome={nome} onApri={setApertaId} />
            ))}
          </ul>
        </>
      )}

      {/* Resta il fatto, va via il commento. Il ripasso di come sono
          fatti gli altri due giochi stava dentro la Dama, dove non serve
          a decidere niente: chi e' qui ha gia' scelto. */}
      {mieAperte.length === 0 && !sfidando && (
        <p className="dama-vuoto">Nessuna partita in corso.</p>
      )}

      {classifica.length > 0 && (
        <>
          <p className="dama-sezione">Rank</p>
          <ol className="dama-classifica">
            {classifica.map((r, i) => (
              <li key={r.id} className={r.id === membro.id ? 'dama-riga io' : 'dama-riga'}>
                <span className="dama-posto">{i + 1}</span>
                <span className="dama-chi">{nome(r.id)}</span>
                <span className="dama-conti">
                  <strong>{r.vinte}</strong> {r.vinte === 1 ? 'vinta' : 'vinte'}
                  {r.perse > 0 && ` · ${r.perse} perse`}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      {mieFinite.length > 0 && (
        <>
          <p className="dama-sezione">Finite</p>
          <ul className="dama-elenco">
            {mieFinite.slice(0, 5).map((p) => (
              <CartaPartita key={p.id} partita={p} ioId={membro.id} nome={nome} onApri={setApertaId} />
            ))}
          </ul>
        </>
      )}

      {altrui.length > 0 && (
        <>
          <p className="dama-sezione">Le partite degli altri</p>
          <ul className="dama-elenco">
            {altrui.slice(0, 5).map((p) => (
              <CartaPartita key={p.id} partita={p} ioId={membro.id} nome={nome} onApri={setApertaId} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

// Come raccontare una partita a chi la guarda. Sempre dal punto di vista
// di chi legge: "Hai vinto", non "Ha vinto Leo".
export function raccontaPartita(partita, ioId, nome) {
  const fine = comeEFinita(partita)
  const gioco = partita.bianco === ioId || partita.nero === ioId

  // ⚠️ Chi e' uscito e' uscito, e all'altro va detto — o gli resta la
  // scacchiera ferma per sempre, ad aspettare un turno che non arriva.
  // E' una notizia, non una punizione: la partita non conta per nessuno
  // dei due, non l'ha vinta nessuno, non entra in classifica.
  if (partita.stato === 'abbandonata') {
    const uscito = partita.abbandonataDa
    return {
      testo: uscito === ioId ? 'Sei uscito' : `${nome(uscito)} è uscito`,
      dettaglio: 'La partita non conta',
      verso: 'patta',
    }
  }

  if (!fine.finita) {
    const stato = ricostruisci(partita.mosse)
    const toccaId = stato.turno === BIANCO ? partita.bianco : partita.nero
    if (!gioco) return { testo: `Tocca a ${nome(toccaId)}`, verso: 'attesa' }
    return toccaId === ioId
      ? { testo: 'Tocca a te', verso: 'tua' }
      : { testo: `Tocca a ${nome(toccaId)}`, verso: 'attesa' }
  }

  if (fine.motivo === 'patta') return { testo: 'Patta', verso: 'patta' }

  // Qui ci arrivano solo le partite giocate fino in fondo: le
  // abbandonate se ne sono andate sopra, e non hanno un vincitore.
  if (!gioco) {
    return {
      testo: `${nome(fine.vincitore)} ha battuto ${nome(fine.perdente)}`,
      verso: 'finita',
    }
  }
  if (fine.vincitore === ioId) return { testo: 'Hai vinto', verso: 'vinta' }
  return { testo: `Ha vinto ${nome(fine.vincitore)}`, verso: 'persa' }
}

function CartaPartita({ partita, ioId, nome, onApri }) {
  const chi =
    partita.bianco === ioId
      ? `Tu contro ${nome(partita.nero)}`
      : partita.nero === ioId
        ? `Tu contro ${nome(partita.bianco)}`
        : `${nome(partita.bianco)} contro ${nome(partita.nero)}`
  const r = raccontaPartita(partita, ioId, nome)

  return (
    <li>
      <button
        type="button"
        className={r.verso === 'tua' ? 'dama-carta tocca' : 'dama-carta'}
        onClick={() => onApri(partita.id)}
      >
        <span className="dama-carta-chi">{chi}</span>
        <span className={`dama-carta-stato ${r.verso}`}>{r.testo}</span>
      </button>
    </li>
  )
}

// Esportata per poterla montare da sola con dati finti, come le altre
// schermate: la partita vera vuole due telefoni e un database.
export function Scacchiera({
  partita,
  partite,
  membro,
  nome,
  onMuovi,
  onAbbandona,
  onSfida,
  onApri,
  onChiudi,
  // Contro Allan: stessa scacchiera, ma non assegna punti e non scrive
  // niente da nessuna parte.
  allenamento = false,
}) {
  const [scelto, setScelto] = useState(null)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [confermaResa, setConfermaResa] = useState(false)

  // La scacchiera si rigioca dalle mosse a ogni disegno: è il modo in cui
  // due telefoni restano d'accordo senza fidarsi l'uno dell'altro.
  const stato = useMemo(() => ricostruisci(partita.mosse), [partita.mosse])
  const fine = comeEFinita(partita)

  const mioColore =
    partita.bianco === membro.id ? BIANCO : partita.nero === membro.id ? NERO : null
  const toccaAMe = !fine.finita && mioColore !== null && stato.turno === mioColore

  // I punti si assegnano quando la partita finisce, e li scrive chi la
  // vede finire: nessun server, come per tutto il resto. La chiave di
  // deduplica fa il resto se la vedono in due.
  useEffect(() => {
    // ⚠️ La riga che tiene onesta la classifica della Dama.
    //
    // Contro Allan non si prendono punti. Senza questa riga vincere
    // contro una macchina varrebbe quanto vincere contro una persona, e
    // il Trofeo lo prenderebbe chi ha più tempo libero. Sta per prima
    // apposta: qualunque cosa cambi qui sotto, questa resta davanti.
    if (allenamento) return
    if (!fine.finita || !fine.vincitore) return
    if (fine.vincitore !== membro.id) return
    if (!eLaPrimaVittoria(partite ?? [], membro.id, partita)) return
    dopoUnaVittoria(membro.id).catch(() => {})
  }, [allenamento, fine.finita, fine.vincitore, membro.id, partita, partite])

  const legali = useMemo(() => (toccaAMe ? mosseLegali(stato) : []), [toccaAMe, stato])
  const dalScelto = legali.filter((m) => m.da === scelto)

  // Il nero vede la scacchiera dal suo lato: i suoi pezzi in basso.
  const capovolta = mioColore === NERO
  const ordine = useMemo(() => {
    const indici = Array.from({ length: 64 }, (_, i) => i)
    return capovolta ? indici.reverse() : indici
  }, [capovolta])

  async function tocca(i) {
    if (!toccaAMe || inCorso) return
    setAvviso(null)

    const pezzo = stato.caselle[i]
    if (pezzo && pezzo.colore === mioColore) {
      setScelto(legali.some((m) => m.da === i) ? i : null)
      return
    }

    const mossa = dalScelto.find((m) => m.passi[m.passi.length - 1] === i)
    if (!mossa) return

    setInCorso(true)
    try {
      await onMuovi(partita, mossaInTesto(mossa))
      setScelto(null)
    } catch (e) {
      setAvviso(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  async function resa() {
    setInCorso(true)
    try {
      await onAbbandona(partita.id)
      // ⚠️ Niente penalità: alla Dama i punti si prendono vincendo, e
      // basta. La Legge XLIX resta scritta e spenta in `config/leggi.js`,
      // col perché. Una partita dopo cena si molla perché arriva da
      // mangiare, non per dispetto — e farla costare spinge a non
      // cominciarla, non a finirla.
      setConfermaResa(false)
    } catch (e) {
      setAvviso(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  async function rivincita() {
    setInCorso(true)
    setAvviso(null)
    try {
      // I colori si scambiano: chi era bianco fa il nero, e il vantaggio
      // della prima mossa gira da solo.
      // Contro Allan «rivincita» vuol dire una partita nuova e basta:
      // non c'è nessuno da sfidare e niente da scrivere.
      if (allenamento) {
        onSfida()
        return
      }
      const avversarioId = partita.bianco === membro.id ? partita.nero : partita.bianco
      const nuova = await onSfida(avversarioId, mioColore === BIANCO)
      onApri(nuova.id)
    } catch (e) {
      setAvviso(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  const arriviPossibili = new Set(dalScelto.map((m) => m.passi[m.passi.length - 1]))
  const racconto = raccontaPartita(partita, membro.id, nome)

  const conteggio = { bianco: 0, nero: 0 }
  for (const p of stato.caselle) if (p) conteggio[p.colore] += 1

  return (
    <div className="gioco-corpo dama">
      <header className="dama-testata">
        <button type="button" className="dama-indietro" onClick={onChiudi}>
          ‹ Partite
        </button>
        {!fine.finita && (
          <p className={racconto.verso === 'tua' ? 'dama-tocca a-me' : 'dama-tocca'}>
            {racconto.testo}
          </p>
        )}
      </header>

      {/* Come finisce una partita, detto forte. Prima era una riga di
          testo piccola accanto al tasto indietro, e da lì non si capiva
          che fosse finita: si restava a fissare una scacchiera che non
          rispondeva più. */}
      {fine.finita && (
        <div className={`dama-esito ${racconto.verso}`} role="status">
          <p className="dama-esito-titolo">{racconto.testo}</p>
          {racconto.dettaglio && <p className="dama-esito-dettaglio">{racconto.dettaglio}</p>}
        </div>
      )}

      <p className="dama-giocatori">
        <span className="dama-pallino bianco" /> {nome(partita.bianco)} ({conteggio.bianco})
        <span className="dama-contro">contro</span>
        <span className="dama-pallino nero" /> {nome(partita.nero)} ({conteggio.nero})
      </p>

      <div
        className={
          [
            'dama-tavola',
            inCorso ? 'in-corso' : '',
            fine.finita ? 'finita' : '',
          ]
            .filter(Boolean)
            .join(' ')
        }
      >
        {ordine.map((i) => {
          const pezzo = stato.caselle[i]
          const classi = ['dama-casella']
          if (casellaScura(i)) classi.push('scura')
          if (i === scelto) classi.push('scelta')
          if (arriviPossibili.has(i)) classi.push('arrivo')
          return (
            <button
              key={i}
              type="button"
              className={classi.join(' ')}
              onClick={() => tocca(i)}
              aria-label={`Casella ${i}`}
              disabled={!toccaAMe}
            >
              {pezzo && (
                <span
                  className={
                    pezzo.dama ? `dama-pezzo ${pezzo.colore} regina` : `dama-pezzo ${pezzo.colore}`
                  }
                />
              )}
            </button>
          )
        })}
      </div>

      {avviso && <p className="dama-avviso">{avviso}</p>}

      {fine.finita
        ? mioColore !== null && (
            <button type="button" className="dama-rivincita" onClick={rivincita} disabled={inCorso}>
              Rivincita
            </button>
          )
        : mioColore !== null &&
          (confermaResa ? (
            <div className="dama-resa-conferma">
              <p>Abbandoni? Vince l'altro. A te non costa niente.</p>
              <div>
                <button type="button" className="dama-resa si" onClick={resa} disabled={inCorso}>
                  Abbandona
                </button>
                <button type="button" className="dama-resa" onClick={() => setConfermaResa(false)}>
                  Lascia stare
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="dama-abbandona" onClick={() => setConfermaResa(true)}>
              Abbandona la partita
            </button>
          ))}
    </div>
  )
}
