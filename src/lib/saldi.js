// I conti. Niente Supabase qui dentro, così si provano da riga di
// comando: sono soldi veri di persone vere, e un errore qui non si nota
// finché qualcuno non ci rimette.
//
// Tutto in centesimi interi. In virgola mobile una cena da 40€ divisa per
// tre lascia un residuo a ogni riga, e dopo cinque giorni la somma dei
// saldi non fa più zero.
//
// Convenzione dei segni: saldo positivo = deve ricevere, saldo negativo =
// deve dare. La somma di tutti i saldi fa sempre zero.

// "12,50" o "12.50" o "12" → 1250. null se non è un importo.
export function inCentesimi(testo) {
  const pulito = String(testo ?? '')
    .trim()
    .replace(',', '.')
  if (!/^\d{1,7}(\.\d{0,2})?$/.test(pulito)) return null

  const [interi, decimali = ''] = pulito.split('.')
  const centesimi = Number(interi) * 100 + Number(decimali.padEnd(2, '0'))
  return Number.isSafeInteger(centesimi) ? centesimi : null
}

export function formattaEuro(centesimi) {
  const segno = centesimi < 0 ? '-' : ''
  const assoluto = Math.abs(centesimi)
  const interi = Math.floor(assoluto / 100)
  const resto = String(assoluto % 100).padStart(2, '0')
  return `${segno}${interi},${resto} €`
}

// Divide un importo in parti intere che rimettono insieme l'originale.
// I centesimi che avanzano vanno ai primi, in ordine di id: deve venire
// uguale su tutti i telefoni, o due persone vedono due conti diversi.
export function dividi(centesimi, quanti) {
  if (quanti <= 0) return []
  const base = Math.floor(centesimi / quanti)
  const resto = centesimi - base * quanti
  return Array.from({ length: quanti }, (_, i) => base + (i < resto ? 1 : 0))
}

export function calcolaSaldi(spese, pagamenti, membriIds) {
  const saldi = Object.fromEntries(membriIds.map((id) => [id, 0]))
  const conosciuto = (id) => Object.prototype.hasOwnProperty.call(saldi, id)

  for (const spesa of spese) {
    if (spesa.eliminata) continue

    // Chi non c'è più fra i membri verrebbe ignorato e la spesa non
    // tornerebbe: si tiene solo se resta qualcuno da entrambe le parti.
    const paganti = [...spesa.paganti].filter(conosciuto).sort()
    const fra = [...spesa.divisaFra].filter(conosciuto).sort()
    if (paganti.length === 0 || fra.length === 0) continue

    // Chi ha pagato si divide il credito come chi ha consumato si divide
    // il debito: due divisioni dello stesso importo, quindi la somma
    // resta zero per costruzione, non per fortuna.
    const messo = dividi(spesa.centesimi, paganti.length)
    paganti.forEach((id, i) => {
      saldi[id] += messo[i]
    })

    const quote = dividi(spesa.centesimi, fra.length)
    fra.forEach((id, i) => {
      saldi[id] -= quote[i]
    })
  }

  // Un rimborso avvenuto riduce il debito di chi l'ha dato.
  for (const pagamento of pagamenti) {
    if (pagamento.eliminato) continue
    if (!conosciuto(pagamento.da) || !conosciuto(pagamento.a)) continue

    saldi[pagamento.da] += pagamento.centesimi
    saldi[pagamento.a] -= pagamento.centesimi
  }

  return saldi
}

