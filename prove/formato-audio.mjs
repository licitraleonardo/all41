// La verifica bloccante n.3 dello spec, provata senza browser.
//
// Il punto non e' quale formato esca, e' che NON sia scritto nel codice:
// su Safari deve uscire mp4, su Chrome webm, e in tutti e due i casi
// deve uscire qualcosa invece di rompersi.

import { scegliFormato, estensioneDi, FORMATI } from '../src/lib/formatoAudio.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

// Finti browser: dicono di sì solo ai formati che sanno davvero fare.
const safari = (t) => t.startsWith('audio/mp4')
const chrome = (t) => t.includes('webm')
const firefox = (t) => t.includes('ogg') || t.includes('webm')
const preistorico = () => false
const rotto = () => {
  throw new Error('isTypeSupported esplode')
}

console.log('\nquale formato esce su cosa')
prova('Safari: mp4, che si sente ovunque', scegliFormato(safari).startsWith('audio/mp4'))
prova('Chrome: webm', scegliFormato(chrome).includes('webm'))
prova('Firefox: webm o ogg', /webm|ogg/.test(scegliFormato(firefox)))

console.log('\nla preferenza dello spec')
prova(
  'mp4 viene prima di tutto',
  FORMATI[0].startsWith('audio/mp4'),
  { primo: FORMATI[0] }
)
prova(
  'chi sa fare tutto usa mp4, non webm',
  scegliFormato(() => true).startsWith('audio/mp4')
)

console.log('\nquando va storto')
prova(
  'browser che non ne sa fare nessuno: stringa vuota, non un errore',
  scegliFormato(preistorico) === ''
)
prova(
  'isTypeSupported che esplode: non trascina giu la registrazione',
  scegliFormato(rotto) === ''
)

console.log('\nnome del file')
prova('mp4 -> m4a', estensioneDi('audio/mp4;codecs=mp4a.40.2') === 'm4a')
prova('webm -> webm', estensioneDi('audio/webm;codecs=opus') === 'webm')
prova('ogg -> ogg', estensioneDi('audio/ogg;codecs=opus') === 'ogg')
prova('ignoto -> bin', estensioneDi('') === 'bin')
prova('niente -> bin', estensioneDi(undefined) === 'bin')

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
