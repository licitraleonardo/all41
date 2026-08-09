// I numeri utili: l'unica schermata che deve funzionare cascasse il mondo.
//
// Il file `config/info.js` porta un avviso in cima — qui dentro non si
// scrive niente a memoria — ma un avviso e' un commento, e un commento
// non ferma nessuno. Queste prove sono la parte dell'avviso che si fa
// sentire: controllano le cose che, se sbagliate, si scoprono solo nel
// momento in cui uno ha davvero bisogno di chiamare.
//
// Non controllano se un numero e' GIUSTO — quello lo puo' dire solo chi
// lo verifica alla fonte. Controllano che sia **chiamabile**, che sia
// **al posto giusto**, e che l'elenco di quello che manca non dica il
// falso.

import { DA_TROVARE, DOVE, EMERGENZE, UTILI } from '../src/config/info.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

const tutti = [...EMERGENZE, ...UTILI]

console.log('\nogni numero si puo davvero chiamare')
{
  // `Info.jsx` costruisce l'href togliendo gli spazi. Se in un numero
  // finisce un trattino, una parentesi o un "+39 " scritto a mano, il
  // `tel:` esce storto e su qualche telefono non parte proprio — e non se
  // ne accorge nessuno finche' non serve.
  for (const n of tutti) {
    const href = n.numero.replace(/\s/g, '')
    prova(`${n.cosa}: solo cifre`, /^\d+$/.test(href), n.numero)
  }
  prova(
    'nessuno e scritto col prefisso internazionale a mano',
    tutti.every((n) => !n.numero.includes('+')),
    tutti.filter((n) => n.numero.includes('+')).map((n) => n.numero)
  )
}

console.log('\nogni voce dice cosa e, non solo il numero')
{
  // Un numero senza etichetta e' un numero che nessuno chiama: in mezzo
  // agli altri non si sa cosa succede se lo premi.
  for (const n of tutti) {
    prova(`${n.numero} ha un nome`, typeof n.cosa === 'string' && n.cosa.trim().length > 0)
    prova(
      `${n.numero} ha un dettaglio`,
      typeof n.dettaglio === 'string' && n.dettaglio.trim().length > 0
    )
  }
}

console.log('\nle emergenze sono poche, gratuite e sempre aperte')
{
  // La lista rossa si scorre con gli occhi mentre sta succedendo
  // qualcosa: ogni riga in piu' e' tempo. Se un giorno qualcuno ha voglia
  // di aggiungerci la sesta cosa utile, questa prova lo ferma e lo manda
  // in UTILI, che e' dove si legge con calma.
  prova('non sono piu di quattro', EMERGENZE.length <= 4, EMERGENZE.length)

  // I numeri brevi (112, 1530, 1515) sono gratuiti e valgono su tutta
  // l'isola: sono gli unici che meritano il rosso.
  prova(
    'sono tutti numeri brevi, quindi gratuiti',
    EMERGENZE.every((e) => e.numero.length <= 4),
    EMERGENZE.map((e) => e.numero)
  )

  prova(
    'ognuna dice quando risponde',
    EMERGENZE.every((e) => typeof e.quando === 'string' && e.quando.trim().length > 0)
  )

  prova('il 112 c e, ed e il primo', EMERGENZE[0]?.numero === '112')
}

console.log('\nnessun numero compare due volte')
{
  const visti = tutti.map((n) => n.numero.replace(/\s/g, ''))
  prova('nessun doppione fra emergenze e utili', new Set(visti).size === visti.length, visti)
}

console.log('\ni numeri locali dicono quando sono aperti')
{
  // Un numero che non risponde alle tre di notte e' peggio di un numero
  // che dice "chiuso": chi chiama pensa che non arrivi aiuto.
  //
  // I due contatti personali del viaggio (la barca, il van) sono esclusi:
  // di quelli non conosciamo gli orari, e fingere di saperli sarebbe la
  // stessa bugia che questo file esiste per evitare.
  const conOrario = UTILI.filter((u) => u.numero.startsWith('070'))
  prova('ce n e almeno uno', conOrario.length > 0)
  for (const u of conOrario) {
    prova(
      `${u.cosa}: dice quando risponde`,
      typeof u.quando === 'string' && u.quando.trim().length > 0
    )
  }
}

console.log('\nquello che manca e scritto come manca, e non mente')
{
  // Se il telefono della struttura fosse stato riempito, "ancora da
  // trovare" direbbe il falso — e chi lo legge smetterebbe di cercarlo.
  const parlaDellaCasa = DA_TROVARE.some((c) => /affitta|struttura|villaggio/i.test(c))
  prova(
    'se manca il telefono della casa, l elenco lo dice',
    DOVE.telefono ? !parlaDellaCasa : parlaDellaCasa,
    { telefono: DOVE.telefono, daTrovare: DA_TROVARE }
  )

  // La trappola vera: uno mette il numero, si dimentica di togliere la
  // riga, e l'app continua a dire che manca una cosa che c'e'.
  const cifreNote = tutti.map((n) => n.numero.replace(/\s/g, ''))
  prova(
    'non chiede numeri che sono gia dentro',
    DA_TROVARE.every((c) => !cifreNote.some((d) => c.replace(/\s/g, '').includes(d))),
    DA_TROVARE
  )
}

console.log('\nle info stanno nel codice, non sul database')
{
  // E' la ragione per cui questo file esiste invece di una tabella: se
  // servono, servono col telefono che non prende. Basta che siano
  // costanti esportate — se un domani qualcuno le trasformasse in una
  // lettura, questa prova non ci sarebbe piu' e si noterebbe.
  prova('gli elenchi sono array veri', Array.isArray(EMERGENZE) && Array.isArray(UTILI))
  prova('e non sono vuoti', EMERGENZE.length > 0 && UTILI.length > 0)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
