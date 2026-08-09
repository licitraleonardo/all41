// Quando chiedere «com'è che va?».
//
// La domanda è delicata per la stessa ragione del banner della posizione:
// l'app si apre quaranta volte al giorno, e un cartello che torna troppo
// spesso si impara a chiudere senza leggerlo. A quel punto non serve più
// a niente, e in più dà fastidio.
//
// Niente browser qui dentro: sono condizioni, e si provano da riga di
// comando come il resto delle regole.

const GIORNI = 2
const UN_GIORNO = 24 * 3600 * 1000

// ⚠️ Due giorni **più un caso fra zero e ventiquattro ore**, e il caso
// non è un vezzo.
//
// Con un intervallo fisso il cartello tornerebbe sempre alla stessa ora
// del giorno — cioè, per come si usa un'app in vacanza, sempre nello
// stesso momento della giornata: sempre a colazione, o sempre in
// spiaggia. Chi lo becca a colazione impara che quello è «il cartello di
// colazione» e lo chiude prima di leggerlo.
export function prossimaVolta({ adesso = new Date(), caso = Math.random() } = {}) {
  return new Date(adesso.getTime() + GIORNI * UN_GIORNO + Math.floor(caso * UN_GIORNO))
}

// Si chiede adesso?
export function vaChiestoFeedback({
  prossima = null,
  dentroIlViaggio = true,
  primoGiorno = false,
  adesso = new Date(),
}) {
  // Fuori dalle date del viaggio non c'è niente su cui dire la propria.
  if (!dentroIlViaggio) return false

  // ⚠️ Mai il primo giorno. Il 12 si arriva, si fa il check-in e si
  // scarica la macchina: chiedere «com'è che va?» a chi ha aperto l'app
  // da un'ora è il modo più veloce per far chiudere il cartello a tutti e
  // otto senza leggerlo, e da lì in poi vale zero.
  if (primoGiorno) return false

  // Prima volta: non si chiede subito, si programma e basta. Chi arriva
  // deve poter usare l'app prima che gli si chieda com'è.
  if (!prossima) return false

  const quando = Date.parse(prossima)
  if (!Number.isFinite(quando)) return false

  return adesso.getTime() >= quando
}
