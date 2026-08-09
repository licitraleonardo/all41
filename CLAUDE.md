# Come lavorare su questo progetto

Progetto: **All For One**, web app per un viaggio di gruppo in Sardegna (12–16 agosto).
Le specifiche complete stanno in `sardegna-trip-app-spec.md`. Leggilo prima di iniziare.

> ⚠️ **Non sei da solo in questa cartella.** Su questo progetto lavora più di
> una sessione di Claude Code alla volta, nella **stessa cartella** e sullo
> stesso `main` — non su due copie. Se due sessioni aprono lo stesso file,
> l'ultima che scrive cancella il lavoro dell'altra **senza nessun errore**.
> **Leggi `CANTIERE.md` prima di scrivere qualunque file, e prenditi lì
> quello su cui lavori.**

## Ritmo di lavoro

- **Una feature per volta, poi stop.** Alla fine di ogni punto del "Piano di sviluppo" dello spec, fermati e aspetta il mio ok prima di passare al successivo. Non anticipare feature successive perché "tanto ci vuole poco".
- **Committa a ogni feature funzionante**, così c'è sempre un punto a cui tornare.
- **Non cambiare l'ordine dello spec** senza chiedermelo. Se pensi che un ordine diverso sia meglio, dimmelo e decido io.
- **Non aggiungere feature non presenti nello spec.** Se ti viene un'idea, proponila a parole invece di implementarla.

## Come spiegarmi le cose

Non spiegarmi come funziona il codice: mi interessa poco e mi rallenta. **Spiegami come testarlo.**

A ogni stop, dammi:
1. Cosa aprire (URL locale o deploy)
2. Cosa fare, passo per passo
3. Cosa dovrei vedere se funziona
4. Cosa vedrei se è rotto, e cosa guardare in quel caso (console, network, ecc.)

Esempio di quello che voglio:

> **Come testare il soundboard**
> 1. Apri l'app su due dispositivi diversi (uno anche desktop va bene)
> 2. Su A, tocca qualsiasi punto dello schermo (serve a sbloccare l'audio), poi premi "Aho"
> 3. Su B, con l'app aperta su una tab qualsiasi, dovresti sentire il suono entro 1-2 secondi
> 4. Se su B non si sente: guarda la console, se c'è un errore tipo `NotAllowedError` è la policy autoplay — B non ha ancora interagito con la pagina
> 5. Premi "Aho" due volte di fila: la seconda deve essere rifiutata con "Aspetta 10s", non ignorata in silenzio

Esempio di quello che NON voglio: una spiegazione di come è strutturato il listener Firestore.

## Test che devo fare io su dispositivi veri

Ci sono cose che tu non puoi verificare. Quando arriviamo a queste, ricordamelo esplicitamente:
- **Audio**: registrazione e riproduzione su almeno un iPhone e un Android (formati diversi, vedi verifiche bloccanti nello spec)
- **Soundboard globale**: il suono che parte su un altro dispositivo
- **PWA**: installazione sulla home, apertura a schermo intero
- **Foto**: upload da fotocamera del telefono, non da file picker desktop
- **Offline**: aereo mode → l'app si apre, mostra i dati, compare la Pecora

## Cose da segnalarmi, non da aggirare

- Se una scelta dello spec si rivela sbagliata mentre la implementi, **dimmelo** invece di inventare un workaround silenzioso
- Se una delle quattro "verifiche bloccanti" dello spec non è stata fatta e stiamo per lavorare su qualcosa che ne dipende, fermami
- Se una feature sta diventando molto più grossa del previsto, dillo prima di scrivere 400 righe

## Convenzioni

- **Testi dell'interfaccia in italiano**, tono informale — vedi la sezione "Tono e voce" dello spec. Non tradurre in inglese e non usare registri aziendali.
- Limiti, regole e Leggi vivono in **file di configurazione separati**, non sparsi nei componenti
- Ogni listener sul database ha un `limit()` — vedi verifica bloccante n.4
