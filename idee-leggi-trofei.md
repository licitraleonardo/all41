# Leggi, Trofei e punteggio — catalogo e decisioni

> **Chiuso l'8 agosto.** Era un documento esplorativo; adesso le decisioni sono prese e implementate. La Parte 6 in fondo dice cosa è entrato, cosa è stato scartato e perché. Chi cerca lo stato attuale del sistema legga quella; le Parti 1-5 restano perché contengono il ragionamento, che vale più dell'elenco.
>
> Fonte di verità del codice: `src/config/leggi.js` (le voci), `src/lib/punteggioProposte.js` (la logica pura), `prove/proposte.mjs` (116 controlli).

---

## Parte 1 — Principi di design

Prima delle idee, cinque regole che tengono insieme il sistema. Se una Legge le viola, di solito è quella che rovina il viaggio a qualcuno.

1. **Il valore è nella scoperta, non nella minaccia.** Una Legge nascosta che scatta fa ridere; la stessa Legge annunciata in anticipo diventa solo un divieto. Per questo il pallino di notifica su Leggi e Trofei non letti ([TEST-1]) è il vero motore: la gente apre Testamento per vedere *cosa ha appena sbloccato*.
2. **Simmetria esca/trappola.** Il meccanismo più efficace è già in PUNTI-3: premiare un comportamento e punirlo se esagera. Vale per quasi tutto — chi fotografa tanto è il "Paparazzo", chi fotografa troppo è "Basta foto".
3. **Le trappole devono essere raggiungibili per caso.** Se serve una combinazione improbabile, nessuno la trova e la Legge non esiste. Meglio poche trappole a portata di mano che trenta esoteriche.
4. **Il malus non deve mai fare male sul serio.** Il divertimento è la rivelazione. Se un malus ribalta la classifica, la gente smette di giocare per paura.
5. **Mai punire l'uso normale dell'app.** Caricare foto, scrivere in chat e votare devono restare gratis. Si punisce l'eccesso, l'assenza prolungata o la furbizia — mai l'uso base.
6. **Le Spese restano fuori dal gioco.** Regola già stabilita: nessuna Legge, nessun Trofeo, nessun punto legato alla sezione Spese. È l'unica parte dell'app che tratta soldi veri tra amici, e deve restare uno strumento affidabile e serio. Se registrare una spesa potesse far guadagnare o perdere punti, la gente inizierebbe a registrarle in modo strategico — e il conto finale non sarebbe più credibile.
7. **Andamento generale: i Trofei danno punti, le Leggi li tolgono.** È la bussola del sistema e vale salvo eccezioni motivate. Ne discende una simmetria utile: i Trofei si conquistano **facendo** qualcosa e sono l'unico canale di punteggio che dipende solo da sé stessi; le Leggi si subiscono inciampandoci. Chi vuole salire in classifica ha quindi sempre una strada attiva che non passa dal danneggiare gli altri.

---

## Parte 2 — Catalogo per sezione

Legenda: 🪤 trappola (malus, nascosta) · 🏆 trofeo (bonus) · ⚖️ coppia esca/trappola

### Gruppo / Chat

| | Nome | Innesco | Effetto |
|---|---|---|---|
| 🪤 | **Sveglia il gruppo** | messaggio inviato tra le 3:00 e le 6:00 | malus — *"C'era davvero bisogno?"* |
| 🏆 | **Il primo sveglio** | primo messaggio della giornata | bonus piccolo |
| 🪤 | **Muro di testo** | messaggio oltre ~600 caratteri | malus — *"Nessuno lo leggerà, lo sai."* |
| 🏆 | **Il Monologo** | 5 messaggi consecutivi senza risposta di nessuno | trofeo ironico — *"Parli da solo, ma con stile"* |
| 🪤 | **Il Fantasma** | zero messaggi per 24h durante il viaggio | malus — *"Sei ancora con noi?"* |

### Vocali

| | Nome | Innesco | Effetto |
|---|---|---|---|
| ⚖️ | **Il Podcast** | vocale oltre 3 minuti | trofeo la 1ª volta, malus dalla 3ª — *"Non è una serie TV"* |
| 🏆 | **Telegrafico** | vocale sotto i 2 secondi | trofeo |
| 🏆 | **Voce del popolo** | 10 vocali in un solo giorno | trofeo |

### Album / Foto

