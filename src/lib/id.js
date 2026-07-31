// crypto.randomUUID() esiste solo in "contesto sicuro": HTTPS oppure
// localhost. Aprendo l'app dal telefono su http://192.168.x.x non c'è, e
// qualunque cosa la usi fallisce con "is not a function".
//
// crypto.getRandomValues() invece è disponibile ovunque, quindi l'uuid si
// costruisce da lì. Stessa qualità di casualità, stesso formato.

export function uuid() {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()

  const byte = crypto.getRandomValues(new Uint8Array(16))
  byte[6] = (byte[6] & 0x0f) | 0x40 // versione 4
  byte[8] = (byte[8] & 0x3f) | 0x80 // variante RFC 4122

  const esa = [...byte].map((n) => n.toString(16).padStart(2, '0'))
  return [
    esa.slice(0, 4).join(''),
    esa.slice(4, 6).join(''),
    esa.slice(6, 8).join(''),
    esa.slice(8, 10).join(''),
    esa.slice(10, 16).join(''),
  ].join('-')
}
