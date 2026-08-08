// navigator.clipboard esiste solo in contesto sicuro: aprendo l'app dal
// telefono su http://192.168.x.x non c'è, e il bottone non farebbe
// niente. Il ripiego vecchio stile funziona anche lì.
export async function negliAppunti(testo) {
  try {
    await navigator.clipboard.writeText(testo)
    return true
  } catch {
    // Si prova l'altra strada.
  }

  return conLaSelezione(testo)
}

// Copia una cosa che ancora non c'è.
//
// Serve per il codice di accesso: si genera solo dopo che il profilo è
// stato creato, cioè dopo un giro di rete, e a quel punto su iPhone il
// permesso di copiare è già scaduto — Safari lo concede solo dentro il
// gesto che l'utente ha appena fatto, e un `await` in mezzo lo brucia.
//
// La via d'uscita è dichiarare l'intenzione di copiare DENTRO il gesto,
// passando una Promise al posto del testo: il browser tiene aperto il
// permesso finché non si risolve. Safari e Chrome la accettano, Firefox
// no — e lì si ricade su writeText, che su desktop funziona lo stesso
// perché il vincolo è molto più largo.
//
// Va chiamata SENZA await dentro il gestore del tocco, o l'attivazione
// scade prima di arrivarci.
export function negliAppuntiQuandoPronto(promessaDelTesto) {
  try {
    const pezzo = promessaDelTesto.then(
      (testo) => new Blob([testo], { type: 'text/plain' })
    )
    return navigator.clipboard
      .write([new ClipboardItem({ 'text/plain': pezzo })])
      .then(() => true)
      .catch(() => promessaDelTesto.then((testo) => negliAppunti(testo)))
  } catch {
    return promessaDelTesto.then((testo) => negliAppunti(testo))
  }
}

// Il ripiego, riscritto perché quello di prima su iPhone non copiava
// niente: un textarea con `readonly` e `opacity: 0` iOS non lo seleziona.
// Si porta fuori schermo invece di renderlo invisibile, e la selezione si
// fa con un Range, che è l'unica che iOS rispetta.
function conLaSelezione(testo) {
  try {
    const campo = document.createElement('textarea')
    campo.value = testo
    campo.contentEditable = 'true'
    campo.readOnly = false
    campo.style.position = 'fixed'
    campo.style.left = '-9999px'
    campo.style.top = '0'
    // Sotto i 16px iOS zooma sul campo prima di copiare.
    campo.style.fontSize = '16px'
    document.body.appendChild(campo)

    const intervallo = document.createRange()
    intervallo.selectNodeContents(campo)
    const selezione = window.getSelection()
    selezione.removeAllRanges()
    selezione.addRange(intervallo)
    campo.setSelectionRange(0, testo.length)

    const riuscito = document.execCommand('copy')
    selezione.removeAllRanges()
    campo.remove()
    return riuscito
  } catch {
    return false
  }
}
