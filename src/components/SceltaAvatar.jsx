import { STILI, urlAvatar } from '../config/avatar.js'

export default function SceltaAvatar({ seme, stile, onCambia }) {
  return (
    <fieldset className="avatar-scelta">
      <legend>Avatar</legend>
      <div className="avatar-griglia">
        {STILI.map((s) => (
          <button
            key={s}
            type="button"
            className={s === stile ? 'avatar scelto' : 'avatar'}
            onClick={() => onCambia(s)}
            aria-pressed={s === stile}
            aria-label={`Avatar stile ${s}`}
          >
            <img src={urlAvatar(s, seme)} alt="" width="64" height="64" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
