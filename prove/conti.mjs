// I casi scritti a mano: fissano il VERSO delle cose — chi paga è in
// credito, chi consuma è in debito — che una prova casuale non può
// controllare, perché resterebbe coerente anche coi segni invertiti.
// L'aritmetica su tante combinazioni la controlla conti-casuali.mjs.
import {
  inCentesimi,
  formattaEuro,
  dividi,
  calcolaSaldi,
  chiDeveAChi,
} from '../src/lib/saldi.js'

let falliti = 0
function prova(nome, condizione) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) falliti += 1
}

console.log('\ninCentesimi')
prova('12,50', inCentesimi('12,50') === 1250)
prova('12.50 col punto', inCentesimi('12.50') === 1250)
prova('interi', inCentesimi('12') === 1200)
prova('un decimale', inCentesimi('12,5') === 1250)
prova('zero', inCentesimi('0') === 0)
prova('spazi intorno', inCentesimi('  7,30 ') === 730)
prova('virgola secca', inCentesimi('12,') === 1200)
prova('lettere', inCentesimi('dodici') === null)
prova('tre decimali', inCentesimi('12,345') === null)
prova('negativo rifiutato', inCentesimi('-5') === null)
prova('vuoto', inCentesimi('') === null)
prova('niente', inCentesimi(null) === null)
prova('virgola e punto', inCentesimi('1.2,3') === null)

console.log('\nformattaEuro')
prova('1250', formattaEuro(1250) === '12,50 €')
prova('centesimi soli', formattaEuro(5) === '0,05 €')
prova('tondo', formattaEuro(4000) === '40,00 €')
prova('negativo', formattaEuro(-1250) === '-12,50 €')
prova('zero', formattaEuro(0) === '0,00 €')

console.log('\ndividi')
const tre = dividi(1000, 3)
prova('somma invariata', tre.reduce((a, b) => a + b, 0) === 1000)
prova('resto ai primi', JSON.stringify(tre) === '[334,333,333]')
prova('divisione esatta', JSON.stringify(dividi(900, 3)) === '[300,300,300]')
prova('uno solo', JSON.stringify(dividi(777, 1)) === '[777]')
prova('otto persone', dividi(1000, 8).reduce((a, b) => a + b, 0) === 1000)
prova('zero persone', dividi(100, 0).length === 0)

console.log('\ncalcolaSaldi')
const membri = ['a', 'b', 'c']

// Caso base: A paga 30 per tutti e tre.
let saldi = calcolaSaldi(
  [{ centesimi: 3000, paganti: ['a'], divisaFra: ['a', 'b', 'c'], eliminata: false }],
  [],
  membri
)
prova('chi paga è in credito', saldi.a === 2000)
prova('gli altri in debito', saldi.b === -1000 && saldi.c === -1000)
prova('somma zero', saldi.a + saldi.b + saldi.c === 0)

// Divisione che non torna: 10,00 fra tre.
saldi = calcolaSaldi(
  [{ centesimi: 1000, paganti: ['a'], divisaFra: ['a', 'b', 'c'], eliminata: false }],
  [],
  membri
)
prova(
  'resto: somma comunque zero',
  saldi.a + saldi.b + saldi.c === 0
)
prova('il centesimo in più tocca al primo in ordine', saldi.a === 1000 - 334)

// Spesa che non riguarda tutti.
saldi = calcolaSaldi(
  [{ centesimi: 2000, paganti: ['a'], divisaFra: ['a', 'b'], eliminata: false }],
  [],
  membri
)
prova('chi è fuori resta a zero', saldi.c === 0)
prova('divisa in due', saldi.a === 1000 && saldi.b === -1000)

// Spesa eliminata.
saldi = calcolaSaldi(
  [
    { centesimi: 3000, paganti: ['a'], divisaFra: ['a', 'b', 'c'], eliminata: false },
    { centesimi: 9900, paganti: ['b'], divisaFra: ['a', 'b', 'c'], eliminata: true },
  ],
  [],
  membri
)
prova('la spesa eliminata non conta', saldi.a === 2000)

// Rimborso.
saldi = calcolaSaldi(
  [{ centesimi: 3000, paganti: ['a'], divisaFra: ['a', 'b', 'c'], eliminata: false }],
  [{ da: 'b', a: 'a', centesimi: 1000, eliminato: false }],
  membri
)
prova('chi ha restituito torna a zero', saldi.b === 0)
prova('chi ha ricevuto scende', saldi.a === 1000)
prova('somma ancora zero', saldi.a + saldi.b + saldi.c === 0)

// Rimborso eliminato.
saldi = calcolaSaldi(
  [{ centesimi: 3000, paganti: ['a'], divisaFra: ['a', 'b', 'c'], eliminata: false }],
  [{ da: 'b', a: 'a', centesimi: 1000, eliminato: true }],
  membri
)
prova('il rimborso eliminato non conta', saldi.b === -1000)

// Persona uscita dal gruppo.
saldi = calcolaSaldi(
  [{ centesimi: 3000, paganti: ['a'], divisaFra: ['a', 'b', 'zzz'], eliminata: false }],
  [],
  membri
)
prova('sconosciuti ignorati, conti a zero', saldi.a + saldi.b + saldi.c === 0)
prova('divisa fra chi resta', saldi.a === 1500 && saldi.b === -1500)

// Chi ha pagato non è più nel gruppo: la spesa si salta tutta.
saldi = calcolaSaldi(
  [{ centesimi: 3000, paganti: ['zzz'], divisaFra: ['a', 'b'], eliminata: false }],
  [],
  membri
)
prova('spesa di uno sconosciuto saltata', saldi.a === 0 && saldi.b === 0)

console.log('\npiù paganti')

