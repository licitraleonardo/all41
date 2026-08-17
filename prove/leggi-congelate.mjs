// Le Leggi congelate prima del viaggio, e la domanda che le ha fatte
// scrivere: **una proposta di punti puo' sbloccare un achievement di
// nascosto?**
//
// La risposta e' no, e questa prova esiste perche' oggi e' no **per come
// e' fatta la struttura**, non perche' qualcuno l'abbia dichiarato. Le
// due strade non si toccano per fortuna, non per regola:
//
//   punti di una proposta →  assegnaPunti  →  point_events        (nessuna scoperta)
//   una Legge che scatta  →  faiScattareLegge → scopri_legge → leggi
//
// Basta che qualcuno, fra sei mesi, faccia passare i punti di una
// proposta dall'imbuto sbagliato: le scoperte comparirebbero e basta,
// senza nessun errore da nessuna parte. Qui si controlla che la
// separazione regga ancora.
//
// ⚠️ Si legge il sorgente, come `prove/fogli.mjs`: il difetto sarebbe
// l'assenza di una riga, e nessuna prova di comportamento la vede.

import { readFileSync } from 'node:fs'

let falliti = 0
function prova(nome, condizione, dettaglio) {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '} ${nome}`)
  if (!condizione) {
    falliti += 1
    if (dettaglio !== undefined) console.log('       ', JSON.stringify(dettaglio))
  }
}

// ⚠️ Senza togliere i commenti la prova legge anche le spiegazioni, e in
// questo progetto i commenti citano il codice che spiegano: la riga che
// dice «i punti delle proposte non passano da faiScattareLegge» verrebbe
// contata come una chiamata a faiScattareLegge. E' gia' successo tre
// volte.
const senzaCommenti = (dove) =>
  readFileSync(dove, 'utf8')
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')

const punti = senzaCommenti('src/lib/punti.js')
const proposte = senzaCommenti('src/lib/proposte.js')
const schema = readFileSync('supabase/schema.sql', 'utf8')

console.log('\nla scoperta ha una porta sola')
{
  // Se `scopri_legge` si potesse chiamare da piu' punti, congelarne uno
  // non basterebbe — e nessuno se ne accorgerebbe finche' non compare una
  // Legge che non doveva.
  const quante = (readFileSync('src/lib/punti.js', 'utf8').match(/scopri_legge/g) ?? []).length
  prova('scopri_legge si nomina solo in punti.js', quante >= 1, quante)

  const altrove = ['src/lib/proposte.js', 'src/lib/regole.js', 'src/lib/sfide.js'].filter((f) =>
    senzaCommenti(f).includes('scopri_legge')
  )
  prova('e nessun altro la chiama', altrove.length === 0, altrove)
}

console.log('\nil congelamento sta nell imbuto')
{
  const dentro = punti.slice(punti.indexOf('export async function faiScattareLegge'))
  prova('faiScattareLegge guarda se il viaggio e cominciato', /viaggioCominciato\(\)/.test(dentro))
  // ⚠️ E deve uscire PRIMA di assegnare i punti, non dopo: un controllo
  // messo in fondo lascerebbe passare tutto.
  const primaDelPunto = dentro.indexOf('viaggioCominciato()') < dentro.indexOf('assegnaPunti(')
  prova('e lo guarda prima di assegnare qualsiasi punto', primaDelPunto)
}

