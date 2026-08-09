# Caccia all'Impostore — 8 agosto

Una caccia sistematica sull'Impostore ha prodotto **63 segnalazioni**. Trentatré
sono state verificate sul momento (31 reali, 1 già coperta, 1 falsa) e corrette
in giornata. Le altre **30 sono rimaste senza verifica** perché gli agenti hanno
esaurito il tempo: erano solo un numero in `SESSIONE-8-AGOSTO.md`, senza niente
dietro. Questo file è quel "dietro", recuperato e ricontrollato riga per riga
contro il codice del 9 agosto.

Trenta segnalazioni, ma non trenta difetti: agenti diversi hanno trovato più
volte la stessa cosa. Difetti distinti: **diciassette**. Otto li avevo già chiusi
io, tre li ha chiusi l'altra chat mentre scrivevo questo. **Restano aperti nove.**

---

## Aperti

### 1. Nel colpo di coda tutti leggono «Ti hanno beccato»

`src/components/Impostore.jsx:1011` — l'etichetta sta **fuori** dal ternario
`tocca ?`, quindi la stampa anche a chi non è l'impostore.

**Come si vede.** Otto giocatori, un impostore. Il gruppo lo becca. Sul telefono
di un innocente la schermata dice, in cima, *«Ti hanno beccato»*, e sotto *«Marco
ci prova»*: due frasi rivolte a due persone diverse, sullo stesso schermo, nel
momento in cui quell'innocente ha appena **vinto**.

