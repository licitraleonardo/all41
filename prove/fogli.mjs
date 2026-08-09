// Come si esce da un foglio, e chi non deve poterne uscire per sbaglio.
//
// Le tre uscite (tocco fuori, tasto indietro, Esc) stanno tutte dentro
// `components/Foglio.jsx`, e si provano nel browser perché sono fatte di
// eventi veri. Quello che si puo' provare qui e' l'altra meta': che
// nessuno **rifaccia un foglio a mano** saltando quel componente, e che
// le tre eccezioni restino eccezioni dichiarate invece di diventare
// dimenticanze.
//
// E' la stessa forma di `prove/sql-una-sola-volta.mjs`: si legge il
// sorgente e si controlla una regola che nessun test di comportamento
// prenderebbe, perche' il difetto e' proprio l'assenza di una riga.

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

const CARTELLA = 'src/components'
const files = readdirSync(CARTELLA).filter((f) => f.endsWith('.jsx'))
const testo = Object.fromEntries(
  files.map((f) => [f, readFileSync(join(CARTELLA, f), 'utf8')])
)

// ⚠️ Senza questo la prova legge anche i commenti, e in questo progetto i
// commenti citano il codice che spiegano: la riga che dice «qui non si
// chiama mai history.back()» veniva contata come una chiamata a
// history.back(). Prima versione di questa prova: tre segnalazioni, tutte
// e tre false.
const codice = Object.fromEntries(
  files.map((f) => [
    f,
    testo[f]
      .split('\n')
      .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
      .join('\n'),
  ])
)

// I fogli veri: solo qui hanno senso le regole sulle uscite. Onboarding ha
// un tasto «Indietro» ma è una procedura a passi, non un foglio.
const fogli = files.filter((f) => /<Foglio[\s>]/.test(codice[f]))

console.log('\nil velo lo disegna un componente solo')
{
  // Chi se lo ridisegna a mano si porta dietro un foglio senza nessuna
  // delle tre uscite, e non se ne accorge nessuno: sembra uguale.
  const aMano = files.filter(
    (f) => f !== 'Foglio.jsx' && codice[f].includes('className="foglio-sfondo"')
  )
  prova('nessuno se lo rifa da solo', aMano.length === 0, aMano)
  prova('e qualcuno lo usa davvero', fogli.length >= 6, fogli)
}

console.log('\nsi esce con due parole sole in tutta l app')
{
  // L'appunto diceva: «adesso convivono Annulla, Lascia stare, Chiudi e
  // la ×». Ne restano due, e vogliono dire cose diverse: «Lascia stare»
  // si abbandona qualcosa, «Chiudi» si smette di guardare.
  const AMMESSE = ['Lascia stare', 'Chiudi']
  const VIETATE = ['Annulla', 'Indietro', 'Torna indietro', 'Esci']

  // Solo i fogli: l'Onboarding ha un «Indietro» ma è una procedura a
  // passi, e lì indietro vuol dire davvero il passo di prima.
  for (const f of fogli) {
    for (const v of VIETATE) {
      // Solo quando e' TUTTO il testo del bottone: «Annulla la partita»
      // vuol dire un'altra cosa e resta legittimo.
      const trovata = new RegExp(`>\\s*${v}\\s*<`).test(codice[f])
      prova(`${f}: niente «${v}» come uscita`, !trovata)
    }
  }
  prova('le due ammesse sono ancora quelle', AMMESSE.length === 2)
}

console.log('\nchi non deve chiudersi per sbaglio lo dichiara')
{
  // ⚠️ Queste tre non sono preferenze grafiche.
  //
  // Il foglio della punizione e' **l'unico posto in tutta l'app** in cui
  // viene detto perche' hai perso dei punti, e la Legge XIV si paga una
  // volta sola per viaggio: se sparisse per un tocco storto sul velo, chi
  // c'e' cascato non lo saprebbe mai.
  //
  // L'SOS e' l'unica funzione di sicurezza dell'app, e chi la sta usando
  // ha il telefono in mano mentre cammina.
  const DEVONO_RESISTERE = [
    ['FoglioSOS.jsx', "l'SOS"],
    ['Classifica.jsx', 'la punizione del Testamento e la proposta gia in voto'],
  ]

  for (const [f, cosa] of DEVONO_RESISTERE) {
    prova(`${f}: ${cosa}`, /chiudibileFuori=\{false\}/.test(codice[f] ?? ''))
  }

  // Classifica ne ha due, e devono esserlo tutte e due.
  const quante = (codice['Classifica.jsx'].match(/chiudibileFuori=\{false\}/g) ?? []).length
  prova('Classifica: tutti e due i suoi fogli', quante === 2, quante)
}

console.log('\nchi ci fa scrivere dentro avvisa prima di buttare via')
{
  // Un foglio con un campo di testo che si chiude al primo tocco sul velo
  // butta via quello che uno stava scrivendo, in silenzio. La regola:
  // se dentro un <Foglio> c'e' un campo, quel foglio dichiara `sporco`.
  const conCampo = fogli.filter((f) => /<input\s+type="text"|<textarea/.test(codice[f]))

  prova('ce ne sono, se no la prova non prova niente', conCampo.length >= 3, conCampo)
  for (const f of conCampo) {
    prova(`${f}: dichiara «sporco»`, /sporco=\{/.test(codice[f]))
  }
}

console.log('\nil componente non chiama mai history.back()')
{
  // La ragione lunga sta scritta dentro `Foglio.jsx`, e vale la pena
  // tenerla ferma: `back()` mette in coda un `popstate` che arriva
  // quando il foglio che l'ha chiesto non c'e' piu', e a raccoglierlo e'
  // il foglio aperto nel frattempo — che si chiude appena nato. E'
  // successo davvero, ed e' costato mezz'ora di caccia.
  const chiamate = ((codice['Foglio.jsx'] ?? '').match(/history\.back\(\)/g) ?? []).length
  prova('nessun history.back()', chiamate === 0, chiamate)
  // La ragione invece sta proprio nei commenti, quindi qui si legge il
  // file intero.
  prova('e la ragione e scritta li dentro', testo['Foglio.jsx'].includes('non si chiama mai'))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
