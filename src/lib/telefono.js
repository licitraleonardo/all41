// Il numero di telefono: controllarlo senza diventare antipatici.
//
// Niente Supabase e niente React qui dentro: sono regole, e si provano da
// riga di comando come il resto.
//
// ⚠️ Il metro è **sbagliato di poco è peggio di mancante.** Un numero
// lasciato in bianco lo si chiede a voce; un numero storto lo si compone
// alle due di notte quando uno non rientra, e non risponde nessuno.
// Quindi si rifiuta quello che non torna, invece di salvarlo "tanto poi
// si vede".

// I prefissi che servono a questo viaggio: otto italiani, e i vicini per
// chi ha una scheda straniera. Non è un elenco del mondo — una tendina di
// duecento voci, su un campo facoltativo, si salta e basta.
export const PREFISSI = [
  { codice: '+39', paese: 'Italia' },
  { codice: '+41', paese: 'Svizzera' },
  { codice: '+33', paese: 'Francia' },
  { codice: '+49', paese: 'Germania' },
  { codice: '+44', paese: 'Regno Unito' },
  { codice: '+34', paese: 'Spagna' },
]

export const PREFISSO_PREDEFINITO = '+39'

// Si tiene solo quello che si può comporre. Gli spazi, i punti, i
// trattini e le parentesi che la gente copia dalla rubrica se ne vanno:
// quello che resta è un numero che il telefono sa chiamare.
export function soloCifre(testo) {
  return String(testo ?? '').replace(/[^\d]/g, '')
}

// ⚠️ Uno zero iniziale è quasi sempre un prefisso interno appiccicato a
// un prefisso internazionale: `+39 06...` è giusto, `+39 006...` no, e
// `+41 079...` va composto come `+41 79...`. Toglierlo qui evita il
// numero che sembra a posto e non squilla.
export function senzaZeroIniziale(cifre) {
  return cifre.replace(/^0+/, '')
}

// Non si controlla che il numero ESISTA — non si può da qui — ma che
// abbia una lunghezza plausibile. Sotto le sei cifre è un errore di
// battitura, sopra le quindici non è un numero (E.164 si ferma lì).
export function validaTelefono(prefisso, numero) {
  const cifre = senzaZeroIniziale(soloCifre(numero))

  if (cifre.length === 0) return { ok: false, vuoto: true, motivo: null }

  if (!PREFISSI.some((p) => p.codice === prefisso)) {
    return { ok: false, motivo: 'Scegli il prefisso.' }
  }

  if (cifre.length < 6) return { ok: false, motivo: 'Sono poche cifre: manca qualcosa?' }
  if (cifre.length > 15) return { ok: false, motivo: 'Sono troppe cifre.' }

  // I cellulari italiani cominciano per 3. Lo si dice e basta, senza
  // rifiutare: un fisso di casa è un numero legittimo da lasciare, e chi
  // ha davvero un 3xx e ha sbagliato la prima cifra se ne accorge qui.
  const avviso =
    prefisso === '+39' && !cifre.startsWith('3')
      ? 'Non sembra un cellulare. Se è giusto, va bene lo stesso.'
      : null

  return { ok: true, valore: `${prefisso} ${cifre}`, avviso, motivo: null }
}

// Come si chiama: senza spazi, che è quello che vuole un link `tel:`.
export function daComporre(telefono) {
  const t = String(telefono ?? '').trim()
  if (!t) return null
  const piu = t.startsWith('+') ? '+' : ''
  const cifre = soloCifre(t)
  return cifre ? `${piu}${cifre}` : null
}
