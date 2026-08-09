// Il telefono lasciato quando ci si registra.
//
// ⚠️ Il metro e' che **sbagliato di poco e' peggio di mancante**: un
// numero lasciato in bianco lo si chiede a voce, uno storto lo si compone
// alle due di notte quando qualcuno non rientra, e non risponde nessuno.
// Quindi vuoto va bene e storto no.

import {
  PREFISSI,
  PREFISSO_PREDEFINITO,
  daComporre,
  senzaZeroIniziale,
  soloCifre,
  validaTelefono,
} from '../src/lib/telefono.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\nlasciarlo in bianco e una risposta')
{
  // Facoltativo vuol dire facoltativo: se diventasse obbligatorio, la
  // domanda smetterebbe di essere un servizio e diventerebbe un pedaggio
  // proprio nel momento in cui uno sta entrando per la prima volta.
  const v = validaTelefono(PREFISSO_PREDEFINITO, '')
  prova('vuoto non e un errore', v.vuoto === true && v.motivo === null)
  prova('e nemmeno spazi', validaTelefono(PREFISSO_PREDEFINITO, '   ').vuoto === true)
}

console.log('\nsi tiene solo quello che si puo comporre')
{
  // La gente incolla dalla rubrica, e dalla rubrica arriva di tutto.
  prova('spazi', soloCifre('333 123 4567') === '3331234567')
  prova('trattini e punti', soloCifre('333-123.4567') === '3331234567')
  prova('parentesi', soloCifre('(333) 1234567') === '3331234567')
  prova('lettere buttate via', soloCifre('333abc4567') === '3334567')
}

console.log('\nlo zero davanti se ne va')
{
  // ⚠️ E' il numero che sembra a posto e non squilla: `+39 006...` e
  // `+41 079...` vanno composti senza lo zero interno.
  prova('uno zero', senzaZeroIniziale('0791234567') === '791234567')
  prova('piu di uno', senzaZeroIniziale('00391234') === '391234')
  prova('e chi non ce l ha resta com e', senzaZeroIniziale('3331234567') === '3331234567')

  const v = validaTelefono('+41', '079 123 45 67')
  prova('e finisce nel valore salvato', v.ok && v.valore === '+41 791234567', v.valore)
}

console.log('\nquello storto si rifiuta, e si dice perche')
{
  const poche = validaTelefono('+39', '333')
  prova('poche cifre', !poche.ok && /poche/i.test(poche.motivo ?? ''), poche.motivo)

  const troppe = validaTelefono('+39', '1234567890123456789')
  prova('troppe cifre', !troppe.ok && /troppe/i.test(troppe.motivo ?? ''), troppe.motivo)

  const prefissoIgnoto = validaTelefono('+999', '3331234567')
  prova('prefisso che non c e', !prefissoIgnoto.ok, prefissoIgnoto.motivo)
}

console.log('\nquello buono passa')
{
  const v = validaTelefono('+39', '333 1234567')
  prova('un cellulare italiano', v.ok, v)
  prova('e il valore ha il prefisso', v.valore === '+39 3331234567', v.valore)
  prova('senza avvisi', v.avviso === null)
}

console.log('\nun fisso si accetta, ma lo si fa notare')
{
  // ⚠️ Si AVVISA, non si rifiuta: un fisso di casa e' un numero
  // legittimo da lasciare, e chi ha davvero un 3xx e ha sbagliato la
  // prima cifra se ne accorge qui.
  const v = validaTelefono('+39', '070 1234567')
  prova('passa', v.ok, v)
  prova('ma lo dice', /non sembra un cellulare/i.test(v.avviso ?? ''), v.avviso)

  // Fuori dall'Italia non si dice niente: le regole dei cellulari
  // cambiano paese per paese, e inventarsele sarebbe peggio.
  prova('e fuori dall Italia niente avviso', validaTelefono('+41', '211234567').avviso === null)
}

console.log('\nil link per chiamare')
{
  prova('niente spazi', daComporre('+39 333 1234567') === '+393331234567')
  prova('tiene il piu', daComporre('+39 3331234567').startsWith('+'))
  prova('senza numero, niente link', daComporre(null) === null && daComporre('') === null)
  prova('e nemmeno con la sola punteggiatura', daComporre('+ - .') === null)
}

console.log('\nl elenco dei prefissi sta in piedi')
{
  prova('il predefinito e nell elenco', PREFISSI.some((p) => p.codice === PREFISSO_PREDEFINITO))
  prova('ognuno ha un paese', PREFISSI.every((p) => p.paese && p.codice.startsWith('+')))
  prova('nessun doppione', new Set(PREFISSI.map((p) => p.codice)).size === PREFISSI.length)
  // Una tendina di duecento voci, su un campo facoltativo, si salta e
  // basta: sono quelli che servono a questo viaggio.
  prova('e sono pochi apposta', PREFISSI.length <= 10, PREFISSI.length)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
