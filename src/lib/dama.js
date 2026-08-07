import { DAMA } from '../config/dama.js'

// Il motore della Dama. Non sa cosa sia Supabase, come quello
// dell'Impostore: una partita è la lista delle sue mosse, e da quella
// lista lo stato si ricostruisce identico su ogni telefono. Sul database
// non si salva nessun vincitore — si ricava, come i saldi delle Spese.
//
// La scacchiera è un array di 64 caselle, indice = riga * 8 + colonna.
// Si gioca solo sulle scure, quelle con (riga + colonna) dispari. Il
// bianco parte in basso (righe 5-7) e sale, il nero parte in alto
// (righe 0-2) e scende. Promozione sull'ultima riga dell'avversario.
//
// Una mossa è { da, passi, prese, promuove }: `passi` sono le caselle
// toccate dopo la partenza (una per il passo semplice, una per salto
// nella catena), `prese` le pedine mangiate, nell'ordine. In testo
// diventa "40-33" per il passo e "40x26x12" per la catena: si legge come
// la direbbe una persona.

export const BIANCO = 'bianco'
export const NERO = 'nero'

const riga = (i) => Math.floor(i / 8)
const colonna = (i) => i % 8
const dentro = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8
const indice = (r, c) => r * 8 + c

export function casellaScura(i) {
  return (riga(i) + colonna(i)) % 2 === 1
}

function avversario(colore) {
  return colore === BIANCO ? NERO : BIANCO
}

// Verso di marcia delle pedine: il bianco sale (riga che cala), il nero
// scende. Le dame vanno dove vogliono.
function direzioni(pezzo) {
  if (pezzo.dama) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]
  }
  return pezzo.colore === BIANCO
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ]
}

function rigaDiPromozione(colore) {
  return colore === BIANCO ? 0 : 7
}

export function partitaNuova() {
  const caselle = Array(64).fill(null)
  for (let i = 0; i < 64; i += 1) {
    if (!casellaScura(i)) continue
    if (riga(i) < 3) caselle[i] = { colore: NERO, dama: false }
    if (riga(i) > 4) caselle[i] = { colore: BIANCO, dama: false }
  }
  return { caselle, turno: BIANCO, senzaPresa: 0 }
}

// Tutte le catene di presa che partono da `da`. Ricorsiva: dopo un salto
// si continua a mangiare finché si può, e ogni fermata possibile è una
// mossa distinta — sceglie chi gioca, non il motore. La promozione
// chiude la catena: una pedina che arriva in fondo si ferma lì.
function catene(caselle, da, pezzo, giaPrese) {
  const esiti = []
  for (const [dr, dc] of direzioni(pezzo)) {
    const rp = riga(da) + dr
    const cp = colonna(da) + dc
    const ra = riga(da) + dr * 2
    const ca = colonna(da) + dc * 2
    if (!dentro(ra, ca)) continue
    const preda = indice(rp, cp)
    const arrivo = indice(ra, ca)
    const bersaglio = caselle[preda]
    if (!bersaglio || bersaglio.colore === pezzo.colore) continue
    if (giaPrese.includes(preda)) continue
    if (caselle[arrivo] !== null) continue

    const prese = [...giaPrese, preda]
    const promuove = !pezzo.dama && riga(arrivo) === rigaDiPromozione(pezzo.colore)

    if (promuove) {
      esiti.push({ passi: [arrivo], prese, promuove: true })
      continue
    }

    // La pedina mangiata resta a terra fino a fine catena (per questo
    // `giaPrese` e non una scacchiera modificata): non ci si può
    // atterrare sopra, e non si può mangiarla due volte.
    const dopo = caselle.slice()
    dopo[arrivo] = pezzo
    dopo[da] = null
    const seguiti = catene(dopo, arrivo, pezzo, prese)
    if (seguiti.length === 0) {
      esiti.push({ passi: [arrivo], prese, promuove: false })
    } else {
      for (const s of seguiti) {
        esiti.push({ passi: [arrivo, ...s.passi], prese: s.prese, promuove: s.promuove })
      }
    }
  }
  return esiti
}

