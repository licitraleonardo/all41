// Le uscite di Allan nella chat.
//
// Registro: asciutto e un po' svogliato. Frasi corte, punto fermo,
// nessun entusiasmo forzato, niente emoji sorridenti. La comicità sta
// nell'understatement. Allan non si scusa, non dà consigli non richiesti
// e non parla mai di sé come di un'app.
//
// Sono locali ed effimere: le vede solo chi le innesca, non finiscono nel
// database e spariscono ricaricando. Così nessuno deve decidere quale
// telefono le scrive, e restano imprevedibili.

export const BATTUTE_ALLAN = [
  'Preso nota.',
  'Interessante. Non molto, ma interessante.',
  'Lo dirò a nessuno.',
  'Sto contando tutto, comunque.',
  'Va bene. Continuate pure.',
  'Ho visto di peggio. Oggi, anche.',
  'Il Testamento non commenta.',
  'Bene. Io resto qui.',
  'Uno di voi doveva dirlo.',
  'Segnato, come sempre.',
]

// Parla raramente: se commenta un messaggio su tre diventa rumore, e il
// personaggio si consuma nel primo pomeriggio del 12 agosto.
export const ALLAN = {
  probabilita: 0.12,
  pausaMinuti: 8,
}
