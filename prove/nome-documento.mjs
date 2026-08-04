// Quando il nome del file vale come titolo e quando no. Sembra una
// sciocchezza, ma "IMG_2931" precompilato è la differenza fra un elenco
// di documenti leggibile e uno inutile.

import { nomeUtile } from '../src/lib/nomeDocumento.js'

const casi = [
  // Roba che scrive la macchina: campo vuoto, col suggerimento
  ['IMG_2931.png', ''],
  ['IMG2931.jpg', ''],
  ['PXL_20260812_101530.jpg', ''],
  ['DSC_0042.JPG', ''],
  ['20260812104501.jpg', ''],
  ['2026-08-12 10.15.30.jpg', ''],
  ['Screenshot 2026-08-12 alle 10.15.png', ''],
  ['WhatsApp Image 2026-08-12 at 10.15.jpeg', ''],
  ['scan_0001.pdf', ''],

  // Nomi veri: si tengono
  ['biglietto traghetto.pdf', 'biglietto traghetto'],
  ['Prenotazione Villaggio.pdf', 'Prenotazione Villaggio'],
  ['QR barca 14 agosto.png', 'QR barca 14 agosto'],
  ['foto biglietto barca.jpg', 'foto biglietto barca'],
  ['ricevuta.pdf', 'ricevuta'],

  // Casi storti
  ['', ''],
  [null, ''],
  ['.pdf', ''],
]

let falliti = 0
for (const [nome, atteso] of casi) {
  const avuto = nomeUtile(nome)
  const ok = avuto === atteso
  if (!ok) falliti += 1
  console.log(
    `  ${ok ? 'ok  ' : 'NO  '} ${JSON.stringify(nome).padEnd(44)} -> ${JSON.stringify(avuto)}`
  )
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
