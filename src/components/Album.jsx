import { useMemo, useRef, useState } from 'react'
import './Album.css'
import { useFoto } from '../hooks/useFoto.js'
import { caricaFoto, eliminaFoto } from '../lib/foto.js'
import { descriviErrore } from '../lib/errori.js'
import { dopoFoto } from '../lib/regole.js'
import { forseChiudiCollettiva } from '../lib/sfide.js'
import { useSfide } from '../hooks/useSfide.js'
import Sfide from './Sfide.jsx'
import { urlAvatar } from '../config/avatar.js'
import { TIPI_ACCETTATI } from '../config/foto.js'

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
  const [vista, setVista] = useState('album')

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
        setAvviso(`Aspetta ${esito.attesa}s.`)
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
      setInCoda((precedenti) => [...precedenti, { file, nome: file.name }])
      setAvviso(`Non è partita. ${descriviErrore(e)}`)
    } finally {
      setInCorso(false)
    }
  }

  async function scegli(e) {
    const scelti = [...e.target.files]
    e.target.value = ''
    for (const file of scelti) await carica(file)
  }

  async function riprova(indice) {
    const voce = inCoda[indice]
    setInCoda((precedenti) => precedenti.filter((_, i) => i !== indice))
    await carica(voce.file)
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
            className="carica"
            onClick={() => campoFoto.current?.click()}
            disabled={inCorso}
          >
            📷 Scatta
          </button>
          <button
            type="button"
            className="carica secondario-chiaro"
            onClick={() => campoFile.current?.click()}
            disabled={inCorso}
          >
            🖼 Scegli
          </button>
        </div>

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
          {inCoda.map((voce, i) => (
            <li key={`${voce.nome}-${i}`}>
              <span>{voce.nome}</span>
              <button type="button" onClick={() => riprova(i)} disabled={inCorso}>
                Riprova
              </button>
            </li>
          ))}
        </ul>
      )}

      {stato === 'caricamento' && <p className="album-vuoto">Un attimo.</p>}
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
                  <div className="cella-foto">
                    <img
                      src={f.url}
                      alt=""
                      width={f.larghezza ?? 800}
                      height={f.altezza ?? 800}
                      loading="lazy"
                    />
                    {f.autoreId === membro.id && (
                      <button
                        type="button"
                        className="cella-elimina"
                        onClick={() => elimina(f)}
                        aria-label="Elimina"
                      >
                        ×
                      </button>
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
    </div>
  )
}

function peso(byte) {
  if (byte >= 1048576) return `${(byte / 1048576).toFixed(1)} MB`
  return `${Math.round(byte / 1024)} KB`
}
