import { quorumRaggiunto } from '../config/proposte.js'

// La logica del punteggio delle proposte, senza database: dato com'è
// andata una votazione, dice quali Leggi scattano e su chi. Sta separata
// da proposte.js — che importa Supabase — per la stessa ragione di
// saldi.js e impostore.js: da qui escono punti, e i punti si provano da
// riga di comando o non si provano affatto.
//
// Ogni voce restituita ha la sua dedupeKey deterministica: due telefoni
// che chiudono la stessa proposta insieme producono le stesse chiavi, e
// il database ne accetta una sola.

// Com'è finita: 'annullata' (niente quorum), 'pareggio', 'unanime',
// 'approvata', 'bocciata'.
export function esitoProposta({ si, no, votanti, totale }) {
  if (!quorumRaggiunto(votanti, totale)) return 'annullata'
  if (si === no && votanti > 0) return 'pareggio'
  if (si > no && no === 0 && votanti > 1) return 'unanime'
  return si > no ? 'approvata' : 'bocciata'
}

// Le Leggi che scattano alla chiusura. `schede` è chi ha votato cosa
// ({membroId: opzione}, 0 = Sì, 1 = No): da quando i voti sono palesi,
// l'esito può guardare anche i singoli voti — è così che il NO alla
// propria proposta diventa rilevabile.
export function leggiDellEsito({ esito, proponenteId, membriIds, votoId, schede = {} }) {
  const scattano = []

  // Annullata: non l'ha giudicata nessuno, nessuna Legge scatta. Chi ha
  // proposto non merita niente per il disinteresse degli altri.
  if (esito === 'annullata') return scattano

  // Il NO alla propria proposta si paga, comunque sia finita: hai chiesto
  // al gruppo di decidere e poi hai remato contro te stesso. Il sistema
  // ti lascia finire — voti, la proposta si chiude — e solo allora
  // presenta il conto. Vale anche sull'autoproposta: votarsi contro dopo
  // essersi proposti da soli è un capolavoro che merita entrambe le
  // penalità.
  if (proponenteId && schede[proponenteId] === 1) {
    scattano.push({
      leggeId: 'contro-te-stesso',
      memberId: proponenteId,
      dedupeKey: `contro-te-stesso_${votoId}`,
    })
  }

  if (esito === 'pareggio') {
    // Legge XI: il pareggio colpisce tutti, anche chi non c'entrava. Il
    // gruppo non ha saputo decidere, il gruppo paga.
    for (const id of membriIds) {
      scattano.push({ leggeId: 'poll-tie', memberId: id, dedupeKey: `poll-tie_${votoId}_${id}` })
    }
    // E il proponente, che il gruppo l'ha spaccato a metà, si porta a
    // casa il trofeo: il suo -1 della XI resta, il +3 lo ripaga con gli
    // interessi. Mettere in difficoltà otto amici vale la differenza.
    if (proponenteId) {
      scattano.push({
        leggeId: 'in-difficolta',
        memberId: proponenteId,
        dedupeKey: `in-difficolta_${votoId}`,
      })
    }
    return scattano
  }

  if (!proponenteId) return scattano

  if (esito === 'unanime') {
    scattano.push({ leggeId: 'unanimous', memberId: proponenteId, dedupeKey: `unanimous_${votoId}` })
  }

  if (esito === 'bocciata') {
    scattano.push({
      leggeId: 'proposal-rejected',
      memberId: proponenteId,
      dedupeKey: `rejected_${votoId}`,
    })
  }

  return scattano
}

// L'escalation verso la stessa persona, nella stessa giornata. `quante`
// è il totale di oggi DOPO la proposta appena fatta: alla seconda scatta
// l'esca, alla terza la trappola. L'esca premia esattamente il
// comportamento che la trappola punisce — è il rinforzo che rende la
// terza proposta irresistibile.
export function sogliaCoppia(quante) {
  if (quante === 2) return 'vera-amicizia'
  if (quante >= 3) return 'ci-nascondete-qualcosa'
  return null
}

// Il NO sistematico: quanti NO consecutivi ha dato una persona nelle
// proposte concluse, dalla più recente indietro. Le proposte dove non ha
// votato non spezzano la serie — non votare non è cambiare idea.
// `schedePerVoto` arriva ordinato dal più recente.
export function contaNoConsecutivi(schedePerVoto, memberId) {
  let no = 0
  for (const schede of schedePerVoto) {
    const voto = schede?.[memberId]
    if (voto === undefined) continue
    if (voto !== 1) break
    no += 1
  }
  return no
}

// Il voto all'ultimo momento: dentro i 60 secondi finali della finestra.
export function finestraSuspense(scadeIl, adesso = Date.now()) {
  const resta = Date.parse(scadeIl) - adesso
  return resta > 0 && resta <= 60000
}
