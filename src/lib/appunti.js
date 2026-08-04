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

  try {
    const campo = document.createElement('textarea')
    campo.value = testo
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const riuscito = document.execCommand('copy')
    campo.remove()
    return riuscito
  } catch {
    return false
  }
}
