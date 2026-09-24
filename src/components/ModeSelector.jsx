import { MODES } from "../constants.js";

/**
 * @param {Object} props
 * @param {string} props.selected
 * @param {(mode: string) => void} props.onSelect
 */
export default function ModeSelector({ selected, onSelect }) {
  return (
    <fieldset className="mode-selector" aria-label="Study mode">
      <legend className="mode-selector__legend">Choose a mode</legend>
      <div className="mode-selector__group">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`mode-selector__btn${selected === mode.id ? " is-active" : ""}`}
            aria-pressed={selected === mode.id}
            onClick={() => onSelect(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