| | Nome | Innesco | Effetto |
|---|---|---|---|
| ⚖️ | **Il Paparazzo** | 10 foto in un giorno → trofeo; oltre 30 → malus | *"Stiamo vivendo o archiviando?"* |
| 🪤 | **L'Invisibile** | nessuna foto caricata per 2 giorni interi | malus lieve |
| 🏆 | **Prima luce** | prima foto del viaggio in assoluto | trofeo |

### Votazioni e proposte

*(oltre a PUNTI-1 / PUNTI-3 / PUNTI-4 già definite)*

| | Nome | Innesco | Effetto |
|---|---|---|---|
| 🪤 | **L'Astenuto** | non voti nessuna proposta per un intero giorno | malus — *"Il silenzio è una posizione, ma costa."* |
| 🏆 | **Suspense** | voti negli ultimi 60 secondi dei 45 minuti | trofeo |
| 🏆 | **Unanimità** | una tua proposta passa con tutti i SÌ | trofeo per il proponente |
| 🪤 | **Bastian contrario** | voti NO a 4 proposte consecutive | malus — *"Ti piace qualcosa?"* |
| 🪤 | **Il Generoso sospetto** | proponi punti solo e sempre alla stessa persona | rinforza PUNTI-3, oppure sostituiscilo |

### Spese

**Nessuna Legge e nessun Trofeo.** Le Spese restano fuori dal gioco per scelta (vedi principio 6). Sezione di sola utilità.

### Itinerario / Mappa

| | Nome | Innesco | Effetto |
|---|---|---|---|
| 🪤 | **Il Ritardatario** | segni l'arrivo dopo l'orario previsto della tappa | malus (richiede un check-in per tappa) |
| 🏆 | **Puntuale** | tre check-in in orario di fila | trofeo |
| 🏆 | **L'Esploratore** | ti allontani dal gruppo oltre una certa distanza | trofeo — ⚠️ richiede posizione condivisa e consenso esplicito |

### L'Impostore

| | Nome | Innesco | Effetto |
|---|---|---|---|
| 🏆 | **Bugiardo perfetto** | vinci da impostore senza ricevere un solo voto | trofeo raro |
| 🪤 | **Accusa infondata** | accusi la persona sbagliata 3 volte nella stessa partita | malus |
| 🏆 | **Il Segugio** | scopri l'impostore per primo | trofeo |

### Gioco di ALL

| | Nome | Innesco | Effetto |
|---|---|---|---|
| 🏆 | **Metafora riuscita** | superi il punteggio precedente del gruppo | trofeo |
| 🪤 | **Non stai vivendo il viaggio** | 20 partite in un giorno | malus — *"Sei in vacanza, ricordi?"* |

### Meta — le più divertenti

Queste non riguardano il viaggio ma l'uso dell'app. Sono le più facili da inciampare e quelle che di solito fanno ridere di più.

| | Nome | Innesco | Effetto |
|---|---|---|---|
| 🪤 | **Crisi d'identità** | cambi avatar o nome più di 3 volte | malus — *"Deciditi."* |
| 🪤 | **Cerchi qualcosa?** | apri e chiudi la stessa sezione 15 volte di fila | malus lieve |
| 🏆 | **Avvocato del gruppo** | leggi tutte le Leggi già sbloccate | trofeo |
| 🏆 | **Il Curioso** | apri tutte le sezioni dell'app nel primo giorno | trofeo |
| 🪤 | **Insonne** | app aperta dopo le 4:00 | malus — *"Domani sarà colpa nostra."* |
| 🏆 | **Non hai ascoltato il tutorial** | apri la Guida | trofeo ironico (chiude il gioco già presente nel tutorial) |

---

## Parte 3 — Allineamento del punteggio

Il rischio con tante Leggi è che i punti diventino rumore. Una struttura a fasce tiene insieme il caos. Il segno segue il principio 7: **le fasce dei Trofei sono in positivo, quelle delle Leggi in negativo**.

| Fascia | Trofeo | Legge | Uso |
|---|---|---|---|
| Micro | +1 | −1 | comportamenti frequenti (primo messaggio, vocale corto) |
| Standard | +3 | −3 | trappole e trofei normali |
| Raro | +5 | −5 | eventi difficili (Bugiardo perfetto, Unanimità) |
| Proposte votate | variabile, con **tetto** | — | il canale principale dei punti |

