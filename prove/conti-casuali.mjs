// Non si provano tutte le combinazioni possibili: sono infinite. Si
// provano le PROPRIETÀ che devono valere in ognuna, su tante situazioni
// generate a caso. Se una proprietà regge su centomila casi storti,
// regge anche sul viaggio.
//
// Le quattro che contano, coi soldi:
//   1. la somma di tutti i saldi fa esattamente zero (nessun centesimo
//      creato o perso)
//   2. eseguendo i passaggi suggeriti, tutti finiscono esattamente a zero
//   3. nessuno paga sé stesso, e nessun passaggio è di zero o negativo
//   4. lo stesso identico elenco di passaggi esce su ogni telefono, in
//      qualunque ordine arrivino i dati dal database

import { calcolaSaldi, chiDeveAChi, chiPagaChi } from '../src/lib/saldi.js'

// Generatore con seme: se un caso fallisce, si rilancia identico invece
// di sperare che ricapiti.
let seme = 20260803
function caso() {
  seme = (seme * 1103515245 + 12345) & 0x7fffffff
  return seme / 0x7fffffff
}
const fra = (min, max) => min + Math.floor(caso() * (max - min + 1))
const scegli = (elenco) => elenco[fra(0, elenco.length - 1)]

function sottoinsieme(elenco, minimo = 1) {
  const quanti = fra(minimo, elenco.length)
  const copia = [...elenco]
  const preso = []
  for (let i = 0; i < quanti; i += 1) {
    preso.push(copia.splice(fra(0, copia.length - 1), 1)[0])
  }
  return preso
}

