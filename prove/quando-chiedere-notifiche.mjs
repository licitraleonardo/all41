// Quando si offrono le notifiche.
//
// ⚠️ Questa prova esiste per una condizione sola, ed è quella che non si
// può sbagliare: **permesso già negato, non si chiede più niente.**
//
// Il cartello del browser si brucia una volta sola. Se uno ha detto
// «Blocca», riproporgli il nostro cartello non riapre nessuna porta: fa
// solo comparire una domanda che non porta da nessuna parte, e la nostra
// domanda serve proprio a non arrivare mai a quel «Blocca».

// ⚠️ Prima dell'import: il modulo legge localStorage, che in node non
// esiste.
const deposito = new Map()
globalThis.localStorage = {
  getItem: (k) => (deposito.has(k) ? deposito.get(k) : null),
  setItem: (k, v) => deposito.set(k, v),
}

const { vaOffertoIlPermesso, segnaRimandato, rimandatoIl } = await import(
  '../src/lib/quandoChiedereNotifiche.js'
)

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\na chi non ha mai deciso si chiede')
prova('permesso mai dato: si offre', vaOffertoIlPermesso({ permesso: 'default' }))

console.log('\ne a tutti gli altri no')
{
  prova('gia concesso: ci pensa il riaggancio', !vaOffertoIlPermesso({ permesso: 'granted' }))
  // ⚠️ La condizione che conta.
  prova('gia negato: non si insiste', !vaOffertoIlPermesso({ permesso: 'denied' }))
  prova(
    'browser che non sa mandarle: niente',
    !vaOffertoIlPermesso({ permesso: 'default', possibili: false })
  )
}

console.log('\nsu iPhone solo dall app installata')
{
  // ⚠️ Fuori dall'app installata, su iPhone, le notifiche web non
  // esistono: offrirle e' promettere una cosa che non puo' succedere.
  prova(
    'iPhone dentro Safari: non si offre',
    !vaOffertoIlPermesso({ permesso: 'default', suIPhone: true, installataSullaHome: false })
  )
  prova(
    'iPhone dall app sulla home: si offre',
    vaOffertoIlPermesso({ permesso: 'default', suIPhone: true, installataSullaHome: true })
  )
  // Su Android l'app non installata non e' un ostacolo.
  prova(
    'Android dal browser: si offre lo stesso',
    vaOffertoIlPermesso({ permesso: 'default', suIPhone: false, installataSullaHome: false })
  )
}

console.log('\nil «non ora» vale per la giornata')
{
  // ⚠️ L'una di notte, e non e' un'ora a caso: il giorno si segna
  // **locale**, non UTC. All'una in Italia la data UTC e' ancora quella
  // di ieri, e un «non ora» detto adesso sarebbe gia' scaduto un secondo
  // dopo averlo detto.
  const unaDiNotte = new Date('2026-08-13T01:00:00')

  prova(
    'senza aver rimandato, si offre',
    vaOffertoIlPermesso({ permesso: 'default', rimandatoIl: rimandatoIl(), adesso: unaDiNotte })
  )

  segnaRimandato(unaDiNotte)
  prova(
    'detto «non ora», si tace',
    !vaOffertoIlPermesso({ permesso: 'default', rimandatoIl: rimandatoIl(), adesso: unaDiNotte })
  )
  prova(
    'e si tace anche il pomeriggio',
    !vaOffertoIlPermesso({
      permesso: 'default',
      rimandatoIl: rimandatoIl(),
      adesso: new Date('2026-08-13T17:00:00'),
    })
  )
  // ⚠️ Ma domani si richiede: un «non ora» non e' un «mai piu'», ed e'
  // tutta la differenza con il «Blocca» del browser.
  prova(
    'ma domani si richiede',
    vaOffertoIlPermesso({
      permesso: 'default',
      rimandatoIl: rimandatoIl(),
      adesso: new Date('2026-08-14T09:00:00'),
    })
  )
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