**Regola di equilibrio:** le proposte votate devono restare la fonte dominante di punteggio. Leggi e Trofei aggiungono colore e scarti, ma se la loro somma può ribaltare la classifica da sola, il viaggio non conta più — conta chi ha inciampato in più trappole.

**Sblocco progressivo:** non attivare tutte le Leggi dal giorno 1. Rilasciarne un gruppo al giorno mantiene viva la curiosità per l'intero viaggio ed evita che si scopra tutto la prima sera.

**Segnalazione:** ogni Legge o Trofeo appena sbloccato accende il pallino in Testamento ([TEST-1]). È lì che si chiude il ciclo: inciampo → notifica → apro → scopro → lo racconto agli altri.

---

## Parte 4 — Il problema del NO sistematico

### Perché succede
Il punteggio è **relativo**: conta la posizione in classifica, non il valore assoluto. Quindi ogni punto dato a un altro è un punto tolto a me. Per un giocatore che vuole davvero vincere, **votare NO a ogni proposta è la strategia ottimale** — e non richiede nemmeno malizia, basta ragionare.

Se anche una sola persona su sei ragiona così, il danno è limitato. Se lo fanno in due o tre, non passa più niente e il sistema di votazione — che è il canale principale dei punti — smette di funzionare. È il classico fallimento dei giochi dove i giocatori hanno potere di veto reciproco.

Va detto però che il contesto conta: qui sono amici in vacanza, e il vero obiettivo della maggior parte sarà **far ridere, non vincere**. Il rischio non è che tutti diventino ostruzionisti, è che **una o due persone competitive rovinino il meccanismo per tutti**. La soluzione quindi non deve rendere il NO impossibile, deve renderlo **poco conveniente e socialmente visibile**.

### Rimedi, dal più efficace al più debole

**1. Voti palesi — chi ha votato cosa è visibile a tutti** ⭐ *il più efficace, e costa zero*
In un gruppo di amici la pressione sociale è più forte di qualunque malus. Se dopo tre giorni è evidente che una persona ha votato NO a tutto, ci pensa il gruppo — con lo sfottò, che è esattamente il tono dell'app. Il voto segreto invece protegge l'ostruzionista.

**2. Briciola a chi vota, non solo a chi riceve**
Chi vota (qualsiasi cosa voti) prende +1. Così partecipare rende sempre qualcosa e l'astensione strategica costa. Attenzione: premia anche chi vota NO, quindi va combinato col punto 1 o col 3.

**3. Bonus alla maggioranza**
Chi ha votato come la maggioranza prende una briciola. Votare NO a una proposta palesemente giusta diventa perdente, perché resti in minoranza. Trasforma il voto da "blocco" a "previsione", che è più divertente.

**4. Legge "Bastian contrario"** *(già in catalogo)*
Malus dopo 4 NO consecutivi. È un cerotto: punisce il pattern grossolano, non chi alterna NO e SÌ con criterio. Utile come rinforzo, insufficiente da solo.

**5. Trofei come canale alternativo**
I Trofei danno punti (vedi principio 7), quindi non sono fuori classifica — ma si conquistano **facendo cose**, non impedendole. Più il catalogo dei Trofei è ricco, più per un competitivo conviene inseguire quelli invece di bloccare le proposte altrui: è l'unico canale di punteggio che dipende solo da sé stessi. Non risolve il NO sistematico, ma ne riduce la convenienza.

**6. Quorum sul NO**
Perché una proposta venga respinta serve una maggioranza qualificata, non semplice. Il default diventa l'approvazione. Efficace ma rischia di far passare tutto, svuotando il voto.

### Combinazione consigliata
**Voti palesi + bonus alla maggioranza + Bastian contrario.** Il primo attiva il controllo sociale, il secondo rende il NO immotivato perdente sul piano dei punti, il terzo copre il caso limite. Nessuno dei tre richiede di cambiare la struttura delle proposte già definita in PUNTI-4.

### Da decidere
- I voti sono **palesi o segreti**? È la decisione più pesante di tutto il sistema, e va presa prima di scrivere il resto.
- Si può **cambiare il proprio voto** finché la proposta è aperta? Se sì, il bonus maggioranza diventa un gioco di attesa: tutti aspettano gli ultimi secondi. Probabilmente va vietato, o vanno nascosti i risultati parziali fino alla chiusura.

