import { useMemo, useState } from 'react'
import './Spese.css'
import { urlAvatar } from '../config/avatar.js'
import { useSpese } from '../hooks/useSpese.js'
import { formattaEuro, inCentesimi } from '../lib/saldi.js'
import { MAX_CENTESIMI, MAX_DESCRIZIONE } from '../config/spese.js'
import { descriviErrore } from '../lib/errori.js'

// L'unica sezione fuori dal sistema punti e senza la voce di Allan: qui
// ci sono soldi veri di persone vere, e una battuta sul conto di
// qualcun altro non fa ridere nessuno. Testi asciutti, e basta.
export default function Spese({ membro }) {
  const conti = useSpese()
  const [vista, setVista] = useState('elenco')

  return (
    <div className="spese-schermo">
      <div className="segmenti" role="tablist">
        {[
          ['elenco', 'Spese'],
          ['conti', 'Conti'],
          ['aggiungi', 'Aggiungi'],
        ].map(([id, etichetta]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            className={vista === id ? 'segmento attivo' : 'segmento'}
            onClick={() => setVista(id)}
          >
            {etichetta}
          </button>
        ))}
      </div>

      {conti.stato === 'caricamento' && <p className="spese-vuoto">Un attimo.</p>}
      {conti.stato === 'guasto' && <p className="spese-guasto">{conti.errore}</p>}

      {conti.stato === 'pronto' && vista === 'elenco' && (
        <Elenco conti={conti} ioId={membro.id} />
      )}
      {conti.stato === 'pronto' && vista === 'conti' && (
        <Conti conti={conti} ioId={membro.id} />
      )}
      {conti.stato === 'pronto' && vista === 'aggiungi' && (
        <Aggiungi
          conti={conti}
          ioId={membro.id}
          onFatto={() => setVista('elenco')}
        />
      )}
    </div>
  )
}

