import { useRef, useState } from 'react'
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
  const sfide = useSfide()

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

      // Una sfida collettiva si chiude quando l'ha fatta tutto il
      // gruppo: si controlla dopo ogni caricamento.
      if (sfidaId) {
        sfide
          .ricarica()
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
      <div className="album-testata">
        <h1 className="album-titolo">Album</h1>

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

      {avviso && <p className="album-avviso">{avviso}</p>}

      <Sfide
        diOggi={sfide.diOggi}
        conquistate={sfide.conquistate}
        vinte={sfide.vinte}
        partecipazioni={sfide.partecipazioni}
        membri={sfide.membri}
        ioId={membro.id}
        totaleMembri={sfide.membriIds.length}
        onScegli={carica}
        inCorso={inCorso}
      />

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
    </div>
  )
}

function peso(byte) {
  if (byte >= 1048576) return `${(byte / 1048576).toFixed(1)} MB`
  return `${Math.round(byte / 1024)} KB`
}
