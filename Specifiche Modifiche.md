# Specifiche modifiche — App viaggio

> Documento di lavoro. Ogni punto ha un ID per poterlo richiamare singolarmente (es. "implementa AUTH-1").
>
> **Stato all'8 agosto** — legenda in testa a ogni voce:
> ✅ fatto · ⏸ rimandato con motivo · ❌ scartato con motivo · ⬜ da fare
>
> | | |
> |---|---|
> | ✅ Fatti | **tutto**, tranne GAME-1 |
> | ❌ / ⏸ | GAME-1 (impossibile come scritto, vedi `DA-FARE.md`) |
>
> **Resta solo quello che non può fare il codice**: l'orario e il molo della barca del 14, e il telefono del villaggio. Sono in `DA-FARE.md`.
>
> I cinque "Punti da chiarire" in fondo hanno tutti una risposta: sono nella sezione **Decisioni prese**.

---

## 1. Accesso e gestione codice ✅ **fatto** (`318cf62`)

> ⚠️ **Il pezzo difficile non era nel documento.** Il codice nasce insieme al profilo, cioè dopo un giro di rete, e a quel punto su iPhone il permesso di copiare è già scaduto: Safari lo concede solo dentro il gesto appena fatto, e un `await` in mezzo lo brucia. Scritto nel modo ovvio, AUTH-2 avrebbe mostrato "Codice copiato" **senza aver copiato niente**, proprio sull'unica cosa che riporta dentro l'app. Risolto passando una Promise al posto del testo (`ClipboardItem`), che tiene aperto il permesso.
>
> In tutti e due i casi il messaggio **dice la verità**: se la copia non riesce scrive il codice per intero invece di dire "copiato".
>
> **Risposte alle domande che il documento lasciava aperte:**
> - *Quale "copia il codice" rimuovere da AUTH-1?* Nella schermata d'uscita non ce n'era nessuno. L'unico bottone Copia dell'app stava in `CodiceNuovo`, la schermata che AUTH-3 elimina: quindi è sparito da solo.
> - *Il codice è di 5 o 6 caratteri?* Resta **5**. Lo spec ne mostrava sei (`YHA8HD`), ma sono quelli già distribuiti e allungarli li invaliderebbe tutti.
> - *"Genera avatar / nome" genera anche il nome?* **No, solo l'avatar.** Con nomi inventati, in classifica e nelle Spese non si riconosce più nessuno — ed è l'unica cosa che il gruppo deve leggere a colpo d'occhio.
>
> Spariscono `CodiceNuovo.jsx` e `Recupero.jsx`: il codice si inserisce nell'onboarding, non in una schermata a parte.

