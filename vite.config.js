import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

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
  plugins: [react(), basicSsl()],
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
