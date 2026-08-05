import './Rotella.css'

// L'attesa dell'app. Prima era la scritta "Un attimo." ripetuta in tredici
// componenti: una frase ferma sembra un guasto, una rotella che gira dice
// che qualcosa sta succedendo davvero.
//
// Il testo resta, ma sotto e piccolo: serve ai lettori di schermo e a chi
// aspetta da troppo.
export default function Rotella({ testo = 'Un attimo', piccola = false }) {
  return (
    <p className={piccola ? 'rotella-riga piccola' : 'rotella-riga'} role="status">
      <span className="rotella" aria-hidden="true" />
      <span className="rotella-testo">{testo}</span>
    </p>
  )
}
