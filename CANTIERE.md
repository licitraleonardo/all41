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

> 📻 **Per parlarsi c'è `ponte/`.** Questo file dice *chi ha cosa*; il ponte
> serve a **mettersi d'accordo**, ed è fatto in modo che il canale stesso non
> possa rompersi: `ponte/A.jsonl` la scrive solo A, `ponte/B.jsonl` solo B,
> e si scrive **solo in coda**. Le regole e gli otto verbi stanno in
> `ponte/PROTOCOLLO.md`.
>
> ✅ **9/8 — accordo chiuso: continua A da sola.** B si è tirata indietro
> (`ponte/B.jsonl`, messaggio `B9`) e ha consegnato quello che sapeva in
> `CONTESTO.md` prima di fermarsi. Da lì in poi tutti i commit sono di A.
> Se una terza sessione apre questa cartella, si dia una lettera, scriva in
> `ponte/` e **non tocchi `src/` finché A non risponde**.

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
| **A** | Niente: la road map del 9 agosto è finita, tutto committato e spinto | nessuno | 9/8 |
| **B** | Ferma. Ha consegnato `CONTESTO.md` e si è tirata indietro | nessuno | 9/8 |

Sessione **A** ha fatto tutti i commit del 9 agosto tranne due.
Sessione **B** è quella di `a6c6a52` (`CACCIA-IMPOSTORE.md`) e `a90b8fc`
(`CONTESTO.md`).
Chi arriva e non è A né B, si dia una lettera e si aggiunga.

⚠️ `CONTESTO.md` **non** è mai stato ricontrollato contro il codice: la fase
di verifica è morta sul limite di sessione. È materiale buono, non una fonte.

**Il disco è pulito e `main` è allineato a `origin/main`.** Se qui risulta
modificato qualcosa, è di una sessione che non ha scritto in questa tabella:
guardare prima di committare.

---

## Conflitti

Qui si scrive quando due lavori si toccano. Non si discute nel codice: si
scrive qui e si aspetta che Leonardo decida, oppure si prende altro.

### 1. Chi corregge i nove punti dell'Impostore — **chiuso: li ha fatti A**

Leonardo ha confermato, B si è tirata indietro, e i nove sono chiusi in
`160bdc5` e `37b3151`. La trappola del punto 7 — `schema.sql` che riportava
indietro tre funzioni senza dare nessun errore — è disinnescata in `49aaef0`:
una funzione, un file, e un controllo in fondo a `schema.sql` che lo dice.

<details><summary>Com'era la discussione</summary>

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

</details>

---

### 2. Dodici commit sono solo su questo disco — **chiuso: spinti**

Leonardo ha dato il permesso di spingere, e da `b214d9f` in poi ogni pezzo
funzionante finisce su `origin/main` appena è verde. `main` è allineato.

<details><summary>Com'era la discussione</summary>

`main` è **avanti di 12 commit su `origin/main`**. Nessuno dei due ha mai spinto:
tutto il lavoro del 9 agosto — di A e di B — esiste in un posto solo.

La regola 4 qui sopra dice *«un commit invece si recupera sempre»*. È vero solo
se è stato spinto. Finché non lo è, `git commit` protegge dall'altra sessione ma
non da niente altro.

Dalle trascrizioni risulta una decisione di Leonardo — il push lo fa Claude in
automatico a ogni pezzo funzionante, perché lui lavora spesso dal telefono e da
lì non riesce a spingere. Ma quella decisione viene da una sessione vecchia,
nessuno l'ha riconfermata, e con due sessioni sullo stesso branch conviene che lo
dica lui.

*In attesa della parola di Leonardo. Chi la riceve, spinga.*

</details>

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
| `9b1ad94` | A | `CANTIERE.md`: un posto dove mettersi d'accordo |
| `a90b8fc` | B | `CONTESTO.md`: le cinque chat ricordano le stesse cose |
| `f21e82a` | A | `ponte/`: un canale che non si può rompere da solo |
| `e170c74` | B | B si tira indietro e consegna |
| `752cf47` | A | L'accordo è chiuso: continua A |
| `49aaef0` | A | Una funzione, un file: disinnescata la trappola di `schema.sql` |
| `44149da` | A | Le spese eliminate non spariscono più dai conti |
| `160bdc5` | A | Quattro dei nove dell'Impostore |
| `25dd6c7` | A | Un giro d'accusa apre **un** voto, non uno per telefono |
| `80efcd0` | A | I profili di prova |
| `37b3151` | A | Gli ultimi quattro dell'Impostore |
| `b214d9f` | A | **Il tetto di tempo al centro** — chiude 8 difetti su 35 |
| `9a749f0` | A | La sera del 12 si entra, e riprovando non nasce un doppio |
| `5ff3e8b` | A | I soldi: niente doppioni, e un saldo spiegabile |
| `494d7b7` | A | Alla Dama i punti si prendono vincendo |
| `5322d70` | A | Ogni statistica dice cosa mostra |
| `13550ec` | A | I punti guadagnati arrivano, e l'MVP è quello della giornata |
| `2026730` | A | Chi decide legge fresco |
| `4748444` | A | La caccia: il 20 si vota fino a sera, e il pareggio si chiama così |
| `1fda645` | A | L'app non si ricarica più addosso a chi sta facendo qualcosa |
| `9c98f9a` | A | I vocali: l'eliminazione vale per tutti |
| `64d031e` | A | Il buco del socket non si mangia più l'SOS |
