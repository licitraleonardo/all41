// Dopo un buco del realtime si rilegge.
//
// Il realtime consegna quello che succede MENTRE si e' collegati. Se il
// socket cade -- si passa sotto un ponte, il telefono va in tasca, la wifi
// del villaggio fa una delle sue -- quello che e' passato in quei venti
// secondi non arriva mai piu' su quel telefono. E sullo schermo la
// conversazione risulta ferma e completa: nessun segno che manchi qualcosa.
//
// Nel caso peggiore a cadere nel buco e' un SOS, e li' il buco non si
// richiude da solo: quando uno si perde, gli altri smettono di scrivere in
// chat e cominciano a telefonare. Non arriva nessun evento successivo.
//
// Non si prova con un socket vero: si guarda che i tre agganci ci siano.
// Rete grossolana, ma il difetto e' invisibile e toglierli non romperebbe
// nient'altro.

import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const posti = [
  ['src/hooks/useFeed.js', 'il feed della chat'],
  // Il riallineamento degli SOS si e' spostato da `StrisciaSOS` a questo
  // gancio il 9 agosto, quando la striscia e' salita in `App`: prima
  // viveva dentro la chat, quindi un SOS lo vedeva solo chi era gia' nel
  // tab giusto. La striscia adesso disegna e basta.
  ['src/hooks/useSosAperti.js', 'chi legge gli SOS aperti'],
]

for (const [file, cosa] of posti) {
  console.log(`\n${cosa}`)
  const t = readFileSync(new URL('../' + file, import.meta.url), 'utf8')

  prova('si rilegge quando il canale torna su', /subscribe\(\s*\(/.test(t), {
    aiuto: 'subscribe() senza callback non sa dire quando si e ricollegato',
  })
  prova('e solo dalla seconda volta, non alla prima', /giaCollegato/.test(t), {
    aiuto: 'senza, si rileggerebbe una volta di troppo a ogni apertura',
  })
  prova('si rilegge quando l app torna in primo piano', /visibilitychange/.test(t), {
    aiuto: 'dentro una PWA in tasca il socket muore senza che nessuno lo dichiari',
  })
  prova('e quando torna la rete', /addEventListener\('online'/.test(t))
  prova('e i tre agganci si tolgono smontando', /removeEventListener\('online'/.test(t))
}

console.log('\nil feed si riallinea in avanti, mai indietro')
{
  const t = readFileSync(new URL('../src/hooks/useFeed.js', import.meta.url), 'utf8')
  prova(
    'il riallineamento legge FRESCO, non dalla copia',
    /leggiFeed\s*\.\s*fresca\(/.test(t),
    {
      aiuto:
        'con la copia locale il riallineamento riporterebbe la conversazione indietro invece che avanti',
    }
  )
  // E la prima lettura invece la copia la usa: senza rete la chat si apre
  // lo stesso, ed e' tutto il senso dell'offline.
  prova('ma la prima lettura continua a poter ripiegare sulla copia', /leggiFeed\(\)/.test(t))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
