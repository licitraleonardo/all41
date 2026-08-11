import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Album.css'
import { useFoto } from '../hooks/useFoto.js'
import { caricaFoto, eliminaFoto } from '../lib/foto.js'
import { descriviErrore } from '../lib/errori.js'
import { dopoFoto } from '../lib/regole.js'
import { forseChiudiCollettiva } from '../lib/sfide.js'
import { useSfide } from '../hooks/useSfide.js'
import { useSchedaRicordata } from '../hooks/useSchedaRicordata.js'
import { accoda, etichetta, leggiCoda, togliDallaCoda } from '../lib/codaFoto.js'
import {
  conVoce,
  inOrdine,
  mie,
  nuovaVoce,
  senzaVoce,
  soloInMemoria,
} from '../lib/codaFotoRegole.js'
import { SFIDE_PER_ID } from '../config/sfide.js'
import { uuid } from '../lib/id.js'
import Sfide from './Sfide.jsx'
import FotoGrande from './FotoGrande.jsx'
import BottoneElimina from './BottoneElimina.jsx'
import { urlAvatar } from '../config/avatar.js'
import { MASSIMO_IN_CODA, TIPI_ACCETTATI } from '../config/foto.js'
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

  // ⚠️ Riprova a chiudere le collettive appena si guarda l'Album.
  //
  // Senza questa riga una sfida collettiva completata **resta aperta per
  // sempre**, ed è successo davvero: la sera dell'11 tutti e otto hanno
  // caricato il selfie di «Ci siamo tutti» prima delle 19, quando il
  // viaggio non era ancora cominciato. `forseChiudiCollettiva` rimanda —
  // giusto — ma l'unico posto che la chiamava era il ramo di un
  // caricamento **riuscito**, e chi ha già caricato non ricarica. Nessuno
  // ha preso i tre punti a testa e la Legge XXIX non è mai stata
  // scoperta: nessun errore, da nessuna parte, solo una sfida che non si
  // chiudeva.
  //
  // Il commento che stava accanto alla guardia diceva «a quel punto la fa
  // il primo che apre l'Album». Non era vero, e adesso lo è.
  //
  // Costa una lettura già fatta: gira solo quando i dati delle sfide sono
  // arrivati, e `chiudi_sfida` è idempotente — se l'ha già chiusa un
  // altro telefono, questa non fa niente.
  useEffect(() => {
    if (!sfide.membriIds?.length) return

    const daChiudere = [...sfide.diOggi, ...sfide.aperte].filter(
      (s) =>
        s.tipo === 'collettiva' &&
        !sfide.vinte[s.id] &&
        sfide.membriIds.every((id) =>
          (sfide.partecipazioni[s.id] ?? []).some((f) => f.autoreId === id)
        )
    )
    if (daChiudere.length === 0) return

    let vivo = true
    Promise.all(
      daChiudere.map((s) =>
        forseChiudiCollettiva(s.id, sfide.partecipazioni[s.id] ?? [], sfide.membriIds).catch(
          () => null
        )
      )
    ).then((esiti) => {
      if (!vivo) return
      if (esiti.some((r) => r?.appena)) {
        setAvviso('🏆 Ci siete tutti.')
        sfide.ricarica()
      }
    })

    return () => {
      vivo = false
    }
    // `partecipazioni` cambia oggetto a ogni ricarica: si guarda quante
    // foto ci sono, non l'identità dell'oggetto, o si riproverebbe in
    // continuazione.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sfide.membriIds?.length, sfide.diOggi.length, sfide.aperte.length, JSON.stringify(sfide.vinte)])
  const [vista, setVista] = useSchedaRicordata('scheda.foto', 'album', ['album', 'sfide'])
  const [grande, setGrande] = useState(null)
  const [bloccato, setBloccato] = useState(false)
  const codaViva = useRef([])
  const caricaOra = useRef(null)
  const drenaggio = useRef(false)

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

  // La foto va SUL TELEFONO ogni volta che non arriva a destinazione, e
  // "non arriva" comprende il rifiuto del limite: una scattata con
  // "📷 Scatta" non è nel rullino — è un file temporaneo dato solo alla
  // pagina — quindi buttarla perché sono le sei di sera e ne hai già fatte
  // cinque vuol dire distruggerla, e il messaggio parla d'altro.
  //
  // `voceEsistente` c'è quando questo è un ritentativo: la sua riga si
  // aggiorna invece di lasciarne una seconda con un id nuovo.
  async function tieniDaParte(file, sfidaId, voceEsistente, motivo) {
    const voce =
      voceEsistente ??
      nuovaVoce({
        id: uuid(),
        file,
        nome: file.name,
        sfidaId,
        membroId: membro.id,
        quando: Date.now(),
      })

    const salvata = await accoda(voce)
    setInCoda((precedenti) => conVoce(precedenti, { ...voce, salvata }, MASSIMO_IN_CODA).coda)

    setAvviso(
      salvata
        ? `Non è partita, ma è al sicuro sul telefono: la ritrovi qui sotto. ${motivo}`
        : // Il messaggio di prima diceva "non chiudere l'app": non bastava.
          // Questa schermata si smonta anche solo cambiando tab, e con lei
          // se ne va l'unica copia rimasta.
          `Non è partita e non riesco a tenerla da parte: resta qui sotto finché non cambi schermata. ${motivo}`
    )
  }

  // Torna true solo se la foto è arrivata a destinazione: è quello che
  // decide se la voce può uscire dalla coda.
  async function carica(file, sfidaId = null, voceEsistente = null) {
    setInCorso(true)
    setAvviso(null)
    try {
      const esito = await caricaFoto(file, membro.id, { onStato: setAvviso, sfidaId })
      if (!esito.ok) {
        // Il tetto della giornata non si scavalca aspettando qualche
        // secondo: dirlo con un cronometro sarebbe una presa in giro.
        await tieniDaParte(
          file,
          sfidaId,
          voceEsistente,
          esito.motivo === 'giorno' ? TETTO_AL_GIORNO : `Aspetta ${esito.attesa}s.`
        )
        return false
      }

      // Adesso, e solo adesso, la voce può lasciare il telefono.
      if (voceEsistente) {
        setInCoda((precedenti) => senzaVoce(precedenti, voceEsistente.id))
        await togliDallaCoda(voceEsistente.id)
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
            // ⚠️ Ci siete tutti ma il viaggio non è cominciato. Senza
            // questa riga il gruppo carica otto selfie, li vede tutti
            // caricati e non succede niente: sembra rotta.
            else if (r?.aspetta) setAvviso('🏆 Ci siete tutti. Si chiude il 12.')
          })
          .then(() => sfide.ricarica())
          .catch(() => {})
      }
      return true
    } catch (e) {
      await tieniDaParte(file, sfidaId, voceEsistente, descriviErrore(e))
      return false
    } finally {
      setInCorso(false)
    }
  }

  // Si aggiornano a ogni disegno perché `svuota` deve restare la stessa
  // funzione per tutta la vita del componente — ci si aggancia un listener
  // — e leggere comunque l'ultima coda e l'ultimo `carica`. Senza il
  // secondo, una foto di sfida consegnata dal ritentativo automatico
  // chiamerebbe la `sfide.aggiornaGara` di dieci minuti fa.
  caricaOra.current = carica
  codaViva.current = inCoda

  // Adesso si riprova davvero da sola: appena la coda è stata letta, e ogni
  // volta che il browser dice che la rete è tornata — come fanno già i
  // punteggi della Pecora in useRecordPecora. Il commento lo prometteva da
  // giorni e sotto non c'era niente: una foto in coda aspettava un tocco
  // manuale che nessuno sapeva di dover dare, in una scheda che nessuno
  // apriva.
  const svuota = useCallback(async () => {
    if (drenaggio.current || navigator.onLine === false) return
    drenaggio.current = true
    try {
      // Una per volta e in ordine di scatto. Al primo che non passa ci si
      // ferma: se è caduto il segnale o è finito il tetto del giorno, le
      // altre cadrebbero uguale, e ogni tentativo è un file spedito.
      for (const voce of inOrdine(codaViva.current)) {
        const fatta = await caricaOra.current?.(voce.file, voce.sfidaId ?? null, voce)
        if (!fatta) break
      }
    } finally {
      drenaggio.current = false
    }
  }, [])

  // La coda si ricostruisce all'avvio: è l'unica cosa che rende utile
  // averla salvata. Solo le proprie — sta sul dispositivo, e chi entra col
  // codice di un altro non deve ritrovarsi le sue foto in mano.
  useEffect(() => {
    let vivo = true
    leggiCoda().then((tutte) => {
      if (!vivo) return
      const nostre = mie(tutte, membro.id)
      setInCoda(nostre)
      // Il ref si scrive a mano invece di aspettare il disegno dopo
      // `setInCoda`: `svuota` parte subito e leggerebbe la lista vuota.
      codaViva.current = nostre
      svuota().catch(() => {})
    })
    return () => {
      vivo = false
    }
  }, [membro.id, svuota])

  useEffect(() => {
    const alRitorno = () => {
      svuota().catch(() => {})
    }
    window.addEventListener('online', alRitorno)
    return () => window.removeEventListener('online', alRitorno)
  }, [svuota])

  async function scegli(e) {
    const scelti = [...e.target.files]
    e.target.value = ''
    for (const file of scelti) await carica(file)
  }

  async function riprova(voce) {
    // La voce resta dov'è finché non è arrivata. Prima si toglieva subito,
    // e bastava che il ritentativo venisse RIFIUTATO invece che fallire —
    // il tetto delle cinque al giorno, o "Aspetta 47s" — perché la foto
    // sparisse dal telefono senza che nessuno la stesse cancellando.
    // Premere "Riprova" rendeva la foto meno al sicuro di prima.
    await carica(voce.file, voce.sfidaId ?? null, voce)
  }

  async function scarta(voce) {
    setInCoda((precedenti) => senzaVoce(precedenti, voce.id))
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

      {/* Fuori da `vista === 'album'`, dov'era prima: una foto mandata a
          una sfida che non parte finisce in coda, e chi l'ha mandata sta
          guardando la scheda Sfide — dove la coda non compariva. L'unico
          segnale era l'avviso qui sopra, che sparisce al primo messaggio
          successivo. La foto restava su IndexedDB per sempre, invisibile,
          finché qualcuno non toccava "Album" per caso. */}
      {inCoda.length > 0 && (
        <ul className="coda">
          {inCoda.map((voce) => (
            <li key={voce.id} className={soloInMemoria(voce) ? 'coda-in-aria' : undefined}>
              <span>
                {etichetta(voce)}
                {voce.sfidaId && (
                  <em> · {SFIDE_PER_ID[voce.sfidaId]?.titolo ?? 'sfida'}</em>
                )}
                {soloInMemoria(voce) && <em> · non salvata sul telefono</em>}
              </span>
              <button type="button" onClick={() => riprova(voce)} disabled={inCorso}>
                Riprova
              </button>
              {/* Due tocchi, come la × delle foto già sul server. Anzi:
                  soprattutto qui. Là si toglie una copia di una cosa che
                  resta, qui si distrugge l'unica che esiste — e le due ×
                  si somigliano abbastanza da prendere la memoria
                  muscolare dell'una e usarla sull'altra. */}
              <BottoneElimina
                classe="coda-scarta"
                etichetta="Scarta questa foto"
                onElimina={() => scarta(voce)}
              />
            </li>
          ))}
        </ul>
      )}

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
