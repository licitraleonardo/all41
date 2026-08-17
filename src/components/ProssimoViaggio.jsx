import { useState } from 'react'
import './ProssimoViaggio.css'
import { PROSSIMO } from '../config/prossimoViaggio.js'

// La pagina su cui l'app si apre adesso che il viaggio è finito.
//
// ⚠️ Il tasto non fa niente, ed è la ragione per cui esiste: serve a far
// vedere come sarà, non a caricare qualcosa. Per questo non c'è nessun
// campo dove lasciare un file — un tasto che non fa niente si capisce in
// mezzo secondo, un file che sparisce dentro una pagina finta no, e
// qualcuno ci lascerebbe l'itinerario del viaggio dopo credendo di
// averlo salvato.
//
// E infatti, premuto, dice che non c'è ancora niente da caricare invece
// di fingere un caricamento andato a buon fine.
export default function ProssimoViaggio({ onIndietro }) {
  const [premuto, setPremuto] = useState(false)

  return (
    <div className="prossimo">
      <button type="button" className="prossimo-indietro" onClick={onIndietro}>
        <span aria-hidden="true">←</span> {PROSSIMO.indietro}
      </button>

      <div className="prossimo-centro">
        <h2 className="prossimo-titolo">{PROSSIMO.titolo}</h2>
        <p className="prossimo-sotto">{PROSSIMO.sottotitolo}</p>

        <button
          type="button"
          className="prossimo-carica"
          onClick={() => setPremuto(true)}
        >
          {PROSSIMO.tasto}
        </button>

        {/* `role="status"` e non un avviso: è una risposta a un tocco, non
            un problema. Chi usa il lettore di schermo la sente una volta
            senza che gli venga interrotto quello che stava leggendo. */}
        {premuto && (
          <p className="prossimo-nota" role="status">
            {PROSSIMO.dopoIlTasto}
          </p>
        )}
      </div>
    </div>
  )
}
