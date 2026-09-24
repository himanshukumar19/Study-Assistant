import { useState } from "react";
import TextInput from "./components/TextInput.jsx";
import ModeSelector from "./components/ModeSelector.jsx";
import { MODE_IDS } from "./constants.js";
import "./App.css";

export default function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState(MODE_IDS[0]);

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__title">Study Assistant</h1>
        <p className="app-shell__subtitle">
          Turn your notes into study material
        </p>
      </header>

      <TextInput
        value={text}
        onChange={setText}
        disabled={false}
      />

      <ModeSelector
        selected={mode}
        onSelect={setMode}
      />

      <button
        type="button"
        className="generate-btn"
        disabled={!text.trim()}
        aria-label="Generate study set"
      >
        Generate Study Set
        <svg
          className="generate-btn__icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </main>
  );
}
