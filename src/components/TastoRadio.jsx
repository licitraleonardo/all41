import './TastoRadio.css'

// Il tasto tondo in sovraimpressione, tipo i comandi di una radio.
//
// Sta sopra il contenuto e non dentro il flusso: sulla pagina del
// prossimo viaggio, che è quasi vuota, un pulsante in mezzo peserebbe più
// di tutto il resto; sull'itinerario, che scorre, resta dov'è mentre i
// giorni gli passano sotto.
//
// ⚠️ `aria-label` e `title` dicono dove porta, perché il simbolo da solo
// non lo dice a chi non vede lo schermo. Il primo lo legge il lettore
// vocale, il secondo compare tenendo il puntatore fermo sul computer.
export default function TastoRadio({ verso, onClick }) {
  return (
    <button
      type="button"
      className={`tasto-radio tasto-radio-${verso.segno === '⏮' ? 'indietro' : 'avanti'}`}
      onClick={onClick}
      aria-label={verso.dove}
      title={verso.dove}
    >
      <span aria-hidden="true">{verso.segno}</span>
    </button>
  )
}
