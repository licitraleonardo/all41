// Quando l'app si scopre.
//
// ⚠️ Una data sbagliata qui non da' nessun errore: l'app resta coperta
// mentre il gruppo e' in Sardegna, oppure si apre due giorni prima e il
// primo che gioca si porta via le Leggi per tutti. Non c'e' nessun
// sintomo intermedio, ed e' per questo che ha una prova sua.

import {
  APERTURA,
  APERTURA_ASSOLUTA,
  FORZA_APERTA,
  GIOCHI_COPERTI,
  giocoCoperto,
  viaggioCominciato,
} from '../src/config/rilascio.js'
import { SFIDE, sfidaComparsa, sfideDaMostrare } from '../src/config/sfide.js'
import { VIAGGIO } from '../src/config/viaggio.js'
import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

console.log('\nprima delle 19 dell 11 e tutto coperto')
{
  prova('il 10 sera', !viaggioCominciato(new Date('2026-08-10T23:59:00')))
  prova("l'11 di pomeriggio", !viaggioCominciato(new Date('2026-08-11T14:00:00')))
  // ⚠️ Il minuto prima. E' il caso che una data scritta storta sbaglia.
  prova("e perfino alle 18:59 dell'11", !viaggioCominciato(new Date('2026-08-11T18:59:00')))
}

console.log('\ndalle 19 in poi si apre da solo')
{
  prova('alle 19 in punto', viaggioCominciato(new Date('2026-08-11T19:00:00')))
  // ⚠️ La notte in aeroporto a Palermo, col volo delle 5:45 del 12: e' il
  // motivo per cui l'apertura e' scesa alla sera dell'11. Il viaggio
  // comincia quando si esce di casa, non quando si atterra.
  prova('alle 3 di notte, in aeroporto', viaggioCominciato(new Date('2026-08-12T03:00:00')))
  prova('a mezzogiorno del 12', viaggioCominciato(new Date('2026-08-12T12:00:00')))
  prova('e per tutto il viaggio', viaggioCominciato(new Date('2026-08-16T20:00:00')))
  // ⚠️ E dopo resta aperto: a viaggio finito si guardano le foto, il
  // Testamento e la classifica. Chiudere a fine viaggio sarebbe togliere
  // il ricordo insieme al gioco.
  prova('e anche dopo, per guardare', viaggioCominciato(new Date('2026-09-01T10:00:00')))
}

