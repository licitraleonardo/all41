// La scadenza degli invii, provata senza aspettare dieci secondi veri.
//
// Il caso che conta e' l'ultimo del secondo gruppo: una risposta che
// arriva DOPO la scadenza non deve trasformare un'attesa scaduta in un
// successo. Sarebbe il difetto di partenza rimesso al mondo dall'altra
// parte — l'app direbbe che e' andata bene mentre chi aspetta ha gia'
// letto che non ha risposto.

import { conScadenza, eScaduta, SCADUTA } from '../src/lib/scadenza.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

// Un rifiuto che nessuno raccoglie e' un guasto vero, non un dettaglio:
// in produzione diventa un errore in console e in Node fa uscire il
// processo. Lo si conta invece di sperare che non capiti.
let rifiutiOrfani = 0
process.on('unhandledRejection', () => {
  rifiutiOrfani += 1
})

// Orologio finto: i timer non scattano da soli, scattano quando lo dico
// io. Cosi' le prove durano millisecondi e non dipendono dalla velocita'
// della macchina che le esegue.
function orologioFinto() {
  let prossimo = 1
  const attesi = new Map()
  return {
    avvia: (fn, ms) => {
      const id = prossimo++
      attesi.set(id, { fn, ms })
      return id
    },
    ferma: (id) => attesi.delete(id),
    scatta: () => {
      for (const [id, v] of [...attesi]) {
        attesi.delete(id)
        v.fn()
      }
    },
    quanti: () => attesi.size,
    msDi: (id) => attesi.get(id)?.ms,
  }
}

const maiPiu = () => new Promise(() => {})
const respira = () => new Promise((r) => setImmediate(r))

console.log('\nquando la risposta arriva in tempo')
{
  const c = orologioFinto()
  const valore = await conScadenza(Promise.resolve('mandata'), 10000, c)
  prova('torna il valore, intatto', valore === 'mandata')
  prova('e il timer viene spento', c.quanti() === 0, { rimasti: c.quanti() })
}
{
  const c = orologioFinto()
  const suo = new Error('niente rete')
  let preso = null
  try {
    await conScadenza(Promise.reject(suo), 10000, c)
  } catch (e) {
    preso = e
  }
  prova('un errore vero passa cosi com e', preso === suo)
  prova('e non viene spacciato per scadenza', !eScaduta(preso))
  prova('anche qui il timer viene spento', c.quanti() === 0)
}

console.log('\nquando non risponde')
{
  const c = orologioFinto()
  const attesa = conScadenza(maiPiu(), 10000, c)
  prova('il timer e stato messo, coi millisecondi giusti', c.msDi(1) === 10000, {
    ms: c.msDi(1),
  })
  c.scatta()
  let preso = null
  try {
    await attesa
  } catch (e) {
    preso = e
  }
  prova('solleva invece di restare appesa', preso !== null)
  prova('e si riconosce che e una scadenza', eScaduta(preso), { codice: preso?.code })
  prova('il codice e quello pubblico', preso?.code === SCADUTA)
  prova('con un messaggio da mostrare', typeof preso?.message === 'string' && preso.message.length > 0)
}

console.log('\nquando la risposta arriva tardi')
{
  const c = orologioFinto()
  let sblocca
  const lenta = new Promise((r) => {
    sblocca = r
  })
  const attesa = conScadenza(lenta, 10000, c)
  c.scatta()

  let preso = null
  try {
    await attesa
  } catch (e) {
    preso = e
  }
  prova('prima scade', eScaduta(preso))

  // La richiesta non e' stata annullata: arriva, tardi.
  sblocca('arrivata comunque')
  await respira()
  prova('la risposta in ritardo non ribalta la scadenza in successo', eScaduta(preso))
}
{
  const c = orologioFinto()
  let butta
  const lenta = new Promise((_, r) => {
    butta = r
  })
  const attesa = conScadenza(lenta, 10000, c)
  c.scatta()
  try {
    await attesa
  } catch {
    // gia provato sopra
  }
  butta(new Error('andata male, tardi'))
  await respira()
  prova('e un guasto in ritardo non resta un rifiuto orfano', rifiutiOrfani === 0, {
    orfani: rifiutiOrfani,
  })
}

console.log('\nsenza scadenza si aspetta come prima')
{
  const c = orologioFinto()
  const valore = await conScadenza(Promise.resolve('ok'), 0, c)
  prova('zero: nessun timer messo', c.quanti() === 0)
  prova('zero: il valore passa lo stesso', valore === 'ok')
}
{
  const c = orologioFinto()
  await conScadenza(Promise.resolve('ok'), undefined, c)
  prova('tipo senza scadenza in configurazione: nessun timer', c.quanti() === 0)
}
{
  const c = orologioFinto()
  let arrivata = false
  conScadenza(maiPiu(), 0, c).then(() => {
    arrivata = true
  })
  await respira()
  prova('zero su una richiesta appesa: resta appesa, non finge una scadenza', !arrivata)
}

console.log('\neScaduta non prende lucciole per lanterne')
prova('errore normale: no', !eScaduta(new Error('boh')))
prova('niente: no', !eScaduta(null))
prova('oggetto qualunque: no', !eScaduta({ code: 'PGRST205' }))

await respira()
prova('nessun rifiuto orfano in tutta la corsa', rifiutiOrfani === 0, { orfani: rifiutiOrfani })

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
