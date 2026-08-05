import { urlAllan } from '../config/avatar.js'

// La faccia di Allan.
//
// Viene dalla stessa fonte degli avatar del gruppo e dallo stesso stile,
// quindi e' della stessa famiglia invece di essere un disegno estraneo
// appiccicato sopra. Ma il seme e' fisso e l'espressione e' scelta a
// mano: Allan non cambia faccia a ogni ricaricamento come fa la gente, e
// non gli capita di sorridere.
//
// Quale espressione sta in config/avatar.js, che e' l'unico posto da
// toccare se un giorno non convince piu'.
export default function FacciaAllan({ lato = 40, className = '' }) {
  return (
    <img
      className={`faccia-allan ${className}`.trim()}
      src={urlAllan()}
      alt="Allan"
      width={lato}
      height={lato}
      // Senza rete resta il buco invece dell'icona di immagine rotta: la
      // faccia e' un di piu', non un'informazione che manca.
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}
