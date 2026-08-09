# Idee — parcheggio

Non è lo spec. Qui dentro non c'è niente di deciso: sono cose a cui abbiamo pensato e che potrebbero avere senso un giorno.
Una riga per idea, nessun ordine, nessuna priorità. Se serve formattarla, non scriverla.

## Venute a Leonardo usando l'app (9 agosto) — rimandate a dopo il viaggio

Rimandate per una ragione sola: mancavano tre giorni alla partenza e c'erano
45 difetti aperti. Nessuna delle tre è stata scartata, e nessuna è piccola.

- **Solitario con le carte alla Allan.** Oppure, meglio, una **sezione single
  player** che raccolga quello che si gioca da soli: la Pecora ci sta già, il
  solitario ci starebbe accanto. Adesso la Pecora vive nel tab Gioco insieme a
  cose che si giocano in gruppo, e la differenza non si vede.
- **Scacchi accanto alla dama, in una sezione «Duo».** La dama esiste già e il
  motore di partita a due c'è; gli scacchi però non sono «la dama con altri
  pezzi»: arrocco, en passant, promozione, scacco matto e patta sono cinque
  regole nuove, ognuna con i suoi casi limite. È una feature intera, non un
  ritocco.
- **Onboarding che chiede i documenti importanti** (e il telefono). Il dubbio è
  scritto nell'appunto stesso: *«o appesantisce?»*. Chiedere roba prima di far
  vedere qualcosa è il modo più veloce per far chiudere l'app la prima sera —
  e la prima sera è l'unico momento in cui devono entrare tutti e otto. Se si
  fa, va fatto **saltabile** e dopo il primo giro dentro l'app.

  *(Il telefono al momento di registrarsi è invece deciso e sta in
  `SESSIONE-9-AGOSTO.md`, non qui: quello serve a essere raggiungibili offline.)*

## Rimandate consapevolmente durante la progettazione

- Skribbl.io e Gartic Phone — servono canvas di disegno sincronizzato in tempo reale, infrastruttura che il resto dell'app non usa
- Walkie-talkie vero in streaming (WebRTC) — sostituito dai messaggi vocali
- Notifiche push (Firebase Cloud Messaging) — sostituite dagli indicatori di novità; da riconsiderare se durante il viaggio si rivela un problema reale
- Avatar generati con IA vera invece di DiceBear
- Sondaggi custom a testo libero, oltre a quelli preimpostati
- Recap automatico di fine viaggio: conteggi, superlativi di gruppo, "chi si è alzato più tardi"
- Storico degli MVP di giornata ("3 titoli per Marco") — i dati ci sono già nei pointEvents, è solo una query
- Modifiche, reazioni ed emoji sui messaggi
- App nativa sugli store invece della PWA
- Compressione e ottimizzazione avanzata di foto e audio

## Se diventasse una piattaforma per più viaggi

Configurazione iniziale in cui chi crea il viaggio risponde a qualche domanda (destinazione, date, gruppo, tipo di vacanza) e l'app si genera addosso al viaggio: itinerario, colori, sfondo, tema del gioco.

**Cosa resta pura configurazione (nessuna AI):**
- Palette, sfondo, nome, date, membri
- Struttura dell'itinerario: la forma "giorni → tappe → orari → note" è universale
- Leggi, limiti, sfide della caccia al tesoro, cartella dei suoni
- Tema del gioco: protagonista e ostacoli sono già dati, non codice (in Islanda husky tra blocchi di ghiaccio, stesso motore)

**Cosa richiede generazione, con revisione umana obbligatoria:**
- Curiosità storiche e piatti tipici per tappa — un modello che inventa l'etimologia di un'isola o consiglia un ristorante chiuso da due anni è peggio di nessun contenuto. AI propone, umano approva, mai pubblicazione cieca
- Suggerimenti su spiagge e ristoranti: serve anche un'API tipo Places, non solo un modello
- Palette da tema: meglio 8-10 palette curate a mano che una generata — le palette generate sono quasi sempre brutte

**Cosa serve comunque a monte:** autenticazione vera e isolamento dati tra gruppi diversi (vedi spec).

