# Sessione dell'8 agosto — cosa è successo e dove siamo

> Documento di passaggio, come `SESSIONE-5-6-AGOSTO.md`. Chi riprende in
> mano il progetto legga **prima le due cose bloccanti** qui sotto, poi il
> resto quando serve.

---

## ⚠️ DUE COSE PRIMA DI TUTTO

### 1. Quattro file SQL da lanciare, in quest'ordine

Nell'**SQL Editor di Supabase**. Sono tutti rieseguibili: rilanciarli non rompe niente.

| File | Cosa aggiunge | Se non lo lanci |
|---|---|---|
| `supabase/dama.sql` | La tabella della Dama, le funzioni, **e l'iscrizione al realtime** | La scheda Dama non si apre. Se l'hai lanciato prima del 7 agosto, **rilancialo**: senza l'iscrizione le mosse dell'altro non arrivano mai, e sembra che il gioco sia rotto |
| `supabase/testimone.sql` | La colonna `turno_da` | Il testimone dei 30 secondi non blocca nessuno (l'app funziona, il tasto resta libero per tutti) |
| `supabase/apertura.sql` | `avvia_impostore` con i giri | **L'Impostore non parte proprio**: la funzione cambia firma |
| `supabase/giro.sql` | `chiudi_accusa` col giro vero e `turno_da` | Il contatore resta inchiodato su "Giro 1" tutta la sera, e chi apre un giro nuovo ha il testimone già scaduto |

### 2. Dati che il codice non può inventare, e sono tuoi

- **L'orario e il molo della barca del 14.** È la giornata più importante e l'unica pagata, e nell'app non c'è né ora né luogo. Sta in `src/config/itinerario.js`.
- **Il telefono del villaggio**, più guardia medica e farmacia di Quartu. Sta in `src/config/info.js`. L'indirizzo c'è già.
- **I profili di prova sul database.** Ce ne sono sei (Turi, Giulia, Ciccio, Ale, Nadia + il tuo). Prima di far entrare il gruppo vero vanno tolti con `supabase/svuota.sql`: **un profilo in più sballa i saldi delle Spese di tutti e non si cancella da solo.**

---

## Dove siamo

`Specifiche Modifiche.md` è **chiuso**: tutti gli ID fatti tranne GAME-1, che è impossibile come scritto (i numeri stanno in `DA-FARE.md`). `idee-leggi-trofei.md` è chiuso: la Parte 6 dice cosa è entrato e cosa no.

**Circa 500 controlli automatici**, tutti verdi. Un comando solo:

```bash
npm run prova
```

Prima di ogni commit, quello più `npm run lint`. Non è opzionale: dal 6 agosto è il lint che intercetta gli identificatori mancanti.

---

## Cosa è stato fatto oggi

### Il sistema di punteggio (il pezzo grosso)

Da un canale solo — proponi, il gruppo vota — a tre, di cui due che non passano dal giudizio degli altri. **49 Leggi, 37 attive.**

Le quattro trappole di PUNTI, tutte:

| Legge | | Nota |
|---|---|---|
| `contro-te-stesso` | −3 | Vale **anche se la proposta passa**: hai remato contro |
| `in-difficolta` | +3 | Il pareggio: **convive** con la Legge XI invece di sostituirla |
| `vera-amicizia` +2 / `ci-nascondete-qualcosa` −3 | | Conta le **proposte**, non i voti |
| `troppo-giudicante` | −3 | Il suggerimento non nomina né la Legge né il malus |

Più undici Leggi di ritmo quotidiano. La logica pura sta in `src/lib/punteggioProposte.js` con **116 prove** — era l'unico blocco che generava punti senza copertura.

**I voti sulle proposte sono palesi**, ma i nomi si scoprono **solo dopo aver votato**: era già la regola dei numeri, e vederli prima trasformerebbe il voto in un sondaggio a cui accodarsi.

### La Dama

Gioco nuovo, di coppia. Motore puro in `src/lib/dama.js` — una partita è la lista delle sue mosse, e da quella si ricostruisce identica su ogni telefono. **Il vincitore non è salvato: si ricava**, come i saldi delle Spese.

Regole all'inglese: presa **obbligatoria**, catena da completare, promozione che chiude la mossa, patta dopo 80 mosse senza prese. **55 prove**, fra cui 200 partite casuali a seme fisso su cui valgono sempre quattro proprietà.

Punteggio: quasi tutto passa dal **titolo di giornata** (+3) e non dalla singola vittoria — con le partite a raffica dopo cena, pagare ogni vittoria vorrebbe dire che il viaggio lo vince chi gioca di più.

### L'Impostore, rifatto in due punti

**I giri non si votano più all'inizio.** All'apertura si vota solo *"Quanti impostori?"*. Finito ogni giro si va al voto, e fra le risposte c'è **"Non ne so abbastanza — un altro giro"**. È la stessa decisione, quindi sta nello stesso voto.

⚠️ **A parità si accusa.** Restare fermi è la risposta che allunga, e un gruppo indeciso che si blocca è peggio di un'accusa sbagliata.

**Il testimone**: per 30 secondi dopo il cambio turno il tasto lo preme solo chi parla. Non è il countdown che lo spec vieta — un countdown mette fretta a chi parla, questo lo protegge da chi ha il dito veloce, e alla scadenza **non succede niente**.

**Il conteggio dei voti si vede mentre si vota.** Chi vota per ultimo diventa l'ago della bilancia: è voluto, così una parità la si vede arrivare.

### Il resto

Intro pixel-art (14 s, caricata pigra, **con una via d'uscita a tempo** se i fotogrammi non partono) · ingresso col codice come azione primaria e "Registrati" a tendina · uscita che copia il codice da sola · tutorial di 15 step · pallini per singola Legge che si spengono **guardando** (IntersectionObserver) · pagina `/installa` con rilevamento del browser interno di WhatsApp · tre banner che portano dritti al punto (proposta, sfida a dama, Legge nuova).

---

## ⚠️ Le trappole che questo progetto continua a pagare

### I numeri di posizione — **tre volte**

Le schede dei voti sul database sono **indici** dentro `voto.opzioni`, non id. Tradurle con l'elenco sbagliato sposta ogni numero di un posto e **non dà nessun errore**: assegna i punti alle persone sbagliate, in silenzio.

È successo con le schede dell'Impostore, con le opzioni dell'apertura quando ne ho aggiunta una, e con lo storico che traduceva con `partita.giocatori`.

> **Regola:** ogni volta che un elenco finisce sul database come indici, le opzioni si rileggono **da quella riga**, mai dalla configurazione. Cambiare la configurazione dopo rompe le righe vecchie senza dirlo.

### Il calcolo duplicato

Il finale dell'Impostore se lo calcolavano **tre posti diversi** e solo uno sapeva del colpo di coda. Non era un errore di calcolo: era la stessa domanda fatta a tre persone, e due non avevano l'ultima notizia. Ora c'è `raccontaFinale()` e la interrogano tutti.

Stessa forma il difetto dei punti: `paga()` guardava solo l'ultimo voto, quindi un impostore beccato al primo giro risultava **impunito** e si prendeva i 5 punti di chi l'ha fatta franca.

### Il contrasto che sembra a norma

L'etichetta delle Spese era a 5,33:1 — a norma — e si leggeva male lo stesso: 12px in maiuscoletto spaziato peso 400. **Le regole non modellano lo spaziamento.**

E il caso opposto: i pezzi neri della dama su casella blu scuro davano **1,05**, cioè la stessa luminosità. Erano invisibili e nessuno se n'era accorto perché "nero su scuro" sembra normale.

### Le prove sono decisioni, non regressioni

Quando cambia una regola, le prove che la contraddicono si **riscrivono**, non si aggiustano finché tornano verdi. È successo con i giri fissi dell'Impostore: cinque prove riscritte.

### Quello che il pannello di anteprima non può dirti

Non compone fotogrammi. Quindi **non funzionano**: `requestAnimationFrame`, `ResizeObserver`, `IntersectionObserver`, gli screenshot. E `document.hasFocus()` è falso, quindi la copia negli appunti fallisce sempre.

Non sono difetti del codice. Ma vuol dire che **intro, pallini del Testamento e copia del codice vanno provati su un telefono vero**.

---

## Cosa resta

### Da provare su dispositivi veri

1. **La safe area in PWA installata** — i tab in alto si vedono per intero? È BUG-1, mai verificato.
2. **La copia del codice su iPhone** — entrando, il messaggio dice *"Codice copiato"* o *"Il tuo codice è…"*? Il secondo vuol dire che è fallita.
3. **Le mosse della dama in tempo reale** fra due telefoni.
4. **`/installa` aperto da WhatsApp** — deve dire *"Aprila in Safari"*, non mostrare la guida.
5. **L'Impostore in sei o otto**, che è l'unica cosa che non si simula.

### Difetti noti e non ancora corretti

Dalla caccia sistematica dell'8 agosto restano **30 segnalazioni non verificate** (gli agenti hanno esaurito il tempo) e alcuni "raro" confermati:

- ⚠️ **`chiudiScaduti` può chiudere il voto dell'Impostore** dopo 30 minuti e piantare la partita. Rimedio: escludere `category = 'impostore'` da `src/lib/voti.js`.
- Se l'impostore beccato sparisce, la partita **resta in `colpo`** e non paga nessuno: manca un modo per il gruppo di rinunciare.
- Con due impostori beccati insieme, **entrambi** possono scrivere la parola ma vale solo la prima: va deciso chi tenta.
- Gli **indovini dei giri precedenti** non vengono pagati: `paga()` guarda solo l'ultimo voto.

Dalla critica funzionale del 7 agosto **non resta più niente**: anche la foto che spariva se l'upload falliva è stata chiusa (vedi sotto).

### La coda delle foto, rifatta

La coda su IndexedDB c'era già dal 7 agosto, e copriva il caso per cui era nata: l'upload che **fallisce**. Una caccia sistematica ha trovato che tutto il resto perdeva la foto lo stesso, e in silenzio. Chiusi:

| Dov'era | Cosa succedeva |
|---|---|
| `foto.js` | L'upload **appeso** non fallisce, quindi non arrivava mai al `catch` che accoda: la foto restava viva solo in una variabile, e i due bottoni morti per sempre. Ora ha 45 secondi (`SECONDI_UPLOAD`) |
| `Album.jsx` | **"Riprova" toglieva la voce prima di ritentare.** Bastava che il ritentativo venisse *rifiutato* — il tetto delle cinque al giorno — perché la foto sparisse. Premere Riprova la rendeva meno al sicuro di prima |
| `Album.jsx` | Il **rifiuto del limite** non accodava niente: scattavi la sesta foto del giorno e veniva buttata, con un messaggio che parlava d'altro |
| `Album.jsx` | Se `accoda` falliva, la riga compariva **identica alle salvate** e moriva al primo cambio scheda. Ora è tratteggiata e lo dice |
| `Album.jsx` | La × **distruggeva l'unica copia in un tocco**, mentre le foto già sul server ne chiedono due. Ora usa lo stesso `BottoneElimina` |
| `Album.jsx` | La voce non conservava lo **sfidaId**: la foto ritentata usciva dalla gara, finiva in album e bruciava una delle cinque |
| `Album.jsx` | La coda si vedeva **solo nella scheda Album**: chi falliva dalle Sfide non la trovava mai |
| `Album.jsx` | Nessun **ritentativo automatico**, malgrado due commenti che si citavano a vicenda promettendolo. Ora c'è il listener `online`, come la Pecora |
| `codaFotoRegole.js` | La coda **non era di nessuno**: chi entrava col codice di un altro se ne ritrovava le foto e le caricava a nome proprio |

Le regole stanno in `src/lib/codaFotoRegole.js`, fuori da IndexedDB e da React, con **37 prove**. La sola che conta: *una voce esce dalla coda solo se è arrivata o se l'hanno scartata*.

⚠️ **Resta da provare su un iPhone vero**: che un `File` da `capture` messo in IndexedDB sopravviva davvero alla chiusura della PWA. Su Chrome desktop i byte ci sono, ma è l'unico anello che non si verifica da qui — ed è quello su cui poggia tutta la frase "al sicuro sul telefono".

**L'SOS non è più in questo elenco.** L'errore era già finito dentro il foglio con `f2d8def`; restava il caso opposto, che è più subdolo: una richiesta che non fallisce ma **resta appesa**. Con una tacca di segnale la fetch non solleva niente, aspetta — quindi nessun `catch` scattava e il bottone restava su *"Invio…"* all'infinito, senza né errore né conferma. Ora l'SOS ha dieci secondi (`SECONDI_ATTESA` in `src/config/azioni.js`, l'unico tipo che ne ha) e allo scadere dice **"Non ha risposto"**, non "non è partita": sono due cose diverse, e la richiesta non viene annullata, quindi può ancora arrivare.

### Decisioni ancora aperte

- **SFI-1**: la finestra chiude il **19** (tre giorni dopo il 16, come dice il documento) o il **20** come è configurato?
- **GAME-1**: si fa la Pecora in verticale col doppio salto? Costa i record e 82 prove. I numeri sono in `DA-FARE.md`.

---

## Come si lavora qui

Le regole vere stanno in `CLAUDE.md` e valgono tutte. Le tre che contano di più:

1. **Una feature per volta, poi stop.** Non anticipare.
2. **Spiegami come testarlo, non come funziona.** Cosa aprire, cosa fare, cosa dovrei vedere, cosa vedrei se è rotto.
3. **Se una scelta dello spec si rivela sbagliata, dillo** invece di inventare un workaround silenzioso. È successo con GAME-1, con la sequenza del tutorial e coi giri dell'Impostore — e ogni volta la versione uscita dalla discussione era migliore di quella scritta.

Ogni pezzo di logica che genera punti va in una **funzione pura** provabile da riga di comando, fuori dai file che importano Supabase. Ogni listener ha il suo `limit()`. I testi dell'interfaccia stanno nei file di `src/config/`, non sparsi nei componenti.
