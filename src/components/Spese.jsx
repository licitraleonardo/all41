import { useEffect, useMemo, useState } from 'react'
import './Spese.css'
import { urlAvatar } from '../config/avatar.js'
import { useSpese } from '../hooks/useSpese.js'
import { formattaEuro, inCentesimi } from '../lib/saldi.js'
import { MAX_CENTESIMI, MAX_DESCRIZIONE } from '../config/spese.js'
import { descriviErrore } from '../lib/errori.js'
import { tieniOccupato } from '../lib/aggiornamento.js'
import Rotella from './Rotella.jsx'
import Foglio from './Foglio.jsx'

// L'unica sezione fuori dal sistema punti e senza la voce di Allan: qui
// ci sono soldi veri di persone vere, e una battuta sul conto di
// qualcun altro non fa ridere nessuno. Testi asciutti, e basta.
//
// Una pagina sola: quanto sei messo, come stanno tutti, e sotto la
// cronologia. Quello che si fa passa da due fogli — "Segna" sempre
// raggiungibile in fondo, e il foglio di una persona toccando la sua
// riga. Le sotto-schede erano struttura in più su una sezione che ha una
// cosa sola da dire.
// `senzaCornice` quando vive dentro il tab Altro, che la schermata la
// mette già lui: due padding annidati raddoppierebbero i margini e
// spingerebbero il contenuto a metà pagina.
export default function Spese({ membro, senzaCornice = false }) {
  const conti = useSpese(membro.id)
  const [foglio, setFoglio] = useState(null)

  const { stato, errore } = conti

  return (
    <div className={senzaCornice ? 'spese-dentro' : 'spese-schermo'}>
      {stato === 'caricamento' && <Rotella />}
      {stato === 'guasto' && <p className="spese-guasto">{errore}</p>}

      {stato === 'pronto' && (
        <>
          <SaldoMio
            conti={conti}
            ioId={membro.id}
            onApri={() => setFoglio({ tipo: 'persona', id: membro.id })}
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

// Il proprio saldo, e si tocca per aprire i conti aperti.
//
// Sotto c'era l'elenco di tutti con il saldo di ciascuno, e sembrava una
// classifica: chi sta in alto e chi in basso, in una sezione che parla di
// soldi fra amici. E non era nemmeno utile — sapere che Turi deve dei
// soldi a Leo non e' una cosa su cui puoi agire. Adesso si vede solo
// quello che ti riguarda: a chi devi dare e chi deve dare a te.
function SaldoMio({ conti, ioId, onApri }) {
  const mio = conti.saldi[ioId] ?? 0
  const quanti = conti.passaggi.filter((p) => p.da === ioId || p.a === ioId).length

  return (
    <button
      type="button"
      className={mio < 0 ? 'saldo-mio devi' : 'saldo-mio'}
      onClick={onApri}
      disabled={quanti === 0}
    >
      {/* Il verso e la cifra da una parte, l'azione dall'altra: sono due
          cose diverse — quanto sei messo, e cosa puoi farci. */}
      <span className="saldo-quanto">
        <span className="saldo-etichetta">
          {mio === 0 ? 'Sei in pari' : mio > 0 ? 'Devi ricevere' : 'Devi dare'}
        </span>
        {/* ⚠️ Niente «−» davanti alla cifra. C'era stato messo perché il
            verso viveva solo nel colore, e il colore non si legge ad alta
            voce. Ma sopra la cifra c'è già scritto «Devi dare» a lettere
            piene: il meno ripeteva una cosa già detta, e su un numero da
            28px sembrava piuttosto un errore di battitura. */}
        {mio !== 0 && <strong className="saldo-cifra">{formattaEuro(Math.abs(mio))}</strong>}
      </span>

      {/* «Conti aperti» descriveva uno stato; «Salda» dice cosa si può
          fare toccando. Sta a destra, dove va a finire il pollice e dove
          l'occhio cerca l'azione. */}
      {quanti > 0 && <span className="saldo-apri">Salda ›</span>}
    </button>
  )
}

// Due elenchi e non uno: una spesa e un rimborso sono due cose diverse —
// una è un costo del viaggio, l'altro è un debito che si chiude — e
// mescolarle nella stessa colonna di importi fa leggere male entrambe.
function Cronologia({ conti, ioId }) {
  const { spese, rimborsi, membriPerId, togliSpesa, togliRimborso } = conti
  const [quale, setQuale] = useState('spese')
  const [inCorso, setInCorso] = useState(null)
  // Quale riga è armata per l'eliminazione. Si disarma da sola dopo tre
  // secondi, come la × dell'album: un bottone rimasto acceso a metà, in
  // tasca, sarebbe peggio del problema che risolve.
  const [armato, setArmato] = useState(null)

  useEffect(() => {
    if (!armato) return undefined
    const timer = setTimeout(() => setArmato(null), 3000)
    return () => clearTimeout(timer)
  }, [armato])
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
    //
    // Armato in due tempi, come la × dell'album: qui però pesa di più.
    // Una foto persa è una foto; una spesa da 240 euro che sparisce dai
    // telefoni di tutti, senza conferma e senza modo di rimetterla, la
    // si scopre la sera del 16 facendo i conti — e a quel punto nessuno
    // sa più cosa mancava.
    eliminabile(riga) && (
      <button
        type="button"
        className={armato === riga.id ? 'spesa-elimina armato' : 'spesa-elimina'}
        onClick={() => (armato === riga.id ? togli(riga) : setArmato(riga.id))}
        disabled={inCorso === riga.id}
      >
        {inCorso === riga.id ? 'Elimino…' : armato === riga.id ? 'Sicuro? Tocca ancora' : 'Elimina'}
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
  const { passaggi, membriPerId, registraRimborso, saldi, dettaglio } = conti
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
  const dare = miei.filter((p) => p.da === ioId)
  const avere = miei.filter((p) => p.a === ioId)

  return (
    <Foglio etichetta={persona?.nome ?? 'I tuoi conti'} onChiudi={onChiudi} className="foglio-alto">
      <>
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

        {/* ⚠️ Il «da dove viene». Il numero qui sopra è il saldo NETTO dopo
            che tutte le spese si sono compensate, non la propria parte di
            una cena: con due spese incrociate non assomiglia più a nessuna
            divisione rifacibile a mente, e un numero che non sai rifare —
            sui soldi — vale come un numero sbagliato. È successo a chi
            l'app l'ha scritta. Le righe sommano esattamente al saldo, e c'è
            una prova che lo tiene fermo. */}
        {io && dettaglio.length > 0 && (
          <details className="saldo-dettaglio">
            <summary>Da dove viene</summary>
            <ul>
              {dettaglio.map((r) => (
                <li key={`${r.genere}-${r.id}`}>
                  <span>
                    {r.genere === 'rimborso'
                      ? `${r.hoDato ? 'Hai dato a' : 'Ti ha dato'} ${nome(r.altro)}`
                      : `${r.descrizione} — ${formattaEuro(r.totale)} in ${r.inQuanti}`}
                  </span>
                  <strong className={r.centesimi < 0 ? 'in-meno' : 'in-piu'}>
                    {r.centesimi > 0 ? '+' : '−'}
                    {formattaEuro(Math.abs(r.centesimi))}
                  </strong>
                </li>
              ))}
            </ul>
            <p className="saldo-dettaglio-totale">
              In tutto <strong>{mio < 0 ? '−' : ''}{formattaEuro(Math.abs(mio))}</strong>
            </p>
          </details>
        )}

        {miei.length === 0 && (
          <p className="spese-vuoto">
            {io ? 'Non devi dare né ricevere niente.' : `Fra te e ${persona?.nome} è tutto a posto.`}
          </p>
        )}

        {/* Due elenchi separati: quello che devi tirare fuori dal
            portafoglio e quello che ti deve rientrare sono due cose
            diverse, e mescolarle costringe a leggere ogni riga per capire
            da che parte sta. */}
        {dare.length > 0 && (
          <>
            <p className="foglio-gruppo">A chi devi dare</p>
            {dare.map((p) => (
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
          </>
        )}

        {avere.length > 0 && (
          <>
            <p className="foglio-gruppo">Chi deve dare a te</p>
            {avere.map((p) => (
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
          </>
        )}

        <button type="button" className="secondario-foglio" onClick={onChiudi}>
          Chiudi
        </button>
      </>
    </Foglio>
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
  const [conferma, setConferma] = useState(null)

  // ⚠️ L'importo si congela alla prima volta che si guarda, e non si
  // rilegge da `passaggio` a ogni disegno.
  //
  // `passaggio` viene da `chiDeveAChi`, che si ricalcola a ogni riga nuova
  // che arriva dal realtime. Con la scheda aperta, qualcuno che segna una
  // cena dall'altra parte del tavolo cambiava il numero **mentre lo stavi
  // leggendo**: toccavi «Salda 30,00» e ne registravi 75, perché quello che
  // parte era `passaggio.centesimi` di adesso e non quello di un attimo
  // prima. Un rimborso è un fatto e non si revoca: quei 45 € restavano
  // spostati fra due persone.
  const [congelato] = useState(passaggio.centesimi)
  const cambiato = passaggio.centesimi !== congelato

  const scritto = inCentesimi(importo)
  const centesimi = apri ? scritto : congelato
  const valido = centesimi !== null && centesimi > 0 && centesimi <= MAX_CENTESIMI

  const paghiTu = passaggio.da === ioId
  const altro = nome(paghiTu ? passaggio.a : passaggio.da)
  const quanto = formattaEuro(congelato)

  // Due tempi: il primo tocco dice cosa sta per succedere, il secondo lo
  // fa. Sui soldi la conferma non è un fastidio — è l'unico punto in cui si
  // legge, prima che diventi un fatto, la frase «X → Y, tot euro».
  async function salda() {
    if (conferma === null) {
      setConferma(centesimi)
      return
    }
    setInCorso(true)
    setErrore(null)
    try {
      await onRegistra({ da: passaggio.da, a: passaggio.a, centesimi: conferma })
      onFatto()
    } catch (e) {
      setErrore(descriviErrore(e))
      setInCorso(false)
      setConferma(null)
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

      {/* Se il conto è cambiato mentre la scheda era aperta lo si dice,
          invece di far partire il numero vecchio in silenzio o di
          sostituirlo sotto il dito. */}
      {cambiato && (
        <p className="salda-cambiato" role="status">
          Nel frattempo il conto è cambiato: adesso sarebbe{' '}
          <strong>{formattaEuro(passaggio.centesimi)}</strong>. Chiudi e riapri se
          vuoi quello aggiornato.
        </p>
      )}

      {errore && <p className="spese-guasto">{errore}</p>}

      <button
        type="button"
        className="primario-spese"
        onClick={salda}
        disabled={!valido || inCorso}
      >
        {inCorso
          ? 'Un attimo…'
          : conferma !== null
            ? `Sicuro? ${paghiTu ? 'Hai dato' : 'Ti ha dato'} ${formattaEuro(conferma)} ${paghiTu ? 'a' : ''} ${paghiTu ? altro : ''}`.trim()
            : `Salda ${formattaEuro(valido ? centesimi : congelato)}`}
      </button>

      {conferma !== null && !inCorso && (
        <button
          type="button"
          className="riga-secondaria"
          onClick={() => setConferma(null)}
        >
          No, aspetta
        </button>
      )}

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

  // Finché questo foglio è aperto l'app non si ricarica da sola. È il
  // posto dove si perde di più: descrizione, importo, chi ha pagato e
  // divisa fra chi sono quattro cose da rimettere, e sparivano senza un
  // messaggio quando arrivava una versione nuova.
  useEffect(() => tieniOccupato('foglio-spesa'), [])

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
    <Foglio
      etichetta="Nuova spesa"
      sporco={descrizione.trim().length > 0 || importo.trim().length > 0}
      onChiudi={inCorso ? undefined : onChiudi}
      className="foglio-alto"
    >
      <>
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
      </>
    </Foglio>
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