// A e B pagano 30 insieme, si divide fra tutti e tre.
saldi = calcolaSaldi(
  [{ centesimi: 3000, paganti: ['a', 'b'], divisaFra: ['a', 'b', 'c'], eliminata: false }],
  [],
  membri
)
prova('ognuno ha messo 15 e consumato 10', saldi.a === 500 && saldi.b === 500)
prova('chi non ha pagato deve la sua parte', saldi.c === -1000)
prova('somma zero', saldi.a + saldi.b + saldi.c === 0)

// Pagano in due, ma la spesa riguarda solo loro due: conti in pari.
saldi = calcolaSaldi(
  [{ centesimi: 2000, paganti: ['a', 'b'], divisaFra: ['a', 'b'], eliminata: false }],
  [],
  membri
)
prova('pagata e consumata dagli stessi: tutti a zero', saldi.a === 0 && saldi.b === 0)

// Il caso cattivo: due divisioni che non tornano nella stessa spesa.
// 10,00 messi da 3 persone e divisi fra 7.
const sette = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']
saldi = calcolaSaldi(
  [{ centesimi: 1000, paganti: ['m1', 'm2', 'm3'], divisaFra: sette, eliminata: false }],
  [],
  sette
)
// Messo: 334, 333, 333. Consumato: 143 a testa tranne l'ultimo, 142.
prova(
  'due resti nella stessa spesa: somma comunque zero',
  Object.values(saldi).reduce((a, b) => a + b, 0) === 0
)
prova('chi ha messo il centesimo in più lo ritrova', saldi.m1 === 334 - 143)
prova('gli altri due paganti', saldi.m2 === 333 - 143 && saldi.m3 === 333 - 143)
prova('chi ha solo consumato', saldi.m4 === -143 && saldi.m7 === -142)

// Un pagante che non è nel gruppo: si tiene il resto invece di buttare
// tutta la spesa.
saldi = calcolaSaldi(
  [{ centesimi: 2000, paganti: ['a', 'zzz'], divisaFra: ['a', 'b'], eliminata: false }],
  [],
  membri
)
prova('resta il pagante conosciuto', saldi.a === 1000 && saldi.b === -1000)
prova('somma zero anche così', saldi.a + saldi.b + saldi.c === 0)

// Nessun pagante conosciuto: la spesa si salta tutta.
saldi = calcolaSaldi(
  [{ centesimi: 2000, paganti: ['zzz', 'yyy'], divisaFra: ['a', 'b'], eliminata: false }],
  [],
  membri
)
prova('senza paganti noti la spesa non conta', saldi.a === 0 && saldi.b === 0)

// Elenco vuoto di paganti: non deve dividere per zero.
saldi = calcolaSaldi(
  [{ centesimi: 2000, paganti: [], divisaFra: ['a', 'b'], eliminata: false }],
  [],
  membri
)
prova('paganti vuoti: nessun NaN', Object.values(saldi).every((v) => Number.isInteger(v)))
prova('paganti vuoti: tutto a zero', saldi.a === 0 && saldi.b === 0)

console.log('\nchiDeveAChi')
let passaggi = chiDeveAChi({ a: 2000, b: -1000, c: -1000 })
prova('due passaggi', passaggi.length === 2)
prova('tutti verso il creditore', passaggi.every((p) => p.a === 'a'))
prova(
  'gli importi coprono il credito',
  passaggi.reduce((s, p) => s + p.centesimi, 0) === 2000
)

passaggi = chiDeveAChi({ a: 0, b: 0, c: 0 })
prova('conti pari: nessun passaggio', passaggi.length === 0)

passaggi = chiDeveAChi({ a: 1500, b: 500, c: -2000 })
prova('un debitore verso due creditori', passaggi.length === 2)
prova('prima il credito più grosso', passaggi[0].a === 'a' && passaggi[0].centesimi === 1500)

// Caso vero: otto persone, spese sparse.
const otto = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8']
const spese = [
  { centesimi: 12040, paganti: ['m1'], divisaFra: otto, eliminata: false },
  { centesimi: 3350, paganti: ['m3'], divisaFra: ['m3', 'm4', 'm5'], eliminata: false },
  { centesimi: 8000, paganti: ['m7'], divisaFra: otto, eliminata: false },
  { centesimi: 999, paganti: ['m2'], divisaFra: ['m1', 'm2'], eliminata: false },
  // Il van pagato in tre e diviso fra tutti: il caso vero.
  { centesimi: 97460, paganti: ['m2', 'm5', 'm8'], divisaFra: otto, eliminata: false },
]
const saldiOtto = calcolaSaldi(spese, [{ da: 'm4', a: 'm1', centesimi: 500, eliminato: false }], otto)
const somma = Object.values(saldiOtto).reduce((a, b) => a + b, 0)
prova('otto persone: somma zero', somma === 0)

const passaggiOtto = chiDeveAChi(saldiOtto)
const daPagare = Object.values(saldiOtto).filter((v) => v < 0).reduce((a, b) => a - b, 0)
prova(
  'i passaggi saldano tutto il dovuto',
  passaggiOtto.reduce((s, p) => s + p.centesimi, 0) === daPagare
)
prova('nessun passaggio a sé stessi', passaggiOtto.every((p) => p.da !== p.a))
prova('nessun importo a zero o negativo', passaggiOtto.every((p) => p.centesimi > 0))

// Applicando i passaggi, tutti tornano a zero.
const dopo = { ...saldiOtto }
for (const p of passaggiOtto) {
  dopo[p.da] += p.centesimi
  dopo[p.a] -= p.centesimi
}
prova('dopo i passaggi sono tutti a zero', Object.values(dopo).every((v) => v === 0))

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
