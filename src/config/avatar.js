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
