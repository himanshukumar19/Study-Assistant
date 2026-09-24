# Study Assistant

AI-powered study tool that turns your notes into interactive flashcards, quizzes, or a mixed study set.

## Setup

```bash
npm install
npm start
```

Requires Node.js 20+ (uses `--env-file` for `.env` loading). The app runs at `http://localhost:5173` (frontend) and `http://localhost:3001` (backend proxy).

Create a `.env` file based on `.env.example` with your API keys:

```
CEREBRAS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

## Usage

1. Paste your notes, textbook excerpt, or lecture transcript into the text area
2. Choose a mode: **Flashcards**, **Quiz**, or **Mixed**
3. Click **Generate Study Set**
4. **Flashcards**: tap to flip, then self-grade with "Got it" or "Review again". Use arrow keys to navigate. Progress dots track your progress.
5. **Quiz**: select an answer, click "Lock in" (once locked, it cannot be changed). Explanation reveals after locking. Incorrect answers go into a retest queue.

## Tech Stack

- React 19 + Vite 8
- Express backend proxy (port 3001) — routes LLM calls, holds API keys server-side
- Plain CSS with CSS custom properties
- Cerebras API (primary) / Google Gemini (fallback)
- No TypeScript — JSDoc for type annotations

## AI-Usage Note

This project uses AI (Cerebras / Gemini) to generate structured study material from free-form text input. The AI returns JSON that is validated on the frontend before rendering. API keys are held server-side via a backend proxy — they never reach the browser.

## Known Limitations

- No Gemini fallback yet (Cerebras only)
- No dark mode
- No save/load sessions
- No streaming response rendering
- Quiz is multiple-choice only (no free-text grading)
- Mixed mode still renders as raw JSON (FlashcardSection + QuizSection built, MixedSection pending)

## Time Spent

~12 hours (scaffolding, design system, input/mode UI, schema, backend proxy, response validator, reducers, generate flow, FlashcardSection, QuizSection, reviews)

## License

MIT