**Rimedio.** Spostare l'etichetta dentro il ramo `tocca`; agli altri metterne una
loro (*«L'avete beccato»*).

**Nello stesso punto**: `Impostore.jsx:141` toglie la schermata *«Sei fuori»* a
tutti quando lo stato è `colpo`, non solo all'impostore che deve scrivere. Chi
era stato eliminato per errore al giro prima perde l'elenco delle parole proprio
mentre la partita finisce. La guardia giusta è "non a chi è in `puo`", non "non
in stato colpo".

---

### 2. In quattro con due impostori la partita nasce già vinta

`src/config/impostore.js:27` — `sceltePerImpostori: [1, 2]` è una costante e non
guarda quanti sono i giocatori.

**Come si vede.** Quattro persone, il minimo. Al voto d'apertura il gruppo sceglie
2. Da quel momento `impostoriInMaggioranza` è **già vero** — due contro due — ma
quel controllo gira solo dentro `dopoAccusa`, cioè dopo la prima accusa. Il gruppo
gioca un giro intero e un voto per una partita che, per regola sua, ha già perso.

**Rimedio.** O `sceltePerImpostori` diventa una funzione del numero di giocatori
(due impostori da sei in su), o `avviaPartita` rifiuta un numero che renderebbe
vera `impostoriInMaggioranza` al primo turno — è lo stesso conto, esiste già.

---

### 3. Chi non sta giocando può annullare la partita a tutti

`src/components/Impostore.jsx:108` — `{inCorsoOra && <Abbandona … />}`, senza
`inGioco`.

**Come si vede.** Togli una persona dall'elenco prima di far partire la partita.
Su quel telefono l'app dice *«C'è una partita in corso e tu non ci sei dentro.
Goditela da fuori.»* — e subito sopra le mette un tasto che chiude il tavolo a
tutti gli altri. Le tre schermate del gioco vero hanno già la guardia `inGioco`
(righe 195, 205, 217); questa se l'è persa.

**Rimedio.** `{inCorsoOra && inGioco && <Abbandona … />}`.

---

### 4. La schermata d'apertura promette un numero di impostori che poi si vota

`src/components/Impostore.jsx:464-471`.

**Come si vede.** Metti otto persone. Sotto il tasto leggi *«Ci saranno due
impostori.»* Premi «Comincia in 8», il gruppo vota **1**, e la partita parte con
uno. La frase era un futuro indicativo su una cosa che decidono loro trenta
secondi dopo.

**Rimedio.** Dire che lo votano loro: *«Quanti impostori lo decidete voi fra un
attimo — in otto di solito due.»* (La riga *«Dopo due giri si vota»* era lo stesso
difetto ed è già stata tolta.)

---

### 5. Chi apre l'app mentre si vota non può più rivedere la sua parola

Il tasto *«👁 Tieni premuto: la tua parola»* vive solo dentro `Giro`
(`Impostore.jsx:753`), che si monta solo con stato `in-corso`.

**Come si vede.** Uno è al bagno col telefono in tasca e non apre mai l'app
durante il giro di parole. L'ultimo preme «Fatto, avanti». Quello torna, apre, e
si trova direttamente il voto: vota **senza sapere che parola aveva**, e — con la
variante della parola simile — senza sapere se l'impostore è lui.

**Rimedio.** Portare il tasto anche in `Accusa`, o mostrare la carta coperta sopra
il voto quando su quel telefono `impostore-letta-<id>` non è mai stato scritto.

---

### 6. Ogni giro d'accusa lascia in giro un voto per telefono

`src/lib/partiteImpostore.js:248-285` — `apriVoto` fa **prima** l'INSERT del voto e
**poi** l'UPDATE con `.is('vote_id', null)`.

**Come si vede.** Sei telefoni vedono lo stato passare a `voto` nello stesso
istante, ognuno con la sua copia locale dove `votoId` è nullo. Partono sei
`apriVoto`: la corsa la vince uno, ma le **sei righe** in `votes` sono già state
scritte tutte. Cinque sondaggi orfani per ogni giro d'accusa, aperti e votabili
per id. Nell'interfaccia non si vedono, ma restano.

**Rimedio.** Invertire l'ordine con una funzione SQL che, con la riga della partita
bloccata, crea il voto solo se `vote_id is null` e lo aggancia nella stessa
transazione — lo schema di `assicura_voto_sfida`, che già fa esattamente questo.

---

### 7. Rilanciare `schema.sql` resuscita le funzioni vecchie, in silenzio

`avvia_impostore`, `avanza_impostore` e `chiudi_accusa` sono dichiarate **due
volte**: in `schema.sql` (versione vecchia) e nei file che le governano
(`apertura.sql`, `testimone.sql`, `giro.sql`, e quindi `DA-LANCIARE.sql`). Vince
l'ultimo eseguito.

**Come si vede.** Il database è a posto. Più avanti serve una colonna nuova e si
rilancia `schema.sql` — cosa che il file stesso dichiara sicura (*«Rieseguibile:
se lo rilanci non rompe niente»*). Da quel momento il testimone dei 30 secondi non
riparte più, e il contatore dei giri torna a inchiodarsi. Nessun errore, nessun
messaggio.

**Rimedio.** Una sola definizione per funzione, in un solo file: togliere le tre da
`schema.sql` e lasciarle dove stanno adesso. Finché sono doppie, la frase
"rieseguibile" in cima a `schema.sql` non è vera.

---

### 8. `paga()` senza il voto in mano non si ferma

`src/lib/partiteImpostore.js:388` — `const opzioni = voto?.opzioni ?? partita.giocatori`.

**Attenuato**, non chiuso: da quando `scoperti`/`impuniti` si deducono da `fuori`,
un `voto` mancante non regala più +5 a tutti. Resta però che senza schede gli
**indovini sono zero**: chi aveva riconosciuto l'impostore non viene pagato, e
siccome la `dedupeKey` è `impostore:<partita>:<legge>:<membro>` quella mancanza è
definitiva — nessuno ripassa a rimediare.

**Come si vede.** Uno ricarica l'app mentre la partita è in `colpo`. `leggiPartita`
torna, `setStato('pronto')` gira **prima** che `caricaVoto` abbia finito, `Colpo`
si monta con `voto = null`, vede il tentativo già scritto e chiude la partita lui.

**Rimedio.** Far fallire `paga()` quando manca `voto?.opzioni`, come già fa
`chiudiAccusa`; e in `useImpostore` aspettare il voto prima di dichiarare `pronto`.

---

### 9. La risposta di una RPC lenta riscrive sopra un aggiornamento più recente

`src/hooks/useImpostore.js` — ogni `setPartita(await …)` (righe 159, 171, 181, 191,
201, 214, 239, 253) scrive la riga tornata dalla RPC così com'è. Il listener
realtime, invece, la confronta (riga 77).

**Come si vede.** Su rete lenta: premi «Fatto, avanti», e mentre la risposta viaggia
arriva dal realtime uno stato più avanti. La risposta atterra dopo e riporta
indietro la schermata di un passo. Si risistema al messaggio successivo, quindi è
raro e passeggero — ma nel gioco dove il turno deve essere lo stesso su otto
telefoni, un passo indietro si vede.

**Rimedio.** Far passare anche queste dallo stesso confronto del listener, invece
di scrivere diretto.

---

## Chiusi — e da chi

Dei diciassette difetti distinti, otto li ho chiusi io l'8 agosto e tre l'altra
chat il 9. Restano qui perché la caccia li aveva trovati e non si buttano via le
prove: se uno tornasse, questo è il punto da cui ripartire.

| Difetto | Segnalazioni | Chiuso da |
|---|---|---|
| L'impostore beccato a un giro precedente pagato come «impunito» | 1, 12, 18, 20 | `fuori` passato a `esito`/`premi`/`raccontaFinale`, poi `a29d606` |
| Il voto vecchio resta in mano e «Rivela» chiude il giro nuovo con le schede di prima | 2, 10, 11, 21 | `setVoto(null)` in `useImpostore.js:132` |
| Lo storico legge le schede con l'elenco dei giocatori invece che con le opzioni del voto | 3, 13, 22 | `8f27619` (`options` nella select) |
| «Giro 1 di 2» per tutta la partita | 4, 14, 25 | `giro.sql` — `coalesce(p_giro, giro + 1)` |
| Lo stato `colpo` senza via d'uscita se chi deve tentare sparisce | 5 | `fff13a5` — *«Non risponde: chiudete»* |
| Una partita annullata poteva tornare `finita` e pagare i punti | 6 | `.neq('stato','annullata')` in `chiudiPartita` |
| `chiudiScaduti` chiudeva il voto d'accusa e piantava la partita | 15 | `CATEGORIE_CHE_SCADONO` senza `impostore` |
| «Un altro giro» **e** un'accusa nella stessa scheda | 23 | la guardia in `alterna()` |
| L'intestazione col numero di impostori di partenza, non di quelli vivi | 24 | `impostoriVivi(partita)` |

Il difetto 7 (le funzioni doppie) è rimasto aperto **anche dopo** che l'altra chat
ha generato `DA-LANCIARE.sql`: quel file mette in fila i patch, ma `schema.sql`
continua a contenere le versioni vecchie delle stesse tre funzioni.
