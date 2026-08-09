// L'SOS si vede da dovunque, e non cede il posto a nessuno.
//
// Il comportamento vero si prova nel browser — mandare un SOS da un
// telefono e guardarlo comparire su un altro mentre e' nelle foto. Qui si
// tiene ferma la **struttura**, che e' la parte che si puo' smontare per
// distrazione: la striscia era finita dentro la chat, e da li' la vedeva
// solo chi era gia' nel posto giusto.
//
// E' lo stesso difetto del buco del realtime — l'SOS che non arriva a chi
// non sta guardando il punto esatto — ma senza bisogno che cada la rete.
// Bastava essere in un altro tab.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

// I commenti citano il codice che spiegano: senza toglierli, la riga che
// dice «prima stava dentro la chat» conta come se ci stesse ancora.
const senzaCommenti = (t) =>
  t
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')

const app = senzaCommenti(readFileSync('src/App.jsx', 'utf8'))
const css = readFileSync('src/components/StrisciaSOS.css', 'utf8')
const gancio = senzaCommenti(readFileSync('src/hooks/useSosAperti.js', 'utf8'))

console.log('\nla striscia sta in App, non dentro una schermata')
{
  prova('App la monta', /<StrisciaSOS/.test(app))

  // Chiunque altro se la monta se la prende solo per se': quella copia
  // vivrebbe finche' sei in quel tab.
  const altrove = readdirSync('src/components')
    .filter((f) => f.endsWith('.jsx') && f !== 'StrisciaSOS.jsx')
    .filter((f) => /<StrisciaSOS/.test(senzaCommenti(readFileSync(join('src/components', f), 'utf8'))))
  prova('e nessun altro componente se la disegna', altrove.length === 0, altrove)
}

console.log('\nsta sopra tutto, e gli altri banner si tolgono')
{
  prova('e fissa in cima', /position: fixed/.test(css) && /top: 0/.test(css))

  // Sopra gli altri banner, che stanno a 30.
  const z = Number((css.match(/\.sos-aperti\s*\{[\s\S]*?z-index:\s*(\d+)/) ?? [])[1])
  prova(`z-index ${z} sopra i banner (30)`, z > 30, z)

  // ⚠️ Una proposta di punti scade in un'ora e una sfida a dama aspetta.
  // Uno che si e' perso no. Tutti e quattro i banner devono chiedersi se
  // c'e' un SOS prima di prendersi la cima.
  const quante = (app.match(/sos\.aperti\.length === 0/g) ?? []).length
  prova('tutti i banner cedono il posto', quante >= 4, quante)
}

console.log('\nchi legge gli SOS sopravvive a un buco di rete')
{
  // Le tre occasioni di riallineamento, le stesse del feed: il canale che
  // torna su, l'app che torna in primo piano, la rete che torna.
  prova('rilegge quando il canale si riaggancia', /giaCollegato/.test(gancio))
  prova('rilegge quando l app torna avanti', /visibilitychange/.test(gancio))
  prova('rilegge quando torna la rete', /'online'/.test(gancio))
  prova('e non rilegge alla prima iscrizione', /if \(giaCollegato && vivo\)/.test(gancio))
}

console.log('\n«Rientrato» lo puo premere chiunque')
{
  // Chi si e' perso ha il telefono in mano per orientarsi, non per
  // chiudere cartelli, e spesso e' un altro ad averlo trovato.
  prova('nessun controllo su chi l ha mandato', !/autoreId\s*===|mio|membroId\s*===/.test(gancio))

  // Se l'eliminazione non riesce il cartello RESTA: meglio uno di troppo
  // che uno di meno.
  const corpo = gancio.match(/const rientrato = useCallback[\s\S]*?\}, \[\]\)/)?.[0] ?? ''
  prova('e se non riesce il cartello resta', /catch/.test(corpo) && /return false/.test(corpo))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