---

## Parte 5 — Decisioni da prendere

1. **Quante Leggi attive** in totale? Sotto le 10 il sistema è povero, sopra le 30 diventa rumore e nessuno le legge.
2. **I malus sono pubblici o privati?** Se il gruppo vede che hai attivato "Crisi d'identità" il gioco diventa sociale; se lo vedi solo tu resta un fatto personale. Questa scelta cambia completamente il tono dell'app.
3. **Le Leggi si ripetono?** Una volta scoperta, "Sveglia il gruppo" continua a togliere punti ogni volta o scatta una volta sola?
4. **Trofei ripetibili o unici** per persona?
5. Alcune idee richiedono funzionalità che oggi non ci sono: **check-in per tappa** (Ritardatario/Puntuale) e **posizione condivisa** (Esploratore). Vanno tenute o scartate?

---

## Parte 6 — Cosa è stato deciso (8 agosto)

Le cinque domande della Parte 5, risposte.

**1. Quante Leggi.** Trentasette attive su quarantasei scritte. Sopra le trenta il documento temeva il rumore, ma il rumore viene dal *quante ne scattano al giorno*, non da quante esistono: le nuove sono quasi tutte "una volta a testa per viaggio" o "una volta al giorno", quindi in una giornata normale se ne vedono due o tre.

**2. Malus pubblici.** Tutto quello che tocca i punti finisce nello storico della Classifica, che leggono tutti. Non è stata una scelta nuova: era già così per `self-praise`, e mezzo sistema si regge sul fatto che il gruppo veda. Un malus privato sarebbe un rimprovero; pubblico è una gag.

**3 e 4. Ripetibilità: la decide la chiave.** Non serviva un campo `ripetibile`, serviva guardare la `dedupeKey` che c'era già:
- chiave **senza data né id** (`prima-luce`) → una volta per tutto il viaggio, per tutti;
- chiave **con l'id della persona** (`telegrafico_${id}`) → una volta a testa, per sempre;
- chiave **con la data** (`insonne_${id}_${oggi}`) → una volta a testa al giorno;
- chiave **con la coppia** (`vera-amicizia_${a}_${b}`) → una volta per coppia di persone, come chiedeva PUNTI-3.

**5. Check-in e posizione: scartati.** Il Ritardatario, il Puntuale e l'Esploratore vogliono un check-in per tappa che non esiste e una posizione condivisa in continuo. Quest'ultima ribalta la decisione di prodotto più delicata dell'app — "la posizione non si aggiorna mai da sola" — e non si tocca per tre punti.

### Il catalogo, voce per voce

| Idea | Esito | Perché |
|---|---|---|
| Sveglia il gruppo | ✅ `sveglia-il-gruppo` −2 | messaggio fra le 3 e le 6, una volta a notte |
| Il primo sveglio | ✅ `primo-sveglio` +1 | primo messaggio della giornata, del gruppo |
| Muro di testo | ❌ | vuole 600 caratteri, la chat ne ammette 200. Abbassare la soglia a 180 punirebbe l'uso normale |
| Il Monologo | ❌ | vuole "rispondi", che è una colonna nuova e una feature intera |
| Il Fantasma | ❌ | punisce chi vive la vacanza invece del telefono. Contro il principio 5 |
| Il Podcast | ✅ `il-podcast` +2 | girato in Trofeo: il limite è 60s, chi ci arriva merita rispetto, non un malus |
| Telegrafico | ✅ `telegrafico` +1 | sotto i due secondi |
| Voce del popolo | ❌ | dieci vocali in un giorno è già il ritmo normale del walkie-talkie |
| Il Paparazzo | ✅ `paparazzo` +2 | riportato sui numeri veri: il tetto è 5, quindi il premio è "rullino finito". Il malus a 30 non ha più senso |
| L'Invisibile | ❌ | come il Fantasma: punisce chi sta vivendo |
| Prima luce | ✅ `prima-luce` +3 | la primissima foto del viaggio, una sola in cinque giorni |
| L'Astenuto | ❌ | serve una chiusura di giornata, e punisce chi non ha rete |
| Suspense | ✅ `suspense` +1 | voto negli ultimi 60 secondi |
| Unanimità | ✅ già esisteva | è `unanimous`, +5 |
| Bastian contrario | ✅ `bastian-contrario` −3 | quattro No consecutivi. Le proposte non votate non spezzano la serie: non votare non è cambiare idea |
| Il Generoso sospetto | ✅ *fuso* in PUNTI-3 | era la stessa regola scritta due volte |
| Ritardatario / Puntuale / Esploratore | ❌ | vedi decisione 5 |
| Bugiardo perfetto / Accusa infondata / Il Segugio | ⏸ rimandate | toccano `schedePerId`, il punto dove l'Impostore si rompe in silenzio. Non a cinque giorni dalla partenza |
| Metafora riuscita | ⏸ | esiste già come record della Pecora |
| Non stai vivendo il viaggio | ❌ | vuole una colonna contatore, e punisce l'unico gioco che serve alle attese |
| Crisi d'identità | ❌ | vuole una colonna sul profilo per una battuta sola |
| Cerchi qualcosa? | ❌ | o è un contatore locale inaffidabile, o è una scrittura al database a ogni tocco di tab |
| Avvocato del gruppo | ⏸ | dipende da TEST-1, il letto-per-elemento |
| Il Curioso | ⏸ | idem |
| Insonne | ✅ `insonne` −2 | app aperta fra le 4 e le 6 |
| Non hai ascoltato il tutorial | ✅ `non-hai-ascoltato` +1 | apri la Guida |

