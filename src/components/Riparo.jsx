import { Component } from 'react'
import './Riparo.css'

// La rete sotto le sezioni.
//
// Senza, una svista in una schermata porta giù tutta l'app: pagina
// bianca, e da lì non si torna indietro senza ricaricare. È già successo
// — un componente usato e mai definito nell'Impostore — e in Sardegna,
// con otto telefoni e nessuno che possa toccare il codice, quella è una
// serata rovinata invece di un tab rotto.
//
// Deve essere una classe: gli hook non possono intercettare un errore di
// disegno, è l'unica cosa in React che si fa ancora così.
export default class Riparo extends Component {
  constructor(props) {
    super(props)
    this.state = { caduta: null }
  }

  static getDerivedStateFromError(errore) {
    return { caduta: errore }
  }

  componentDidCatch(errore, dove) {
    // L'errore vero in chiaro, come ovunque nell'app: la frase gentile
    // serve a chi guarda, questa a chi ripara.
    console.error('[all41] sezione caduta:', this.props.nome, errore, dove?.componentStack)
  }

  render() {
    if (!this.state.caduta) return this.props.children

    // Certe cose non meritano un cartello: una celebrazione che non parte
    // è meglio che sparisca in silenzio piuttosto che diventare un errore
    // in mezzo allo schermo.
    if (this.props.zitto) return null

    return (
      <div className="riparo" role="alert">
        <p className="riparo-titolo">Questa parte non va</p>
        {/* "non si carica" e non "si è rotto": con i nomi delle schede
            il participio sbaglia genere una volta su due — "le foto si è
            rotto" — e un errore scritto male fa sembrare rotta anche la
            parte che funziona. */}
        <p className="riparo-testo">
          {this.props.nome ?? 'Questa sezione'} non si carica. Il resto dell’app
          funziona: prova a cambiare scheda.
        </p>
        <button
          type="button"
          className="riparo-riprova"
          onClick={() => this.setState({ caduta: null })}
        >
          Riprova
        </button>
        <p className="riparo-nota">
          Se ricapita, dillo a Leo: nella console c’è scritto cosa è successo.
        </p>
      </div>
    )
  }
}
