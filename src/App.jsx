import './App.css'

// Iniettati a build time da vite.config.js — servono a capire quale deploy si sta guardando.
const commit = __COMMIT__
const buildTime = __BUILD_TIME__

function App() {
  return (
    <main className="schermata">
      <div className="marchio">ALL41</div>
      <h1>All For One</h1>
      <p className="sottotitolo">Sardegna &middot; 12&ndash;16 agosto</p>

      <p className="allan">Non c&rsquo;&egrave; ancora niente qui. Ma il deploy funziona.</p>

      <dl className="targa">
        <div>
          <dt>Commit</dt>
          <dd>{commit}</dd>
        </div>
        <div>
          <dt>Build</dt>
          <dd>{buildTime}</dd>
        </div>
      </dl>
    </main>
  )
}

export default App
