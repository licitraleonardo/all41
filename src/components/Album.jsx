import { useEffect, useMemo, useRef, useState } from 'react'
import './Album.css'
import { useFoto } from '../hooks/useFoto.js'
import { caricaFoto, eliminaFoto } from '../lib/foto.js'
import { descriviErrore } from '../lib/errori.js'
import { dopoFoto } from '../lib/regole.js'
import { forseChiudiCollettiva } from '../lib/sfide.js'
import { useSfide } from '../hooks/useSfide.js'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import { accoda, etichetta, leggiCoda, togliDallaCoda } from '../lib/codaFoto.js'
import NuvolettaAllan from './NuvolettaAllan.jsx'
import { uuid } from '../lib/id.js'
import Sfide from './Sfide.jsx'
import FotoGrande from './FotoGrande.jsx'
import BottoneElimina from './BottoneElimina.jsx'
import { urlAvatar } from '../config/avatar.js'
import { TIPI_ACCETTATI } from '../config/foto.js'
import { LIMITI } from '../config/limiti.js'
import Rotella from './Rotella.jsx'

// Il numero viene dalla configurazione e non è scritto a mano: la Legge I
// del Testamento ha detto "±10" per settimane mentre il limite vero era
// ±5, e nessuno se n'era accorto.
const TETTO_AL_GIORNO =
  `${LIMITI.photo.giorno} foto al giorno. Le hai finite: domani se ne riparla.`

