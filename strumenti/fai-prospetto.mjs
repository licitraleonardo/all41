// Il prospetto delle Leggi e dei Trofei, generato da `config/leggi.js`.
//
// ⚠️ Generato e non scritto a mano, per la stessa ragione per cui la
// Guida diceva «sono 49» quando le attive erano 39: una tabella copiata
// a mano mente al primo ritocco, e mente in silenzio.
//
// Si rifà con: npm run prospetto

import { writeFileSync } from 'node:fs'
import { LEGGI, TROFEI, PUNIZIONI, etichetta } from '../src/config/leggi.js'

const numero = (l) => etichetta(l).replace(/^(Trofeo|Legge) /, '')
const tuttiQuanti = (l) => (l.bersaglio === 'tutti' ? ' **(colpisce tutti)**' : '')
const riga = (l) => `| ${numero(l)} | ${l.punti} | ${l.testo}${tuttiQuanti(l)} |`
const rigaConNome = (l) => `| ${etichetta(l)} | ${l.punti} | ${l.testo}${tuttiQuanti(l)} |`

const vive = (elenco) => elenco.filter((l) => l.attiva)
const spente = (elenco) => elenco.filter((l) => !l.attiva)

const attive = LEGGI.filter((l) => l.attiva).length

const testo = `# Leggi e Trofei — il foglio degli spoiler

> ⚠️ **Serve a chi tiene l'app, non al gruppo.** Tutto il gioco sta nel
> non sapere: le Leggi si scoprono facendole scattare, e da stasera la
> Guida non ne parla più. Questo file è l'unico posto in cui sono scritte.

Generato da \`src/config/leggi.js\` con \`npm run prospetto\`. Non si scrive
a mano: una tabella copiata a mano mente al primo ritocco, ed è già
successo — la Guida ha detto «sono 49» per un giorno intero mentre le
attive erano 39.

**${LEGGI.length} in tutto**: ${TROFEI.length} trofei e ${PUNIZIONI.length} leggi. Ne possono scattare **${attive}**.

## Come si sbloccano

Nessuna è nota all'inizio: il Testamento parte tutto oscurato. Scattano
da sole quando fai la cosa descritta, e la scoperta è **collettiva** — la
prima volta che una scatta su chiunque, si sblocca per tutto il gruppo.
Il motivo compare in Classifica nell'istante in cui succede.

## Trofei che possono scattare (${vive(TROFEI).length})

| | Punti | Come si sblocca |
|---|---|---|
${vive(TROFEI).map(riga).join('\n')}

## Leggi che possono scattare (${vive(PUNIZIONI).length})

| | Punti | Come scatta |
|---|---|---|
${vive(PUNIZIONI).map(riga).join('\n')}

## ⚠️ Quelle che non scatteranno mai (${spente(LEGGI).length})

Esistono nel codice ma niente le fa partire: dipendono da pezzi che non
sono stati costruiti. Nel Testamento restano oscurate come tutte le non
scoperte, quindi non si nota — ma **nessuno le troverà**.

| | Punti | Cosa dovrebbe fare |
|---|---|---|
${spente(LEGGI).map(rigaConNome).join('\n')}

## Cosa costa accenderle

Misurato il 10 agosto guardando cosa manca a ciascuna, non a occhio.

**Quasi gratis — il dato c'è già, manca la chiamata**

- *Tre sfide della caccia vinte*: \`vinte\` è già contato in \`useSfide\`.
- *Primo del gruppo la mattina* e *un giorno intero senza aprire l'app*:
  si leggono da \`last_seen_at\`, che \`src/lib/membri.js\` scrive a ogni
  visita, dentro \`allApertura()\` che gira già a ogni avvio.

**Un meccanismo solo, e poi vengono insieme**

- *Nessuno ha caricato foto per un giorno* e *nessun vocale in tutto il
  viaggio*: sono cose che **non** succedono, quindi non hanno un gesto
  che le faccia scattare. Serve un controllo «com'è andata ieri»
  all'apertura, scritto una volta e riusato.

**Lavoro vero**

- Le tre sui sondaggi (*unico ad aver votato*, *ultimo a votare*,
  *opzione perdente tre volte*): il dato c'è (\`chiusoIl\`, i voti), manca
  chi tira le somme quando un sondaggio si chiude.
- *Eri Maglia Nera e non lo sei più*: \`magliaNeraDelGiorno()\` esiste già
  in \`lib/classifica.js\`, ma serve ricordare quella di ieri per
  confrontarla.
`

writeFileSync('LEGGI-E-TROFEI.md', testo)
console.log(`  LEGGI-E-TROFEI.md — ${LEGGI.length} voci, ${attive} attive\n`)