// Da dove viene il tuo saldo, riga per riga.
//
// ⚠️ Esiste perché il numero non era spiegabile, e sui soldi un numero che
// non sai rifare vale come un numero sbagliato. È successo a chi l'app l'ha
// scritta: «perché devo solo 5,63? 87,50 diviso 4 non fa 5,63». Il conto
// era giusto — quel 5,63 veniva da un'altra spesa, e soprattutto la
// schermata mostra il **saldo netto** dopo che tutte le spese si sono
// compensate fra loro, non la tua parte di quella cena. Con due spese
// incrociate il risultato non assomiglia più a nessuna divisione rifacibile
// a mente.
//
// Le righe qui sotto sommano ESATTAMENTE al saldo, ed è la proprietà che
// rende la schermata utile: se non sommassero, spiegherebbe una cosa
// diversa da quella che mostra.
export function dettaglioSaldo(spese, pagamenti, membriIds, ioId) {
  const conosciuto = (id) => membriIds.includes(id)
  if (!conosciuto(ioId)) return []

  const righe = []

  for (const spesa of spese) {
    if (spesa.eliminata) continue

    const paganti = [...spesa.paganti].filter(conosciuto).sort()
    const fra = [...spesa.divisaFra].filter(conosciuto).sort()
    if (paganti.length === 0 || fra.length === 0) continue

    // Gli stessi due conti di `calcolaSaldi`, e devono restare gli stessi:
    // se un giorno divergono, questa schermata comincia a raccontare una
    // matematica che non è quella che muove i soldi.
    let quanto = 0
    const messo = dividi(spesa.centesimi, paganti.length)
    const i = paganti.indexOf(ioId)
    if (i >= 0) quanto += messo[i]

    const quote = dividi(spesa.centesimi, fra.length)
    const j = fra.indexOf(ioId)
    if (j >= 0) quanto -= quote[j]

    if (quanto === 0) continue

    righe.push({
      genere: 'spesa',
      id: spesa.id,
      descrizione: spesa.descrizione,
      // Positivo = hai messo tu e ti rientra; negativo = l'hai consumata.
      centesimi: quanto,
      hoPagato: i >= 0,
      inQuanti: fra.length,
      totale: spesa.centesimi,
      quando: spesa.creataIl,
    })
  }

  for (const pagamento of pagamenti) {
    if (pagamento.eliminato) continue
    if (!conosciuto(pagamento.da) || !conosciuto(pagamento.a)) continue
    if (pagamento.da !== ioId && pagamento.a !== ioId) continue

    righe.push({
      genere: 'rimborso',
      id: pagamento.id,
      // Chi ha dato i contanti riduce il proprio debito: per lui è un più.
      centesimi: pagamento.da === ioId ? pagamento.centesimi : -pagamento.centesimi,
      hoDato: pagamento.da === ioId,
      altro: pagamento.da === ioId ? pagamento.a : pagamento.da,
      quando: pagamento.creatoIl,
    })
  }

  // Dalla più recente, come l'elenco delle spese. A parità di istante l'id
  // più basso, o due telefoni ordinerebbero diverso.
  return righe.sort(
    (a, b) =>
      Date.parse(b.quando ?? 0) - Date.parse(a.quando ?? 0) || (a.id < b.id ? -1 : 1)
  )
}


