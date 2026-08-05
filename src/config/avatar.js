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
