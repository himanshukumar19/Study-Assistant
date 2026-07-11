import { useState, useRef, useEffect } from "react";
import TextInput from "./components/TextInput.jsx";
import ModeSelector from "./components/ModeSelector.jsx";
import { MODE_IDS } from "./constants.js";
import { useRequestLifecycle } from "./hooks/useRequestLifecycle.js";
import { generateStudySet } from "./services/generate.js";
import { validateResponse } from "./services/validateResponse.js";
import "./App.css";

export default function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState(MODE_IDS[0]);
  const { state, fetchStart, fetchSuccess, fetchError, reset } =
    useRequestLifecycle();
  const abortRef = useRef(/** @type {AbortController | null} */ (null));
  const [droppedCount, setDroppedCount] = useState(0);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const isLoading = state.status === "loading";

  const handleGenerate = async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = fetchStart();

    try {
      const raw = await generateStudySet({
        text,
        mode,
        signal: controller.signal,
      });

      const result = validateResponse(raw);

      if (result.success) {
        fetchSuccess(result.data.items, requestId);
        setDroppedCount(result.data.dropped);
      } else {
        const rawSnippet = result.raw.slice(0, 300);
        fetchError(
          `[${result.reason}] Validation failed.\n\nRaw response (truncated):\n${rawSnippet}`,
          requestId
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      fetchError(
        err instanceof Error ? err.message : String(err),
        requestId
      );
    }
  };

  return (
    <main className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__title">Study Assistant</h1>
        <p className="app-shell__subtitle">
          Turn your notes into study material
        </p>
      </header>

      <TextInput value={text} onChange={setText} disabled={isLoading} />

      <ModeSelector selected={mode} onSelect={setMode} disabled={isLoading} />

      <button
        type="button"
        className={`generate-btn${isLoading ? " generate-btn--loading" : ""}`}
        disabled={!text.trim() || isLoading}
        onClick={handleGenerate}
        aria-label="Generate study set"
      >
        {isLoading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Generating...
          </>
        ) : (
          <>
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
          </>
        )}
      </button>

      {isLoading && (
        <div className="result-card result-card--loading" role="status">
          <p className="result-card__text">
            Generating your study set&hellip;
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="result-card result-card--error" role="alert">
          <p className="result-card__title">Something went wrong</p>
          <pre className="result-card__error-detail">{state.error}</pre>
          <button
            type="button"
            className="result-card__action"
            onClick={reset}
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "success" && state.data && (
        <div className="result-card result-card--success">
          <p className="result-card__title">
            {state.data.length} item{state.data.length !== 1 ? "s" : ""}{" "}
            generated
          </p>
          {droppedCount > 0 && (
            <p className="result-card__dropped">
              {droppedCount} invalid item{droppedCount !== 1 ? "s" : ""} skipped
            </p>
          )}
          <pre className="result-card__raw">{JSON.stringify(state.data, null, 2)}</pre>
          <button
            type="button"
            className="result-card__action"
            onClick={() => {
              reset();
              setText("");
              setDroppedCount(0);
            }}
          >
            Generate new set
          </button>
        </div>
      )}
    </main>
  );
}
