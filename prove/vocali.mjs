// Il vocale: un tocco parte, un tocco ferma, e la domanda arriva dopo.
//
// Il gesto in se' si prova solo su un telefono vero — serve un microfono
// e un dito. Quello che si prova qui e' la **scelta di fondo**, che e'
// l'unica cosa che puo' essere smontata per sbaglio da chi ci mette mano
// fra sei mesi:
//
//   il vocale parte SUBITO, e «era importante?» e' una correzione che
//   arriva dopo. Mai il contrario.
//
// Se un giorno qualcuno spostasse la domanda prima dell'invio — sembra
// piu' pulito, e sarebbe la cosa naturale da fare — un minuto di
// registrazione resterebbe appeso in memoria ad aspettare un tocco. Chi
// si distrae, o a cui si blocca il telefono, lo perde. In questa app un
// vocale perso e' gia' il difetto n.3, e non serve un secondo modo per
// perderlo.

import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

// ⚠️ Via i commenti prima di leggere.
//
// In questo progetto i commenti citano il codice che spiegano, quindi una
// prova che cerca `onPointerLeave` lo trova nella riga che dice «niente
// `onPointerLeave`». E' gia' successo con `prove/fogli.mjs`: tre
// segnalazioni, tutte e tre false.
const senzaCommenti = (t) =>
  t
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')

const vista = senzaCommenti(readFileSync('src/components/Vocali.jsx', 'utf8'))
const gancio = senzaCommenti(readFileSync('src/hooks/useVocali.js', 'utf8'))
const libreria = senzaCommenti(readFileSync('src/lib/vocali.js', 'utf8'))

console.log('\nil vocale parte prima che si parli di importante')
{
  const invio = vista.indexOf('inserisci(esito.vocale)')
  const domanda = vista.indexOf('setDaSegnare(esito.vocale.id)')
  prova('l invio c e', invio > 0)
  prova('la domanda c e', domanda > 0)
  prova('e la domanda viene DOPO', invio < domanda, { invio, domanda })

  // La prova che conta davvero: quello che si manda non porta con se'
  // nessuna risposta dell'utente. Se ricomparisse `importante` dentro la
  // chiamata, vorrebbe dire che qualcuno l'ha rimessa prima dell'invio.
  const chiamata = vista.match(/mandaVocale\(([^)]*)\)/)?.[1] ?? ''
  prova('e si manda senza aspettare risposte', !/importante/.test(chiamata), chiamata)
}

console.log('\nil gesto vecchio non e rimasto a meta')
{
  // Un pezzo di trascinamento dimenticato non da' errori: resta li' e
  // ogni tanto fa qualcosa che nessuno si aspetta piu'.
  prova('niente trascinamento', !/TRASCINAMENTO|partenzaY/.test(vista))
  prova('niente onPointerMove', !/onPointerMove/.test(vista))
  // ⚠️ `onPointerLeave` fermava la registrazione se il dito scivolava
  // via. Col tocco singolo allontanare il dito non vuol dire piu'
  // niente — e se ancora fermasse, non si potrebbe posare il telefono
  // mentre si parla, che e' esattamente il motivo per cui il gesto e'
  // stato cambiato.
  prova('niente onPointerLeave', !/onPointerLeave/.test(vista))
  prova('si registra con un click', /onClick=\{registrando \? ferma : avvia\}/.test(vista))
}

console.log('\ndue tocchi nervosi non lasciano il microfono acceso')
{
  // Fra il tocco e `setRegistrando(true)` c'e' il permesso del microfono,
  // e in quel buco `registrando` e' ancora falso. Col tocco singolo il
  // rischio e' piu' alto di prima: «tocca» e «tocca di nuovo» sono ormai
  // lo stesso gesto.
  prova('la guardia c e ancora', /staPartendo\.current/.test(vista))
  prova('ed e un ref, non uno stato', /const staPartendo = useRef\(false\)/.test(vista))
  prova('e si rimette a posto sempre', /finally\s*\{[\s\S]{0,200}staPartendo\.current = false/.test(vista))
}

console.log('\nimportante vale per tutti, non solo per chi lo preme')
{
  // Stesso difetto delle eliminazioni, gia' pagato una volta: il bollino
  // compariva solo sul telefono di chi l'aveva premuto, e sugli altri
  // sette il vocale restava uno qualunque — cioe' proprio quello che
  // segnarlo doveva evitare.
  prova('il realtime ascolta gli UPDATE', /event: 'UPDATE'/.test(gancio))
  prova('e non guarda solo le eliminazioni', /importante: Boolean\(riga\.importante\)/.test(gancio))

  // E se non riesce, il bollino torna indietro: una promessa fatta agli
  // altri sette non si lascia a schermo quando non e' partita.
  prova('se non riesce, il bollino torna indietro', /importante: false/.test(gancio))
}

console.log('\nsi puo solo accendere')
{
  // E' un ripensamento di un secondo dopo, non un interruttore da
  // rigirare: cosi' non serve decidere cosa vuol dire toglierlo dopo che
  // gli altri l'hanno gia' visto.
  const corpo = libreria.match(/export async function segnaImportante[\s\S]*?\n\}/)?.[0] ?? ''
  prova('segnaImportante esiste', corpo.length > 0)
  prova('e scrive solo true', /importante: true/.test(corpo) && !/importante: false/.test(corpo))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
