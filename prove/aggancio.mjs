// L'aggancio del telefono al profilo.
//
// ⚠️ Quello che si sta provando qui non e' una funzione: e' la
// condizione che permette di chiudere le porte senza chiudere fuori
// qualcuno. A porte chiuse, un telefono non agganciato non riceve un
// errore — riceve zero righe: foto sparite, chat sparita, spese sparite,
// e nessun messaggio che spieghi perche'. Ogni caso qui sotto e' un modo
// di restare fuori senza accorgersene.

import { readFileSync } from 'node:fs'
import { deveAgganciare, segno } from '../src/lib/aggancioRegole.js'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio) console.log('       ', JSON.stringify(dettaglio))
  }
}

const UID = 'aaaaaaaa-1111-2222-3333-444444444444'
const ALTRO_UID = 'bbbbbbbb-1111-2222-3333-444444444444'
const MEMBRO = '11111111-aaaa-bbbb-cccc-dddddddddddd'
const ALTRO_MEMBRO = '22222222-aaaa-bbbb-cccc-dddddddddddd'

console.log('\nquando ci si aggancia, e quando no')
{
  prova(
    'mai agganciato: si aggancia',
    deveAgganciare({ uid: UID, membroId: MEMBRO, segnato: null }) === true,
  )

  prova(
    'gia agganciato, stessa sessione e stesso membro: non si rifa',
    deveAgganciare({ uid: UID, membroId: MEMBRO, segnato: segno(UID, MEMBRO) }) === false,
  )

  // Cache svuotata, Safari privato, telefono nuovo: la sessione cambia
  // ma il segno di prima e' ancora li'. Senza questo caso quel telefono
  // non si riaggancerebbe MAI piu', e il giorno della chiusura resta
  // fuori con l'app che gli sembra vuota.
  prova(
    'sessione nuova, stesso membro: si riaggancia',
    deveAgganciare({ uid: ALTRO_UID, membroId: MEMBRO, segnato: segno(UID, MEMBRO) }) === true,
  )

  // Stesso telefono, membro diverso: capita a chi passa il telefono, e a
  // chi entra come qualcun altro per provare una cosa.
  prova(
    'stessa sessione, membro diverso: si riaggancia',
    deveAgganciare({ uid: UID, membroId: ALTRO_MEMBRO, segnato: segno(UID, MEMBRO) }) === true,
  )

  prova(
    'senza sessione non si tenta',
    deveAgganciare({ uid: null, membroId: MEMBRO, segnato: null }) === false,
  )

  prova(
    'senza membro non si tenta',
    deveAgganciare({ uid: UID, membroId: null, segnato: null }) === false,
  )

  // Il segno deve distinguere le due coppie, o i due casi qui sopra
  // sarebbero veri per caso invece che per costruzione.
  prova(
    'il segno tiene sessione E membro',
    segno(UID, MEMBRO) !== segno(ALTRO_UID, MEMBRO) &&
      segno(UID, MEMBRO) !== segno(UID, ALTRO_MEMBRO),
  )
}

