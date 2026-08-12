import { useState } from 'react'

// Il voto fra le foto in gara.
//
// Anonimo per davvero: nel database finiscono solo i conteggi e l'elenco
// di chi ha votato, mai chi ha votato cosa. Nascondere la preferenza
// nell'interfaccia non basterebbe — chiunque apra il database la
// vedrebbe.
//
// La propria foto non compare fra le opzioni: non è una tentazione da
// resistere, è una scelta che non esiste.
export default function VotoSfida({ voto, foto, ioId, membri, onVota }) {
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState(null)

  const hoVotato = voto.hannoVotato.includes(ioId)
  const chiuso = Boolean(voto.chiusoIl) || Date.parse(voto.scadeIl) <= Date.now()
  const totale = voto.conteggi.reduce((a, b) => a + b, 0)
  const massimo = Math.max(...voto.conteggi, 0)

  const perId = Object.fromEntries(foto.map((f) => [f.id, f]))

  async function scegli(indice) {
    setInCorso(true)
    setErrore(null)
    try {
      await onVota(voto.id, indice)
    } catch (e) {
      setErrore(e?.message ?? 'Non ha funzionato.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="voto-sfida">
      <p className="voto-sfida-testa">
        {chiuso
          ? 'Voto chiuso.'
          : hoVotato
            ? 'Hai votato. Aspetta gli altri.'
            : 'Quale vince? Il voto è anonimo.'}
      </p>

      <div className="gara">
        {voto.fotoIds.map((fotoId, i) => {
          const f = perId[fotoId]
          const mia = f?.autoreId === ioId
          const conteggio = voto.conteggi[i] ?? 0
          const mostraEsito = hoVotato || chiuso
          const vince = mostraEsito && conteggio === massimo && conteggio > 0

          return (
            <figure className={vince ? 'gara-foto vince' : 'gara-foto'} key={fotoId}>
              {f ? <img src={f.url} alt="" loading="lazy" /> : <div className="gara-vuota" />}

              {mia && <span className="gara-mia">la tua</span>}

              {mostraEsito ? (
                <figcaption className="gara-conto">
                  {conteggio}
                  {totale > 0 && <span className="gara-quota">{Math.round((conteggio / totale) * 100)}%</span>}
                </figcaption>
              ) : (
                /* La propria non si può votare: il bottone non c'è
                   proprio, invece di esserci e rifiutare. */
                !mia && (
                  <button
                    type="button"
                    className="gara-vota"
                    onClick={() => scegli(i)}
                    disabled={inCorso}
                  >
                    Questa
                  </button>
                )
              )}
            </figure>
          )
        })}
      </div>

      {chiuso && massimo > 0 && (
        <p className="voto-sfida-esito">
          Vince la foto di{' '}
          {membri[perId[voto.fotoIds[voto.conteggi.indexOf(massimo)]]?.autoreId]?.nome ??
            'qualcuno'}
          .
        </p>
      )}

      {errore && <p className="sondaggio-errore">{errore}</p>}
    </div>
  )
}