### Le fasce, come sono finite

Il documento proponeva ±1 / ±3 / ±5. Rispettata, con una precisazione: **nessun malus nuovo supera il −3**, e la prova lo verifica. I −5 restano solo dove c'erano già.

- **±1** ritmo quotidiano: primo sveglio, telegrafico, suspense
- **±2** cose che richiedono un minimo di impegno: paparazzo, il podcast, vera amicizia, sveglia il gruppo, insonne
- **±3** trappole vere e trofei rari: contro te stesso, ci nascondete qualcosa, troppo giudicante, bastian contrario, in difficoltà, prima luce
- **±5** eventi rari, quelli che c'erano già: unanimità, impostore impunito, record del viaggio

**La regola di equilibrio regge**: somma dei trofei attivi **+60**, delle punizioni **−34**, contro proposte che valgono fino a ±5 l'una e tre al giorno a testa. In una giornata a otto persone le proposte possono muovere fino a 120 punti: restano il canale dominante, come voleva il documento.

### Lo sblocco progressivo: scartato

La Parte 3 proponeva di rilasciare le Leggi a gruppi, un giorno alla volta. Non è stato fatto, e per una ragione precisa: **le nuove Leggi si scoprono già a scaglioni da sole**, perché dipendono da cose che succedono in momenti diversi del viaggio. `prima-luce` scatta il primo giorno, `bastian-contrario` non prima del terzo, `ci-nascondete-qualcosa` solo quando qualcuno si accanisce. Aggiungere un campo `dalGiorno` avrebbe messo un calendario sopra un ritmo che già c'è.

### Il NO sistematico: la combinazione consigliata, applicata

Il documento raccomandava **voti palesi + bonus alla maggioranza + Bastian contrario**. Due su tre sono dentro:

- **Voti palesi** ✅ — chi ha votato cosa si vede, dopo aver votato. Costava zero: il dato c'era già.
- **Bastian contrario** ✅ — quattro No di fila, −3.
- **Bonus alla maggioranza** ❌ — scartato. Premia chi indovina l'esito, e con i voti palesi diventa un gioco di attesa: si aspetta di vedere come vota il gruppo e ci si accoda. Il documento stesso lo temeva ("tutti aspettano gli ultimi secondi"). Al suo posto c'è `suspense`, che quell'attesa la premia esplicitamente invece di fingere che sia strategia.

Al loro fianco, la cosa che il documento non aveva previsto: **undici Trofei che si prendono facendo cose da soli**. È la risposta strutturale al NO sistematico — per un competitivo conviene inseguire quelli invece di bloccare le proposte altrui, perché sono l'unico canale che non dipende dal giudizio di nessuno.

### Cosa non si può ancora fare

`contro-te-stesso` e `bastian-contrario` leggono le schede dei voti. Funzionano perché le proposte nascono con `anonymous: false` e il database riempie `ballots` da sempre. **Se un giorno si rendessero anonime le proposte, queste due Leggi smetterebbero di scattare in silenzio** — nessun errore, semplicemente non succede più niente.
