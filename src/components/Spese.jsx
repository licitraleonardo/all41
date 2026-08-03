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
//
// Una pagina sola: quanto sei messo, come stanno tutti, e sotto la
// cronologia. Quello che si fa passa da due fogli — "Segna" sempre
// raggiungibile in fondo, e il foglio di una persona toccando la sua
// riga. Le sotto-schede erano struttura in più su una sezione che ha una
// cosa sola da dire.
export default function Spese({ membro }) {
  const conti = useSpese()
  const [foglio, setFoglio] = useState(null)

  const { stato, errore } = conti

  return (
    <div className="spese-schermo">
      {stato === 'caricamento' && <p className="spese-vuoto">Un attimo.</p>}
      {stato === 'guasto' && <p className="spese-guasto">{errore}</p>}

      {stato === 'pronto' && (
        <>
          <SaldoMio conti={conti} ioId={membro.id} />

          <h3 className="sezione">Come stanno tutti</h3>
          <ComeStannoTutti
            conti={conti}
            ioId={membro.id}
            onScegli={(id) => setFoglio({ tipo: 'persona', id })}
          />

          <Cronologia conti={conti} ioId={membro.id} />

          <button
            type="button"
            className="segna-fisso"
            onClick={() => setFoglio({ tipo: 'segna' })}
          >
            Segna una spesa
          </button>

          {foglio?.tipo === 'segna' && (
            <FoglioSpesa
              conti={conti}
              ioId={membro.id}
              onChiudi={() => setFoglio(null)}
            />
          )}

          {foglio?.tipo === 'persona' && (
            <FoglioPersona
              conti={conti}
              ioId={membro.id}
              personaId={foglio.id}
              onChiudi={() => setFoglio(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

function SaldoMio({ conti, ioId }) {
  const mio = conti.saldi[ioId] ?? 0

  return (
    <div className={mio < 0 ? 'saldo-mio devi' : 'saldo-mio'}>
      <span className="saldo-etichetta">
        {mio === 0 ? 'Sei in pari' : mio > 0 ? 'Devi ricevere' : 'Devi dare'}
      </span>
      {mio !== 0 && <strong className="saldo-cifra">{formattaEuro(Math.abs(mio))}</strong>}
    </div>
  )
}

function ComeStannoTutti({ conti, ioId, onScegli }) {
  const { membri, saldi, passaggi } = conti

  // Si apre solo quello che si può fare: il tuo, e quello di chi ha un
  // conto in sospeso con te. Gli altri restano righe da leggere — sapere
  // che Turi deve dei soldi a Leo non è una cosa su cui puoi agire.
  const apribile = (id) =>
    id === ioId ||
    passaggi.some(
      (p) => (p.da === ioId && p.a === id) || (p.a === ioId && p.da === id)
    )

  return (
    <ul className="saldi">
      {membri.map((m) => {
        const saldo = saldi[m.id] ?? 0
        const dentro = (
          <>
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
                saldo < 0
                  ? 'saldo-cifra-riga meno'
                  : saldo > 0
                    ? 'saldo-cifra-riga piu'
                    : 'saldo-cifra-riga'
              }
            >
              {saldo === 0 ? '—' : formattaEuro(saldo)}
            </span>
            {apribile(m.id) && (
              <span className="saldo-freccia" aria-hidden="true">
                ›
              </span>
            )}
          </>
        )

        const classe = m.id === ioId ? 'saldo-riga io' : 'saldo-riga'

        return (
          <li key={m.id}>
            {apribile(m.id) ? (
              <button type="button" className={classe} onClick={() => onScegli(m.id)}>
                {dentro}
              </button>
            ) : (
              <div className={classe}>{dentro}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Due elenchi e non uno: una spesa e un rimborso sono due cose diverse —
// una è un costo del viaggio, l'altro è un debito che si chiude — e
// mescolarle nella stessa colonna di importi fa leggere male entrambe.
function Cronologia({ conti, ioId }) {
  const { spese, rimborsi, membriPerId, togliSpesa, togliRimborso } = conti
  const [quale, setQuale] = useState('spese')
  const [inCorso, setInCorso] = useState(null)
  const [errore, setErrore] = useState(null)

  const totale = spese.reduce((s, x) => s + x.centesimi, 0)
  const nome = (id) => membriPerId[id]?.nome ?? 'Qualcuno'

  const leSpese = useMemo(
    () =>
      [...spese]
        .map((s) => ({ ...s, genere: 'spesa', quando: s.creataIl }))
        .sort((a, b) => b.quando.localeCompare(a.quando)),
    [spese]
  )

  const iRimborsi = useMemo(
    () =>
      [...rimborsi]
        .map((r) => ({ ...r, genere: 'rimborso', quando: r.creatoIl }))
        .sort((a, b) => b.quando.localeCompare(a.quando)),
    [rimborsi]
  )

  async function togli(riga) {
    setInCorso(riga.id)
    setErrore(null)
    try {
      if (riga.genere === 'spesa') await togliSpesa(riga.id)
      else await togliRimborso(riga.id)
    } catch (e) {
      // Senza rete non parte: dirlo, invece di lasciare la riga lì come
      // se il tocco non fosse arrivato.
      setErrore(descriviErrore(e))
    } finally {
      setInCorso(null)
    }
  }

  const eliminabile = (riga) =>
    riga.genere === 'spesa' ? riga.paganti.includes(ioId) : riga.da === ioId

  const bottoneElimina = (riga) =>
    // Chi ha messo i soldi può togliere la riga: se avete pagato in due,
    // basta che se ne accorga uno.
    eliminabile(riga) && (
      <button
        type="button"
        className="spesa-elimina"
        onClick={() => togli(riga)}
        disabled={inCorso === riga.id}
      >
        Elimina
      </button>
    )

  return (
    <>
      {/* Due schede accanto invece di due elenchi uno sotto l'altro: una
          spesa e un rimborso sono cose diverse, e in colonna il secondo
          elenco finiva comunque fuori schermo. */}
      <div className="segmenti cronologia-schede" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={quale === 'spese'}
          className={quale === 'spese' ? 'segmento attivo' : 'segmento'}
          onClick={() => setQuale('spese')}
        >
          Spese
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={quale === 'rimborsi'}
          className={quale === 'rimborsi' ? 'segmento attivo' : 'segmento'}
          onClick={() => setQuale('rimborsi')}
        >
          Rimborsi
        </button>
      </div>

      {errore && <p className="spese-guasto">{errore}</p>}

      {quale === 'spese' && (
        <>
          <p className="cronologia-totale">{formattaEuro(totale)} in tutto</p>

          {leSpese.length === 0 ? (
            <p className="spese-vuoto">Ancora nessuna spesa.</p>
          ) : (
            <ul className="spese-elenco">
              {leSpese.map((riga) => (
                <li key={riga.id} className="spesa">
                  <div className="spesa-testa">
                    <span className="spesa-descrizione">{riga.descrizione}</span>
                    <span className="spesa-importo">{formattaEuro(riga.centesimi)}</span>
                  </div>

                  <p className="spesa-sotto">
                    {nomiPaganti(riga.paganti, nome)} · divisa fra {riga.divisaFra.length} ·{' '}
                    {quando(riga.quando)}
                    {riga.divisaFra.includes(ioId) ? '' : ' · non tocca a te'}
                  </p>

                  {bottoneElimina(riga)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Un rimborso non è un costo del viaggio: è un debito che si
          chiude. Elenco suo, e fuori dal totale. */}
      {quale === 'rimborsi' && (
        <>
          {iRimborsi.length === 0 ? (
            <p className="spese-vuoto">Nessuno ha ancora restituito niente.</p>
          ) : (
            <ul className="spese-elenco">
              {iRimborsi.map((riga) => (
                <li key={riga.id} className="spesa rimborso">
                  <div className="spesa-testa">
                    <span className="spesa-descrizione">
                      {nome(riga.da)} <span aria-hidden="true">→</span> {nome(riga.a)}
                    </span>
                    <span className="spesa-importo">{formattaEuro(riga.centesimi)}</span>
                  </div>

                  <p className="spesa-sotto">{quando(riga.quando)}</p>

                  {bottoneElimina(riga)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}

// Tutto scritto dal punto di vista di chi guarda: "devi dare" e "ti deve
// dare", non "Turi → Leo". Chi apre l'app vuole sapere cosa tocca a lui,
// non leggere un tabellone in terza persona.
//
// Il tasto lo può premere chiunque dei due: se i contanti te li mette in
// mano lui, sei tu ad avere l'app aperta.
function FoglioPersona({ conti, ioId, personaId, onChiudi }) {
  const { passaggi, membriPerId, registraRimborso, saldi } = conti
  const persona = membriPerId[personaId]
  const nome = (id) => membriPerId[id]?.nome ?? 'Qualcuno'
  const io = personaId === ioId

  // Sul proprio foglio tutti i conti aperti; su quello di un altro solo
  // quello fra voi due, che è l'unico su cui puoi fare qualcosa.
  const miei = passaggi.filter((p) =>
    io
      ? p.da === ioId || p.a === ioId
      : (p.da === ioId && p.a === personaId) || (p.a === ioId && p.da === personaId)
  )

  const mio = saldi[ioId] ?? 0

  return (
    <div className="foglio-sfondo" role="dialog" aria-modal="true" aria-label={persona?.nome}>
      <div className="foglio foglio-alto">
        <h2 className="foglio-titolo">{io ? 'I tuoi conti' : persona?.nome}</h2>

        {io && (
          <p className="foglio-saldo">
            {mio === 0
              ? 'Sei in pari.'
              : mio > 0
                ? `In tutto devi ricevere ${formattaEuro(mio)}`
                : `In tutto devi dare ${formattaEuro(-mio)}`}
          </p>
        )}

        {miei.length === 0 && (
          <p className="spese-vuoto">
            {io ? 'Non devi dare né ricevere niente.' : `Fra te e ${persona?.nome} è tutto a posto.`}
          </p>
        )}

        {miei.map((p) => (
          <Salda
            key={`${p.da}-${p.a}`}
            passaggio={p}
            ioId={ioId}
            nome={nome}
            conNome={io}
            onRegistra={registraRimborso}
            onFatto={onChiudi}
          />
        ))}

        <button type="button" className="secondario-foglio" onClick={onChiudi}>
          Chiudi
        </button>
      </div>
    </div>
  )
}

// `conNome` distingue i due fogli: sul proprio serve sapere con chi è il
// conto, su quello di una persona il nome sta già in testata e ripeterlo
// a ogni riga è rumore.
function Salda({ passaggio, ioId, nome, conNome, onRegistra, onFatto }) {
  const [apri, setApri] = useState(false)
  const [importo, setImporto] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  const scritto = inCentesimi(importo)
  const centesimi = apri ? scritto : passaggio.centesimi
  const valido = centesimi !== null && centesimi > 0 && centesimi <= MAX_CENTESIMI

  const paghiTu = passaggio.da === ioId
  const altro = nome(paghiTu ? passaggio.a : passaggio.da)
  const quanto = formattaEuro(passaggio.centesimi)

  async function salda() {
    setInCorso(true)
    setErrore(null)
    try {
      await onRegistra({ da: passaggio.da, a: passaggio.a, centesimi })
      onFatto()
    } catch (e) {
      setErrore(descriviErrore(e))
      setInCorso(false)
    }
  }

  return (
    <div className="salda">
      <p className="salda-riga">
        {paghiTu ? (
          <>
            Devi dare <strong>{quanto}</strong>
            {conNome && <> a {altro}</>}
          </>
        ) : (
          <>
            {conNome ? `${altro} ti deve dare ` : 'Ti deve dare '}
            <strong>{quanto}</strong>
          </>
        )}
      </p>

      {apri && (
        <label className="campo">
          <span>Quanto è passato davvero</span>
          <input
            type="text"
            inputMode="decimal"
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            placeholder={quanto.replace(' €', '')}
          />
        </label>
      )}

      {errore && <p className="spese-guasto">{errore}</p>}

      <button
        type="button"
        className="primario-spese"
        onClick={salda}
        disabled={!valido || inCorso}
      >
        {inCorso ? 'Un attimo…' : `Salda ${formattaEuro(valido ? centesimi : passaggio.centesimi)}`}
      </button>

      {/* I contanti arrivano spesso a metà: "ti do cento dei centotrenta"
          è un fatto avvenuto quanto il resto, e va potuto registrare. */}
      {!apri && (
        <button type="button" className="riga-secondaria" onClick={() => setApri(true)}>
          {paghiTu ? 'Ne ho dati di meno' : 'Ne ha dati di meno'}
        </button>
      )}
    </div>
  )
}

function FoglioSpesa({ conti, ioId, onChiudi }) {
  const { membri, registra } = conti
  const [descrizione, setDescrizione] = useState('')
  const [importo, setImporto] = useState('')
  const [paganti, setPaganti] = useState([ioId])
  const [fra, setFra] = useState(() => membri.map((m) => m.id))
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  const centesimi = inCentesimi(importo)
  const tutti = useMemo(() => membri.map((m) => m.id), [membri])

  const fuoriScala = centesimi !== null && centesimi > MAX_CENTESIMI
  const valido =
    descrizione.trim().length > 0 &&
    centesimi !== null &&
    centesimi > 0 &&
    !fuoriScala &&
    paganti.length > 0 &&
    fra.length > 0

  const commuta = (metti) => (id) =>
    metti((precedenti) =>
      precedenti.includes(id) ? precedenti.filter((x) => x !== id) : [...precedenti, id]
    )

  async function segna() {
    setInCorso(true)
    setErrore(null)
    try {
      await registra({
        descrizione: descrizione.trim(),
        centesimi,
        paganti,
        divisaFra: fra,
      })
      onChiudi()
    } catch (e) {
      setErrore(descriviErrore(e))
      setInCorso(false)
    }
  }

  return (
    <div className="foglio-sfondo" role="dialog" aria-modal="true" aria-label="Nuova spesa">
      <div className="foglio foglio-alto">
        <h2 className="foglio-titolo">Nuova spesa</h2>

        <label className="campo">
          <span>Cosa</span>
          <input
            type="text"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            maxLength={MAX_DESCRIZIONE}
            placeholder="Spesa al supermercato"
          />
        </label>

        <label className="campo">
          <span>Quanto</span>
          <input
            type="text"
            inputMode="decimal"
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            placeholder="42,80"
          />
        </label>

        {fuoriScala && (
          <p className="spese-avviso">{formattaEuro(centesimi)}? Controlla la virgola.</p>
        )}

        {/* Stessa forma di "Divisa fra", perché è la stessa domanda: chi
            sono le persone. Prima era una riga che si apriva, e nel
            foglio che scorre non si capiva che l'elenco fosse comparso. */}
        <h3 className="sezione">
          Chi ha pagato
          <button
            type="button"
            className="sezione-azione"
            onClick={() => setPaganti(paganti.length === tutti.length ? [ioId] : tutti)}
          >
            {paganti.length === tutti.length ? 'Solo io' : 'Tutti'}
          </button>
        </h3>

        <div className="scelta-persone">
          {membri.map((m) => (
            <button
              key={m.id}
              type="button"
              className={paganti.includes(m.id) ? 'persona scelta' : 'persona'}
              onClick={() => commuta(setPaganti)(m.id)}
              aria-pressed={paganti.includes(m.id)}
            >
              <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="40" height="40" />
              <span>{m.id === ioId ? `${m.nome} (tu)` : m.nome}</span>
            </button>
          ))}
        </div>

        {/* In più di uno, l'importo si divide fra chi ha messo i soldi
            come si divide fra chi ha consumato: due divisioni dello
            stesso totale, quindi i conti restano in pari. */}
        {paganti.length > 1 && centesimi !== null && centesimi > 0 && !fuoriScala && (
          <p className="spese-quota">
            {centesimi % paganti.length === 0 ? '' : 'Circa '}
            {formattaEuro(Math.floor(centesimi / paganti.length))} messi a testa
          </p>
        )}

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
              onClick={() => commuta(setFra)(m.id)}
              aria-pressed={fra.includes(m.id)}
            >
              <img src={urlAvatar(m.avatarStyle, m.avatarSeed)} alt="" width="40" height="40" />
              <span>{m.id === ioId ? `${m.nome} (tu)` : m.nome}</span>
            </button>
          ))}
        </div>

        {centesimi !== null && centesimi > 0 && fra.length > 0 && !fuoriScala && (
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

        <button type="button" className="secondario-foglio" onClick={onChiudi}>
          Lascia stare
        </button>
      </div>
    </div>
  )
}

function quando(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

// In due si scrivono tutti e due; da tre in su il nome più lungo
// mangerebbe la riga, e chi sono di preciso si vede aprendo la spesa.
function nomiPaganti(ids, nome) {
  if (ids.length === 0) return 'Nessuno'
  if (ids.length === 1) return nome(ids[0])
  if (ids.length === 2) return `${nome(ids[0])} e ${nome(ids[1])}`
  return `${nome(ids[0])} e altri ${ids.length - 1}`
}