export default function Album({ membro }) {
  const { foto, membri, stato, errore, altre, inArrivo, caricaAltre, inserisci, rimuovi } =
    useFoto()
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState(null)
  // Gli upload falliti non si perdono in silenzio: restano qui con un
  // bottone per riprovare.
  const [inCoda, setInCoda] = useState([])
  const campoFile = useRef(null)
  const campoFoto = useRef(null)
  const sfide = useSfide(membro.id)
  const [vista, setVista] = useSchedaRicordata('scheda.foto', 'album', ['album', 'sfide'])
  const [grande, setGrande] = useState(null)
  const [bloccato, setBloccato] = useState(false)

  // Quante ne hai già caricate oggi nell'album. Si contano da quelle che
  // sono già a schermo invece di chiederlo al database: la griglia è
  // ordinata per data e le tue di oggi ci sono tutte, e così il numero si
  // aggiorna nell'istante in cui ne carichi o ne togli una.
  //
  // Le foto mandate a una sfida non contano, come dice la regola.
  const rimaste = useMemo(() => {
    const mezzanotte = new Date()
    mezzanotte.setHours(0, 0, 0, 0)

    const fatte = foto.filter(
      (f) =>
        f.autoreId === membro.id &&
        !f.sfidaId &&
        Date.parse(f.creataIl) >= mezzanotte.getTime()
    ).length

    return Math.max(0, LIMITI.photo.giorno - fatte)
  }, [foto, membro.id])

  // Il bottone a limite raggiunto resta cliccabile e rifiuta: se fosse
  // spento davvero il messaggio non potrebbe materialmente comparire, ed
  // è la stessa regola che vale per i tasti della Chat Rapida.
  function apriIngresso(campo) {
    if (rimaste === 0) {
      setBloccato(true)
      setTimeout(() => setBloccato(false), 4000)
      return
    }
    campo.current?.click()
  }

  // Quante sfide aspettano ancora qualcosa da te: serve solo a mettere
  // il pallino sulla scheda, così non bisogna aprirla per sapere se c'è
  // qualcosa da fare. Contano anche quelle dei giorni scorsi rimaste
  // aperte — è tutto il punto di non farle più scadere.
  const daFare = useMemo(
    () =>
      [...sfide.diOggi, ...sfide.aperte].filter((s) => {
        if (sfide.vinte[s.id]) return false
        const voto = sfide.voti[s.id]
        if (voto && !voto.hannoVotato.includes(membro.id)) return true
        return !(sfide.partecipazioni[s.id] ?? []).some((f) => f.autoreId === membro.id)
      }).length,
    [sfide.diOggi, sfide.aperte, sfide.vinte, sfide.voti, sfide.partecipazioni, membro.id]
  )

  async function carica(file, sfidaId = null) {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await caricaFoto(file, membro.id, { onStato: setAvviso, sfidaId })
      if (!esito.ok) {
        // Il tetto della giornata non si scavalca aspettando qualche
        // secondo: dirlo con un cronometro sarebbe una presa in giro.
        setAvviso(esito.motivo === 'giorno' ? TETTO_AL_GIORNO : `Aspetta ${esito.attesa}s.`)
        return
      }
      inserisci(esito.foto)
      setAvviso(`Caricata. ${peso(esito.primaByte)} → ${peso(esito.dopoByte)}.`)

      // Le Leggi non devono far fallire il caricamento: se il rilevamento
      // va storto, la foto è comunque salva.
      dopoFoto(membro.id)
        .then((scattate) => {
          const nuova = scattate.find((s) => s.scopertaNuova)
          if (nuova) setAvviso(`📜 Nuova Legge scoperta. Guarda il Testamento.`)
        })
        .catch(() => {})

      // Le collettive si chiudono quando l'ha fatta tutto il gruppo; le
      // competitive aprono il voto appena le foto in gara sono due.
      if (sfidaId) {
        sfide
          .aggiornaGara(sfidaId)
          .then(() =>
            forseChiudiCollettiva(
              sfidaId,
              [...(sfide.partecipazioni[sfidaId] ?? []), { autoreId: membro.id }],
              sfide.membriIds
            )
          )
          .then((r) => {
            if (r?.appena) setAvviso(`🏆 Ci siete tutti. +${r.punti} a testa.`)
          })
          .then(() => sfide.ricarica())
          .catch(() => {})
      }
    } catch (e) {
      // La foto va SUL TELEFONO, non in memoria. Quella scattata con
      // "📷 Scatta" non è nel rullino — è un file temporaneo dato solo
      // alla pagina — quindi se la PWA viene uccisa mentre lo schermo è
      // bloccato non esiste più da nessuna parte.
      const voce = { id: uuid(), file, nome: file.name, quando: Date.now() }
      const salvata = await accoda(voce)
      setInCoda((precedenti) => [...precedenti, voce])
      setAvviso(
        salvata
          ? `Non è partita, ma è al sicuro sul telefono. ${descriviErrore(e)}`
          : `Non è partita, e non riesco a tenerla da parte: non chiudere l'app. ${descriviErrore(e)}`
      )
    } finally {
      setInCorso(false)
    }
  }

  // La coda si ricostruisce all'avvio: è l'unica cosa che rende utile
  // averla salvata. Si riprova anche da sola quando torna la rete.
  useEffect(() => {
    let vivo = true
    leggiCoda().then((voci) => vivo && setInCoda(voci))
    return () => {
      vivo = false
    }
  }, [])

  async function scegli(e) {
    const scelti = [...e.target.files]
    e.target.value = ''
    for (const file of scelti) await carica(file)
  }

  async function riprova(voce) {
    // Si toglie dalla coda solo se il caricamento riesce: se fallisce di
    // nuovo, `carica` la rimette dentro con un id nuovo e quella vecchia
    // resterebbe lì come doppione.
    setInCoda((precedenti) => precedenti.filter((v) => v.id !== voce.id))
    await togliDallaCoda(voce.id)
    await carica(voce.file)
  }

  async function scarta(voce) {
    setInCoda((precedenti) => precedenti.filter((v) => v.id !== voce.id))
    await togliDallaCoda(voce.id)
  }

  async function elimina(f) {
    rimuovi(f.id)
    try {
      await eliminaFoto(f.id)
    } catch {
      inserisci(f)
      setAvviso('Non è riuscita a togliersi. Riprova.')
    }
  }

  return (
    <div className="album-schermo">
      <NuvolettaAllan membroId={membro?.id} passo={vista === 'album' ? 'foto' : 'foto.sfide'} />

      <div className="segmenti" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'album'}
          className={vista === 'album' ? 'segmento attivo' : 'segmento'}
          onClick={() => setVista('album')}
        >
          Album
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'sfide'}
          className={vista === 'sfide' ? 'segmento attivo' : 'segmento'}
          onClick={() => setVista('sfide')}
        >
          Sfide
          {daFare > 0 && <span className="segmento-pallino">{daFare}</span>}
        </button>
      </div>

      {avviso && <p className="album-avviso">{avviso}</p>}

      {vista === 'sfide' && (
        <Sfide
          diOggi={sfide.diOggi}
          aperte={sfide.aperte}
          conquistate={sfide.conquistate}
          vinte={sfide.vinte}
          partecipazioni={sfide.partecipazioni}
          voti={sfide.voti}
          membri={sfide.membri}
          ioId={membro.id}
          totaleMembri={sfide.membriIds.length}
          onScegli={carica}
          onVota={sfide.vota}
          inCorso={inCorso}
        />
      )}

      {vista === 'sfide' && sfide.diOggi.length === 0 && sfide.aperte.length === 0 && sfide.conquistate.length === 0 && (
        <p className="album-vuoto">
          Nessuna sfida oggi. Compaiono nei giorni del viaggio, una tappa per volta.
        </p>
      )}

      {vista === 'album' && (
      <>
      <div className="album-testata">
        <h1 className="album-titolo">Album</h1>

        {/* I due tasti sono scesi in fondo, dov'è il pollice: caricare
            una foto è l'azione principale della sezione e stava
            nell'angolo più lontano da raggiungere con una mano sola. */}
        <div className="album-bottoni">
          {/* Due ingressi separati invece di uno solo: "capture" e
              "multiple" si escludono, quindi con un bottone unico o si
              scatta o si sceglie dalla galleria, mai tutti e due. */}
          <button
            type="button"
            className={rimaste === 0 ? 'carica esaurito' : 'carica'}
            onClick={() => apriIngresso(campoFoto)}
            disabled={inCorso}
          >
            📷 Scatta
          </button>
          <button
            type="button"
            className={
              rimaste === 0 ? 'carica secondario-chiaro esaurito' : 'carica secondario-chiaro'
            }
            onClick={() => apriIngresso(campoFile)}
            disabled={inCorso}
          >
            🖼 Scegli
          </button>
        </div>

        {bloccato && (
          <p className="album-bloccato" role="status">
            {TETTO_AL_GIORNO}
          </p>
        )}

        <input
          ref={campoFoto}
          type="file"
          accept={TIPI_ACCETTATI}
          capture="environment"
          onChange={scegli}
          hidden
        />
        <input
          ref={campoFile}
          type="file"
          accept={TIPI_ACCETTATI}
          multiple
          onChange={scegli}
          hidden
        />
      </div>



      {inCoda.length > 0 && (
        <ul className="coda">
          {inCoda.map((voce) => (
            <li key={voce.id}>
              <span>{etichetta(voce)}</span>
              <button type="button" onClick={() => riprova(voce)} disabled={inCorso}>
                Riprova
              </button>
              <button
                type="button"
                className="coda-scarta"
                onClick={() => scarta(voce)}
                disabled={inCorso}
                aria-label="Scarta questa foto"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {stato === 'caricamento' && <Rotella />}
      {stato === 'guasto' && <p className="album-guasto">{errore}</p>}

      {stato === 'pronto' && foto.length === 0 && (
        <p className="album-vuoto">Ancora niente. Qualcuno si muova.</p>
      )}

      {foto.length > 0 && (
        <>
          <div className="griglia">
            {foto.map((f) => {
              const autore = membri[f.autoreId]
              return (
                <figure className="cella" key={f.id}>
                  {/* In una griglia da tre colonne una foto è larga cento
                      pixel: si tocca e si apre grande, per guardarla e
                      scaricarla. Togliere resta qui, sulla × piccola. */}
                  <div className="cella-foto">
                    <button
                      type="button"
                      className="cella-apri"
                      onClick={() => setGrande(f)}
                      aria-label={`Apri la foto di ${autore?.nome ?? 'qualcuno'}`}
                    >
                      <img
                        src={f.url}
                        alt=""
                        width={f.larghezza ?? 800}
                        height={f.altezza ?? 800}
                        loading="lazy"
                      />
                    </button>

                    {f.autoreId === membro.id && (
                      <BottoneElimina onElimina={() => elimina(f)} />
                    )}
                  </div>

                  <figcaption>
                    <img
                      className="cella-avatar"
                      src={urlAvatar(autore?.avatarStyle, autore?.avatarSeed || '?')}
                      alt=""
                      width="18"
                      height="18"
                    />
                    <span>{autore?.nome ?? 'Qualcuno'}</span>
                  </figcaption>
                </figure>
              )
            })}
          </div>

          {altre && (
            <button type="button" className="altre" onClick={caricaAltre} disabled={inArrivo}>
              {inArrivo ? 'Carico…' : 'Carica altre'}
            </button>
          )}
        </>
      )}
      </>
      )}

      {grande && (
        <FotoGrande
          foto={grande}
          autore={membri[grande.autoreId]}
          onChiudi={() => setGrande(null)}
        />
      )}
    </div>
  )
}

function peso(byte) {
  if (byte >= 1048576) return `${(byte / 1048576).toFixed(1)} MB`
  return `${Math.round(byte / 1024)} KB`
}
