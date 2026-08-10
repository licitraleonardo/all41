# Leggi e Trofei — il foglio degli spoiler

> ⚠️ **Serve a chi tiene l'app, non al gruppo.** Tutto il gioco sta nel
> non sapere: le Leggi si scoprono facendole scattare, e da stasera la
> Guida non ne parla più. Questo file è l'unico posto in cui sono scritte.

Generato da `src/config/leggi.js` con `npm run prospetto`. Non si scrive
a mano: una tabella copiata a mano mente al primo ritocco, ed è già
successo — la Guida ha detto «sono 49» per un giorno intero mentre le
attive erano 39.

**48 in tutto**: 27 trofei e 21 leggi. Ne possono scattare **39**.

## Come si sbloccano

Nessuna è nota all'inizio: il Testamento parte tutto oscurato. Scattano
da sole quando fai la cosa descritta, e la scoperta è **collettiva** — la
prima volta che una scatta su chiunque, si sblocca per tutto il gruppo.
Il motivo compare in Classifica nell'istante in cui succede.

## Trofei che possono scattare (23)

| | Punti | Come si sblocca |
|---|---|---|
| I | ±5 | Punti proposti da qualcuno e approvati dal gruppo a maggioranza |
| II | 10 | Hai vinto più sfide della caccia al tesoro di chiunque altro |
| III | 5 | Sei sfuggito al voto: l'impostore l'ha fatta franca |
| IV | 3 | Prima foto della giornata |
| VII | 5 | Una tua proposta è passata con voto unanime |
| IX | 3 | Detieni il record della pecora a fine giornata |
| X | 5 | Sei stato MVP di giornata due volte |
| XI | 1 | Hai fatto scattare una Legge mai vista prima |
| XIII | 2 | Hai votato l’impostore giusto |
| XIV | 5 | Record della Pecora al termine del viaggio |
| XV | 2 | Sei stato l’unico a mandare una foto per una sfida |
| XVI | 3 | Il gruppo al completo, uno per uno |
| XVII | 1 | Primo messaggio della giornata in chat |
| XVIII | 1 | Un vocale sotto i due secondi. Tutto lì? |
| XIX | 2 | Un vocale da quasi un minuto. Ascoltato per dovere. |
| XX | 3 | La prima foto del viaggio, in assoluto |
| XXI | 2 | Rullino del giorno finito: cinque su cinque |
| XXII | 1 | Hai votato negli ultimi sessanta secondi |
| XXIII | 3 | La tua proposta ha spaccato il gruppo a metà |
| XXIV | 2 | Due proposte per la stessa persona in un giorno. Questa è vera amicizia. |
| XXV | 1 | Hai aperto la Guida. Classico. |
| XXVI | 3 | Hai vinto più partite a dama di tutti, in una giornata |
| XXVII | 2 | La tua prima partita a dama vinta |

## Leggi che possono scattare (16)

| | Punti | Come scatta |
|---|---|---|
| III | -2 | Soundboard lanciato tra l’01:00 e le 07:00 |
| V | -1 | Una proposta di punti è finita in pareggio **(colpisce tutti)** |
| VI | -2 | Una tua proposta è stata bocciata dal gruppo |
| VII | quanti te ne sei dati | Hai proposto punti per te stesso. Lo sanno tutti. |
| IX | -1 | Più di 30 foto caricate in un solo giorno |
| XI | -1 progressivo (max -5) | Hai insistito su un bottone già bloccato dal limite |
| XII | -2 | Hai scritto una parola che il Testamento non tollera |
| XIII | -3 | Hai svuotato la soundboard a raffica e te l’hanno tolta |
| XIV | -6 | Hai rifatto la stessa raffica nello stesso giorno |
| XV | -1 | Sei sceso sotto lo zero |
| XVI | -2 | Messaggio in chat fra le 3:00 e le 6:00. C’era davvero bisogno? |
| XVII | -2 | App aperta fra le 4:00 e le 6:00. Domani sarà colpa nostra. |
| XVIII | -3 | Hai votato No alla tua stessa proposta |
| XIX | -3 | Tre proposte per la stessa persona in un giorno. Ci nascondete qualcosa? |
| XX | -3 | Un’altra proposta mentre la tua era ancora in voto. Troppo giudicante. |
| XXI | -3 | Quattro No di fila. Ti piace qualcosa? |

## ⚠️ Quelle che non scatteranno mai (9)

Esistono nel codice ma niente le fa partire: dipendono da pezzi che non
sono stati costruiti. Nel Testamento restano oscurate come tutte le non
scoperte, quindi non si nota — ma **nessuno le troverà**.

| | Punti | Cosa dovrebbe fare |
|---|---|---|
| Trofeo V | 1 | Primo del gruppo ad aprire l’app la mattina |
| Legge I | -2 | Non hai aperto l’app per un giorno intero |
| Legge II | -1 | Nessuno ha caricato foto per un’intera giornata **(colpisce tutti)** |
| Legge IV | -1 | Ultimo del gruppo a votare in un sondaggio |
| Trofeo VI | 1 | Unico ad aver votato in un sondaggio scaduto |
| Legge VIII | -1 | Hai votato l’opzione perdente tre volte di fila |
| Trofeo VIII | 5 | Hai vinto tre sfide della caccia al tesoro |
| Legge X | -2 | Nessun vocale registrato in tutto il viaggio |
| Trofeo XII | 3 | Eri Maglia Nera e non lo sei più |

## Cosa costa accenderle

Misurato il 10 agosto guardando cosa manca a ciascuna, non a occhio.

**Quasi gratis — il dato c'è già, manca la chiamata**

- *Tre sfide della caccia vinte*: `vinte` è già contato in `useSfide`.
- *Primo del gruppo la mattina* e *un giorno intero senza aprire l'app*:
  si leggono da `last_seen_at`, che `src/lib/membri.js` scrive a ogni
  visita, dentro `allApertura()` che gira già a ogni avvio.

**Un meccanismo solo, e poi vengono insieme**

- *Nessuno ha caricato foto per un giorno* e *nessun vocale in tutto il
  viaggio*: sono cose che **non** succedono, quindi non hanno un gesto
  che le faccia scattare. Serve un controllo «com'è andata ieri»
  all'apertura, scritto una volta e riusato.

**Lavoro vero**

- Le tre sui sondaggi (*unico ad aver votato*, *ultimo a votare*,
  *opzione perdente tre volte*): il dato c'è (`chiusoIl`, i voti), manca
  chi tira le somme quando un sondaggio si chiude.
- *Eri Maglia Nera e non lo sei più*: `magliaNeraDelGiorno()` esiste già
  in `lib/classifica.js`, ma serve ricordare quella di ieri per
  confrontarla.