function Elenco({ conti, ioId }) {
  const { spese, membriPerId, togliSpesa } = conti
  const [inCorso, setInCorso] = useState(null)
  const [errore, setErrore] = useState(null)

  const totale = spese.reduce((s, x) => s + x.centesimi, 0)
  const nome = (id) => membriPerId[id]?.nome ?? 'Qualcuno'

  async function togli(id) {
    setInCorso(id)
    setErrore(null)
    try {
      await togliSpesa(id)
    } catch (e) {
      // Senza rete l'eliminazione non parte: dirlo, invece di lasciare la
      // riga lì come se il tocco non fosse arrivato.
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(null)
    }
  }

  if (spese.length === 0) {
    return <p className="spese-vuoto">Ancora nessuna spesa.</p>
  }

  return (
    <div className="spese-corpo">
      <p className="spese-totale">
        <span>Totale del viaggio</span>
        <strong>{formattaEuro(totale)}</strong>
      </p>

      {errore && <p className="spese-guasto">{errore}</p>}

      <ul className="spese-elenco">
        {spese.map((s) => (
          <li key={s.id} className="spesa">
            <div className="spesa-testa">
              <span className="spesa-descrizione">{s.descrizione}</span>
              <span className="spesa-importo">{formattaEuro(s.centesimi)}</span>
            </div>
            <p className="spesa-sotto">
              {nome(s.pagataDa)} · divisa fra {s.divisaFra.length} · {quando(s.creataIl)}
              {s.divisaFra.includes(ioId) ? '' : ' · non tocca a te'}
            </p>
            {s.pagataDa === ioId && (
              <button
                type="button"
                className="spesa-elimina"
                onClick={() => togli(s.id)}
                disabled={inCorso === s.id}
              >
                Elimina
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function quando(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

function Conti({ conti, ioId }) {
  const { saldi, passaggi, membriPerId, rimborsi, membri, registraRimborso, togliRimborso } =
    conti
  const [erroreTogli, setErroreTogli] = useState(null)

  const nome = (id) => membriPerId[id]?.nome ?? 'Qualcuno'
  const mio = saldi[ioId] ?? 0

  function togli(id) {
    setErroreTogli(null)
    togliRimborso(id).catch((e) => setErroreTogli(descriviErrore(e)))
  }

  return (
    <div className="spese-corpo">
      <div className={mio < 0 ? 'saldo-mio devi' : 'saldo-mio'}>
        <span className="saldo-etichetta">
          {mio === 0 ? 'Sei in pari' : mio > 0 ? 'Devi ricevere' : 'Devi dare'}
        </span>
        {mio !== 0 && (
          <strong className="saldo-cifra">{formattaEuro(Math.abs(mio))}</strong>
        )}
      </div>

      <h3 className="sezione">Come stanno tutti</h3>
      <ul className="saldi">
        {membri.map((m) => {
          const saldo = saldi[m.id] ?? 0
          return (
            <li key={m.id} className={m.id === ioId ? 'saldo-riga io' : 'saldo-riga'}>
              <img
                className="saldo-avatar"
                src={urlAvatar(m.avatarStyle, m.avatarSeed)}
                alt=""
                width="30"
                height="30"
              />
              <span className="saldo-nome">{m.nome}</span>
              <span
                className={
                  saldo < 0 ? 'saldo-cifra-riga meno' : saldo > 0 ? 'saldo-cifra-riga piu' : 'saldo-cifra-riga'
                }
              >
                {saldo === 0 ? '—' : formattaEuro(saldo)}
              </span>
            </li>
          )
        })}
      </ul>

      <h3 className="sezione">Chi deve a chi</h3>
      {passaggi.length === 0 ? (
        <p className="spese-vuoto">Nessuno deve niente a nessuno.</p>
      ) : (
        <ul className="passaggi">
          {passaggi.map((p) => (
            <li key={`${p.da}-${p.a}`} className="passaggio">
              <span>
                <strong>{nome(p.da)}</strong> → <strong>{nome(p.a)}</strong>
              </span>
              <span className="passaggio-importo">{formattaEuro(p.centesimi)}</span>
            </li>
          ))}
        </ul>
      )}

      <SegnaRimborso
        membri={membri}
        ioId={ioId}
        onRegistra={registraRimborso}
      />

      {rimborsi.length > 0 && (
        <>
          <h3 className="sezione">Rimborsi registrati</h3>
          {erroreTogli && <p className="spese-guasto">{erroreTogli}</p>}
          <ul className="passaggi">
            {rimborsi.map((r) => (
              <li key={r.id} className="passaggio">
                <span>
                  {nome(r.da)} → {nome(r.a)}
                </span>
                <span className="passaggio-importo">{formattaEuro(r.centesimi)}</span>
                {r.da === ioId && (
                  <button
                    type="button"
                    className="spesa-elimina"
                    onClick={() => togli(r.id)}
                  >
                    Elimina
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

// "Ti ho dato 12€ in contanti ieri" è un fatto avvenuto, non lo stato di
// una riga calcolata: si registra, e il debito sparisce da solo.
function SegnaRimborso({ membri, ioId, onRegistra }) {
  const [a, setA] = useState(null)
  const [importo, setImporto] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  const centesimi = inCentesimi(importo)
  const valido = a && centesimi !== null && centesimi > 0 && centesimi <= MAX_CENTESIMI

  async function segna() {
    setInCorso(true)
    setErrore(null)
    try {
      await onRegistra({ da: ioId, a, centesimi })
      setImporto('')
      setA(null)
    } catch (e) {
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <>
      <h3 className="sezione">Ho restituito dei soldi</h3>
      <div className="scelta-persone">
        {membri
          .filter((m) => m.id !== ioId)
          .map((m) => (
            <button
              key={m.id}
              type="button"
              className={m.id === a ? 'persona scelta' : 'persona'}
              onClick={() => setA(m.id === a ? null : m.id)}
              aria-pressed={m.id === a}
            >
              <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="40" height="40" />
              <span>{m.nome}</span>
            </button>
          ))}
      </div>

      <label className="campo-chiaro">
        <span>Quanto</span>
        <input
          type="text"
          inputMode="decimal"
          value={importo}
          onChange={(e) => setImporto(e.target.value)}
          placeholder="12,50"
        />
      </label>

      {errore && <p className="spese-guasto">{errore}</p>}

      <button
        type="button"
        className="primario-spese"
        onClick={segna}
        disabled={!valido || inCorso}
      >
        {inCorso ? 'Un attimo…' : 'Segna il rimborso'}
      </button>
    </>
  )
}

function Aggiungi({ conti, ioId, onFatto }) {
  const { membri, registra } = conti
  const [descrizione, setDescrizione] = useState('')
  const [importo, setImporto] = useState('')
  const [pagataDa, setPagataDa] = useState(ioId)
  const [fra, setFra] = useState(() => membri.map((m) => m.id))
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  const centesimi = inCentesimi(importo)
  const tutti = useMemo(() => membri.map((m) => m.id), [membri])

  const importoFuoriScala = centesimi !== null && centesimi > MAX_CENTESIMI
  const valido =
    descrizione.trim().length > 0 &&
    centesimi !== null &&
    centesimi > 0 &&
    !importoFuoriScala &&
    fra.length > 0

  function commuta(id) {
    setFra((precedenti) =>
      precedenti.includes(id) ? precedenti.filter((x) => x !== id) : [...precedenti, id]
    )
  }

  async function segna() {
    setInCorso(true)
    setErrore(null)
    try {
      await registra({
        descrizione: descrizione.trim(),
        centesimi,
        pagataDa,
        divisaFra: fra,
      })
      onFatto()
    } catch (e) {
      setErrore(descriviErrore(e))
      setInCorso(false)
    }
  }

  return (
    <div className="spese-corpo">
      <label className="campo-chiaro">
        <span>Cosa</span>
        <input
          type="text"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          maxLength={MAX_DESCRIZIONE}
          placeholder="Spesa al supermercato"
        />
      </label>

      <label className="campo-chiaro">
        <span>Quanto</span>
        <input
          type="text"
          inputMode="decimal"
          value={importo}
          onChange={(e) => setImporto(e.target.value)}
          placeholder="42,80"
        />
      </label>

      {importoFuoriScala && (
        <p className="spese-avviso">
          {formattaEuro(centesimi)}? Controlla la virgola.
        </p>
      )}

      <h3 className="sezione">Chi ha pagato</h3>
      <div className="scelta-persone">
        {membri.map((m) => (
          <button
            key={m.id}
            type="button"
            className={m.id === pagataDa ? 'persona scelta' : 'persona'}
            onClick={() => setPagataDa(m.id)}
            aria-pressed={m.id === pagataDa}
          >
            <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="40" height="40" />
            <span>{m.id === ioId ? `${m.nome} (tu)` : m.nome}</span>
          </button>
        ))}
      </div>

      <h3 className="sezione">
        Divisa fra
        <button
          type="button"
          className="sezione-azione"
          onClick={() => setFra(fra.length === tutti.length ? [] : tutti)}
        >
          {fra.length === tutti.length ? 'Nessuno' : 'Tutti'}
        </button>
      </h3>
      <div className="scelta-persone">
        {membri.map((m) => (
          <button
            key={m.id}
            type="button"
            className={fra.includes(m.id) ? 'persona scelta' : 'persona'}
            onClick={() => commuta(m.id)}
            aria-pressed={fra.includes(m.id)}
          >
            <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="40" height="40" />
            <span>{m.id === ioId ? `${m.nome} (tu)` : m.nome}</span>
          </button>
        ))}
      </div>

      {centesimi !== null && centesimi > 0 && fra.length > 0 && !importoFuoriScala && (
        <p className="spese-quota">
          {centesimi % fra.length === 0 ? '' : 'Circa '}
          {formattaEuro(Math.floor(centesimi / fra.length))} a testa
        </p>
      )}

      {errore && <p className="spese-guasto">{errore}</p>}

      <button
        type="button"
        className="primario-spese"
        onClick={segna}
        disabled={!valido || inCorso}
      >
        {inCorso ? 'Un attimo…' : 'Segna'}
      </button>
    </div>
  )
}
