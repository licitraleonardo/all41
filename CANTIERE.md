# Cantiere — chi sta lavorando dove

Su questo progetto lavora **più di una sessione di Claude Code alla volta**,
nella **stessa cartella** e sullo stesso `main`. Non su due copie: la stessa.

Vuol dire che non c'è nessun merge che ci salva. Se due sessioni aprono lo
stesso file, l'ultima che scrive **cancella il lavoro dell'altra senza dire
niente** — nessun conflitto, nessun errore, il codice semplicemente torna
indietro. È la stessa forma di tutti i difetti peggiori di questo progetto:
succede in silenzio.

Questo file esiste per evitarlo. **Va letto prima di scrivere qualunque
file, e aggiornato prima di cominciare un pezzo.**

---

## Le regole, che sono cinque

1. **Prima di toccare dei file, prenditeli qui sotto.** Nome della
   sessione, cosa stai facendo, quali file. Poi lavora.
2. **Se il pezzo che vuoi è già preso, non toccarlo.** Scrivilo in
   *Conflitti* e prendi altro. Non "tanto è una riga".
3. **Quando hai finito, togli la riga** e lascia il commit nel registro
   qui in fondo. Una presa che resta appesa blocca l'altro per niente.
4. **Committa spesso e piccolo.** Finché una modifica è solo sul disco e
   non in un commit, l'altra sessione può cancellarla senza accorgersene.
   Un commit invece si recupera sempre.
5. **Prima di committare, `git status`.** Se ci sono dentro file che non
   hai toccato tu, sono dell'altra sessione: **non aggiungerli**. `git add
   -A` a occhi chiusi è il modo più veloce per committare il lavoro a metà
   di qualcun altro.

Fuori dai file c'è una sola risorsa condivisa che dà fastidio: il **dev
server sulla 5174**. Se è già occupato, è dell'altra sessione — non
ammazzarlo, usalo così com'è (serve la cartella, quindi le modifiche si
vedono lo stesso).

---

## Chi ha cosa, adesso

| Sessione | Sta facendo | File presi | Da |
|---|---|---|---|
| **A** | I nove punti aperti di `CACCIA-IMPOSTORE.md` — **in attesa di conferma da Leonardo**, vedi Conflitti #1 | `src/lib/impostore.js`, `src/lib/partiteImpostore.js`, `src/hooks/useImpostore.js`, `src/components/Impostore.jsx`, `supabase/schema.sql`, `prove/impostore.mjs` | 9/8 |
| **A** | Caccia automatica in corso su sei sezioni non ancora battute (soldi, chat e vocali, punti, caccia al tesoro e Pecora, senza rete, ingresso). **Solo lettura** finché non porta risultati | nessuno preso in scrittura | 9/8 |

| **B** | Fonde in un solo documento quello che sanno le cinque chat di questo progetto e che non sta nel codice: perché una scelta è fatta così, dove Leonardo ha cambiato idea, cosa è già stato provato e non funziona. Lo scrive un workflow in sottofondo (cinque lettori, una fusione, due controlli) | `CONTESTO.md` (nuovo), `CANTIERE.md` | 9/8 |

Sessione **A** è quella che ha fatto i commit da `e104479` a `af70748`.
Sessione **B** è quella di `a6c6a52` (`CACCIA-IMPOSTORE.md`).
Chi arriva e non è A né B, si dia una lettera e si aggiunga.

**B non ha niente in `src/`, `supabase/` o `prove/`.** Se qualcosa lì risulta
modificato e non è di A, non è di nessuno dei due: guardare prima di committare.

---

## Conflitti

Qui si scrive quando due lavori si toccano. Non si discute nel codice: si
scrive qui e si aspetta che Leonardo decida, oppure si prende altro.

### 1. Chi corregge i nove punti dell'Impostore — **aperto**

`CACCIA-IMPOSTORE.md` è stato scritto dalla sessione **B** (commit
`a6c6a52`) e lascia aperti nove difetti dell'Impostore.

La sessione **A** ha lavorato sull'Impostore tutto il 9 agosto — `a29d606`,
`fff13a5`, `ea68009`, `8f27619`, più `7ff834d` sui voti — e nella tabella di
quel documento è "l'altra chat" a cui sono attribuiti tre dei difetti
chiusi.

**Proposta di A:** li prende A, perché ha il contesto fresco su quei file e
tre dei nove toccano codice modificato oggi (il n.1 sta dentro `Colpo`, il
n.8 dentro `paga`, il n.9 dentro `useImpostore`). **B prende altro.**

Il punto **7** in particolare è di A comunque, perché nasce da una cosa che
ha costruito A: `DA-LANCIARE.sql` aggiorna tre funzioni che `schema.sql`
continua a definire nella versione vecchia. Chi rilancia `schema.sql`
riporta indietro l'Impostore **senza nessun errore**, ed è una trappola
armata dentro il file che a Leonardo è stato detto di lanciare.

*In attesa della parola di Leonardo. Finché non arriva, A non tocca niente
di quei file.*

---

## Registro

Cosa è stato fatto, da chi, con il commit. Serve a capire in dieci secondi
se una cosa è già stata fatta dall'altro invece di rifarla.

| Commit | Sessione | Cosa |
|---|---|---|
| `e104479` | A | L'SOS che non risponde lo dice dopo dieci secondi |
| `1ec0191` | A | La coda delle foto non perde più niente, e si svuota da sola |
| `7ff834d` | A | Il voto dell'Impostore non lo chiude più `chiudiScaduti` |
| `a29d606` | A | Gli indovini di tutti i giri vengono pagati |
| `dff882f` | A | `DA-LANCIARE.sql`, un file SQL solo |
| `fff13a5` | A | Via d'uscita dal colpo di coda se chi è beccato sparisce |
| `ea68009` | A | Colpo di coda a due: chi arriva secondo lo sa |
| `8f27619` | A | Lo storico racconta la partita intera |
| `07f73d7` | A | `npm run sql:lancia`, per non aprire il browser |
| `a6c6a52` | B | `CACCIA-IMPOSTORE.md`: le trenta segnalazioni ritrovate |
| `af70748` | A | `CONTROLLA.sql`, il controllo del database in sola lettura |
