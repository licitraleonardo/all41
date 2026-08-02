import { ALLAN, BATTUTE_ALLAN } from '../config/allan.js'

// Tiene il conto dell'ultima uscita e dell'ultima battuta detta, così
// Allan non parla addosso a sé stesso né si ripete due volte di fila.
let ultimaVolta = 0
let ultimaBattuta = null

export function forseAllanCommenta(adesso = Date.now()) {
  if (adesso - ultimaVolta < ALLAN.pausaMinuti * 60000) return null
  if (Math.random() > ALLAN.probabilita) return null

  const disponibili = BATTUTE_ALLAN.filter((b) => b !== ultimaBattuta)
  const battuta = disponibili[Math.floor(Math.random() * disponibili.length)]

  ultimaVolta = adesso
  ultimaBattuta = battuta

  return { id: `allan-${adesso}`, testo: battuta, creatoIl: new Date(adesso).toISOString() }
}
