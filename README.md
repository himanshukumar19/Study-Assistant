# Study Assistant

AI-powered study tool that turns your notes into interactive flashcards, quizzes, or a mixed study set.

## Setup

```bash
npm install
npm start
```

Requires Node.js 20+ (uses `--env-file` for `.env` loading). The app runs at `http://localhost:5173` (frontend) and `http://localhost:3001` (backend proxy).

To test on a phone, connect both devices to the same WiFi and open the **Network** URL shown in the `npm start` output (e.g. `http://192.168.x.x:5173`).

Create a `.env` file based on `.env.example` with your API key:

```
CEREBRAS_API_KEY=your_key_here
```

## Usage

1. Paste your notes or a focused topic (up to 4,000 characters) into the text area
2. Choose a mode: **Flashcards**, **Quiz**, or **Mixed**
3. Click **Generate Study Set**
4. **Flashcards**: tap to flip, then self-grade with "Got it" or "Review again". Use arrow keys to navigate. Progress dots track your progress.
5. **Quiz**: select an answer, click "Lock in" (once locked, it cannot be changed). Explanation reveals after locking. Incorrect answers go into a retest queue.
6. **Mixed**: flashcards first, then a quiz section — sequential, never interleaved.

## How It Works

```
┌─────────────┐     POST /api/generate      ┌──────────────────┐
│   Browser   │ ───────────────────────────▶ │  Express :3001   │
│  (Vite :5173)│                              │  (backend proxy)  │
│              │                              │                   │
│  TextInput   │                              │  Holds API key    │
│  ModeSelector│                              │  Builds prompt    │
│  App.jsx     │                              │  Rate-limit guard │
│              │ ◀─────────────────────────── │                   │
└──────────────┘     { raw: "..." }           └────────┬──────────┘
       │                                               │
       │ validateResponse()                  fetch(CEREBRAS_URL)
       │ • extract JSON from fences          OpenAI-compat endpoint
       │ • validate against schema           response_format: json
       │ • salvage valid items               max_completion_tokens: 8k
       │                                               │
       ▼                                               ▼
┌──────────────────┐                        ┌──────────────────┐
│   StudyItem[]    │                        │   Cerebras API   │
│  discriminated   │                        │  (gpt-oss-120b)  │
│  union data      │                        │                  │
└────────┬─────────┘                        └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                  App.jsx render switch               │
│                                                     │
│  mode=flashcards ──▶ FlashcardSection               │
│                      • 3D CSS flip cards             │
│                      • review-again pool             │
│                      • arrow-key navigation          │
│                                                     │
│  mode=quiz ────────▶ QuizSection                    │
│                      • select → lock → reveal        │
│                      • retest queue for incorrect    │
│                      • arrow-key radiogroup          │
│                                                     │
│  mode=mixed ───────▶ MixedSection                   │
│                      • FlashcardSection first        │
│                      • divider transition            │
│                      • QuizSection after             │
│                      • independent pools (never merge)│
└─────────────────────────────────────────────────────┘

State: useReducer per feature, useRequestLifecycle with stale-response guard
Error codes: 9 distinct types → user-friendly messages + collapsible debug details
```

## Tech Stack

- React 19 + Vite 8
- Express backend proxy (port 3001) — routes LLM calls, holds API keys server-side
- Plain CSS with CSS custom properties
- Cerebras API (primary)
- No TypeScript — JSDoc for type annotations

## AI-Usage Note

I used OpenCode as a coding agent throughout development, working
phase-by-phase against a feature plan I scoped upfront (schema design,
mode behavior, state management, provider choice). Each phase had a
spec I wrote before prompting, and I reviewed every diff before
committing — including manually testing failure modes in the response
validator (malformed JSON, wrong shape, empty responses, rate limiting)
and the stale-response race-condition guard. Architectural decisions —
the discriminated-union schema, sectioned Mixed mode with independent
retest/review pools, multiple-choice-only quiz, Express backend over a
serverless function, no AI SDK (plain fetch to OpenAI-compatible
endpoints) — were mine; OpenCode implemented against locked constraints
I maintained in AGENTS.md and DECISIONS.md throughout.

## Known Limitations

- Input capped at 4,000 characters — keeps generation focused and fits
  comfortably within Cerebras's free-tier context window
- No Gemini fallback yet (Cerebras only) — if Cerebras is rate-limited
  or down, generation fails rather than retrying via a second provider
- Free-tier rate limits (5 requests/minute on Cerebras) may cause
  delays if generating repeatedly in quick succession
- No dark mode
- No save/load sessions
- No streaming response rendering
- Quiz is multiple-choice only (no free-text grading) — deliberate,
  to keep correctness deterministic and validation simple
- Stretch features beyond the core three modes were deliberately not
  pursued — prioritized a solid, well-tested core over a broader
  feature set with less polish

## Time Spent

~7.5 hours total

| Phase | Time | What |
|---|---|---|
| Scaffold + schema + env | ~45m | Vite/React setup, folder structure, `schema.js`, `.env`, AGENTS.md |
| Backend proxy + validator | ~1.5h | Express server, Cerebras handler, `validateResponse.js` with salvage policy |
| State reducers + generate flow | ~1h | `useRequestLifecycle`, `useFlashcardProgress`, `useQuizProgress`, stale-response guard |
| UI across all 3 modes | ~2h | FlashcardSection (3D flip, review-again), QuizSection (lock-in, retest), MixedSection |
| Error/loading/empty states | ~45m | Code-specific error messages, rate-limit handling, empty states across components |
| Responsive + accessibility pass | ~45m | 44px touch targets, focus-visible rings, ARIA labels, quiz arrow-key nav, 375px audit |
| Docs + final QA | ~30m | README, AGENTS.md, DECISIONS.md, manual limitation tests, lint/build |

## License

MIT