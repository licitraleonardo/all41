# Specifiche modifiche — App viaggio

> Documento di lavoro da passare a Claude Code. Ogni punto ha un ID per poterlo richiamare singolarmente (es. "implementa AUTH-1").

---

## 1. Accesso e gestione codice

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

## 2. Tutorial

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

## 3. Testamento

### [TEST-1] Pallini di notifica
- Su **Trofei** e **Leggi**: pallino di notifica **per singolo elemento non ancora visualizzato** (non un badge unico di sezione).
- Il pallino sparisce quando il singolo trofeo / la singola legge viene aperta.
- Serve quindi persistenza dello stato "letto/non letto" per elemento e per utente.

### [TEST-2] Immagine ALLAN
- Rimuovere l'immagine accanto al titolo (vedi [TUT-1]).

---

## 4. Gioco di ALL

### [GAME-1] Dimensione schermo
- Ingrandire l'area di gioco fino a occupare **quasi tutta la schermata** disponibile.

---

## 5. Bug e fix UI

### [BUG-1] iPhone 13 Pro — tab in alto non visibili 🔴 priorità alta
- Su iPhone 13 Pro i tab superiori non si vedono.
- Probabile problema di **safe area / notch**: verificare `safe-area-inset-top`, `viewport-fit=cover` e altezza dell'header.
- Testare su viewport 390×844 con notch.

### [BUG-2] Spese — colore "Devi ricevere"
- Il colore attuale è **troppo chiaro**, poco leggibile. Aumentare contrasto.

### [BUG-3] Spese — "Aggiungi un documento"
- L'elemento è posizionato **troppo in basso**: risalirlo per renderlo raggiungibile/visibile senza scroll eccessivo.

---

## 6. Sfide

### [SFI-1] Finestre temporali
- Ogni sfida si **apre nel proprio giorno** e resta **aperta fino a 3 giorni dopo la fine della vacanza**.
- Esistono due tipi di votazione: **votazioni foto** e **votazioni per persona**. **Entrambe restano aperte** per l'intera finestra, quindi fino a **3 giorni dopo la fine della vacanza**, in linea con la sfida.
- Nessun disallineamento tra apertura della sfida e chiusura del voto: si chiudono insieme.

---

## 7. Sistema di punteggio

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

---

## 8. PWA — pagina di installazione dedicata

**Premessa:** allo stato attuale nessuno ha la PWA installata (chi ce l'ha la cancellerà), quindi si parte da zero e non serve gestire migrazioni.

**Obiettivo:** avere un **link da condividere** che apre una **pagina web dedicata alla sola installazione**, con guida specifica per il dispositivo. Non è l'onboarding dell'app: è una pagina a sé. Una volta che l'app è sulla home del telefono, si usa normalmente.

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

## Punti da chiarire prima di implementare

1. **[PUNTI-1/2/3/4]** I valori esatti di bonus e malus si fissano **dopo** aver scelto il set definitivo di Leggi e Trofei — vedi `idee-leggi-trofei.md`, dove c'è una proposta di fasce (±1 / ±3 / ±5) e il criterio di equilibrio con le proposte votate.
2. **[PUNTI-3]** Il conteggio riguarda i **voti** dati a una persona o le **proposte** aperte a suo favore? Sono due cose diverse.
3. **[PUNTI-4]** Se **nessuno vota**, il countdown non parte mai e la proposta resta aperta all'infinito, bloccando tutte le successive. Serve un limite di sicurezza (es. scadenza assoluta a X ore dall'apertura anche senza voti)?
4. **[PUNTI-4]** Dopo il malus, la seconda proposta viene comunque **creata** o viene **annullata**? Se viene creata, ne restano due aperte contemporaneamente e la regola perde senso.
5. **[PWA-4]** Se qualcuno apre l'URL dell'app direttamente da browser, cosa deve succedere: reindirizzamento automatico alla pagina di installazione, oppure l'app funziona comunque anche da browser?




una cosa aggiuntiva, il ricarica tab e rimane sul tab vale anche per i sotto tab