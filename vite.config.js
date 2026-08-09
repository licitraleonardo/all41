import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// Su Vercel il commit arriva dalle env; in locale lo chiediamo a git.
function commitCorrente() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'locale'
  }
}

// Il certificato autofirmato dell'HTTPS locale non lo accettano tutti:
// certi browser lo rifiutano senza dare modo di dire "vai avanti", e il
// pannello di anteprima non lo apre proprio. `npm run dev:http` rimette
// il server in chiaro senza dover passare variabili d'ambiente a mano,
// che su Windows cambiano forma a seconda della shell.
//
// In chiaro su localhost il contesto resta sicuro, quindi microfono,
// posizione e service worker ci sono lo stesso. Dal telefono, su
// 192.168.x.x, no: lì serve l'HTTPS.
const senzaHttps =
  Boolean(process.env.SENZA_HTTPS) || process.env.npm_lifecycle_event === 'dev:http'

// https://vite.dev/config/
export default defineConfig({
  // basicSsl mette il dev server in HTTPS con un certificato locale. Serve
  // perché microfono, posizione, service worker e crypto.randomUUID
  // esistono solo in "contesto sicuro": su http://192.168.x.x non ci sono,
  // e dal telefono sembrerebbero rotti anche col codice giusto.
  //
  // host: true fa ascoltare anche sulla rete locale, così non serve più
  // lanciare "npm run dev -- --host".
  // Con SENZA_HTTPS=1 il server torna in HTTP: serve quando un browser
  // rifiuta il certificato autofirmato senza dare modo di accettarlo.
  // In quel caso però microfono, posizione e service worker non ci sono.
  plugins: [
    react(),
    ...(senzaHttps ? [] : [basicSsl()]),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'sounds/*.mp3'],
      manifest: {
        name: 'All For One',
        short_name: 'ALL41',
        description: 'Sardegna, 12–16 agosto',
        lang: 'it',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B3550',
        theme_color: '#0B3550',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          {
            src: '/icona-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        // Il pezzo che fa suonare i telefoni. `importScripts` e non
        // `injectManifest`: quella strategia vorrebbe dire riscrivere il
        // service worker intero, e con lui `skipWaiting` e `clientsClaim`
        // su cui poggia l'aggiornamento automatico. Cosi' invece si
        // aggiunge e basta.
        importScripts: ['/push.js'],
        // I suoni sono già nel bundle e servono offline; le foto no,
        // arrivano da Supabase e sono troppe per la cache.
        globPatterns: ['**/*.{js,css,html,svg,png,mp3,woff2}'],
        // Il decodificatore HEIC pesa tre mega: resta fuori dalla cache
        // e si scarica solo quando serve davvero.
        globIgnores: ['**/heic-to*'],
        maximumFileSizeToCacheInBytes: 1500000,
        // Le immagini che arrivano da fuori restano fuori dal pacchetto,
        // ma quelle già viste si tengono: senza, la copia locale dei dati
        // mostrerebbe una griglia di icone rotte e avatar mancanti, che
        // sembra un guasto invece di una vacanza senza campo.
        //
        // Si scarica solo quello che è stato davvero guardato: è
        // l'opposto del precaricare tutto l'album, che resta escluso.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.dicebear\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/storage\/v1\/object\/public\/foto\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'foto-viste',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // I documenti sono l'unica cosa che serve davvero senza rete:
          // il QR del traghetto alle 7 del mattino, in fila all'imbarco,
          // con una tacca di segnale. Restano più a lungo delle foto e
          // non scadono durante il viaggio.
          //
          // ⚠️ Vale per le immagini, che l'app apre da sola. Un PDF
          // aperto con window.open è una navigazione verso un altro
          // dominio, e quella il service worker non la intercetta: per
          // quelli l'unica difesa è averli guardati prima, o salvarli
          // sul telefono.
          {
            urlPattern: /\/storage\/v1\/object\/public\/documenti\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'documenti-visti',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true },
  define: {
    __COMMIT__: JSON.stringify(commitCorrente()),
    __BUILD_TIME__: JSON.stringify(
      new Date().toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    ),
  },
})
