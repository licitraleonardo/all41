import { ESPRESSIONE_PREDEFINITA, urlAllan } from '../config/allan.js'

// La faccia di Allan, ritagliata dallo character sheet.
//
// Prima era un avatar generato: sbagliato, perche' Allan non e' uno del
// gruppo sorteggiato da un nome — e' un personaggio disegnato, con otto
// espressioni sue. Quale usare lo decide chi lo mette in pagina, cosi'
// puo' sbuffare dove serve sbuffare e giudicare dove serve giudicare.
export default function FacciaAllan({
  espressione = ESPRESSIONE_PREDEFINITA,
  lato = 40,
  className = '',
}) {
  return (
    <img
      className={`faccia-allan ${className}`.trim()}
      src={urlAllan(espressione)}
      alt="Allan"
      width={lato}
      height={lato}
      // Niente caricamento pigro: sono immagini piccole e sempre visibili
      // quando vengono disegnate, e dentro una nuvoletta che si apre di
      // colpo il pigro fa lampeggiare il vuoto dove dovrebbe esserci lui.
      draggable="false"
    />
  )
}