function mescola(elenco) {
  const copia = [...elenco]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = fra(0, i)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function generaSituazione() {
  const quanti = fra(2, 10)
  const membri = Array.from({ length: quanti }, (_, i) => `m${String(i).padStart(2, '0')}`)
  // Qualche id che non è nel gruppo: gente uscita, o dati vecchi.
  const estranei = ['fuori-1', 'fuori-2']
  const tuttiPossibili = [...membri, ...estranei]

  const spese = Array.from({ length: fra(0, 15) }, () => ({
    centesimi: fra(1, 500000),
    // A volte si pescano anche estranei, per vedere che non rompano.
    paganti: caso() < 0.15 ? sottoinsieme(tuttiPossibili) : sottoinsieme(membri),
    divisaFra: caso() < 0.15 ? sottoinsieme(tuttiPossibili) : sottoinsieme(membri),
    eliminata: caso() < 0.12,
  }))

  const pagamenti = Array.from({ length: fra(0, 10) }, () => ({
    da: scegli(tuttiPossibili),
    a: scegli(tuttiPossibili),
    centesimi: fra(1, 200000),
    eliminato: caso() < 0.12,
  }))

  return { membri, spese, pagamenti }
}

let falliti = 0
const primoFallimento = {}

function controlla(nome, condizione, dettaglio) {
  if (condizione) return
  falliti += 1
  if (!primoFallimento[nome]) primoFallimento[nome] = dettaglio
}

const GIRI = 100000
let conPassaggi = 0
let maxPassaggi = 0

for (let giro = 0; giro < GIRI; giro += 1) {
  const { membri, spese, pagamenti } = generaSituazione()
  const saldi = calcolaSaldi(spese, pagamenti, membri)

  // 1. nessun centesimo creato o perso
  const somma = Object.values(saldi).reduce((a, b) => a + b, 0)
  controlla('somma zero', somma === 0, { somma, membri, spese, pagamenti })

  // interi sempre: mai un mezzo centesimo in giro
  controlla(
    'sempre interi',
    Object.values(saldi).every(Number.isInteger),
    { saldi }
  )

  const passaggi = chiDeveAChi(saldi)
  if (passaggi.length > 0) conPassaggi += 1
  maxPassaggi = Math.max(maxPassaggi, passaggi.length)

  // ⚠️ Le stesse proprieta', ma sui passaggi che l'app mostra davvero:
  // quelli a coppie, dove si rende a chi ha messo i soldi per te.
  //
  // Il modo di chiudere i conti e' cambiato dopo tre giri di «non mi
  // torna»: le cifre erano giuste e le istruzioni non erano ricavabili
  // — «dai 3,20 a Marco» a uno che con Marco non aveva diviso niente.
  // Cambiando il modello queste proprieta' vanno riverificate da zero:
  // un modo diverso di chiudere gli stessi conti puo' benissimo perdere
  // un centesimo per strada, e non lo direbbe nessuno.
  const aCoppie = chiPagaChi(spese, pagamenti, membri)

  const dopoCoppie = { ...saldi }
  for (const p of aCoppie) {
    dopoCoppie[p.da] += p.centesimi
    dopoCoppie[p.a] -= p.centesimi
  }
  controlla(
    'a coppie: tutti finiscono a zero',
    membri.every((id) => dopoCoppie[id] === 0),
    { dopoCoppie, aCoppie, spese, pagamenti }
  )
  controlla(
    'a coppie: nessuno paga se stesso, e mai zero',
    aCoppie.every((p) => p.da !== p.a && p.centesimi > 0 && Number.isInteger(p.centesimi)),
    { aCoppie }
  )
  controlla(
    'a coppie: solo gente del gruppo',
    aCoppie.every((p) => membri.includes(p.da) && membri.includes(p.a)),
    { aCoppie, membri }
  )

  // ⚠️ E la lista esce identica su ogni telefono, in qualunque ordine
  // arrivino le spese dal database. Senza, due persone vedrebbero due
  // conti diversi per le stesse spese e avrebbero ragione tutte e due.
  controlla(
    'a coppie: stesso elenco in qualunque ordine',
    JSON.stringify(aCoppie) === JSON.stringify(chiPagaChi(mescola(spese), pagamenti, membri)),
    { aCoppie }
  )

  // 3. passaggi sensati
  controlla(
    'nessuno paga sé stesso',
    passaggi.every((p) => p.da !== p.a),
    { passaggi }
  )
  controlla(
    'nessun importo nullo o negativo',
    passaggi.every((p) => p.centesimi > 0 && Number.isInteger(p.centesimi)),
    { passaggi }
  )
  controlla(
    'non si paga più del dovuto',
    passaggi.reduce((s, p) => s + p.centesimi, 0) ===
      Object.values(saldi).reduce((s, v) => (v < 0 ? s - v : s), 0),
    { passaggi, saldi }
  )

  // 2. eseguendo i passaggi, tutti a zero
  const dopo = { ...saldi }
  for (const p of passaggi) {
    dopo[p.da] += p.centesimi
    dopo[p.a] -= p.centesimi
  }
  controlla(
    'dopo i passaggi tutti a zero',
    Object.values(dopo).every((v) => v === 0),
    { dopo, saldi, passaggi }
  )

  // 4. stesso risultato su ogni telefono, in qualunque ordine arrivino
  const saldiMescolati = calcolaSaldi(mescola(spese), mescola(pagamenti), mescola(membri))
  controlla(
    'stessi saldi in qualunque ordine',
    membri.every((id) => saldi[id] === saldiMescolati[id]),
    { saldi, saldiMescolati }
  )
  controlla(
    'stessi passaggi in qualunque ordine',
    JSON.stringify(passaggi) === JSON.stringify(chiDeveAChi(saldiMescolati)),
    { passaggi, altri: chiDeveAChi(saldiMescolati) }
  )
}

console.log(`\n${GIRI.toLocaleString('it-IT')} situazioni generate a caso`)
console.log(`  gruppi da 2 a 10 persone, fino a 15 spese e 10 rimborsi ciascuna`)
console.log(`  ${conPassaggi.toLocaleString('it-IT')} con dei conti da chiudere`)
console.log(`  al massimo ${maxPassaggi} passaggi per chiudere tutto\n`)

if (falliti === 0) {
  console.log('Tutte le proprietà reggono.\n')
} else {
  console.log(`${falliti} violazioni. Prima di ognuna:`)
  console.log(JSON.stringify(primoFallimento, null, 2).slice(0, 3000))
}

process.exit(falliti === 0 ? 0 : 1)
