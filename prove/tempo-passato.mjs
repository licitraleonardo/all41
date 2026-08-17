// Il conto di quanto tempo e' passato dal viaggio.
//
// ⚠️ Non c'e' niente di difficile qui dentro, ed e' proprio il motivo per
// cui va provato: sono tutte cose che sbagliano in silenzio e restano a
// schermo per giorni. Un «0 giorni» che nessuno toglie, un participio che
// sbaglia genere per un'ora al giorno, un conto che va in negativo il
// giorno che si cambia la data in configurazione.

import { readFileSync } from 'node:fs'
import { scomponi, inParole } from '../src/lib/tempoPassato.js'
import { TORNATI, PROSSIMO } from '../src/config/prossimoViaggio.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const MIN = 60000
const ORA = 60 * MIN
const GIORNO = 24 * ORA

console.log('\nil conto')
{
  prova('quattro giorni tondi', JSON.stringify(scomponi(4 * GIORNO)) === JSON.stringify({ giorni: 4, ore: 0, minuti: 0 }))
  prova(
    'giorni, ore e minuti insieme',
    JSON.stringify(scomponi(4 * GIORNO + 7 * ORA + 12 * MIN)) ===
      JSON.stringify({ giorni: 4, ore: 7, minuti: 12 }),
  )
  prova('i secondi non arrotondano in su', scomponi(59 * 1000)?.minuti === 0)

  // ⚠️ Prima della fine non si conta niente. Senza, cambiando la data del
  // viaggio in configurazione comparirebbe «sono passati -3 giorni», che
  // e' il tipo di cosa che nessuno prova perche' «non puo' succedere».
  prova('prima della fine: niente', scomponi(-1) === null)
  prova('niente non e uno zero travestito', scomponi(-5 * GIORNO) === null)
}

console.log('\ncome si dice')
{
  prova(
    'giorni, ore e minuti',
    JSON.stringify(inParole({ giorni: 4, ore: 7, minuti: 12 })) ===
      JSON.stringify({ verbo: 'passati', elenco: '4 giorni, 7 ore e 12 minuti' }),
  )

  // ⚠️ Il participio si accorda col PRIMO pezzo, non con l'ultimo. Nel
  // primo giorno dopo il rientro i giorni sono zero, quindi si comincia
  // dalle ore: «sono PASSATE 23 ore e 12 minuti».
  const senzaGiorni = inParole({ giorni: 0, ore: 23, minuti: 12 })
  prova('senza giorni il verbo diventa femminile', senzaGiorni.verbo === 'passate', senzaGiorni)
  prova('e i giorni a zero non si dicono', senzaGiorni.elenco === '23 ore e 12 minuti', senzaGiorni)

  const conGiorni = inParole({ giorni: 4, ore: 23, minuti: 12 })
  prova('coi giorni torna maschile', conGiorni.verbo === 'passati', conGiorni)

  // I buchi in mezzo si saltano: «4 giorni e 12 minuti», non «4 giorni, 0
  // ore e 12 minuti».
  prova(
    'i pezzi a zero in mezzo spariscono',
    inParole({ giorni: 4, ore: 0, minuti: 12 }).elenco === '4 giorni e 12 minuti',
  )
  prova('un pezzo solo non prende la «e»', inParole({ giorni: 0, ore: 0, minuti: 5 }).elenco === '5 minuti')

  prova('uno solo va al singolare', inParole({ giorni: 1, ore: 1, minuti: 1 }).elenco === '1 giorno, 1 ora e 1 minuto')

  // Appena finito: non «0 minuti», ma una frase che ha senso.
  prova('tutto a zero: nessun elenco', inParole({ giorni: 0, ore: 0, minuti: 0 }).elenco === null)
  prova('e niente resta niente', inParole(null) === null)
}

console.log('\nla configurazione')
{
  prova('la fine del viaggio e una data vera', !Number.isNaN(new Date(TORNATI.fine).getTime()), TORNATI.fine)

  // ⚠️ Il controllo che serve davvero: il participio non deve stare
  // scritto nella configurazione. Ce l'avevo messo, calcolando quello
  // giusto due file piu' in la' e poi non usandolo - cioe' il difetto
  // che il calcolo doveva evitare, dentro il codice che lo evita.
  const nellaConfigurazione = `${TORNATI.prima} ${TORNATI.rinforzo} ${TORNATI.dopo}`
  prova('il participio non e scritto fisso', !/passat[ie]/.test(nellaConfigurazione), nellaConfigurazione)

  const riga = readFileSync(new URL('../src/components/TempoPassato.jsx', import.meta.url), 'utf8')
  prova('e la frase a schermo lo usa davvero', /\{parole\.verbo\}/.test(riga))

  // ⚠️ Il tasto non deve fare niente, ed e' la ragione per cui esiste.
  // Questo controlla che il componente non abbia mai imparato a caricare
  // qualcosa di nascosto: nessun campo per i file, nessuna chiamata.
  const testo = readFileSync(new URL('../src/components/ProssimoViaggio.jsx', import.meta.url), 'utf8')
  prova('nessun campo dove lasciare un file', !/type=["']file["']/.test(testo))
  prova('non parla col database', !/supabase|from\('/.test(testo))
  prova('il testo del tasto viene dalla configurazione', /PROSSIMO\.tasto/.test(testo))
  prova('e il tasto ha un testo', typeof PROSSIMO.tasto === 'string' && PROSSIMO.tasto.length > 0)

  // ⚠️ I due tasti tondi sono fatti di un simbolo solo, quindi chi non
  // vede lo schermo non ha NIENTE da leggere se manca l'etichetta. Un
  // tasto senza nome non e' un tasto brutto: e' un tasto che non esiste.
  for (const [quale, verso] of [['indietro', PROSSIMO.indietro], ['avanti', PROSSIMO.avanti]]) {
    prova(`il tasto ${quale} ha un simbolo`, typeof verso?.segno === 'string' && verso.segno.length > 0)
    prova(`e dice dove porta`, typeof verso?.dove === 'string' && verso.dove.length > 3, verso)
  }

  const tondo = readFileSync(new URL('../src/components/TastoRadio.jsx', import.meta.url), 'utf8')
  prova('e l etichetta arriva davvero al tasto', /aria-label=\{verso\.dove\}/.test(tondo))
  prova('anche tenendo il puntatore fermo', /title=\{verso\.dove\}/.test(tondo))
  prova('il simbolo invece e nascosto al lettore vocale', /aria-hidden="true">\{verso\.segno\}/.test(tondo))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
