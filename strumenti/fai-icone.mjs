// Le icone PNG dell'app, generate da qui.
//
// ⚠️ Perche' esiste questo strumento: **senza un PNG da almeno 192x192
// Chrome non considera l'app installabile.**
//
// Il manifest dichiarava due SVG e `apple-touch-icon.png`, che e' 180x180
// — misurato, non stimato: sotto la soglia. Senza un'icona valida
// `beforeinstallprompt` non scatta mai, quindi il tasto «Installa app»
// non compare, e su Android resta solo «Aggiungi a schermata Home», che
// crea una scorciatoia invece di un'app vera. Una scorciatoia resta «il
// browser» — ed e' anche il motivo per cui le notifiche chiedevano il
// permesso del sito invece che quello dell'app.
//
// ⚠️ Niente librerie: in `node_modules` non c'e' sharp ne' altro con cui
// rasterizzare, e aggiungerne una a due giorni dal viaggio per tre file
// che non cambieranno piu' non vale il rischio. Qui si scrive il PNG a
// mano — `zlib` sta dentro node — e si disegna col font a pixel che il
// progetto ha gia'.
//
// Si rilancia con: npm run icone

import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

// I colori del marchio, gli stessi di `public/icona-maskable.svg`.
const FONDO = [0x0b, 0x35, 0x50]
const CREMA = [0xf7, 0xf4, 0xec]
const ORO = [0xf2, 0xa9, 0x3b]

// ⚠️ Le lettere sono copiate da `src/components/Intro.jsx`, dove vive il
// font a pixel dell'intro. Copiate e non importate di proposito: quel
// file e' un componente React con seicento righe di disegno, e tirarselo
// dentro uno strumento da riga di comando per quattro glifi vorrebbe dire
// caricare tutto il resto. Se il font cambia la', qui non cambia niente —
// ed e' voluto: l'icona di un'app non deve muoversi da sola.
const GLIFI = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
}

// ------------------------------------------------------------ il PNG

const TAVOLA_CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(byte) {
  let c = 0xffffffff
  for (const b of byte) c = TAVOLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pezzo(nome, dati) {
  const lunghezza = Buffer.alloc(4)
  lunghezza.writeUInt32BE(dati.length)
  const corpo = Buffer.concat([Buffer.from(nome, 'ascii'), dati])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([lunghezza, corpo, crc])
}

// Colore vero (RGB, 8 bit), senza trasparenza: un'icona maskable deve
// coprire tutto il quadrato, quindi un canale alfa sarebbe solo peso.
function comePng(lato, pixel) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lato, 0)
  ihdr.writeUInt32BE(lato, 4)
  ihdr[8] = 8 // bit per canale
  ihdr[9] = 2 // colore vero
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // Ogni riga porta davanti il suo byte di filtro. Zero: nessun filtro,
  // che su un disegno a blocchi pieni comprime benissimo lo stesso.
  const righe = Buffer.alloc(lato * (1 + lato * 3))
  for (let y = 0; y < lato; y++) {
    const inizio = y * (1 + lato * 3)
    righe[inizio] = 0
    pixel.copy(righe, inizio + 1, y * lato * 3, (y + 1) * lato * 3)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pezzo('IHDR', ihdr),
    pezzo('IDAT', deflateSync(righe, { level: 9 })),
    pezzo('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------- il disegno

function disegna(lato, { zonaSicura }) {
  const pixel = Buffer.alloc(lato * lato * 3)
  for (let i = 0; i < lato * lato; i++) {
    pixel[i * 3] = FONDO[0]
    pixel[i * 3 + 1] = FONDO[1]
    pixel[i * 3 + 2] = FONDO[2]
  }

  const blocco = (x, y, w, h, colore) => {
    for (let j = Math.max(0, y); j < Math.min(lato, y + h); j++) {
      for (let i = Math.max(0, x); i < Math.min(lato, x + w); i++) {
        const p = (j * lato + i) * 3
        pixel[p] = colore[0]
        pixel[p + 1] = colore[1]
        pixel[p + 2] = colore[2]
      }
    }
  }

  // Una parola, centrata, coi glifi larghi `scala` pixel l'uno.
  const scrivi = (parola, centroY, scala, colore) => {
    const passo = 6 * scala // 5 di lettera + 1 di spazio
    const largo = parola.length * passo - scala
    let x = Math.round((lato - largo) / 2)
    const y = Math.round(centroY - (7 * scala) / 2)
    for (const lettera of parola) {
      const glifo = GLIFI[lettera]
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (glifo[r][c] === '#') blocco(x + c * scala, y + r * scala, scala, scala, colore)
        }
      }
      x += passo
    }
  }

  // ⚠️ Su un'icona maskable Android puo' ritagliare fino al 20% per lato:
  // il marchio va tenuto dentro il cerchio centrale, o su certi telefoni
  // si vede «LL4». Per questo la versione maskable disegna piu' piccolo.
  const respiro = zonaSicura ? 0.60 : 0.74
  const scalaAlto = Math.max(1, Math.round((lato * respiro) / 28))
  const scalaBasso = Math.max(1, Math.round((lato * respiro) / 19))

  // ⚠️ Le due righe vanno tenute distanti: al primo tentativo la base
  // delle «L» toccava la cima del «4», e da lontano diventavano una
  // macchia sola. L'altezza di un glifo e' 7 scale, quindi il centro
  // della riga di sotto deve stare almeno 7 scale piu' giu'.
  scrivi('ALL', lato * 0.34, scalaAlto, CREMA)
  scrivi('41', lato * 0.66, scalaBasso, ORO)
  return pixel
}

// ------------------------------------------------------------- e via

const DA_FARE = [
  ['public/icona-192.png', 192, { zonaSicura: false }],
  ['public/icona-512.png', 512, { zonaSicura: false }],
  ['public/icona-512-maskable.png', 512, { zonaSicura: true }],
]

for (const [dove, lato, opzioni] of DA_FARE) {
  const png = comePng(lato, disegna(lato, opzioni))
  writeFileSync(dove, png)
  console.log(`  ${dove} — ${lato}x${lato}, ${(png.length / 1024).toFixed(1)} KB`)
}
console.log('\nFatte.\n')
