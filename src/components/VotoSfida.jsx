import { useState } from 'react'
import { vincitoreDelVoto } from '../lib/cacciaFinale.js'

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

  // La stessa funzione che decide davvero chi ha vinto, non un massimo
  // ricalcolato qui: due risposte alla stessa domanda sono il difetto che
  // questo progetto ha già pagato più volte.
  const vincitore = chiuso ? vincitoreDelVoto(voto, foto) : null

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

      {/* ⚠️ La schermata deve dire quello che il motore ha davvero deciso.
          Prima annunciava «Vince la foto di X» prendendo il primo indice
          col conteggio più alto — ma `vincitoreDelVoto` in pareggio non
          restituisce nessuno, e con otto persone e due o tre foto in gara
          il pareggio è frequente. Il gruppo leggeva un vincitore sullo
          schermo, e in classifica quella sfida non risultava vinta da
          nessuno e non contava per il premio da dieci punti. Un messaggio
          che afferma il falso, e su cui poi si litiga a tavola. */}
      {chiuso &&
        massimo > 0 &&
        (vincitore ? (
          <p className="voto-sfida-esito">
            Vince la foto di {membri[vincitore.membroId]?.nome ?? 'qualcuno'}.
          </p>
        ) : (
          <p className="voto-sfida-esito">
            Pareggio: non vince nessuno. Come per le sfide, a pari voti la
            sfida resta senza vincitore.
          </p>
        ))}

      {errore && <p className="sondaggio-errore">{errore}</p>}
    </div>
  )
}