// Il "chi paga chi": **si rendono i soldi a chi li ha messi per te**.
//
// ⚠️ Prima si faceva il minor numero di bonifici possibile, e i conti
// tornavano al centesimo: la somma faceva zero, i passaggi chiudevano
// tutto, nessuno pagava un euro di troppo. Ed era comunque sbagliato.
//
// Con il saldo netto di gruppo si arrivava a dire «Leonardo dà 3,20 a
// Marco» a uno che con Marco non aveva mai diviso niente: la cifra era
// giusta e l'istruzione non era ricavabile da niente che avesse fatto.
// Su questo progetto la regola è che un numero che non sai rifare vale
// come un numero sbagliato — e vale anche per un'istruzione. È costato
// tre giri di «non mi torna» prima di capire che il difetto non era nei
// conti, era nel modello.
//
// Adesso ogni passaggio viene da spese vere fra quelle due persone. Si
// compensa **dentro la coppia** — io ti devo 10, tu me ne devi 3, me ne
// dai 7 — ma mai attraverso il gruppo. Costa qualche bonifico in più: su
// otto persone e cinque spese, dieci invece di sette. Vale il cambio.
export function chiPagaChi(spese, pagamenti, membriIds) {
  const conosciuto = (id) => membriIds.includes(id)
  const fra = new Map()

  const somma = (da, a, quanto) => {
    if (!quanto || da === a) return
    const chiave = `${da}|${a}`
    fra.set(chiave, (fra.get(chiave) ?? 0) + quanto)
  }

  for (const spesa of spese) {
    if (spesa.eliminata) continue
    const paganti = [...spesa.paganti].filter(conosciuto).sort()
    const consumatori = [...spesa.divisaFra].filter(conosciuto).sort()
    if (paganti.length === 0 || consumatori.length === 0) continue

    // ⚠️ Gli stessi due conti di `calcolaSaldi`, e devono restare gli
    // stessi: se un giorno divergono, i passaggi smettono di chiudere i
    // saldi e non lo dice nessuno.
    const messo = dividi(spesa.centesimi, paganti.length)
    const quote = dividi(spesa.centesimi, consumatori.length)

    // Il saldo di questa spesa sola, persona per persona. Chi ha messo i
    // soldi ed era anche fra chi ha consumato si compensa da sé.
    const saldoQui = new Map()
    paganti.forEach((id, i) => saldoQui.set(id, (saldoQui.get(id) ?? 0) + messo[i]))
    consumatori.forEach((id, i) => saldoQui.set(id, (saldoQui.get(id) ?? 0) - quote[i]))

    // ⚠️ E qui si abbinano **dentro la spesa**, non dividendo ogni quota
    // fra i paganti.
    //
    // La prima versione faceva così, e sembrava più diretta: la tua parte
    // spezzata fra chi aveva messo i soldi. Ma spezzare ogni quota
    // significa arrotondare due volte, e i centesimi che avanzano non
    // ricompongono più il credito di chi ha pagato: su centomila
    // situazioni generate a caso, ogni tanto qualcuno restava con dei
    // centesimi appesi. Sui cinque conti veri del viaggio non si sarebbe
    // mai visto.
    //
    // Abbinando dentro la spesa i due elenchi vengono dagli stessi
    // interi, quindi le due somme sono uguali per costruzione e non per
    // fortuna: quello che manca a uno è esattamente quello che avanza
    // all'altro.
    const deve = [...saldoQui].filter(([, v]) => v < 0).map(([id, v]) => ({ id, quanto: -v }))
    const avanza = [...saldoQui].filter(([, v]) => v > 0).map(([id, v]) => ({ id, quanto: v }))
    deve.sort((a, b) => a.id.localeCompare(b.id))
    avanza.sort((a, b) => a.id.localeCompare(b.id))

    let d = 0
    let c = 0
    while (d < deve.length && c < avanza.length) {
      const quanto = Math.min(deve[d].quanto, avanza[c].quanto)
      somma(deve[d].id, avanza[c].id, quanto)
      deve[d].quanto -= quanto
      avanza[c].quanto -= quanto
      if (deve[d].quanto === 0) d += 1
      if (avanza[c].quanto === 0) c += 1
    }
  }

  // Un rimborso già dato riduce quello che devi a quella persona, e solo
  // a quella: è un passaggio fra due, come tutto il resto qui dentro.
  for (const pagamento of pagamenti) {
    if (pagamento.eliminato) continue
    if (!conosciuto(pagamento.da) || !conosciuto(pagamento.a)) continue
    somma(pagamento.a, pagamento.da, pagamento.centesimi)
  }

  // Si compensa dentro la coppia, e ne esce un passaggio solo per coppia.
  const passaggi = []
  const fatte = new Set()

  // ⚠️ Ordinato per chiave: senza, l'ordine in cui sono arrivate le spese
  // decide l'ordine dei passaggi, e due telefoni mostrano due liste
  // diverse per gli stessi conti.
  for (const chiave of [...fra.keys()].sort()) {
    const [primo, secondo] = chiave.split('|')
    const coppia = [primo, secondo].sort().join('|')
    if (fatte.has(coppia)) continue
    fatte.add(coppia)

    const netto = (fra.get(`${primo}|${secondo}`) ?? 0) - (fra.get(`${secondo}|${primo}`) ?? 0)
    if (netto > 0) passaggi.push({ da: primo, a: secondo, centesimi: netto })
    else if (netto < 0) passaggi.push({ da: secondo, a: primo, centesimi: -netto })
  }

  return passaggi.sort(
    (a, b) => b.centesimi - a.centesimi || a.da.localeCompare(b.da) || a.a.localeCompare(b.a)
  )
}

// Il "chi deve a chi" a saldo netto di gruppo: meno passaggi, ma
// attraverso persone con cui non hai diviso niente. **Non si usa più**
// nell'app — resta perché le prove ci confrontano contro il totale, che
// deve venire uguale: due modi diversi di chiudere gli stessi conti non
// possono muovere cifre diverse.
//
// Si prende il debito più grosso e lo si manda al credito più grosso,
// finché non resta niente.
export function chiDeveAChi(saldi) {
  const debitori = []
  const creditori = []

  // Ordinati per id prima di tutto: senza, l'ordine delle chiavi decide
  // il risultato e due telefoni mostrano due liste diverse.
  for (const id of Object.keys(saldi).sort()) {
    if (saldi[id] < 0) debitori.push({ id, quanto: -saldi[id] })
    if (saldi[id] > 0) creditori.push({ id, quanto: saldi[id] })
  }

  debitori.sort((a, b) => b.quanto - a.quanto || a.id.localeCompare(b.id))
  creditori.sort((a, b) => b.quanto - a.quanto || a.id.localeCompare(b.id))

  const passaggi = []
  let d = 0
  let c = 0

  while (d < debitori.length && c < creditori.length) {
    const quanto = Math.min(debitori[d].quanto, creditori[c].quanto)
    if (quanto > 0) {
      passaggi.push({ da: debitori[d].id, a: creditori[c].id, centesimi: quanto })
    }

    debitori[d].quanto -= quanto
    creditori[c].quanto -= quanto
    if (debitori[d].quanto === 0) d += 1
    if (creditori[c].quanto === 0) c += 1
  }

  return passaggi
}
