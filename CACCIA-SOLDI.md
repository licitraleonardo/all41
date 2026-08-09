# Caccia sui soldi — 9 agosto

Due difetti **confermati** su `src/lib/cache.js` e `src/hooks/useSpese.js`.
Nessuno dei due è corretto: questo file esiste perché non facciano la fine
delle trenta segnalazioni, di cui era sopravvissuto solo il numero.

## ⚠️ Prima di leggere: la caccia è finita a metà

Sei lenti — soldi, chat e vocali, punti, caccia al tesoro e Pecora, senza
rete, ingresso. **Ha completato il giro solo quella sui soldi.** Le altre
cinque sono morte sul limite di sessione (35 agenti su 47), e quello che
avevano trovato **non è mai stato verificato da nessuno**: non è qui
dentro, di proposito. Un elenco non verificato è un numero senza
contenuto, ed è il difetto che stiamo cercando di non ripetere.

**Le cinque lenti vanno rifatte.** Il testo completo della corsa sta in
`AppData/Local/Temp/claude/C--Users-Lenovo-Desktop-ALL41/de913235-d869-4d85-b592-78042f671dba/tasks/wswze7gsl.output`
finché la sessione vive.

---

## 1. Nessuna lettura ha un tempo massimo, e la copia offline non si accende

`src/lib/cache.js:107-119` · `src/hooks/useSpese.js:22-27` · **grave, silenzioso**

`conCache` serve la copia locale **solo dentro il `catch`**. Ma una fetch con
una tacca di segnale **non fallisce: aspetta**. Quindi non c'è nessun `catch`
da attraversare, e la copia buona che sta in `localStorage` non viene
servita proprio nel caso in cui servirebbe.

È la terza volta oggi che questa forma si presenta, dopo l'SOS e le foto —
ed è già scritta in `src/lib/scadenza.js:5-8`. Le prime due volte era sulle
**scritture**. Sulle **letture** non è mai stata messa.

**Come si vede.** Wifi del villaggio, otto telefoni. `ricarica()` fa
`Promise.all` di tre letture senza tetto di tempo: una resta appesa, la
`Promise.all` non si risolve mai, `stato` resta `'caricamento'` e
`Spese.jsx:30` mostra la Rotella all'infinito. Nessun errore, nessuna via
d'uscita — nel ramo `guasto` non c'è nemmeno un tasto Riprova. Uscire e
rientrare rimonta il componente e riparte identico.

**Non è solo le Spese**: nessuna lettura dell'app ha un tetto. Anche
`trovaPerId` (`App.jsx:230`) appeso inchioda l'app su "Un attimo."

### ⚠️ La trappola nella correzione ovvia

Mettere `conScadenza` dentro `useSpese` **non basta e peggiora**: l'errore
di scadenza ha `message: "Ci sta mettendo troppo."`, che `sembraRete`
(`cache.js:52-57`) **rifiuta** — quindi la copia continuerebbe a non essere
servita, e si passerebbe da una rotella eterna a un cartello d'errore con i
dati buoni in tasca.

La scadenza va messa **dentro `conCache`**, dove il `catch` che serve la
copia esiste già, e il ripiego deve accettare **anche** lo scaduto:

```js
try {
  const dati = await conScadenza(lettura(...argomenti), SECONDI_LETTURA * 1000)
  inCache(k, dati)
  return dati
} catch (e) {
  if (!eScaduta(e) && !sembraRete(e, navigator.onLine !== false)) throw e
  const copia = daCache(k)
  if (!copia) throw e
  return copia.dati
}
```

Una correzione sola, e vale per ogni lettura dell'app. Il numero in
`src/config/`, come vuole `CLAUDE.md`.

**Da verificare dopo**: la copia servita è vecchia, e l'app ha già la
striscia "dati vecchi". Se in questo caso non compare, **un saldo vecchio
spacciato per fresco è un messaggio che afferma il falso** — sui soldi è la
categoria peggiore.

---

## 2. Il realtime fa sparire la spesa che hai appena segnato

`src/hooks/useSpese.js:45-50` · **grave, silenzioso**

Segni la cena. L'inserimento riesce, `setSpese` la mette in testa, il foglio
si chiude. Lo stesso inserimento fa scattare il realtime **anche sul tuo
telefono** (`expenses` e `payments` sono nella publication,
`schema.sql:1256-1266`), quindi riparte `ricarica()`. Quella GET incappa nel
blip, `conCache` **risolve** con la copia di `localStorage` — scritta
**prima** del tuo inserimento — e `setSpese` la mette al posto della tua.

`registra` scrive solo nello stato React, mai in `inCache`
(`useSpese.js:73-76`): dopo un inserimento la copia su disco è **sempre** un
passo indietro rispetto allo schermo.

**Conseguenza.** La cena sparisce dall'elenco e dal totale, i saldi tornano
ai numeri di prima, e `ricarica().catch(() => {})` garantisce che nessuno lo
dica. La rimetti perché non la vedi più — **e adesso ce ne sono due**, anche
sui telefoni degli altri sette.

**Direzione.** Tre cose, e la prima da sola non basta: (a) `registra` deve
aggiornare anche la copia, non solo lo stato; (b) una ricarica che ha
ripiegato sulla copia non deve poter **sostituire** dati più freschi già a
schermo; (c) quel `catch` vuoto deve almeno dire qualcosa.

---

## Perché stanno tutti e due sui soldi

Non è un caso che la lente sui soldi sia quella che ha completato: è anche
quella dove sbagliare costa di più. Un messaggio perso si riscrive, una foto
persa fa arrabbiare, **una spesa contata due volte cambia quanto si devono
otto persone** — e si scopre a fine viaggio, quando non c'è più modo di
ricostruire chi ha pagato cosa.