console.log('\nil segno si scrive solo se il database ha detto di si')
{
  const testo = readFileSync(new URL('../src/lib/aggancio.js', import.meta.url), 'utf8')

  // ⚠️ E' l'ordine che conta, non la presenza. Segnando prima della
  // risposta, un aggancio fallito diventerebbe definitivo: quel telefono
  // non ci riproverebbe piu' e resterebbe fuori per sempre. Quindi si
  // cerca la catena chiamata → controllo dell'errore → scrittura, in
  // quest'ordine e senza scritture in mezzo.
  const catena = /rpc\([\s\S]*?if\s*\(error[\s\S]*?scriviSegno\(/
  prova('prima la risposta, poi il segno', catena.test(testo))

  const primaScrittura = testo.indexOf('scriviSegno(segno')
  const controllo = testo.indexOf('if (error')
  prova(
    'nessuna scrittura del segno prima del controllo',
    controllo !== -1 && primaScrittura > controllo,
    { controllo, primaScrittura },
  )

  // Gira all'avvio, che e' l'unico punto dell'app senza una rete sotto.
  prova('non puo sollevare: c e un try attorno a tutto', /export async function agganciaDispositivo[\s\S]*?try\s*\{/.test(testo))
}

console.log('\nil database: una domanda, una risposta')
{
  // ⚠️ I commenti si tolgono PRIMA di guardare, e non e' un vezzo: il
  // controllo «la funzione non solleva mai» e' rimasto rosso su codice
  // giusto perche' inciampava nel proprio commento, dove la parola
  // `raise` e' scritta per spiegare che non c'e'. Un controllo sul testo
  // che legge anche i commenti risponde a domande che non gli hai fatto.
  const sql = readFileSync(new URL('../supabase/account.sql', import.meta.url), 'utf8')
    .split('\n')
    .map((r) => r.replace(/--.*$/, ''))
    .join('\n')

  // Il primo tentativo (una colonna `members.auth_id` riempita col codice
  // di 5 lettere) era una SECONDA risposta alla domanda «chi sei». Chi
  // scrive le regole di chiusura ne troverebbe due: se sceglie quella
  // morta, le regole diventano sempre false e l'app si svuota per tutti.
  prova('la colonna del primo tentativo viene tolta', /alter table members\s+drop column if exists auth_id/.test(sql))
  prova('e la sua funzione anche', /drop function if exists aggancia_profilo/.test(sql))
  // ⚠️ `auth_id` e' anche il nome della colonna nella tabella nuova, quindi
  // cercare la parola non distingue la risposta viva da quella morta: si
  // cerca la colonna di `members`, che e' l'unica che non deve tornare.
  prova('nessuno legge piu la colonna vecchia', !/\bm(embers)?\.auth_id\b/.test(sql))

  // La domanda vera, quella su cui poggeranno tutte le regole.
  const dentro = sql.slice(sql.indexOf('function sono_del_viaggio'))
  const corpo = dentro.slice(0, dentro.indexOf('grant execute'))
  prova('«sei del viaggio?» guarda i dispositivi', /from member_devices/.test(corpo))
  prova('e controlla anche il viaggio, non solo la persona', /m\.trip_id\s*=\s*p_viaggio/.test(corpo))
  prova('gira coi permessi di chi l ha scritta', /security definer/.test(corpo))

  // ⚠️ Senza questo grant, un estraneo riceve un errore di permessi
  // invece di un educato «no» — e le regole di chiusura si romperebbero
  // in un modo che sembra un guasto del sito.
  prova('anche un anonimo puo chiederlo', /grant execute on function sono_del_viaggio\(text\) to anon, authenticated/.test(sql))

  const agg = sql.slice(sql.indexOf('function aggancia_dispositivo'))
  const corpoAgg = agg.slice(0, agg.indexOf('revoke execute'))
  prova('l aggancio gira coi permessi di chi l ha scritta', /security definer/.test(corpoAgg))
  prova('prende l id del membro, non il codice di 5 lettere', /p_membro uuid/.test(corpoAgg))

  // ⚠️ Gira all'avvio dell'app: un'eccezione qui e' l'unico errore che
  // non ha una rete sotto.
  prova('non solleva mai', !/\braise\b/.test(corpoAgg))

  // Vince l'ultimo che usa quel telefono, invece di fallire in silenzio.
  prova('un telefono che cambia membro si sposta', /on conflict \(auth_id\) do update/.test(corpoAgg))

  prova('un anonimo non puo agganciarsi', /revoke execute on function aggancia_dispositivo\(uuid\) from public, anon/.test(sql))

  // ⚠️ Protezione accesa e nessuna regola scritta: l'elenco di chi entra
  // da dove non deve poterlo leggere nessuno, nemmeno gli otto.
  prova('la tabella dei dispositivi e protetta', /alter table member_devices enable row level security/.test(sql))
  prova('e nessuno ci puo arrivare dall app', !/create policy[\s\S]*?on member_devices/.test(sql))

  // Una tabella e non una colonna: Leonardo entra da telefono e computer,
  // e con una colonna sola il secondo dispositivo spegnerebbe il primo.
  prova('un membro puo avere piu telefoni', /member_id\s+uuid not null references members/.test(sql) && !/member_id\s+uuid[^\n]*unique/.test(sql))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} falliti.\n`)
process.exit(falliti === 0 ? 0 : 1)