console.log('\nnon tutti i giochi sono coperti allo stesso modo')
{
  // ⚠️ «Prima» adesso vuol dire il pomeriggio dell'11, non la sera.
  // L'apertura e' scesa alle 19 dell'11, quindi alle 21 non e' piu'
  // coperto niente — Impostore compreso. Chi si gioca in otto attorno a
  // un tavolo si apre proprio quando siete tutti seduti in aeroporto.
  const prima = new Date('2026-08-11T15:00:00')
  const dopo = new Date('2026-08-12T10:00:00')

  prova("l'Impostore e coperto il pomeriggio dell'11", giocoCoperto('impostore', prima))
  prova('la Dama no', !giocoCoperto('dama', prima))
  prova('All nemmeno', !giocoCoperto('pecora', prima))
  // ⚠️ Il 12 non resta coperto niente. Un gioco dimenticato dentro
  // `GIOCHI_COPERTI` con una condizione sbagliata resterebbe chiuso per
  // tutto il viaggio, e nessuno vedrebbe un errore: vedrebbe un lucchetto.
  prova('dopo l apertura e aperto tutto', GIOCHI_COPERTI.every((id) => !giocoCoperto(id, dopo)), {
    ancoraCoperti: GIOCHI_COPERTI.filter((id) => giocoCoperto(id, dopo)),
  })

  // ⚠️ Un nome scritto storto qui non copre niente e non dice niente.
  //
  // `GIOCHI_COPERTI = ['impostora']` e' una lista valida, `includes`
  // risponde `false`, e l'Impostore si apre due giorni prima senza che un
  // solo errore compaia da nessuna parte. L'unico modo di accorgersene e'
  // confrontare i nomi con quelli veri della Sala.
  const sala = readFileSync('src/components/SalaGiochi.jsx', 'utf8')
  const nomiVeri = [...sala.matchAll(/\['([a-z]+)', '[^']+'\]/g)].map((m) => m[1])
  prova('la Sala ha i suoi giochi', nomiVeri.length >= 3, nomiVeri)
  const inventati = GIOCHI_COPERTI.filter((id) => !nomiVeri.includes(id))
  prova('e ogni gioco coperto e uno di quelli', inventati.length === 0, { inventati, nomiVeri })

  // ⚠️ E un gioco coperto non deve essere **costruito**, solo nascosto.
  //
  // E' la ragione per cui esiste la `Pellicola`: l'Impostore e la Dama,
  // appena montati, aprono ascoltatori sul database e possono creare
  // partite. Nascosti con un velo continuerebbero a girare, e si
  // vedrebbero partite create prima di partire.
  const guardia = sala.indexOf('{!coperto && (')
  prova('la Sala ha la sua guardia', guardia > 0, guardia)
  for (const gioco of ['<Impostore', '<Dama', '<Pecora']) {
    prova(`${gioco} sta dentro la guardia`, sala.indexOf(gioco) > guardia, {
      gioco: sala.indexOf(gioco),
      guardia,
    })
  }
}

console.log('\nuna sfida anticipata compare prima, ma non si chiude prima')
{
  // ⚠️ Questa e' la famiglia con i denti di tutto il file.
  //
  // L'11 il gruppo era gia' dentro l'app e non aveva niente da fare
  // insieme, e la sfida del selfie e' stata anticipata di un giorno. La
  // prima versione la faceva valere **zero punti**, che sembrava la cosa
  // ovvia da fare, e costava tre danni invisibili da li': il 12, giorno
  // vero dell'arrivo, la si sarebbe trovata gia' chiusa; la Legge XXIX
  // prende il suo valore da quella riga e a zero sarebbe scivolata dai
  // Trofei alle Punizioni; e la Legge sarebbe scattata **congelata**,
  // quindi mai scoperta, invisibile nel Testamento per tutto il viaggio.
  //
  // La regola che regge tutto e' una sola: **comparire e chiudersi sono
  // due cose diverse**, e solo la prima si anticipa.
  const anticipate = SFIDE.filter((s) => s.anticipata)
  prova('ce n e almeno una', anticipate.length >= 1, anticipate.map((s) => s.id))

  // E si vede davvero prima che il viaggio cominci, altrimenti
  // «anticipata» sarebbe solo una parola scritta dentro un oggetto.
  const laSera = new Date('2026-08-11T21:00:00')
  for (const s of anticipate) prova(`${s.id} si vede l 11`, sfidaComparsa(s, laSera))

  // ⚠️ Ma vale i suoi punti, e questo va tenuto fermo. Portarla a zero
  // per «non dare punti in anticipo» e' esattamente lo sbaglio di sopra:
  // il punteggio della sfida non e' solo suo, ci pende attaccata una
  // Legge del Testamento.
  const aZero = anticipate.filter((s) => s.punti === 0)
  prova('e vale ancora i suoi punti', aZero.length === 0, aZero.map((s) => s.id))

  // ⚠️ E la chiusura aspetta il viaggio. E' la riga che tiene separate le
  // due cose: senza, la sfida si chiude la sera prima e i tre danni
  // tornano tutti insieme.
  //
  // Si guarda **dentro** `forseChiudiCollettiva` e non nel file intero:
  // `chiudi_sfida` viene chiamata anche dalle competitive, prima nel
  // file, e cercandola alla cieca la prova falliva confrontando la
  // guardia con la chiamata sbagliata.
  const lib = readFileSync('src/lib/sfide.js', 'utf8')
  const dentro = lib.slice(lib.indexOf('export async function forseChiudiCollettiva'))
  const guardia = dentro.indexOf('if (!viaggioCominciato()) return')
  const chiude = dentro.indexOf("rpc('chiudi_sfida'")
  prova('la chiusura ha la sua guardia', guardia > 0, guardia)
  prova('e la guardia viene prima di chiudere', guardia > 0 && guardia < chiude, {
    guardia,
    chiude,
  })

  // ⚠️ E chi sta a schermo deve saperlo. Otto selfie caricati, tutti
  // presenti e niente che succede e' indistinguibile da una cosa rotta:
  // l'Album dice che ci siete tutti e che si chiude il 12.
  const album = readFileSync('src/components/Album.jsx', 'utf8')
  prova('e l Album lo dice invece di stare zitto', /aspetta\b/.test(album))

  // ⚠️ E sono le uniche a comparire in anticipo. La porta aperta per una
  // sfida non deve aprirsi per tutte: il resto della caccia compare il
  // suo giorno, e vederla tutta in anticipo vorrebbe dire bruciarla
  // tutta in anticipo.
  const soloLeAnticipate = (quando) => {
    const viste = sfideDaMostrare({}, quando)
    return [...viste.diOggi, ...viste.aperte].map((s) => s.id)
  }
  // ⚠️ E sta fra le sfide **di oggi**, non fra le «ancora aperte».
  // «Ancora aperte» vuol dire *l'avevi già vista e non l'hai fatta*, e
  // la sera prima di partire non l'aveva vista nessuno.
  const dellaSera = sfideDaMostrare({}, laSera)
  prova(
    'e sta fra quelle di oggi, non fra le aperte',
    dellaSera.diOggi.length === anticipate.length && dellaSera.aperte.length === 0,
    { diOggi: dellaSera.diOggi.map((s) => s.id), aperte: dellaSera.aperte.map((s) => s.id) }
  )

  // Ma solo prima di partire: a viaggio finito non esiste piu' nessun
  // «oggi», e restare li' vorrebbe dire una sfida di oggi per sempre.
  const dopoTutto = sfideDaMostrare({}, new Date('2026-09-01T10:00:00'))
  prova('e a viaggio finito non e piu di oggi', dopoTutto.diOggi.length === 0, {
    diOggi: dopoTutto.diOggi.map((s) => s.id),
  })

  const laSeraSiVede = soloLeAnticipate(laSera)
  prova(
    'e prima del 12 non se ne vedono altre',
    laSeraSiVede.every((id) => anticipate.some((s) => s.id === id)),
    laSeraSiVede
  )

  // ⚠️ E la stessa domanda al 14 **luglio**, che non e' un capriccio.
  //
  // L'11 agosto la riga qui sopra non sa fallire, e l'ho scoperto
  // rompendo il codice apposta: tolto il controllo sulla data del
  // viaggio la prova restava verde, perche' l'altro confronto — «il
  // giorno della sfida e' arrivato?» — legge solo il **numero** del
  // giorno, e nessuna sfida arriva prima del 12. Undici e' piu' piccolo
  // di dodici e copriva il buco per conto suo.
  //
  // Il 14 luglio no: quattordici e' maggiore di dodici, e senza quel
  // controllo comparirebbero tre sfide con un mese d'anticipo. E' l'unico
  // momento in cui si vede lavorare, quindi e' l'unico momento in cui ha
  // senso guardarlo — e adesso serve doppiamente, perche' l'eccezione
  // delle anticipate sta scritta **sopra** di lui e una scritta sopra
  // puo' scavalcarlo.
  const aLuglio = soloLeAnticipate(new Date('2026-07-14T21:00:00'))
  prova(
    'e nemmeno un mese prima, quando il numero del giorno inganna',
    aLuglio.every((id) => anticipate.some((s) => s.id === id)),
    aLuglio
  )
}

console.log('\nl orario e quello del viaggio, non un altro')
{
  // Una data scritta a mano in due posti diversi e' una data che prima o
  // poi litiga con se stessa.
  // ⚠️ Non piu' il giorno d'inizio: l'app apre **la sera prima**, quando
  // si esce di casa per andare in aeroporto. Quello che deve restare
  // vero e' che apra entro il giorno d'inizio, mai dopo.
  prova('apre entro il giorno d inizio', APERTURA.slice(0, 10) <= VIAGGIO.dataInizio, {
    apertura: APERTURA,
    viaggio: VIAGGIO.dataInizio,
  })
  prova('alle 19', APERTURA.slice(11, 16) === '19:00')
}

console.log('\nl interruttore per provarla e spento')
{
  // ⚠️ Questa e' la riga che conta il 12 agosto. `FORZA_APERTA` serve a
  // provare l'app aperta senza aspettare, e dimenticata a `true` fa
  // uscire tutto scoperto: il primo che gioca si porta via le Leggi per
  // tutti, senza che nessuno se ne accorga.
  prova('FORZA_APERTA e null', FORZA_APERTA === null, FORZA_APERTA)
}

console.log('\nil taglio della classifica e lo stesso istante dell apertura')
{
  // ⚠️ Tre posti dicono «le 6 del 12», e se si separano non lo dice
  // nessuno: `config/rilascio.js` per l'app, il taglio dentro
  // `supabase/azzera.sql`, e il cron in `vercel.json`. Uno sfasamento
  // vuol dire punti guadagnati dopo l'apertura e cancellati lo stesso, o
  // punti delle prove che restano in classifica per tutto il viaggio.
  const sql = readFileSync('supabase/azzera.sql', 'utf8')
  const trovato = (sql.match(/taglio timestamptz := '([^']+)'/) ?? [])[1]
  prova('il taglio c e, scritto nella funzione', Boolean(trovato), trovato)

  prova(
    'ed e lo stesso istante in cui l app si apre',
    new Date(trovato).getTime() === new Date(APERTURA).getTime(),
    { sql: trovato, app: APERTURA }
  )

  // ⚠️ E lo stesso istante con cui si filtrano le statistiche. Sono tre
  // scritture della stessa ora in tre posti: se una si sposta, i punti
  // ripartono da zero in un momento e le statistiche in un altro.
  prova(
    'e lo stesso con cui si contano le statistiche',
    new Date(APERTURA_ASSOLUTA).getTime() === new Date(APERTURA).getTime(),
    { assoluta: APERTURA_ASSOLUTA, app: APERTURA }
  )

  // Il cron: 04:00 UTC sono le 06:00 a Roma a meta' agosto.
  const cron = JSON.parse(readFileSync('vercel.json', 'utf8')).crons ?? []
  const azzera = cron.find((c) => c.path === '/api/azzera')
  prova('il cron dell azzeramento c e', Boolean(azzera), cron)

  const [minuto, ora] = (azzera?.schedule ?? '').split(' ')
  const quando = new Date(Date.UTC(2026, 7, 11, Number(ora), Number(minuto)))
  const aRoma = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
  }).format(quando)
  prova('e a Roma sono le 19:00', aRoma === '19:00', aRoma)
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
