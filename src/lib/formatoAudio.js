// Verifica bloccante n.3 dello spec, e il motivo per cui esisteva.
//
// Chrome e Firefox producono audio/webm con Opus, Safari produce
// audio/mp4 con AAC anche nelle versioni recenti. Chi scrive "webm" nel
// codice si ritrova la registrazione rotta su iPhone, e un file
// registrato su Android che su iPhone non si sente.
//
// Quindi: si chiede al browser cosa sa fare, si preferisce audio/mp4
// perché si riproduce ovunque, e si salva il mimeType VERO insieme al
// file invece di assumerlo.
//
// `supportato` si può iniettare: così tutta la scelta si prova da riga
// di comando, senza un browser e senza un microfono.

export const FORMATI = [
  // Primo l'mp4/AAC: è quello che si sente su tutti i telefoni del
  // gruppo, iPhone compresi.
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  // Poi Opus, che è più leggero ma che i Safari più vecchi non aprono.
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
]

export function scegliFormato(supportato) {
  const sa =
    supportato ??
    ((tipo) =>
      typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(tipo))

  for (const formato of FORMATI) {
    try {
      if (sa(formato)) return formato
    } catch {
      // isTypeSupported può lanciare su implementazioni vecchie: si
      // prova il prossimo invece di fermarsi.
    }
  }

  // Nessuno dei formati noti: si lascia decidere al browser e si legge
  // dopo cosa ha prodotto. Meglio un file di formato ignoto che nessun
  // file — il mimeType vero si salva comunque.
  return ''
}

// L'estensione serve solo a dare un nome sensato al file nello storage:
// quello che conta per la riproduzione è il mimeType salvato accanto.
export function estensioneDi(mimeType) {
  if (!mimeType) return 'bin'
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mpeg')) return 'mp3'
  return 'bin'
}

export function registrazioneDisponibile() {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}
