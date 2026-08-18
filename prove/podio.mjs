// Il podio.
//
// ⚠️ La cosa da provare non e' che compaiano tre facce: e' che compaiano
// le STESSE tre facce a tutti e otto. Un podio che cambia a seconda di
// chi guarda non e' una schermata sbagliata, e' una lite.

import { readFileSync } from 'node:fs'
import { ordina, primiTre, ordineDiScoperta, quantiScoperti } from '../src/lib/podio.js'
import { PODIO } from '../src/config/podio.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const g = (nome, punteggio) => ({ id: nome.toLowerCase(), nome, punteggio })

// I punteggi veri del 17 agosto.
const VERI = [
  g('Martina', 38), g('Gioxs', 23), g('Franky', 18), g('Marco', 13),
  g('Smilerin', 10), g('Zu Die', 4), g('Maligno', -4), g('Leonardo', -23),
]

console.log('\nchi sale')
{
  const tre = primiTre(VERI)
  prova('sono tre', tre?.length === 3)
  prova('e sono i primi tre veri', tre.map((x) => x.nome).join(',') === 'Martina,Gioxs,Franky', tre?.map((x) => x.nome))
  prova('col posto attaccato', tre.map((x) => x.posto).join(',') === '1,2,3')

  // Sotto i tre non c'e' un podio: non si inventa un gradino vuoto.
  prova('in due non c e podio', primiTre([g('A', 5), g('B', 3)]) === null)
  prova('e senza nessuno nemmeno', primiTre([]) === null && primiTre(null) === null)
}

console.log('\nlo stesso podio su tutti i telefoni')
{
  // ⚠️ Il caso che conta. `leggiClassifica` ordina solo per punteggio,
  // quindi a parita' l'ordine delle righe lo decide il database e puo'
  // cambiare da una richiesta all'altra. Se il podio si fidasse di
  // quell'ordine, due telefoni mostrerebbero due secondi posti diversi.
  const pari = [g('Martina', 38), g('Bea', 20), g('Anna', 20), g('Zu Die', 4)]
  const alContrario = [g('Anna', 20), g('Zu Die', 4), g('Bea', 20), g('Martina', 38)]

  const uno = primiTre(pari).map((x) => x.nome).join(',')
  const altro = primiTre(alContrario).map((x) => x.nome).join(',')
  prova('a parita di punti, lo stesso ordine da qualunque lista', uno === altro, { uno, altro })
  prova('e lo spareggio e il nome', uno === 'Martina,Anna,Bea', { uno })

  // Anche mescolando piu' volte deve uscire sempre la stessa cosa.
  let sempreUguale = true
  for (let i = 0; i < 50; i += 1) {
    const mescolata = [...pari].sort(() => (i % 3) - 1)
    if (primiTre(mescolata).map((x) => x.nome).join(',') !== uno) sempreUguale = false
  }
  prova('e resta uguale mescolando cinquanta volte', sempreUguale)

  // ⚠️ Una lista SUA, non `pari`.
  //
  // La prima versione riusava `pari`, che i controlli qui sopra avevano
  // gia' fatto passare da `ordina`: rompendo la funzione apposta - facendola
  // ordinare sul posto - la prova restava verde, perche' la lista era gia'
  // ordinata e non c'era piu' niente da rovinare. Una prova che dipende da
  // quello che e' successo prima nello stesso file non prova quasi niente.
  prova('l ordinamento non tocca la lista di partenza', (() => {
    const sua = [g('Zeta', 1), g('Alfa', 9), g('Beta', 5)]
    const originale = [...sua]
    ordina(sua)
    return sua.every((x, i) => x === originale[i])
  })())
}

console.log('\ncome si scoprono')
{
  const tre = primiTre(VERI)
  const ordine = ordineDiScoperta(tre)
  prova('si parte dal terzo', ordine[0].nome === 'Franky' && ordine[0].posto === 3)
  prova('e si finisce col primo', ordine[2].nome === 'Martina' && ordine[2].posto === 1)
  prova('senza podio non si scopre niente', ordineDiScoperta(null).length === 0)

  // ⚠️ Il fuori-di-uno: a zero millisecondi il terzo posto c'e' gia'.
  // Sbagliando, o non compare mai il primo, o compaiono tutti insieme.
  prova('subito se ne vede uno', quantiScoperti(0) === 1)
  prova('appena prima del passo ancora uno', quantiScoperti(PODIO.passo - 1) === 1)
  prova('al passo ne compare un altro', quantiScoperti(PODIO.passo) === 2)
  prova('al doppio ci sono tutti', quantiScoperti(PODIO.passo * 2) === 3)
  prova('e non se ne aggiungono altri', quantiScoperti(PODIO.passo * 99) === 3)
  prova('un tempo assurdo non rompe niente', quantiScoperti(-5) === 0 && quantiScoperti(NaN) === 0)
}