// Le mosse legali di chi è di turno. Se esiste anche una sola presa,
// si mangia: le mosse semplici spariscono. È la regola che rende la
// Dama un gioco di trappole invece che di attesa.
export function mosseLegali(stato) {
  const { caselle, turno } = stato
  const prese = []
  const semplici = []

  for (let da = 0; da < 64; da += 1) {
    const pezzo = caselle[da]
    if (!pezzo || pezzo.colore !== turno) continue

    for (const m of catene(caselle, da, pezzo, [])) {
      prese.push({ da, ...m })
    }

    if (prese.length > 0) continue
    for (const [dr, dc] of direzioni(pezzo)) {
      const r = riga(da) + dr
      const c = colonna(da) + dc
      if (!dentro(r, c)) continue
      const arrivo = indice(r, c)
      if (caselle[arrivo] !== null) continue
      semplici.push({
        da,
        passi: [arrivo],
        prese: [],
        promuove: !pezzo.dama && r === rigaDiPromozione(pezzo.colore),
      })
    }
  }

  return prese.length > 0 ? prese : semplici
}

// Applica una mossa e restituisce lo stato nuovo. La mossa deve essere
// una di quelle legali: qui non ci si fida di nessuno, nemmeno di sé
// stessi — un testo storto arrivato dal database deve fermarsi qui, non
// produrre una scacchiera impossibile in silenzio.
export function applicaMossa(stato, mossa) {
  const legale = mosseLegali(stato).find(
    (m) => m.da === mossa.da && m.passi.join(',') === mossa.passi.join(',')
  )
  if (!legale) throw new Error('Questa mossa non si può fare.')

  const caselle = stato.caselle.slice()
  const pezzo = caselle[legale.da]
  caselle[legale.da] = null
  for (const p of legale.prese) caselle[p] = null
  const arrivo = legale.passi[legale.passi.length - 1]
  caselle[arrivo] = legale.promuove ? { colore: pezzo.colore, dama: true } : pezzo

  const azzera = legale.prese.length > 0 || legale.promuove
  return {
    caselle,
    turno: avversario(stato.turno),
    senzaPresa: azzera ? 0 : stato.senzaPresa + 1,
  }
}

// Com'è finita, se è finita. Chi non può muovere ha perso — vale sia
// per "mangiate tutte" sia per "tutte bloccate", ed è la stessa regola.
export function esito(stato) {
  if (stato.senzaPresa >= DAMA.pattaDopo) return { finita: true, vincitore: null }
  if (mosseLegali(stato).length === 0) {
    return { finita: true, vincitore: avversario(stato.turno) }
  }
  return { finita: false, vincitore: null }
}

// ------------------------------------------------------------- testo

export function mossaInTesto(mossa) {
  const separatore = mossa.prese.length > 0 ? 'x' : '-'
  return [mossa.da, ...mossa.passi].join(separatore)
}

export function mossaDaTesto(testo) {
  const conPresa = testo.includes('x')
  const numeri = testo.split(conPresa ? 'x' : '-').map(Number)
  if (numeri.length < 2 || numeri.some((n) => !Number.isInteger(n) || n < 0 || n > 63)) {
    throw new Error('Mossa illeggibile.')
  }
  return { da: numeri[0], passi: numeri.slice(1) }
}

// Ricostruisce la partita dalla lista delle mosse. È l'unica fonte di
// verità: due telefoni con le stesse mosse vedono la stessa scacchiera,
// e una mossa illegale in mezzo fa esplodere qui invece di divergere.
export function ricostruisci(mosse) {
  let stato = partitaNuova()
  for (const testo of mosse) {
    stato = applicaMossa(stato, mossaDaTesto(testo))
  }
  return stato
}

// Di chi è il turno alla mossa numero `indice` (da zero): il bianco
// muove sulle pari. Serve alla funzione del database per rifiutare chi
// gioca fuori turno senza dover rigiocare la partita in SQL.
export function toccaA(indiceMossa) {
  return indiceMossa % 2 === 0 ? BIANCO : NERO
}