## Viaggiatore singolo / viaggi aperti a nuove persone

Versione per chi viaggia da solo, con la possibilità di invitare qualcuno e — se un giorno nascesse una community — recensioni, profili e gruppi che si formano spontaneamente.

**Il pezzo che si adatta meglio: il Testamento diventa obiettivi.** Le Leggi funzionano perché sono sociali — qualcuno le fa scattare e il gruppo le scopre. Da solo quel meccanismo collassa. Convertite in obiettivi personali ("prima foto all'alba", "tre città in un viaggio") la struttura dati resta identica: l'array `LEGGI` diventa `OBIETTIVI`, contatore e codice numerato funzionano uguale, zero riscritture.

**Cosa sopravvive da solo**: itinerario, foto, documenti, mappa, meteo, obiettivi, la Pecora. **Cosa sparisce**: Impostore, punti votati dal gruppo, MVP, Maglia Nera, soundboard globale, Dove siete, divisione spese. In pratica la versione singola è un'app più piccola e diversa — circa il 40% di questa — non una modalità di questa.

⚠️ **Da sapere prima di innamorarsene**: All For One è costruita sul presupposto che il gruppo sia fatto di persone che si fidano già. Quasi ogni scorciatoia dello spec dipende da quello, e con degli sconosciuti saltano tutte insieme:

- **Auth anonima + codice** → servono account veri e identità verificate
- **Documenti condivisi** → sconosciuti che vedono il tuo biglietto con nome e cognome
- **Posizione condivisa** → non è più una comodità, è una questione di sicurezza personale
- **Punti proposti e votati dal gruppo** → tra amici è una gag, tra sconosciuti diventa un meccanismo di pressione o di molestia
- **Spese** → soldi tra estranei richiedono un livello di fiducia che l'app oggi dà per scontato
- **Moderazione, segnalazione, blocco** → oggi non esistono, lì diventano obbligatori

Più in generale: qualunque prodotto in cui degli sconosciuti si incontrano di persona richiede verifica dei profili, strumenti di segnalazione e una policy. È lavoro da azienda, non da progetto serale — e la parte difficile non è tecnica, è la sicurezza delle persone.

**Versione intermedia, molto più realistica**: non "trova sconosciuti", ma **apri il viaggio agli amici degli amici**. Link di invito che un membro può inoltrare, con chi invita che fa da garante. Risolve il problema pratico vero ("abbiamo due posti liberi nel van") mantenendo intatto il modello di fiducia su cui l'app è costruita — e non richiede quasi niente di nuovo: basta poter generare inviti e vedere chi ha invitato chi.

## Scartate con motivo

- **Codenames** — tagliato in favore dell'Impostore: richiede griglia condivisa, turni, indizi e visibilità per ruolo, cioè molte volte il lavoro, per un gioco che pretende due squadre concentrate per mezz'ora. Sbagliato per otto persone dopo cena. Si gioca benissimo con le carte vere
- **Lupus in Fabula** — fasi notte/giorno, ruoli multipli, eliminazioni, un narratore e partite da 40 minuti. Sta meglio con le carte fisiche e qualcuno che racconta
- **Bussola** — su iOS richiede permesso esplicito e funziona a singhiozzo, e soprattutto manca il caso d'uso: nessuno fa trekking fuori sentiero, e Maps c'è già
- **Diario di bordo personale** — realisticamente nessuno scrive un diario in cinque giorni tra spiaggia e cene; le foto sono già il diario del viaggio
- **Note personali sui debiti ("devo dare soldi a X")** — duplicano la sezione Spese, che calcola già chi deve a chi. Una nota parallela scritta a mano può solo contraddire il calcolo
- **Area personale privata** — con auth anonima + codice, "privato" non è realmente privato. Diventata "Documenti del viaggio", condivisi e non sensibili

## Dal viaggio (da riempire dal 12 al 16)

Le idee migliori arriveranno usandola davvero: ogni volta che apri l'app per fare una cosa e quella cosa non c'è, scrivila qui sotto.
Valgono più di qualsiasi idea pensata alla scrivania, perché nascono da un attrito vero.

-