console.log('\nla chiusura e sul database, non nell app')
{
  const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
    .split('\n')
    .map((r) => r.replace(/--.*$/, ''))
    .join('\n')

  prova('c e l interruttore sul viaggio', /add column if not exists punti_chiusi/.test(sql))

  const f = sql.slice(sql.indexOf('function assegna_punti'))
  const corpo = f.slice(0, f.indexOf('end $$;'))
  prova('e `assegna_punti` lo guarda', /punti_chiusi from trips/.test(corpo))

  // ⚠️ Terza volta in questo progetto: una funzione che torna UNA riga,
  // quando non ha niente da dire, restituisce una riga di soli `null` -
  // che in JavaScript e' vera.
  prova('restituisce una lista, non una riga', /returns setof point_events/.test(corpo))
  prova('e nessun `return e` travestito', !/return\s+e\s*;/.test(corpo), corpo.match(/return[^;]*;/g))

  const cliente = readFileSync(new URL('../src/lib/punti.js', import.meta.url), 'utf8')
  prova('e chi chiama prende il primo della lista', /data\?\.\[0\]/.test(cliente))
  prova('e si difende dal niente', /if \(!riga\) return null/.test(cliente))
  // Senza questo, una Legge verrebbe scoperta lo stesso, con pergamena e
  // coriandoli, per zero punti.
  prova('a punti chiusi non si scopre nemmeno una Legge', /if \(!evento\) return null/.test(cliente))

  // ⚠️ E la verita' sta in un posto solo: il database. Una costante
  // «chiusa: true» in configurazione sarebbe la seconda risposta alla
  // stessa domanda.
  const config = readFileSync(new URL('../src/config/podio.js', import.meta.url), 'utf8')
  prova('nessun interruttore doppione in configurazione', !/chiusa\s*:\s*(true|false)/.test(config))

  const lettura = readFileSync(new URL('../src/lib/classificaChiusa.js', import.meta.url), 'utf8')
  prova('lo stato si legge dal viaggio', /punti_chiusi/.test(lettura))
  prova('e chi decide lo legge fresco', /classificaChiusa\s*\.\s*fresca/.test(
    readFileSync(new URL('../src/lib/proposte.js', import.meta.url), 'utf8')
  ))
}

console.log('\ne la classifica lo dice, invece di far premere a vuoto')
{
  // ⚠️ Questa famiglia nasce da un mio pezzo lasciato a meta': avevo
  // scritto il rifiuto per chi prova a dare punti, e anche il cartello che
  // spiega perche' no. Il primo era collegato, il secondo era rimasto nel
  // file di configurazione senza che lo leggesse nessuno.
  //
  // Un testo scritto e mai usato non da' nessun errore: sembra fatto.
  const classifica = readFileSync(new URL('../src/components/Classifica.jsx', import.meta.url), 'utf8')
  const gioco = readFileSync(new URL('../src/components/Gioco.jsx', import.meta.url), 'utf8')

  prova('il cartello arriva a schermo', /CLASSIFICA_CHIUSA\.titolo/.test(classifica) && /CLASSIFICA_CHIUSA\.testo/.test(classifica))
  prova('e il rifiuto a chi ci prova lo stesso', /CLASSIFICA_CHIUSA\.rifiuto/.test(gioco))

  // ⚠️ Il punto che conta: la riga non deve piu' aprire la proposta.
  // Senza, il cartello dice «e' chiusa» e sotto ognuna delle otto righe
  // continua a invitare a toccarla.
  prova('le righe non si toccano piu', /disabled=\{chiusa \|\|/.test(classifica))
  prova('e non invitano piu a toccarle', (classifica.match(/\{!chiusa && !\(m\.id === ioId/g) ?? []).length === 2)

  // Il cartello PRENDE IL POSTO dell'invito invece di affiancarglisi: due
  // frasi opposte nello stesso punto dello schermo sono peggio di una
  // sola sbagliata.
  prova('e l invito sparisce invece di restare accanto', /chiusa \? \(/.test(classifica))

  // La verita' sta sul database. Un hook che parte da «chiusa» direbbe a
  // tutti che il gioco e' finito ogni volta che una lettura va storta.
  const hook = readFileSync(new URL('../src/hooks/useClassificaChiusa.js', import.meta.url), 'utf8')
  prova('e si parte da «aperta» se non si sa', /useState\(false\)/.test(hook))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
