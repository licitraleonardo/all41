import { useMemo, useState } from 'react'
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
import { urlAvatar } from '../config/avatar.js'
import Rotella from './Rotella.jsx'

// La Dama: si sfida una persona, un telefono per uno. La scacchiera vera
// è la lista delle mosse sul database; qui si rigioca e si disegna.
// Chi non gioca può guardare: una partita a dama dopo cena ha sempre
// il capannello intorno.
export default function Dama({ membro, membri }) {
  const { partite, stato, errore, sfida, muovi, abbandona } = useDama(membro.id)
  const [apertaId, setApertaId] = useState(null)
  const [sfidando, setSfidando] = useState(false)
  const [avviso, setAvviso] = useState(null)

  const nome = (id) => membri[id]?.nome ?? 'Qualcuno'
  const aperta = partite.find((p) => p.id === apertaId) ?? null

  if (stato === 'caricamento') return <Rotella />
  if (stato === 'guasto') {
    return (
      <div className="gioco-corpo">
        <p className="gioco-guasto">{errore}</p>
        <p className="dama-nota">
          Se è la prima volta: la Dama vuole il suo pezzo di database, si
          lancia <code>supabase/dama.sql</code> e si riapre.
        </p>
      </div>
    )
  }

  if (aperta) {
    return (
      <Scacchiera
        partita={aperta}
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

  const mie = partite.filter((p) => p.bianco === membro.id || p.nero === membro.id)
  const altrui = partite.filter((p) => p.bianco !== membro.id && p.nero !== membro.id)
  const avversari = Object.values(membri).filter((m) => m.id !== membro.id)

  async function lanciaSfida(avversarioId) {
    setAvviso(null)
    // Una partita aperta con la stessa persona si riapre, non si
    // raddoppia: due sfide parallele con lo stesso avversario sono
    // quasi sempre un dito scappato.
    const giaAperta = mie.find(
      (p) =>
        p.stato === 'in-corso' &&
        !esito(ricostruisci(p.mosse)).finita &&
        (p.bianco === avversarioId || p.nero === avversarioId)
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
      <header className="dama-testata">
        <h2 className="dama-titolo">Dama</h2>
        <button type="button" className="dama-sfida" onClick={() => setSfidando((s) => !s)}>
          {sfidando ? 'Lascia stare' : 'Sfida qualcuno'}
        </button>
      </header>

      {sfidando && (
        <div className="dama-avversari">
          {avversari.map((m) => (
            <button
              key={m.id}
              type="button"
              className="dama-avversario"
              onClick={() => lanciaSfida(m.id)}
            >
              <img src={urlAvatar(m)} alt="" width="34" height="34" />
              <span>{m.nome}</span>
            </button>
          ))}
          {avversari.length === 0 && <p className="dama-nota">Non c'è ancora nessuno da sfidare.</p>}
        </div>
      )}

      {avviso && <p className="dama-avviso">{avviso}</p>}

      {mie.length === 0 && !sfidando && (
        <p className="dama-vuoto">
          Nessuna partita. L'Impostore è di gruppo, All gioca da solo: questa si
          gioca in due.
        </p>
      )}

      {mie.length > 0 && (
        <ul className="dama-elenco">
          {mie.map((p) => (
            <CartaPartita key={p.id} partita={p} ioId={membro.id} nome={nome} onApri={setApertaId} />
          ))}
        </ul>
      )}

      {altrui.length > 0 && (
        <>
          <p className="dama-sezione">Le partite degli altri</p>
          <ul className="dama-elenco">
            {altrui.map((p) => (
              <CartaPartita key={p.id} partita={p} ioId={membro.id} nome={nome} onApri={setApertaId} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function descriviPartita(partita, ioId, nome) {
  const stato = ricostruisci(partita.mosse)
  const fine = esito(stato)
  const gioco = partita.bianco === ioId || partita.nero === ioId

  if (partita.stato === 'abbandonata') {
    return partita.abbandonataDa === ioId
      ? 'Hai abbandonato'
      : `${nome(partita.abbandonataDa)} ha abbandonato`
  }
  if (fine.finita) {
    if (fine.vincitore === null) return 'Patta'
    const vincitoreId = fine.vincitore === BIANCO ? partita.bianco : partita.nero
    if (!gioco) return `Ha vinto ${nome(vincitoreId)}`
    return vincitoreId === ioId ? 'Hai vinto' : 'Hai perso'
  }
  const toccaId = stato.turno === BIANCO ? partita.bianco : partita.nero
  if (!gioco) return `Tocca a ${nome(toccaId)}`
  return toccaId === ioId ? 'Tocca a te' : `Tocca a ${nome(toccaId)}`
}

function CartaPartita({ partita, ioId, nome, onApri }) {
  const chi =
    partita.bianco === ioId
      ? `Tu contro ${nome(partita.nero)}`
      : partita.nero === ioId
        ? `Tu contro ${nome(partita.bianco)}`
        : `${nome(partita.bianco)} contro ${nome(partita.nero)}`
  const dove = descriviPartita(partita, ioId, nome)
  const daMe = dove === 'Tocca a te'

  return (
    <li>
      <button type="button" className="dama-carta" onClick={() => onApri(partita.id)}>
        <span className="dama-carta-chi">{chi}</span>
        <span className={daMe ? 'dama-carta-stato tocca' : 'dama-carta-stato'}>{dove}</span>
      </button>
    </li>
  )
}

// Esportata per poterla montare da sola con dati finti, come le altre
// schermate: la partita vera vuole due telefoni e un database.
export function Scacchiera({ partita, membro, nome, onMuovi, onAbbandona, onSfida, onApri, onChiudi }) {
  const [scelto, setScelto] = useState(null)
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  const [confermaResa, setConfermaResa] = useState(false)

  // La scacchiera si rigioca dalle mosse a ogni render: è il modo in cui
  // due telefoni restano d'accordo senza fidarsi l'uno dell'altro.
  const stato = useMemo(() => ricostruisci(partita.mosse), [partita.mosse])
  const fine = esito(stato)

  const mioColore =
    partita.bianco === membro.id ? BIANCO : partita.nero === membro.id ? NERO : null
  const chiusa = partita.stato === 'abbandonata' || fine.finita
  const toccaAMe = !chiusa && mioColore !== null && stato.turno === mioColore

  const legali = useMemo(
    () => (toccaAMe ? mosseLegali(stato) : []),
    [toccaAMe, stato]
  )
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
  const titolo = descriviPartita(partita, membro.id, nome)

  const conteggio = { bianco: 0, nero: 0 }
  for (const p of stato.caselle) if (p) conteggio[p.colore] += 1

  return (
    <div className="gioco-corpo dama">
      <header className="dama-testata">
        <button type="button" className="dama-indietro" onClick={onChiudi}>
          ‹ Partite
        </button>
        <p className={titolo === 'Tocca a te' ? 'dama-tocca a-me' : 'dama-tocca'}>{titolo}</p>
      </header>

      <p className="dama-giocatori">
        <span className="dama-pallino bianco" /> {nome(partita.bianco)} ({conteggio.bianco})
        <span className="dama-contro">contro</span>
        <span className="dama-pallino nero" /> {nome(partita.nero)} ({conteggio.nero})
      </p>

      <div className={inCorso ? 'dama-tavola in-corso' : 'dama-tavola'}>
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

      {chiusa ? (
        mioColore !== null && (
          <button type="button" className="dama-rivincita" onClick={rivincita} disabled={inCorso}>
            Rivincita
          </button>
        )
      ) : (
        mioColore !== null &&
        (confermaResa ? (
          <div className="dama-resa-conferma">
            <p>Abbandoni? L'altro vince.</p>
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
        ))
      )}
    </div>
  )
}
