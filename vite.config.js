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
    ...(process.env.SENZA_HTTPS ? [] : [basicSsl()]),
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
        // I suoni sono già nel bundle e servono offline; le foto no,
        // arrivano da Supabase e sono troppe per la cache.
        globPatterns: ['**/*.{js,css,html,svg,png,mp3,woff2}'],
        // Il decodificatore HEIC pesa tre mega: resta fuori dalla cache
        // e si scarica solo quando serve davvero.
        globIgnores: ['**/heic-to*'],
        maximumFileSizeToCacheInBytes: 1500000,
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
