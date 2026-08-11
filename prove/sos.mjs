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
  // Uno che si e' perso no. In quel posto ci sta una cosa sola: sono
  // tutti `position: fixed; top: 0`, quindi due insieme si coprono a
  // vicenda e chi legge ne vede uno solo, senza sapere che ce n'era un
  // altro sotto.
  //
  // La domanda «chi si e' preso la cima» si fa in un punto solo, e da
  // li' scende: `sosInCima` -> `inCima` -> i quattro banner.
  prova('l SOS decide chi sta in cima', /const sosInCima = sos\.aperti\.length > 0/.test(app))
  prova('e da li scende a tutti', /const inCima = sosInCima \|\| avvisoInCima/.test(app))

  const quante = (app.match(/!inCima/g) ?? []).length
  prova('tutti e quattro i banner cedono il posto', quante >= 4, quante)
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

console.log('\n«Ricevuto» lo puo premere chiunque, e lascia traccia')
{
  const azioni = senzaCommenti(readFileSync('src/lib/azioni.js', 'utf8'))
  const striscia = senzaCommenti(readFileSync('src/components/StrisciaSOS.jsx', 'utf8'))

  // Chi si e' perso ha il telefono in mano per orientarsi, non per
  // chiudere cartelli. Nessuno deve avere il permesso di ricevere.
  prova("il tasto dice «Ricevuto»", /'Ricevuto'/.test(striscia))
  // E l'unica ragione per cui e' spento e' che sta partendo: mai perche'
  // l'SOS e' di qualcun altro.
  const spento = striscia.match(/disabled=\{([^}]*)\}/)?.[1] ?? ''
  prova('e nessuno ha il permesso di riceverlo', !/ioId|autoreId/.test(spento), spento)

  // ⚠️ E l'SOS non si cancella piu'.
  //
  // Prima «Rientrato» chiamava `eliminaAzione`, cioe' marcava la riga
  // come eliminata — e il feed nasconde le righe eliminate. Vuol dire che
  // chiudere un SOS lo faceva **sparire dalla chat**: dell'unica funzione
  // di sicurezza dell'app non restava nessuna traccia da nessuna parte.
  // Adesso resta li' per sempre e se ne va dalla striscia da solo dopo
  // `ORE_SOS`.
  prova('e non si cancella piu quando lo si riceve', !/eliminaAzione/.test(gancio), gancio.match(/eliminaAzione/g))

  // ⚠️ La ricevuta NON passa dal limite della chat.
  //
  // `inviaAzione` chiama `verificaLimite`, e `free_text` ha tre secondi
  // di attesa fra un messaggio e l'altro e dieci in cinque minuti.
  // Passando di li', chi ha appena scritto molto si sentirebbe dire
  // «aspetta» mentre cerca di dire che ha visto un SOS. Un limite
  // anti-spam non deve poter stare in mezzo a quello.
  const invio = azioni.match(/export async function mandaRicevuta[\s\S]*?\n\}/)?.[0] ?? ''
  prova('la ricevuta esiste', invio.length > 0)
  prova('e non passa dal limite della chat', !/inviaAzione|verificaLimite/.test(invio))

  // ⚠️ Ed e' un `free_text`, non un tipo nuovo. Un tipo nuovo vorrebbe una
  // migrazione del vincolo `kind`, e verrebbe scartato in silenzio da
  // `decidi()` sui telefoni fermi alla versione di ieri.
  prova("e' una riga di chat normale", /kind: 'free_text'/.test(invio))
  prova('col contrassegno che la distingue', /ricevutaSos/.test(invio))

  // ⚠️ E porta un testo di ripiego: su un telefono con la versione
  // vecchia la ricevuta si legge come un messaggio invece di sparire.
  prova('e un testo per chi ha la versione vecchia', /testo:/.test(invio))

  // Verifica bloccante n.4 dello spec: ogni lettura ha il suo tetto.
  const lettura = azioni.match(/export async function leggiRicevute[\s\S]*?\n\}/)?.[0] ?? ''
  prova('la lettura delle ricevute ha un limite', /\.limit\(/.test(lettura))

  // Se l'invio non riesce il cartello TORNA SU: meglio uno di troppo che
  // uno di meno.
  const corpo = gancio.match(/const ricevuto = useCallback[\s\S]*?\n  \)/)?.[0] ?? ''
  prova('e se non riesce il cartello torna su', /catch/.test(corpo) && /setRicevute/.test(corpo))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
