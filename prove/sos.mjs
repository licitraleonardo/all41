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

  // ⚠️ E chiudere il **proprio** cartello si scrive, come tutti gli altri.
  //
  // Prima no: sul proprio SOS il tasto usciva prima di scrivere qualsiasi
  // cosa, perche' «Francy ha ricevuto l'SOS di Francy» in chat non vuol
  // dire niente e sembrava una riga sprecata. Ma quella riga era anche
  // l'unica **memoria** della chiusura: la riga finta vive solo dentro lo
  // schermo, e la prima rilettura — un evento dal database, l'app che
  // torna avanti, la rete che rientra — la spazzava via e il cartello
  // tornava su. Chi aveva mandato l'SOS non riusciva piu' a toglierselo.
  //
  // Quindi: fra il momento in cui sparisce dallo schermo e la scrittura
  // non ci deve essere nessuna uscita.
  // ⚠️ Niente `slice` fra due indici, e niente `\b` nella regex.
  //
  // La prima versione tagliava il file fra due indici e cercava
  // `/\breturn\b/`. Rimettendo il difetto dentro il codice restava
  // verde, ed e' il terzo strumento di misura che mi mente in questo
  // progetto. La causa era invisibile: passando la regex da una shell,
  // `\b` era diventato un vero carattere di **backspace** — la prova
  // cercava un carattere di controllo che non esiste in nessun file, e
  // quindi era falsa sempre.
  //
  // Una condizione diretta sul sorgente, senza tagli e senza scorciatoie
  // di regex, non ha finestre in cui sbagliare.
  prova('il tasto scrive la ricevuta', /await mandaRicevuta\(/.test(gancio))

  // ⚠️ Si guarda il **tratto** fra «sparisce dallo schermo» e «si
  // scrive», e ci si chiede se dentro c'è un'uscita. Qualunque.
  //
  // Scritta come `!/autoreId === ioId\) return/` chiedeva tre cose
  // insieme: l'ordine degli operandi, la parentesi attaccata e il
  // `return` sulla stessa riga. Bastava invertire il confronto o mettere
  // le graffe per passarci in mezzo, e il difetto tornava con la prova
  // verde — provato rimettendolo dentro.
  //
  // Niente regex: due `indexOf` e una ricerca di sottostringa non hanno
  // finestre in cui sbagliare.
  const daSchermo = gancio.indexOf('setRicevute((p) => [finto')
  const aScrittura = gancio.indexOf('mandaRicevuta(', daSchermo)
  const inMezzo = daSchermo >= 0 && aScrittura > daSchermo ? gancio.slice(daSchermo, aScrittura) : ''
  prova('il tratto fra schermo e scrittura esiste', inMezzo.length > 0)
  prova('e non c e nessuna uscita in mezzo', !inMezzo.includes('return'), inMezzo)

  // E a non farla vedere ci pensa la chat: nascondere e non scrivere sono
  // due cose diverse, e qui serviva la prima.
  const feed = senzaCommenti(readFileSync('src/components/Feed.jsx', 'utf8'))
  prova('e la chat non disegna la ricevuta del proprio SOS', /sosDi === azione\.autoreId/.test(feed))

  // Se l'invio non riesce il cartello TORNA SU: meglio uno di troppo che
  // uno di meno.
  const corpo = gancio.match(/const ricevuto = useCallback[\s\S]*?\n  \)/)?.[0] ?? ''
  // ⚠️ Si guarda **dentro il `catch`**, non dentro tutta la funzione.
  //
  // Scritta come `/setRicevute/.test(corpo)` su tutto il corpo era sempre
  // vera: `setRicevute` c'è già nella riga ottimistica in cima, quella
  // che il cartello lo toglie. Cancellando il rimedio dentro il `catch`
  // la prova restava verde — provato — mentre in app premere «Ricevuto»
  // senza campo faceva sparire il cartello senza aver scritto niente:
  // chi si è perso non vede nessuna ricevuta, e chi ha premuto crede di
  // aver risposto e non può nemmeno ripremere.
  const dopoIlTry = corpo.slice(corpo.indexOf('} catch'))
  prova('il rimedio esiste', dopoIlTry.length > 0)
  prova(
    'e se non riesce il cartello torna su',
    dopoIlTry.includes('setRicevute') && dopoIlTry.includes('return false'),
    dopoIlTry.slice(0, 200)
  )
}

console.log('\nuna lettura in ritardo non puo scrivere sopra a una piu recente')
{
  // ⚠️ `carica()` parte a ogni evento su `quick_actions`, e durante un
  // SOS quegli eventi sono tanti: sette ricevute piu' i messaggi. Le
  // letture partono in parallelo, e senza numerarle vince **l'ultima che
  // arriva**, non l'ultima che parte. Bastava che una lettura partita
  // prima del tuo «Ricevuto» atterrasse dopo, e la tua ricevuta spariva:
  // il cartello ti tornava su gia' chiuso, lo ripremevi, e in chat
  // comparivano due righe.
  prova('le letture sono numerate', /let giro = 0/.test(gancio))
  prova('e solo la piu recente puo scrivere', /mio === giro/.test(gancio))

  const dentroCarica = gancio.slice(gancio.indexOf('const carica = ()'), gancio.indexOf('carica()\n'))
  prova('la numerazione e dentro carica', /giro \+= 1/.test(dentroCarica), dentroCarica.slice(0, 120))
  const scritture = (dentroCarica.match(/attuale\(\)/g) ?? []).length
  prova('e la guardia copre tutte e due le letture', scritture === 2, scritture)

  // E la riga vera prende il posto di quella finta senza aspettare il
  // realtime: fra l'una e l'altro c'era una finestra in cui una
  // rilettura non conteneva ne' la finta ne' la vera.
  prova('la riga vera sostituisce quella finta', /r\.id !== finto\.id/.test(gancio))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
