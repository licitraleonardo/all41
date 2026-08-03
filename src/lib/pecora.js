// Il motore del gioco. Niente canvas, niente React, niente Supabase: qui
// dentro ci sono solo numeri che si muovono, così si prova da riga di
// comando come tutto il resto della logica.
//
// Non sa cosa sia una pecora né un nuraghe: riceve dei nomi dal tema e
// li passa avanti a chi disegna. Cambiare ambientazione non tocca questo
// file.

import {
  FISICA,
  MONDO,
  NAVICELLA,
  RITMO,
  SAGOME,
  TEMA,
  UNITA_PER_PUNTO,
} from '../config/pecora.js'

// Generatore con seme: la stessa partita si può rigiocare identica, che
// è l'unico modo di provare un gioco pieno di numeri a caso.
function prossimoCaso(seme) {
  const s = (seme * 1664525 + 1013904223) >>> 0
  return [s, s / 4294967296]
}

// Quanto dura un salto e quanto si percorre nel frattempo: da qui esce
// la distanza minima fra due ostacoli, che è ciò che rende il gioco
// giocabile invece che crudele.
export const TEMPO_DI_VOLO = (2 * FISICA.spintaSalto) / FISICA.gravita
export const ALTEZZA_SALTO = FISICA.spintaSalto ** 2 / (2 * FISICA.gravita)

export function distanzaMinima(velocita) {
  return velocita * TEMPO_DI_VOLO * RITMO.stacco
}

// Quanto respiro in più, oltre al minimo, viene lasciato fra un ostacolo
// e l'altro. Cala andando avanti: è così che il gioco si fa difficile
// senza mai diventare ingiusto — lo stacco minimo non si tocca.
export function staccoExtra(distanza) {
  const avanzamento = Math.min(1, distanza / RITMO.distanzaDiRodaggio)
  return (
    RITMO.staccoExtraIniziale +
    (RITMO.staccoExtraFinale - RITMO.staccoExtraIniziale) * avanzamento
  )
}

export function probabilitaVolante(distanza) {
  if (distanza <= RITMO.volanteDopo) return 0
  const avanzamento = Math.min(1, distanza / RITMO.distanzaDiRodaggio)
  return (
    RITMO.volanteDaProbabilita +
    (RITMO.volanteAProbabilita - RITMO.volanteDaProbabilita) * avanzamento
  )
}

export function nuovoMondo(seme = 1) {
  return {
    stato: 'pronto',
    tempo: 0,
    distanza: 0,
    velocita: FISICA.velocitaIniziale,
    giocatore: { y: 0, vy: 0 },
    ostacoli: [],
    prossimoStacco: MONDO.larghezza * 0.9,
    seme: seme >>> 0,
    prossimoId: 1,
    // La navicella arriva sempre allo stesso punteggio, scende dal cielo
    // e da lì in poi resta lì a sparare.
    navicella: {
      arrivata: false,
      quota: NAVICELLA.quotaDArrivo,
      obiettivo: NAVICELLA.quote[1],
      lampo: 0,
    },
  }
}

export function avvia(mondo) {
  if (mondo.stato === 'corsa') return mondo
  return { ...nuovoMondo(mondo.seme), stato: 'corsa' }
}

// È in posizione quando ha finito di spostarsi: spara solo da ferma, o
// il raggio uscirebbe da un punto in cui la navicella non è.
export function inPosizione(navicella) {
  return navicella.arrivata && Math.abs(navicella.quota - navicella.obiettivo) < 1.5
}

// Si salta solo da terra: niente doppio salto, che in un runner toglie
// tutta la tensione.
export function salta(mondo) {
  if (mondo.stato === 'pronto') {
    const partito = avvia(mondo)
    return { ...partito, giocatore: { y: 0, vy: FISICA.spintaSalto } }
  }
  if (mondo.stato !== 'corsa') return mondo
  if (mondo.giocatore.y > 0) return mondo
  return { ...mondo, giocatore: { ...mondo.giocatore, vy: FISICA.spintaSalto } }
}

export function punteggio(mondo) {
  return Math.floor(mondo.distanza / UNITA_PER_PUNTO)
}

function siToccano(a, b) {
  return (
    a.x < b.x + b.larghezza &&
    a.x + a.larghezza > b.x &&
    a.y < b.y + b.altezza &&
    a.y + a.altezza > b.y
  )
}

export function riquadroGiocatore(mondo) {
  const s = SAGOME[TEMA.protagonista]
  return {
    x: MONDO.giocatoreX,
    y: mondo.giocatore.y,
    larghezza: s.larghezza,
    altezza: s.altezza,
  }
}

function riquadroOstacolo(o) {
  return { x: o.x, y: o.quota, larghezza: o.larghezza, altezza: o.altezza }
}

