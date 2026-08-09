import { useState } from 'react'
import './Targhetta.css'
import { forzaAggiornamento } from '../lib/aggiornamento.js'

// Iniettate al momento della costruzione da vite.config.js. Si leggono
// qui e non arrivano da fuori: cosi' questa riga si puo' mettere dovunque
// serva senza portarsi dietro due proprieta' per tutta l'app.
const commit = __COMMIT__
const buildTime = __BUILD_TIME__

// La riga con la versione, in fondo a tutto — e il modo di uscirne quando
// l'app resta indietro.
//
// ⚠️ Perché serve un tasto, se l'aggiornamento è già automatico.
//
// L'automatismo c'è e funziona: il service worker si controlla a ogni
// ritorno in primo piano, e quando ne arriva uno nuovo la pagina si
// ricarica da sola. Ma dentro una PWA installata sulla home — su iPhone
// soprattutto — quel controllo a volte non parte proprio: il sistema
// tiene l'app congelata nello switcher per giorni e non la riapre mai
// per davvero.
//
// Quando succede non c'è **niente** da fare: non c'è la barra
// dell'indirizzo, non c'è il tasto ricarica, e chiudere l'app non basta
// perché non è mai stata chiusa. L'unico segnale che qualcosa non torna è
// questa riga con la versione, che però da sola non dice se è vecchia.
//
// Questo tasto è quella via d'uscita. Non è un ripiego elegante: è
// l'unica cosa che funziona sempre.
export default function Targhetta() {
  const [stato, setStato] = useState('fermo')

  async function aggiorna() {
    setStato('cerco')
    const esito = await forzaAggiornamento()
    // Se ha trovato qualcosa la pagina si ricarica da sola e questo stato
    // non lo vede nessuno.
    if (esito === 'gia-aggiornata') setStato('gia')
    if (esito === 'niente-da-fare') setStato('niente')
  }

  return (
    <footer className="targhetta">
      <span className="targhetta-versione">
        {commit} · {buildTime}
      </span>

      <button
        type="button"
        className="targhetta-aggiorna"
        onClick={aggiorna}
        disabled={stato === 'cerco'}
      >
        {stato === 'cerco' ? 'Cerco…' : 'Aggiorna'}
      </button>

      {/* Si dice com'è andata anche quando non è cambiato niente: un tasto
          che sembra non fare nulla si preme cinque volte. */}
      {stato === 'gia' && <span className="targhetta-esito">Già all’ultima versione.</span>}
      {stato === 'niente' && (
        <span className="targhetta-esito">Non ci riesce. Chiudi e riapri l’app.</span>
      )}
    </footer>
  )
}
