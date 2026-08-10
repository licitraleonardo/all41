import { useState } from 'react'
import { urlAvatar } from '../config/avatar.js'
import { dataDiOggi, statoDelViaggio } from '../lib/giorni.js'
import { magliaNeraDelGiorno, mvpDelGiorno, saldiDelGiorno } from '../lib/classifica.js'
import Proposta from './Proposta.jsx'
import PropostaInAttesa from './PropostaInAttesa.jsx'
import Foglio from './Foglio.jsx'

export default function Classifica({
  classifica,
  eventi,
  diOggi = [],
  ioId,
  proposteAperte = [],
  onVotaProposta,
  onCrea,
  inCorso,
  errore,
  conteggiMvp = {},
}) {
  const oggi = dataDiOggi()
  // ⚠️ `diOggi` e non `eventi`. `eventi` sono gli ultimi quaranta del
  // VIAGGIO: dopo una serata piena, chi aveva preso i punti in mattinata
  // usciva dalla finestra e spariva dal conto, e la corona andava a chi
  // aveva fatto qualcosa nell'ultima ora. La mattina dopo `chiudiGiornate`
  // — che legge la giornata intera — ne scriveva un altro, e le due
  // schermate raccontavano due vincitori diversi per lo stesso giorno.
  //
  // Il ripiego su `eventi` serve solo finché la lettura di oggi non è
  // tornata: meglio un conto parziale per un istante che una card vuota.
  const saldi = saldiDelGiorno(diOggi.length > 0 ? diOggi : eventi, oggi)
  const mvp = mvpDelGiorno(saldi)

  // Chi ha gia' vinto una giornata, dal piu' titolato in giu'.
  const albo = Object.entries(conteggiMvp).sort((a, b) => b[1] - a[1])
  const magliaNera = magliaNeraDelGiorno(saldi)
  const finito = statoDelViaggio(oggi) === 'dopo'

  const perId = Object.fromEntries(classifica.map((m) => [m.id, m]))
  const nome = (id) => perId[id]?.nome ?? 'Qualcuno'

  // I punti si propongono da qui: la classifica è dove guardi chi merita
  // qualcosa, quindi è lì che deve stare il gesto.
  const [scelto, setScelto] = useState(null)
  const [punizione, setPunizione] = useState(null)
  // La proposta trattenuta perché ne hai già una in voto: tenuta da
  // parte intera, così "Aspetto" non fa riscrivere il motivo.
  const [aspetta, setAspetta] = useState(null)
  const [sotto, setSotto] = useState('storico')
  const destinatario = classifica.find((m) => m.id === scelto) ?? null

  const approvati = eventi.filter((e) => e.stato === 'approved')

  // Quante aspettano ancora il tuo voto: quelle su cui hai già detto la
  // tua restano nell'elenco ma non chiamano più.
  const daVotare = proposteAperte.filter((p) => !p.hannoVotato.includes(ioId)).length

  // La trappola scatta una volta sola: chi c'è già cascato non può più
  // toccare la propria riga. Con il tasto spento dall'inizio non ci
  // sarebbe cascato nessuno, con il tasto sempre acceso diventa una
  // penalità che si ripete e smette di essere una sorpresa.
  // ⚠️ Su TUTTI gli eventi noti, non solo sugli ultimi quaranta.
  //
  // Il commento qui sopra dice che la trappola scatta una volta sola, ed è
  // la decisione giusta: una trappola che si ripete smette di essere una
  // sorpresa e diventa una tassa. Ma il controllo guardava la stessa
  // finestra di quaranta eventi, quindi dopo una giornata piena il fatto
  // di esserci già cascati usciva dalla finestra — e il tasto tornava
  // acceso. Chi ci ricascava pagava di nuovo, e i punti non si revocano.
  //
  // `diOggi` e `eventi` insieme allargano la finestra quanto basta; e la
  // Legge è per persona e per viaggio, quindi qualunque riga sua che
  // compaia in una delle due liste è sufficiente a tenerla spenta.
  const giaCascato = [...eventi, ...diOggi].some(
    (e) => e.leggeId === 'self-praise' && e.membroId === ioId
  )

  // Se il limite giornaliero l'ha rifiutata, il foglio resta aperto col
  // motivo: chiuderlo lascerebbe senza sapere cos'è successo.
  //
  // Se invece una tua proposta è ancora in voto, si chiede di aspettare
  // e basta: il suggerimento non dice né quale Legge c'è dietro né
  // quanto costa insistere, perché una trappola annunciata non è una
  // trappola. Chi preme lo stesso la fa scattare, e solo allora la vede.
  async function crea(dati) {
    const esito = await onCrea(dati)
    if (esito?.motivo === 'in-voto') {
      setAspetta(dati)
      return
    }
    if (!esito?.ok) return
    chiudiFoglio(esito)
  }

  function chiudiFoglio(esito) {
    setScelto(null)
    setAspetta(null)
    // Possono scattarne più d'una insieme: si mostra la prima, le altre
    // restano nello storico, che leggono tutti.
    const prima = esito.trappole?.[0] ?? esito.autoElogio
    if (prima) setPunizione(prima)
  }

  async function insisti() {
    const esito = await onCrea({ ...aspetta, insisto: true })
    if (!esito?.ok) return
    chiudiFoglio(esito)
  }

  return (
    <div className="gioco-corpo">
      <div className="titoli">
        <div className="titolo-card mvp">
          <span className="titolo-etichetta">👑 MVP di oggi</span>
          <span className="titolo-nome">
            {mvp ? `${nome(mvp.membroId)} (+${mvp.saldo})` : 'Ancora nessuno.'}
          </span>
          {/* Le giornate gia' chiuse: prima sparivano a mezzanotte e non
              tornavano piu'. Adesso restano, e sono anche il conto da cui
              dipende la Legge XXI. */}
          {albo.length > 0 && (
            <span className="titolo-albo">
              {albo.map(([id, quante]) => `${nome(id)}${quante > 1 ? ` ×${quante}` : ''}`).join(' · ')}
            </span>
          )}
        </div>

        <div className="titolo-card nera">
          <span className="titolo-etichetta">🏴 Maglia Nera</span>
          <span className="titolo-nome">
            {magliaNera
              ? `${nome(magliaNera.membroId)} (${magliaNera.saldo})`
              : 'Giornata senza colpevoli.'}
          </span>
        </div>
      </div>

      <ol className="classifica">
        {classifica.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              className={m.id === ioId ? 'riga io' : 'riga'}
              onClick={() => setScelto(m.id)}
              disabled={m.id === ioId && giaCascato}
            >
              <span className="posto">{i + 1}</span>
              <img
                className="riga-avatar"
                src={urlAvatar(m.avatarStyle, m.avatarSeed)}
                alt=""
                width="34"
                height="34"
              />
              <span className="riga-nome">
                {m.nome}
                {finito && i === 0 && <span className="corona"> 👑</span>}
                {finito && i === classifica.length - 1 && classifica.length > 1 && (
                  <span className="corona"> 🏴</span>
                )}
              </span>
              <span className="riga-colonna-punti">
                <span className={m.punteggio < 0 ? 'riga-punti sotto' : 'riga-punti'}>
                  {m.punteggio}
                </span>
                {/* ⚠️ Dice cosa succede toccando, che prima lo diceva solo
                    una freccia. E' l'unica cosa dell'app che nessuno
                    indovina da solo: che i punti si possono dare **agli
                    altri**, anche a chi ti sta davanti. */}
                {!(m.id === ioId && giaCascato) && (
                  <span className="riga-assegna">assegna punti</span>
                )}
              </span>
              {/* Senza questa freccia niente dice che la riga si tocca:
                  è la stessa che segna le righe apribili nelle Spese. */}
              {!(m.id === ioId && giaCascato) && (
                <span className="riga-freccia" aria-hidden="true">
                  ›
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>

      <p className="classifica-invito">Tocca qualcuno per proporgli dei punti.</p>

      {destinatario && (
        <Proposta
          destinatario={destinatario}
          ioId={ioId}
          onCrea={crea}
          onAnnulla={() => setScelto(null)}
          inCorso={inCorso}
          errore={errore}
        />
      )}

      {/* La trappola è scattata: lo si dice in faccia a chi c'è cascato,
          col conto. Il gruppo lo legge comunque nello storico. */}
      {aspetta && (
        // ⚠️ `chiudibileFuori={false}` non è pigrizia: questo foglio dice
        // che stai per pagare, e le due uscite non sono uguali. Un tocco
        // storto sul velo lo farebbe sparire senza che nessuno abbia
        // deciso niente, e la trappola della Legge XIV si paga una volta
        // sola per viaggio: chi non l'ha letta non capirebbe mai perché
        // ha perso dei punti. Il tasto indietro invece lo chiude, perché
        // quello si preme apposta.
        <Foglio
          etichetta="Hai già una proposta in voto"
          chiudibileFuori={false}
          onChiudi={() => setAspetta(null)}
        >
          <>
            <p className="punizione-testo">Aspetta almeno che finisca la votazione.</p>
            <p className="punizione-nota">Ne hai già una aperta.</p>
            <button type="button" className="primario-spese" onClick={() => setAspetta(null)}>
              Aspetto
            </button>
            <button type="button" className="secondario-foglio" onClick={insisti}>
              Mandala lo stesso
            </button>
          </>
        </Foglio>
      )}

      {punizione && (
        // Stessa ragione di sopra, ancora piu' forte: qui i punti li hai
        // gia' persi, e questo foglio e' l'unico posto in tutta l'app in
        // cui viene detto perche'.
        <Foglio
          etichetta="Il Testamento ha qualcosa da dirti"
          chiudibileFuori={false}
          className="punizione"
          onChiudi={() => setPunizione(null)}
        >
          <>
            <p className="punizione-punti">{punizione.punti}</p>
            <p className="punizione-testo">{punizione.testo}</p>
            <p className="punizione-nota">{punizione.legge}. Adesso lo sanno tutti.</p>
            <button
              type="button"
              className="secondario-foglio"
              onClick={() => setPunizione(null)}
            >
              Me la sono cercata
            </button>
          </>
        </Foglio>
      )}

      {/* Due schede: quello che è già successo e quello che aspetta te.
          Il banner in sovrimpressione in cima all'app resta com'è —
          quello ti raggiunge ovunque, questo è il posto dove le ritrovi.

          Il pallino sulla scheda resta finché non hai votato: è l'unico
          modo di sapere che c'è qualcosa da fare senza aprirla. */}
      <div className="segmenti minori" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={sotto === 'storico'}
          className={sotto === 'storico' ? 'segmento attivo' : 'segmento'}
          onClick={() => setSotto('storico')}
        >
          Cosa è successo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sotto === 'votare'}
          className={sotto === 'votare' ? 'segmento attivo' : 'segmento'}
          onClick={() => setSotto('votare')}
        >
          Da votare
          {daVotare > 0 && <span className="segmento-pallino">{daVotare}</span>}
        </button>
      </div>

      {sotto === 'votare' &&
        (proposteAperte.length === 0 ? (
          <p className="gioco-vuoto">Niente da votare. Per ora.</p>
        ) : (
          <ul className="attese">
            {proposteAperte.map((p) => (
              <PropostaInAttesa
                key={p.votoId}
                proposta={p}
                membri={perId}
                ioId={ioId}
                onVota={onVotaProposta}
              />
            ))}
          </ul>
        ))}

      {sotto === 'storico' &&
        (approvati.length === 0 ? (
          <p className="gioco-vuoto">
            Nessuno ha ancora fatto niente di notevole. Né di riprovevole.
          </p>
        ) : (
          <ul className="storico">
            {approvati.map((e) => (
              <li key={e.id}>
                <span className={e.punti < 0 ? 'storico-punti meno' : 'storico-punti piu'}>
                  {segno(e.punti)}
                </span>
                <span className="storico-motivo">
                  <strong>{nome(e.membroId)}</strong> — {e.motivo}
                  <span className="storico-quando">{quando(e.creatoIl)}</span>
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}

function segno(n) {
  return n > 0 ? `+${n}` : String(n)
}

function quando(iso) {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