function generaOstacolo(mondo) {
  let seme = mondo.seme
  let caso
  let tipo = null
  let quota = 0
  let sparato = false
  let nuovoObiettivo = mondo.navicella.obiettivo

  // La navicella spara solo da ferma, e il raggio prende la quota da
  // dove sta lei: è quello che lo lega alla navicella invece di farlo
  // sembrare un ostacolo qualunque piovuto dal nulla.
  if (inPosizione(mondo.navicella)) {
    ;[seme, caso] = prossimoCaso(seme)
    if (caso < NAVICELLA.probabilitaRaggio) {
      tipo = TEMA.raggio
      quota = mondo.navicella.quota
      sparato = true
      // Sparato il colpo si sposta: la prossima volta arriva da un'altra
      // altezza, e intanto la si vede muoversi.
      ;[seme, caso] = prossimoCaso(seme)
      nuovoObiettivo = NAVICELLA.quote[Math.floor(caso * NAVICELLA.quote.length)]
    }
  }

  if (tipo === null) {
    ;[seme, caso] = prossimoCaso(seme)
    if (caso < probabilitaVolante(mondo.distanza)) {
      tipo = TEMA.volante
      quota = SAGOME[tipo].quota
    } else {
      ;[seme, caso] = prossimoCaso(seme)
      tipo = TEMA.ostacoli[Math.floor(caso * TEMA.ostacoli.length)]
      quota = SAGOME[tipo].quota
    }
  }

  const sagoma = SAGOME[tipo]
  const ostacolo = {
    id: mondo.prossimoId,
    tipo,
    x: MONDO.larghezza + 8,
    larghezza: sagoma.larghezza,
    altezza: sagoma.altezza,
    quota,
  }

  // Lo stacco non scende mai sotto il minimo, e quanto si allunga oltre
  // è l'unica cosa lasciata al caso — e si stringe andando avanti. Così
  // il ritmo si fa serrato senza mai produrre una coppia impossibile.
  ;[seme, caso] = prossimoCaso(seme)
  const stacco =
    distanzaMinima(mondo.velocita) * (1 + caso * staccoExtra(mondo.distanza))

  return { ostacolo, seme, stacco, sparato, nuovoObiettivo }
}

export function passo(mondo, dt) {
  if (mondo.stato !== 'corsa') return mondo

  // Cambiando scheda il browser smette di consegnare fotogrammi, e al
  // ritorno arriverebbe un salto di secondi: la pecora attraverserebbe
  // gli ostacoli senza toccarli. Meglio rallentare che morire per un
  // motivo che non si è visto.
  const d = Math.min(Math.max(dt, 0), 0.05)

  const tempo = mondo.tempo + d
  const velocita = Math.min(
    FISICA.velocitaMax,
    FISICA.velocitaIniziale + FISICA.accelerazione * tempo
  )
  const avanzamento = velocita * d
  const distanza = mondo.distanza + avanzamento

  // Salto: posizione prima, velocità dopo. Al contrario il primo
  // fotogramma perderebbe la spinta iniziale.
  let y = mondo.giocatore.y + mondo.giocatore.vy * d
  let vy = mondo.giocatore.vy - FISICA.gravita * d
  if (y <= 0) {
    y = 0
    vy = 0
  }

  let ostacoli = mondo.ostacoli
    .map((o) => ({ ...o, x: o.x - avanzamento }))
    .filter((o) => o.x + o.larghezza > -20)

  let seme = mondo.seme
  let prossimoId = mondo.prossimoId
  let prossimoStacco = mondo.prossimoStacco - avanzamento

  // Arriva sempre allo stesso punteggio, e scende dal cielo fino alla
  // sua quota invece di comparire dal nulla.
  const arrivata =
    mondo.navicella.arrivata ||
    Math.floor(distanza / UNITA_PER_PUNTO) >= NAVICELLA.soglia

  let navicella = {
    ...mondo.navicella,
    arrivata,
    lampo: Math.max(0, mondo.navicella.lampo - d),
  }

  if (arrivata) {
    const verso = Math.sign(navicella.obiettivo - navicella.quota)
    const salto = NAVICELLA.velocitaVerticale * d
    navicella.quota =
      Math.abs(navicella.obiettivo - navicella.quota) <= salto
        ? navicella.obiettivo
        : navicella.quota + verso * salto
  }

  if (prossimoStacco <= 0) {
    const generato = generaOstacolo({ ...mondo, distanza, velocita, navicella, prossimoId })
    ostacoli = [...ostacoli, generato.ostacolo]
    seme = generato.seme
    prossimoStacco = generato.stacco
    prossimoId += 1

    if (generato.sparato) {
      navicella = {
        ...navicella,
        obiettivo: generato.nuovoObiettivo,
        lampo: NAVICELLA.lampo,
      }
    }
  }

  const prossimo = {
    ...mondo,
    tempo,
    distanza,
    velocita,
    giocatore: { y, vy },
    ostacoli,
    prossimoStacco,
    seme,
    prossimoId,
    navicella,
  }

  const io = riquadroGiocatore(prossimo)
  const colpito = ostacoli.some((o) => siToccano(io, riquadroOstacolo(o)))

  return colpito ? { ...prossimo, stato: 'finita' } : prossimo
}
