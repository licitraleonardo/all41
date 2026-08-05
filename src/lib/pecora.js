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
  MURO,
  NAVICELLA,
  RITMO,
  SAGOME,
  TEMA,
  UNITA_PER_PUNTO,
  muroDi,
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

// Quanto tempo si resta sopra una certa altezza durante un salto. Da qui
// esce quanto puo' essere largo un blocco da scavalcare: non e' un
// numero scelto a occhio, e' il punto in cui la fisica dice basta.
export function finestraSopra(altezza) {
  const dentro = FISICA.spintaSalto ** 2 - 2 * FISICA.gravita * altezza
  if (dentro <= 0) return 0
  return (2 * Math.sqrt(dentro)) / FISICA.gravita
}

// L'ostacolo di terra piu' alto: e' quello che detta il margine, perche'
// una coppia va scavalcata sopra il piu' cattivo dei due.
const ALTEZZA_PEGGIORE = Math.max(...TEMA.ostacoli.map((o) => SAGOME[o].altezza))

// Quanto puo' essere larga una coppia attaccata perche' resti
// scavalcabile con un salto solo, a quella velocita'. Il conto: nel
// tempo passato sopra l'ostacolo si percorre finestra x velocita, e li'
// dentro deve starci sia la coppia sia il corpo di Allan. La frazione in
// configurazione lascia il margine, perche' arrivare al limite esatto
// vuol dire morire nel punto in cui la fisica dice "per un pelo".
export function larghezzaMassimaCoppia(velocita) {
  const utile = finestraSopra(ALTEZZA_PEGGIORE) * velocita - SAGOME[TEMA.protagonista].larghezza
  return Math.max(0, utile * RITMO.doppiettaLarghezzaMax)
}

// Quanto respiro in più, oltre al minimo, viene lasciato fra un ostacolo
// e l'altro. Cala andando avanti: è così che il gioco si fa difficile
// senza mai diventare ingiusto — lo stacco minimo non si tocca.
export function staccoExtra(distanza, muro = MURO.recordFinto) {
  const avanzamento = Math.min(1, distanza / RITMO.distanzaDiRodaggio)
  const base =
    RITMO.staccoExtraIniziale +
    (RITMO.staccoExtraFinale - RITMO.staccoExtraIniziale) * avanzamento

  // Oltre il muro il gioco smette di essere gentile: il respiro si
  // chiude quasi del tutto nell'arco di un centinaio di punti. Lo stacco
  // minimo resta intoccabile, quindi resta sempre superabile — ma di
  // margine non ne rimane.
  const punti = distanza / UNITA_PER_PUNTO
  if (punti <= muro) return base

  const oltre = Math.min(1, (punti - muro) / 150)
  return base + (RITMO.staccoExtraOltreIlMuro - base) * oltre
}

// Quante volte una coppia di ostacoli attaccati puo' uscire. Prima del
// rodaggio mai: le doppiette sono la parte cattiva, non il benvenuto.
export function probabilitaDoppietta(distanza, muro = MURO.recordFinto) {
  if (distanza <= RITMO.doppiettaDopo) return 0
  const punti = distanza / UNITA_PER_PUNTO
  const oltre = punti > muro ? Math.min(1, (punti - muro) / 150) : 0
  return RITMO.doppiettaProbabilita * (1 + oltre)
}

export function probabilitaVolante(distanza) {
  if (distanza <= RITMO.volanteDopo) return 0
  const avanzamento = Math.min(1, distanza / RITMO.distanzaDiRodaggio)
  return (
    RITMO.volanteDaProbabilita +
    (RITMO.volanteAProbabilita - RITMO.volanteDaProbabilita) * avanzamento
  )
}

