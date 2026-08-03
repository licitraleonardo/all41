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

    // Chi era nella divisione ma non c'è più fra i membri verrebbe
    // ignorato, e la spesa non tornerebbe: si tiene solo se resta
    // qualcuno con cui dividerla.
    const fra = [...spesa.divisaFra].filter(conosciuto).sort()
    if (fra.length === 0 || !conosciuto(spesa.pagataDa)) continue

    saldi[spesa.pagataDa] += spesa.centesimi

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

// Il "chi deve a chi": si prende il debito più grosso e lo si manda al
// credito più grosso, finché non resta niente. Non è il minor numero di
// bonifici possibile in assoluto — quello è un problema NP — ma su otto
// persone dà sempre pochi passaggi, ed è l'unica cosa che conta.
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