### [AUTH-1] Esci da questo dispositivo
- **Rimuovere** il pulsante/opzione "copia il codice" dalla schermata di uscita.
- Al tap su *Esci da questo dispositivo*:
  1. mostrare un **avviso di conferma** (l'utente deve sapere che senza codice non rientra);
  2. alla conferma, **copiare automaticamente** il codice di accesso negli appunti;
  3. mostrare toast: **"Codice di accesso copiato"**;
  4. procedere con il logout.

### [AUTH-2] Codice copiato al primo accesso
- Appena si accede (creazione personaggio completata), copiare automaticamente il codice negli appunti e mostrare il messaggio:
  **"Codice copiato — YHA8HD"** (con il codice reale dell'utente).

### [AUTH-3] Inversione schermata "Crea nuovo personaggio"
Invertire la gerarchia della schermata: l'azione primaria diventa l'ingresso con codice esistente.

| Posizione | Prima | Dopo |
|---|---|---|
| Campo principale | Nome | **Inserisci un codice** + pulsante **Entra** |
| Sotto | (codice) | **Genera avatar / nome** |

- Flusso di conferma dopo la generazione: **"Sicuro?"** → pulsanti **Inizia viaggio** / **Indietro**.
- **Inizia viaggio** crea il personaggio e porta **direttamente dentro l'app**, mostrando il toast di [AUTH-2] con il codice già copiato. Nessun passaggio intermedio.
- **Indietro** riporta alla generazione di avatar/nome senza creare nulla.

---

## 2. Tutorial ✅ **fatto** (`ae96d99`, `49725c6`)

> Quindici step invece di cinque messaggi generici. Il lavoro vero non erano i testi ma l'innesco: nove step su quindici stanno dentro sotto-schede, e quello stato vive nei contenitori, non in App. La nuvoletta è scesa dentro Gruppo, Foto, Gioco e Altro; in App resta solo Oggi, che sotto-schede non ne ha.
>
> **Aggiunto uno step per la Dama**, che nell'elenco non c'era perché quando l'hai scritto non esisteva: senza, sarebbe l'unica scheda muta dell'app.
>
> ⚠️ Emersa provando: col ripristino dei sotto-tab (SOTTOTAB) si può atterrare in una scheda senza "entrarci", e il messaggio scatta lì. È il comportamento giusto — la nuvoletta spiega dove sei — ma l'ordine dei quindici non è garantito.

### [TUT-1] Impostazione grafica (vale per tutti gli step)
- **ALLAN va fuori dal fumetto**, non dentro.
- La **coda del fumetto** deve puntare **ad altezza faccia** di ALLAN.
- Usare **una sola immagine** di ALLAN per tutti gli step del tutorial: quella attualmente usata in **Testamento accanto al titolo**.
- **Rimuovere** quell'immagine da Testamento → schermata pulita.

### [TUT-2] Copertura
Attualmente il tutorial ha messaggi generici solo sui primi tab. Va **esteso a tutti i tab** con i testi specifici qui sotto.

### [TUT-3] Comportamento
Per ogni step è indicato se il tutorial **parte dentro il tab** (si entra nella sezione) o se il **fumetto si sposta soltanto** rimanendo nella stessa schermata.

**Innesco degli step:**
- **Step 1–10 (tab principali):** guidati dall'**esplorazione dell'utente** — ogni messaggio compare la prima volta che si apre quel tab, non in catena automatica.
- **Step 11–15 (sotto-voci di Altro):** **sequenza automatica** all'ingresso in Altro. I cinque messaggi scorrono uno dopo l'altro senza bisogno di aprire ogni sotto-sezione.
- Prevedere in ogni caso un **"Salta"** per uscire dalla sequenza automatica.

| # | Sezione | Comportamento | Testo |
|---|---|---|---|
| 1 | **Giorno (Itinerario)** | parte dentro il tab | "Qui c'è il programma del viaggio. Così almeno sapete dove dovreste essere... anche se arriverete in ritardo lo stesso." |
| 2 | **Gruppo** | parte dentro il tab | "Questa è la chat. Parlate, litigate, prendetevi in giro. Cercate solo di non infrangere le Leggi..." |
| 3 | **Vocali** | **solo spostamento del fumetto** verso l'alto, vicino ai vocali | "Se scrivere vi stanca, lasciate un vocale. Sarà comunque troppo lungo per essere ascoltato." |
| 4 | **Album** | parte dentro il tab | "Qui finiscono le foto del viaggio.. Che c'è?? Non c'è nient'altro da dire" |
| 5 | **Sfide** | **solo spostamento del fumetto** verso l'alto, vicino a Sfide | "Dai un'occhiata alle sfide, ce ne sono di nuove ogni giorno, yuppy..." *(tono passivo-aggressivo)* |
| 6 | **Classifica** | parte dentro il tab | "Qui vedete chi sta vincendo il viaggio. Puoi proporre dei punti per ribaltare o confermare la situazione." |
| 7 | **Testamento** | parte dentro il tab | "Le Leggi decidono cosa vale punti e cosa vi farà pentire delle vostre azioni. I Trofei? Gloria eterna." |
| 8 | **L'Impostore** | parte dentro il tab | "Uno mente. Gli altri provano a scoprirlo. Claudio non fare il babbo maligno" |
| 9 | **Gioco di ALL** | parte dentro il tab | "Provo a evitare gli ostacoli, che bella metafora della vita" |
| 10 | **Altro** | parte dentro il tab | "Le cose utili che nessuno cerca finché non servono davvero." |
| 11 | 💸 **Spese** | sotto-voce di Altro | "Segnate chi ha pagato. Così a fine viaggio smettete di dire 'non mi ricordo quanto ti devo'." |
| 12 | 🗺️ **Mappa** | sotto-voce di Altro | "Per chi si perde anche seguendo il gruppo." |
| 13 | 📊 **Statistiche** | sotto-voce di Altro | "Numeri, record e altre prove oggettive delle vostre pessime decisioni." |
| 14 | 📖 **Guida** | sotto-voce di Altro | "Se siete arrivati qui significa che non avete ascoltato il tutorial. Classico." |
| 15 | ℹ️ **Info** | sotto-voce di Altro | "Versione dell'app, crediti e altre cose che leggerete per circa quattro secondi." |

---

## 3. Testamento ✅ **fatto** (`2204ab5`, `ae96d99`)

> **Due decisioni che il documento lasciava indecidibili:**
> 1. *Il pallino segnala anche le Leggi non ancora scoperte?* **No.** La nota di bilanciamento diceva "le Leggi non ancora scoperte restano non lette": presa alla lettera, ogni persona si sarebbe trovata una ventina di pallini accesi **per sempre** sulle voci oscurate — il contrario di una notifica.
> 2. *Cosa vuol dire "aprire" un trofeo?* Non esisteva: erano righe di elenco già tutte aperte, e senza un gesto il pallino non aveva modo di spegnersi. Ora la riga si tocca e si apre, e dentro c'è **chi l'ha fatta scattare e quando** — così aprire significa qualcosa invece di spegnere un pallino.
>
> ⚠️ Lo stato è un insieme di **ID**, mai numeri romani né posizioni: l'etichetta si calcola dalla posizione nell'array, quindi bastava aggiungere un Trofeo in mezzo — ed è successo, quindici volte in un giorno — perché tutti i pallini si riaccendessero sulle voci sbagliate.

### [TEST-1] Pallini di notifica
- Su **Trofei** e **Leggi**: pallino di notifica **per singolo elemento non ancora visualizzato** (non un badge unico di sezione).
- Il pallino sparisce quando il singolo trofeo / la singola legge viene aperta.
- Serve quindi persistenza dello stato "letto/non letto" per elemento e per utente.

### [TEST-2] Immagine ALLAN
- Rimuovere l'immagine accanto al titolo (vedi [TUT-1]).

---

## 4. Gioco di ALL

### [GAME-1] Dimensione schermo ⏸ **impossibile come scritto**
- ~~Ingrandire l'area di gioco fino a occupare **quasi tutta la schermata** disponibile.~~
- La larghezza sullo schermo è quella del telefono: l'unico modo di alzare il riquadro è **far vedere meno pista**. Per arrivare a ~600px servirebbero 208 unità di mondo contro le 500 di oggi, e a quel punto un ostacolo compare **0,22 s** prima di arrivare addosso mentre un salto ne dura **0,58**. Il limite vero è 460 unità (271px), dove il preavviso coincide col salto e non resta margine.
- Alzare il cielo non serve: **il 45% del mondo è già cielo irraggiungibile**, e Allan resta 31px comunque.
- Numeri completi, e cosa costerebbe una versione verticale col doppio salto, in `DA-FARE.md` → *La Pecora in verticale*.

---

## 5. Bug e fix UI

### [BUG-1] iPhone 13 Pro — tab in alto non visibili ✅ **fatto** (`a84990c`)
- Causa: `apple-mobile-web-app-status-bar-style=black-translucent` + `viewport-fit=cover`, quindi in PWA installata il contenuto parte da y=0. `Itinerario.css` compensava con `env(safe-area-inset-top)`, le altre quattro schermate no.
- Rimedio: variabile `--spazio-alto` in `index.css`, gemella di `--altezza-tab`. Da browser vale zero, quindi fuori dalla PWA non cambia niente.
- ⚠️ **Resta da provare su un iPhone vero, in modalità installata**: da Safari il difetto non si vede.

### [BUG-2] Spese — colore "Devi ricevere" ✅ **fatto** (`56fc163`)
- Il contrasto era già a norma (5,33:1): il problema era il maiuscoletto spaziato a 12px in peso 400, che le regole non modellano. Ora è grassetto e prende il colore del verso — verde scuro il credito (9,33:1), rosso scuro il debito (7,77:1).
- Trovati e sistemati nello stesso file due difetti vecchi: `.cronologia-schede` era morta per un `button` orfano, e cinque elementi avevano perso il contorno di messa a fuoco.

### [BUG-3] "Aggiungi un documento" ✅ **fatto** (`cacaaa6`)
- ⚠️ L'elemento sta in **Documenti**, non in Spese.
- Non era troppo basso di qualche pixel: a sezione vuota il testo finiva a y=176 e il bottone stava a y=732 — **556px di vuoto**, mezzo schermo. Il "fisso in fondo" serve a raggiungerti mentre scorri; senza niente da scorrere abbandonava il bottone laggiù.
- Rimedio: `position: sticky`. A elenco lungo resta sopra la barra dei tab esattamente come prima, a sezione vuota sta attaccato al testo.

---

## 6. Sfide — metà fatta (`af67f39`)

> ✅ **La finestra di voto adesso è davvero quella promessa.** La gara nasceva con scadenza "adesso + 24 ore", residuo di quando le gare erano giornaliere: aperta il 17 moriva il 18, mentre `CACCIA.chiude` dice 20. Ora la scadenza è la fine della finestra, uguale per tutte le gare a prescindere da quando si aprono, in una funzione pura con sei prove.
>
> ⬜ **Restano due cose che vogliono una tua decisione:**
> 1. La finestra chiude il **19** (tre giorni dopo il 16, come dice il testo qui sotto) o il **20** come è configurato oggi?
> 2. Le **"votazioni per persona" non esistono** per le sfide: sono tutte foto, il voto è anonimo su id di foto. O è una feature nuova nascosta dentro SFI-1, o intendevi le proposte di punti, che sono già voti su persone.
>
> ⚠️ E soprattutto: aprire i voti **nel giorno della sfida** ribalta una decisione motivata per iscritto in `src/lib/cacciaFinale.js` — i voti si aprono il 17 apposta, perché "il telefono in vacanza si guarda tre volte al giorno". Non è una regolazione di parametri.

### [SFI-1] Finestre temporali
- Ogni sfida si **apre nel proprio giorno** e resta **aperta fino a 3 giorni dopo la fine della vacanza**.
- Esistono due tipi di votazione: **votazioni foto** e **votazioni per persona**. **Entrambe restano aperte** per l'intera finestra, quindi fino a **3 giorni dopo la fine della vacanza**, in linea con la sfida.
- Nessun disallineamento tra apertura della sfida e chiusura del voto: si chiudono insieme.

---

## 7. Sistema di punteggio ✅ **fatto** (`59a24ff`)

> Tutti e quattro implementati, più undici Leggi nuove dal catalogo. La logica sta in `src/lib/punteggioProposte.js` — pura, senza Supabase — con **116 prove** in `prove/proposte.mjs` (`npm run prova:proposte`). Era l'unico blocco che generava punti senza copertura.
>
> Le decisioni sui cinque punti da chiarire sono in fondo, sezione **Decisioni prese**.

### [PUNTI-1] Malus per voto contrario alla propria proposta
- Se faccio una proposta e poi **voto NO** sulla mia stessa proposta → **perdo punti**.
- **Il voto di chi propone è libero**: nessun SÌ implicito, preimpostato o bloccato. Chi apre la votazione vota come tutti gli altri.
- Applicare il pattern "trappola": il sistema **lascia completare** il voto e solo dopo rivela legge + malus.

### [PUNTI-2] Trofeo per pareggio
- Se apro una votazione e finisce in **pareggio** → **trofeo sbloccato**: *"Hai messo in difficoltà il gruppo"*.
- Verificare il caso limite: con numero pari di votanti il pareggio è statisticamente frequente. Valutare un quorum minimo di partecipazione perché il trofeo scatti.

### [PUNTI-3] Voti ripetuti verso la stessa persona — escalation
Il tetto massimo di voti verso la stessa persona è **3 al giorno**: il contatore si **azzera ogni giorno**. Il sistema **non blocca nulla in anticipo**: conta i voti e reagisce in modo diverso a ogni soglia, fino all'ultima consentita.

| Voto n° verso la stessa persona (nella giornata) | Effetto |
|---|---|
| 1° | nessun effetto, voto normale |
| 2° | **Trofeo sbloccato**: *"Questa è vera amicizia"* → **assegna punti** |
| 3° (ultimo possibile) | **Trappola**: *"Ci nascondete qualcosa?"* → **toglie punti** |

- Il premio al 2° voto serve da **esca**: rende la trappola del 3° più efficace, perché l'utente ha appena ricevuto un rinforzo positivo per lo stesso comportamento.
- Meccanica identica alla **trappola del votare se stessi** (regola già definita e nota a Code): il sistema fa completare **tutto il procedimento** e solo alla fine rivela la Legge e applica il malus.
- Essendo 3 il tetto giornaliero, il malus **scatta una volta al giorno** al massimo, e coincide con l'esaurimento dei voti disponibili verso quella persona.
- Il trofeo *"Questa è vera amicizia"* va assegnato **una sola volta per coppia di giocatori**, non ogni giorno: altrimenti in una settimana diventa un bonus automatico.

### [PUNTI-4] Una proposta alla volta — Legge "Troppo giudicante"
- Ogni proposta resta online per **45 minuti**.
- Il countdown parte **dal momento in cui almeno una persona diversa dal proponente ha votato** (comportamento oggi **non presente**, va implementato).
- Una proposta si chiude quando si verifica una delle due condizioni: **la votazione si conclude** oppure **scade il tempo**.
- Finché la propria proposta è ancora aperta, **aprirne un'altra** fa scattare la Legge **"Troppo giudicante"** → **toglie punti**.
  - Prima che la Legge scatti, mostrare un **suggerimento**: *"Aspetta almeno che finisca la votazione."*
  - Il suggerimento **non rivela né la Legge né il malus**: è solo un invito ad aspettare. Chi procede lo stesso attiva la trappola.
- Stesso pattern trappola delle altre Leggi: il sistema lascia completare l'azione e solo dopo rivela la Legge e applica il malus.

### Note di bilanciamento (da valutare insieme prima di implementare)
- **PUNTI-1, PUNTI-3 e PUNTI-4 sono trappole**, quindi *non vanno segnalate in anticipo* nell'interfaccia: la Legge si scopre solo attivandola. Le Leggi non ancora scoperte restano non lette in Testamento (si collega a [TEST-1]).

### Come sono finiti, e cosa è cambiato rispetto a qui sopra

| | Legge | Punti | Nota |
|---|---|---|---|
| PUNTI-1 | `contro-te-stesso` | −3 | vale **anche se la proposta passa lo stesso**: hai remato contro, e quello si paga a prescindere dall'esito |
| PUNTI-2 | `in-difficolta` | +3 | **convive con la Legge XI** invece di sostituirla (vedi sotto) |
| PUNTI-3 | `vera-amicizia` +2 / `ci-nascondete-qualcosa` −3 | | conta le **proposte**, non i voti |
| PUNTI-4 | `troppo-giudicante` | −3 | finestra invariata a 60 minuti |

**PUNTI-2 e la Legge XI.** Il pareggio faceva già scattare `poll-tie`, −1 a tutti. Le due regole non sono state fuse: il proponente incassa il −1 come tutti **e** il +3 del trofeo, quindi ci guadagna netto. È voluto — mettere in difficoltà otto amici vale la differenza — e la prova lo verifica esplicitamente.

**PUNTI-4, la scadenza.** Nessuna scadenza assoluta inventata: la finestra resta quella di **un'ora dalla creazione** che c'era già, quindi il caso "nessuno vota e la proposta blocca tutto per sempre" non esiste. Il countdown dal primo voto è stato scartato — richiedeva una colonna nuova e uno stato "non ancora avviato" che `expires_at not null` non sa rappresentare, e risolveva un problema che la finestra fissa non ha.

**Il suggerimento e la trappola.** "Aspetta almeno che finisca la votazione" con due bottoni: *Aspetto* e *Mandala lo stesso*. Il suggerimento non nomina né la Legge né il malus. Chi insiste la fa scattare e la vede solo dopo, col foglio della punizione che c'era già per l'autoelogio.

**Le trappole possono scattare insieme.** Proporsi punti da soli *mentre* si ha già una proposta aperta *e* per la terza volta verso la stessa persona fa scattare tre Leggi in un colpo. Se ne mostra una, le altre restano nello storico — che leggono tutti, ed è il punto.

---

## 8. PWA — pagina di installazione dedicata

**Premessa:** allo stato attuale nessuno ha la PWA installata (chi ce l'ha la cancellerà), quindi si parte da zero e non serve gestire migrazioni.

**Obiettivo:** avere un **link da condividere** che apre una **pagina web dedicata alla sola installazione**, con guida specifica per il dispositivo. Non è l'onboarding dell'app: è una pagina a sé. Una volta che l'app è sulla home del telefono, si usa normalmente.

> ✅ **Fatto** (`d2ac7dc`). Il riconoscimento del dispositivo è una funzione pura con **25 prove su user agent veri** (`npm run prova:dispositivo`).
>
> ⚠️ **Il caso che conta di più non è riconoscere WhatsApp**: è *non* scambiare Safari per un browser interno. Dire "apri in Safari" a chi è già in Safari è un vicolo cieco. C'è anche l'iPad, che da anni si dichiara Macintosh e si distingue da un Mac solo dal touch.
>
> ⚠️ **PWA-4, la difesa che serviva davvero**: su iOS "Aggiungi alla schermata Home" fissa l'indirizzo della pagina corrente, quindi installando **da /installa** l'icona riaprirebbe per sempre la guida all'installazione. Chi ci arriva già in standalone viene rimandato all'app vera. L'app da browser continua a funzionare normalmente.
>
> ❌ **Niente QR per il desktop**: lo spec lo dava per "eventuale", le librerie non si possono caricare da fuori (CSP) e scriverne uno sarebbe ~150 righe per un caso che si risolve copiando il link.

### [PWA-1] Pagina di installazione separata
- URL dedicato, distinto da quello dell'app (es. `/installa`).
- Contiene **solo** la guida all'installazione: niente login, niente inserimento codice, niente onboarding.
- Rilevare il dispositivo e mostrare **una sola guida**, quella giusta — non tutte insieme.

### [PWA-2] Guida per dispositivo
- **iPhone / Safari:** `beforeinstallprompt` **non esiste**, l'installazione è solo manuale. Servono istruzioni illustrate passo-passo: *Condividi → Aggiungi alla schermata Home → Aggiungi*.
- **Android / Chrome:** intercettare `beforeinstallprompt`, salvare l'evento e mostrare un pulsante **"Installa app"** che chiama `prompt()`. Tenere le istruzioni manuali come fallback, perché l'evento non scatta sempre.
- **Desktop:** mostrare un messaggio che l'app è pensata per il telefono, con eventuale QR code per passare al mobile.

### [PWA-3] Browser in-app 🔴 ostacolo principale
Il link verrà condiviso quasi certamente **su WhatsApp**, che su iPhone lo apre nel **proprio browser interno**, dove *Aggiungi alla schermata Home* **non esiste**. Stesso problema con Instagram, Facebook, Telegram.

- Rilevare il browser in-app dallo user-agent e mostrare, al posto della guida, l'istruzione: **"Apri questa pagina in Safari"** (iOS) / **"Apri in Chrome"** (Android), indicando dove sta il menu ⋯ per farlo.
- ⚠️ **Non è possibile forzare l'apertura in Safari da una pagina web su iOS** (lo schema `x-safari-https://` funziona solo da app native). Su Android si può tentare con un URL `intent://`, ma non è affidabile ovunque.
- Prevedere quindi un pulsante **"Copia link"** ben visibile: è la via più solida — l'utente copia e incolla nel browser giusto.

### [PWA-4] Dopo l'installazione
- Nessun gate e nessun blocco: l'app installata si comporta normalmente.
- Da decidere cosa fare se qualcuno apre l'URL dell'app da browser invece che dalla pagina di installazione (vedi punti da chiarire).

### [PWA-5] Codice di accesso e storage separato
- La PWA installata ha uno **storage separato** dal browser: chi era già entrato da browser **non** si ritrova loggato nell'app e deve reinserire il codice.
- La pagina di installazione deve ricordarlo prima dell'installazione: *"Tieni a portata il tuo codice di accesso, ti servirà per entrare."*
- Si collega a [AUTH-1] / [AUTH-2].

---

## Decisioni prese

I cinque punti che erano da chiarire, risolti l'8 agosto.

**1. I valori di bonus e malus.** Fasce ±1 / ±2 / ±3 / ±5 come proponeva il catalogo, con un vincolo aggiunto: **nessun malus nuovo supera il −3**, e la prova lo verifica. I −5 restano solo dove c'erano già. Somma dei trofei attivi +60, delle punizioni −34, contro proposte che valgono fino a ±5 l'una e tre al giorno a testa: **le proposte restano il canale dominante**, che era la regola di equilibrio.

**2. PUNTI-3 conta le PROPOSTE, non i voti.** Contare i voti litigava con due cose insieme: il quorum di metà gruppo (con tre voti al giorno verso la stessa persona, le proposte sulla persona più gettonata sarebbero diventate invotabili e si sarebbero annullate da sole) e la Legge dell'Astenuto, che avrebbe punito chi non vota. Contare le proposte non ha nessuno di questi effetti, ed è anche la lettura più naturale di "ti accanisci su qualcuno".

**3. Nessuna scadenza assoluta da inventare.** Il countdown dal primo voto è stato scartato: la finestra resta **un'ora dalla creazione**, com'era già, quindi il caso "nessuno vota e la proposta blocca tutto" non si presenta. Il countdown dal primo voto avrebbe richiesto una colonna nuova, uno stato "non ancora avviato" che `expires_at not null` non rappresenta, e un valore sentinella che avrebbe fatto sparire la proposta dal banner prima che qualcuno potesse votarla.

**4. La seconda proposta viene creata.** Chi preme "Mandala lo stesso" la manda davvero: ne restano due aperte, e la Legge scatta. Annullarla sarebbe stato il peggio dei due mondi — l'utente paga il malus *e* perde il lavoro fatto, per una regola che non gli era stata annunciata. Il tetto di tre al giorno impedisce comunque che diventi un'abitudine.

**5. [PWA-4] ⬜ ancora aperta**, perché PWA-1…5 non è stato ancora fatto. Quando si affronterà, la raccomandazione è: **l'app da browser funziona normalmente**, e la pagina `/installa` reindirizza a `/` se si accorge di girare già in standalone. Reindirizzare l'app verso la guida all'installazione lascerebbe fuori chi la apre da desktop.

---

## Extra

### [SOTTOTAB] Il ricarica-tab vale anche per i sotto-tab ✅ **fatto** (`3518192`)
- Ricaricando si resta nella sotto-scheda dov'eri, dentro Gruppo, Foto, Gioco e Altro, più il terzo livello Trofei/Leggi del Testamento.
- Un hook solo (`useSchedaRicordata`) invece di cinque copie. `sessionStorage` come per il tab principale: domani si riparte dalla prima scheda.
- Il valore letto si valida contro gli id ammessi: se una scheda cambia nome fra due deploy si ricade sulla prima invece di aprire il nulla.

### [DAMA] Il gioco di coppia ✅ **fatto** (`519d9ea`)
Non era in questo documento — è arrivato dopo. L'Impostore è di gruppo, la Pecora è da soli: mancava quello che si gioca in due. Motore puro in `src/lib/dama.js`, 29 prove, ⚠️ vuole `supabase/dama.sql` lanciato.