console.log('\nma i punti delle proposte non passano di li')
{
  // ⚠️ E' la domanda di Leonardo, e la risposta e' questa riga.
  //
  // `creaProposta` chiama `assegnaPunti` direttamente per i punti che si
  // propongono a qualcuno. Se un giorno passasse da `faiScattareLegge`,
  // congelare le Leggi spegnerebbe anche il modo esplicito di darsi punti
  // -- e prima del viaggio scoprirebbe il Trofeo delle proposte a tutti.
  const dentro = proposte.slice(
    proposte.indexOf('export async function creaProposta'),
    proposte.indexOf("stato: 'pending'")
  )
  prova('creaProposta assegna i punti da sola', /assegnaPunti\(/.test(dentro))
  prova('e non passa dalle Leggi per farlo', !/faiScattareLegge\(/.test(dentro), dentro.length)
}

console.log('\ne assegnare punti non scopre niente')
{
  // L'altra meta': la funzione del database che assegna i punti non deve
  // toccare la tabella delle scoperte. Se lo facesse, la separazione
  // scritta in JavaScript non varrebbe niente.
  // ⚠️ I commenti si tolgono prima di guardare.
  //
  // Senza, questo controllo e' rimasto rosso su codice giusto: dentro
  // `assegna_punti` c'e' un commento che spiega perche' non solleva, e
  // quel commento nomina «le Leggi». La prova ha letto la parola e ha
  // concluso che la funzione tocca la tabella delle scoperte.
  //
  // E' la terza volta in una notte che un controllo sul testo inciampa
  // in un commento. La regola e' sempre la stessa: si prova il codice,
  // non quello che ci si e' scritto intorno.
  const pulito = schema
    .split('\n')
    .map((r) => r.replace(/--.*$/, ''))
    .join('\n')

  const inizio = pulito.indexOf('function assegna_punti')
  const fine = pulito.indexOf('function ', inizio + 20)
  const corpo = pulito.slice(inizio, fine > inizio ? fine : inizio + 3000)

  prova('assegna_punti esiste', inizio > 0)
  prova('scrive su point_events', /insert into\s+point_events/i.test(corpo))
  // ⚠️ La riga che risponde alla domanda.
  prova('e la tabella delle scoperte non la sfiora', !/\bleggi\b/i.test(corpo), {
    trovato: (corpo.match(/.{0,40}\bleggi\b.{0,40}/i) ?? [])[0],
  })
}

console.log('\nil Primo sveglio conta i messaggi, non le righe dell app')
{
  // ⚠️ Le ricevute degli SOS e gli annunci delle proposte sono righe
  // `free_text` che scrive l'app per conto tuo. Contandole, bastava che
  // alle 8:10 uno proponesse dei punti perche' il Primo sveglio non lo
  // prendesse piu' nessuno: chi scriveva davvero alle 8:20 era gia' il
  // secondo. E una Legge si scopre scattando, quindi in quei giorni
  // spariva anche il +1 di chi la scopre.
  const regole = readFileSync('src/lib/regole.js', 'utf8')
  const conteggio = regole.slice(regole.indexOf('const delGruppo'), regole.indexOf('primo-sveglio'))
  prova('il conteggio del gruppo esiste', conteggio.length > 0)
  prova('e salta le ricevute degli SOS', /ricevutaSos/.test(conteggio), conteggio)
  prova('e gli annunci delle proposte', /propostaVoto/.test(conteggio), conteggio)
}

console.log('\nl arrabbiatura del Testamento la sorteggia il database')
{
  // ⚠️ La proprietà che regge tutto l'evento.
  //
  // I punti nuovi si estraggono UNA volta, in SQL, e si scrivono. Se li
  // estraesse l'app, otto persone vedrebbero otto classifiche diverse e
  // ognuna sarebbe convinta della sua — senza che nessun errore lo dica,
  // perché ogni singolo telefono sarebbe coerente con sé stesso. È il
  // difetto peggiore possibile per una classifica: invisibile da dentro.
  const gancio = readFileSync('src/hooks/useEventoTestamento.js', 'utf8')
  prova('l app non sorteggia niente', !/Math\.random|random\(\)/.test(gancio))
  prova('legge e basta', gancio.includes("from('point_events')"))
  prova('e la lettura ha il suo tetto', gancio.includes('.limit('))

  const sql = readFileSync('supabase/testamento-arrabbiato.sql', 'utf8')
  prova('il sorteggio sta in SQL', sql.includes('order by random()'))

  // ⚠️ E non cancella niente: aggiunge una riga a testa. Il punteggio di
  // questa app è «la somma degli eventi», e ogni schermata ci conta
  // sopra: riscrivere lo storico romperebbe l'invariante in venti punti,
  // e nella Classifica comparirebbero venti numeri cambiati di nascosto
  // invece di una riga sola che spiega il salto.
  prova('non cancella lo storico', !sql.includes('delete from point_events'))
  prova('e ricalcola i punteggi dalla somma', sql.includes('sum(p.points)'))

  // E si può rilanciare senza raddoppiare niente.
  prova('rilanciarlo non fa danno', sql.includes('on conflict (dedupe_key) do nothing'))
}

console.log(falliti === 0 ? '\nTutto a posto.\n' : `\n${falliti} cose non vanno.\n`)
process.exit(falliti === 0 ? 0 : 1)
