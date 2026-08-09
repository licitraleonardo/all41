// L'app non si ricarica addosso a chi sta facendo qualcosa.
//
// Il service worker nuovo prende il comando e la pagina va ricaricata: e'
// giusto, senza quello l'app installata resta a una versione di ieri. Ma
// ricaricare mentre uno ha il foglio della spesa compilato a meta' vuol
// dire portargli via descrizione, importo, chi ha pagato e divisa fra chi
// -- senza un messaggio, senza un modo di capire cos'e' successo. Lo stesso
// per un vocale che si sta registrando, che e' l'unica copia che esiste.
//
// La ricarica non si annulla: si rimanda a quando lo schermo e' libero.

import { tieniOccupato, siPuoRicaricare } from '../src/lib/aggiornamento.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\na schermo libero si ricarica')
prova('senza niente aperto, via libera', siPuoRicaricare())

console.log('\ncon qualcosa a meta si aspetta')
{
  const libera = tieniOccupato('foglio-spesa')
  prova('un foglio aperto ferma la ricarica', !siPuoRicaricare())
  libera()
  prova('e chiudendolo si riparte', siPuoRicaricare())
}

console.log('\ndue cose insieme, e la prima che chiude non basta')
{
  const via1 = tieniOccupato('foglio-spesa')
  const via2 = tieniOccupato('vocale')
  prova('due occupati', !siPuoRicaricare())
  via1()
  prova('ne resta uno: si aspetta ancora', !siPuoRicaricare())
  via2()
  prova('liberi tutti e due', siPuoRicaricare())
}

console.log('\nliberare due volte non sblocca per sbaglio')
{
  const viaA = tieniOccupato('a')
  const viaB = tieniOccupato('b')
  viaA()
  viaA()  // due volte, come capita a un effetto che si rimonta
  prova('b tiene ancora', !siPuoRicaricare())
  viaB()
  prova('e alla fine si libera', siPuoRicaricare())
}

console.log('\nlo stesso motivo due volte conta una volta sola')
{
  // Due schede della stessa cosa aperte insieme non devono poter lasciare
  // l'app bloccata per sempre: il motivo e' una chiave, non un contatore.
  const via1 = tieniOccupato('foglio-spesa')
  const via2 = tieniOccupato('foglio-spesa')
  via1()
  prova('liberato una volta, e libero', siPuoRicaricare())
  via2()
  prova('e resta libero', siPuoRicaricare())
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