// `record` e' il punteggio da battere: da li' in poi il gioco stringe.
// Chi non ne ha ancora uno eredita quello finto, se no la parte dura non
// la vedrebbe mai proprio chi sta provando per la prima volta.
export function nuovoMondo(seme = 1, record = 0) {
  return {
    stato: 'pronto',
    muro: muroDi(record),
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

// Sceglie una quota fra le tre della navicella, ma non a caso piatto:
// quella in alto e' un respiro, non un pericolo, e uscendo quanto le
// altre lasciava la navicella parcheggiata lassu' per mezza partita.
function quotaPesata(caso) {
  let somma = 0
  for (let i = 0; i < NAVICELLA.quote.length; i++) {
    somma += NAVICELLA.pesiQuote[i] ?? 0
    if (caso < somma) return NAVICELLA.quote[i]
  }
  return NAVICELLA.quote[NAVICELLA.quote.length - 1]
}

function generaOstacolo(mondo) {
  let seme = mondo.seme
  let caso
  let tipo = null
  let quota = 0
  let sparato = false
  let nuovoObiettivo = mondo.navicella.obiettivo
  const muro = mondo.muro ?? MURO.recordFinto

  // La navicella spara solo da ferma, e il raggio prende la quota da
  // dove sta lei: è quello che lo lega alla navicella invece di farlo
  // sembrare un ostacolo qualunque piovuto dal nulla.
  if (inPosizione(mondo.navicella)) {
    ;[seme, caso] = prossimoCaso(seme)
    if (caso < NAVICELLA.probabilitaRaggio) {
      // Tre sagome diverse: cambia quando devi saltare, che con un
      // comando solo e' l'unica varieta' possibile.
      ;[seme, caso] = prossimoCaso(seme)
      tipo = TEMA.raggi[Math.floor(caso * TEMA.raggi.length)]
      quota = mondo.navicella.quota
      sparato = true
      ;[seme, caso] = prossimoCaso(seme)
      nuovoObiettivo = quotaPesata(caso)
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

  // Doppietta: un secondo ostacolo di terra attaccato al primo, da
  // scavalcare con un salto solo. Si aggiunge solo se la coppia resta
  // piu' stretta di quanto copre un salto, quindi resta superabile —
  // altrimenti sarebbe una condanna, non una difficolta'.
  const gemelli = []
  if (quota === 0 && tipo !== TEMA.volante) {
    ;[seme, caso] = prossimoCaso(seme)
    if (caso < probabilitaDoppietta(mondo.distanza, muro)) {
      ;[seme, caso] = prossimoCaso(seme)
      const secondo = TEMA.ostacoli[Math.floor(caso * TEMA.ostacoli.length)]
      const s2 = SAGOME[secondo]
      const larghezzaCoppia = sagoma.larghezza + RITMO.doppiettaStacco + s2.larghezza

      // Il tetto non è una frazione del salto ma del margine vero: il
      // tempo passato sopra l'ostacolo più alto, tolto il corpo di Allan.
      // Misurato sul salto era troppo generoso, e usciva la doppietta di
      // due muretti che nessuno scavalca.
      if (larghezzaCoppia <= larghezzaMassimaCoppia(mondo.velocita)) {
        gemelli.push({
          id: mondo.prossimoId + 1,
          tipo: secondo,
          x: ostacolo.x + sagoma.larghezza + RITMO.doppiettaStacco,
          larghezza: s2.larghezza,
          altezza: s2.altezza,
          quota: 0,
        })
      }
    }
  }

  // Lo stacco non scende mai sotto il minimo, e quanto si allunga oltre
  // è l'unica cosa lasciata al caso — e si stringe andando avanti. Così
  // il ritmo si fa serrato senza mai produrre una coppia impossibile.
  //
  // La coppia conta come un blocco solo: il respiro si misura da dove
  // finisce il secondo, non il primo.
  ;[seme, caso] = prossimoCaso(seme)
  const coda = gemelli.length ? gemelli[gemelli.length - 1] : ostacolo
  const ingombro = coda.x + coda.larghezza - ostacolo.x
  const stacco =
    ingombro -
    sagoma.larghezza +
    distanzaMinima(mondo.velocita) * (1 + caso * staccoExtra(mondo.distanza, muro))

  return { ostacolo, gemelli, seme, stacco, sparato, nuovoObiettivo }
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
    ostacoli = [...ostacoli, generato.ostacolo, ...generato.gemelli]
    seme = generato.seme
    prossimoStacco = generato.stacco
    prossimoId += 1 + generato.gemelli.length

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
