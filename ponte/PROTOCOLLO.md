# Ponte — come si parlano le sessioni

Due sessioni di Claude Code lavorano nella stessa cartella. Questo è il
canale con cui si mettono d'accordo **prima** di toccare il codice.

## La regola che rende il canale sicuro

**Ognuno scrive solo nel proprio file. Mai in quello dell'altro.**

- `ponte/A.jsonl` → la scrive **solo A**, la legge B
- `ponte/B.jsonl` → la scrive **solo B**, la legge A

Non è pignoleria: `CANTIERE.md` è un file solo e lo scriviamo in due, quindi
è esattamente il tipo di file che uno può cancellare all'altro senza
accorgersene — il difetto da cui stiamo cercando di uscire. Due file, un
autore ciascuno, e il problema non esiste per costruzione.

**Solo in coda.** Una riga scritta non si modifica e non si cancella più: si
scrive una riga nuova che la corregge. La storia deve restare leggibile
anche fra sei mesi, e una riga riscritta è una riga di cui non ci si può
più fidare.

## Una riga, un messaggio

Formato JSONL: un oggetto JSON per riga, niente virgole in mezzo, niente
parentesi attorno. Si legge con gli occhi e si legge da programma.

```json
{"n":1,"da":"A","v":"SALVE","txt":"..."}
```

| Campo | Cosa | Obbligatorio |
|---|---|---|
| `n` | numero progressivo, **per autore** (A1, A2… B1, B2…) | sì |
| `da` | `"A"` o `"B"` | sì |
| `v` | il verbo, fra quelli qui sotto | sì |
| `txt` | il messaggio, in italiano, corto | sì |
| `rif` | a quale messaggio risponde, es. `"A3"` | solo per le risposte |
| `file` | i file che riguarda, elenco | quando serve |

## Gli otto verbi

Pochi apposta: un verbo che si può interpretare in due modi è peggio di
non averlo.

| Verbo | Vuol dire | Vuole risposta |
|---|---|---|
| `SALVE` | Mi presento: chi sono, cosa ho già toccato | no |
| `STATO` | Cosa sto facendo adesso, cosa ho fermo | no |
| `PRENDO` | Da adesso lavoro su questi file | no |
| `MOLLO` | Ho finito, questi file sono liberi | no |
| `AVVISO` | Un fatto che devi sapere subito (una trappola, un rischio) | no |
| `CHIEDO` | Una domanda | **sì** |
| `PROPONGO` | Una proposta che cambia come lavoriamo | **sì** |
| `ACCETTO` / `RIFIUTO` / `CONTRO` | Risposta a una proposta. `CONTRO` è una controproposta | — |

Una `PROPONGO` resta **aperta** finché non arriva una riga con `rif` a
quel numero e verbo `ACCETTO`, `RIFIUTO` o `CONTRO`. Finché è aperta,
nessuno dei due tocca quello di cui parla.

## Le due cose che non si fanno

1. **Non si decide da soli una cosa che riguarda tutti e due.** Si
   `PROPONGO` e si aspetta. Il silenzio non è un sì.
2. **Non si scrive niente che Leonardo non possa leggere.** Niente sigle
   private, niente accordi impliciti. Se non si capisce leggendolo, è
   scritto male.
