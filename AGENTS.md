# AGENTS.md

## Commands

```bash
npm start          # dev server (Vite) — assignment requires this name, not `npm run dev`
npm run build      # production build
npm run lint       # ESLint (flat config)
npm run preview    # preview production build
```

## Tech Stack

- **Frontend**: React 19, Vite 8, vanilla JS (no TypeScript), plain CSS
- **No TypeScript** — use JSDoc for type annotations
- **Backend proxy**: planned but not yet implemented (see `backend/` directory — holds the API key, never exposed to browser)
- **AI Providers**: Cerebras API (primary, OpenAI-compatible endpoint), Google Gemini (fallback)
- **State**: `useReducer` for flashcard/quiz pools, `useState` for simple UI flags; no external state library

## Architecture (Non-Obvious)

### Schema (see `src/services/schema.js`)
The AI response uses a **discriminated union** of `StudyItem[]`:
- `{ id, type: "flashcard", front, back }`
- `{ id, type: "quiz", question, options[4], correctIndex, explanation }`

### Mixed Mode
Two **sequential sections** (not interleaved): all flashcards first, then quiz. Flashcard "review again" pool and quiz "retest" pool are **completely independent** — never merged.

### AI Response Handling
- **AI output is untrusted input.** Parse and validate on the frontend before it touches render state.
- Handle JSON wrapped in markdown fences or extra prose — extract before parsing.
- **Stale response guard**: use request tokens or `AbortController` so an in-flight response can never overwrite a newer one.
- Must handle: malformed JSON, wrong shape, empty array, timeout, network failure. No crashes.

### State Machines per Feature
- Request lifecycle: `idle → loading → success → error`
- Each flashcard has status: `unseen | known | review-again`
- Each quiz question has status: `unanswered | correct | incorrect`, plus a retest queue

### API Key Security
API keys must never reach the browser. Route all LLM calls through a backend proxy (the `backend/` directory — currently empty scaffold).

## Locked Decisions — do not re-derive or silently change these 
- Modes: Flashcards, Quiz, Mixed. Mixed = two sequential sections (all flashcards, then the quiz) — never interleaved.
- Flashcard "review again" pool and Quiz "retest" pool are independent. Never merge them into one tracking structure.
- Quiz is multiple-choice only (4 options). No free-text answer grading.
- Once a quiz answer is selected and locked, it cannot be changed — explanation reveals only after locking.
- AI provider: Cerebras (primary, OpenAI-compatible endpoint) with Google Gemini as fallback.
- API key lives server-side only, inside `backend/`. Never in frontend code, never in the client bundle, never logged to console.
- State management: React hooks + `useReducer` only. No Redux/Zustand/other external state library.
- `services/schema.js` is canonical. Never redefine these types elsewhere.
- `npm start` must work end-to-end locally (already fixed — do not rename the script back to `dev` without updating this file).

## Rules 
- Never invent or modify the schema in `src/services/schema.js` without flagging it first — this file is canonical.
- Never add a new dependency without asking.
- Never call the AI provider directly from a React component — always through `src/services/` calling the backend proxy.
- Never create local state (`useState`) that duplicates something a reducer already owns.
- Explain your approach before writing any non-trivial code.
- If a prompt conflicts with something in this file, say so — don't silently pick one.
- If something in this file turns out to be wrong or outdated, flag it — don't silently work around it.

## Assignment Requirements (Verbatim from `docs/feature.md`)
- `npm install && npm start` must work end-to-end
- Readme must include: setup, AI-usage note, known limitations, time spent
- `.env.example` is the canonical env reference; never commit real keys
- Must work on mobile
- Loading, error, empty states for every interactive path

## File Layout
```
src/
  theme.css         # design tokens: colors, type scale, spacing, radius, shadows
  index.css         # global styles, font imports, reset, reduced-motion guard
  App.jsx           # main app shell — composes TextInput + ModeSelector + Generate
  App.css           # component styles (BEM naming), animations
  constants.js      # shared constants (MODES array)
  components/
    TextInput.jsx   # textarea + character counter (4000 max)
    ModeSelector.jsx # pill buttons: Flashcards / Quiz / Mixed
  hooks/            # custom hooks (currently empty)
  services/
    schema.js       # canonical AI response types (discriminated union)
backend/            # proxy server (currently empty)
docs/
  feature.md        # detailed feature plan & build phases — canonical spec
```

## Conventions
- This is JavaScript, not TypeScript. Do not add `.ts`/`.tsx` files or TS syntax.
- Use JSDoc `@typedef` for type documentation (see `schema.js` for existing pattern).
- ESLint flat config (`eslint.config.js`), ignores `dist/`.
- No test framework configured yet — don't try to run `npm test`.
