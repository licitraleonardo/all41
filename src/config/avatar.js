// Avatar generati dall'API DiceBear. La versione sta qui: se un giorno
// cambia, si tocca una riga sola.

export const DICEBEAR_VERSIONE = '9.x'

export const STILI = [
  'adventurer',
  'bottts',
  'fun-emoji',
  'lorelei',
  'micah',
  'thumbs',
]

export const STILE_PREDEFINITO = STILI[0]

export function urlAvatar(stile, seed) {
  const s = STILI.includes(stile) ? stile : STILE_PREDEFINITO
  return `https://api.dicebear.com/${DICEBEAR_VERSIONE}/${s}/svg?seed=${encodeURIComponent(seed || 'all41')}`
}

// Un colore per ciascuno sul proprio nome, come nei gruppi di WhatsApp:
// con otto persone che scrivono, il colore si riconosce prima del nome.
// Scelti perché si leggono tutti su bianco e non si confondono fra loro.
const COLORI_NOME = [
  '#1B6E8C',
  '#B4562A',
  '#3F6E5C',
  '#8A4A7D',
  '#9A5B12',
  '#2F5FA8',
  '#A03A46',
  '#4C6B21',
]

// Sempre lo stesso colore per la stessa persona, su tutti i telefoni:
// dipende solo dall'id, non dall'ordine in cui sono arrivati i messaggi.
export function coloreNome(id) {
  const testo = String(id ?? '')
  let somma = 0
  for (let i = 0; i < testo.length; i++) somma = (somma * 31 + testo.charCodeAt(i)) >>> 0
  return COLORI_NOME[somma % COLORI_NOME.length]
}

// La faccia di Allan. Viene dalla stessa fonte degli avatar del gruppo e
// dallo stesso stile, cosi' e' della stessa famiglia — ma il seme e'
// fisso e l'espressione e' scelta, non sorteggiata: Allan non cambia
// faccia a ogni ricaricamento come fa la gente.
//
// occhi e bocca sono i nomi veri dello stile bottts. Cambiare questi due
// valori cambia il carattere della faccia, ed e' l'unico posto da toccare.
export const ALLAN_FACCIA = {
  stile: 'bottts',
  seme: 'allan',
  occhi: 'eva',
  bocca: 'diagram',
  sfondo: '0b3550',
}

export function urlAllan() {
  const { stile, seme, occhi, bocca, sfondo } = ALLAN_FACCIA
  const q = new URLSearchParams({
    seed: seme,
    eyes: occhi,
    mouth: bocca,
    backgroundColor: sfondo,
    radius: '50',
  })
  return `https://api.dicebear.com/${DICEBEAR_VERSIONE}/${stile}/svg?${q}`
}
