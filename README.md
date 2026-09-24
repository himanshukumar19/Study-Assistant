# Study Assistant

AI-powered study tool that turns your notes into interactive flashcards, quizzes, or a mixed study set.

## Setup

```bash
npm install
npm start
```

Requires Node.js 18+. The app runs at `http://localhost:5173`.

Create a `.env` file based on `.env.example` with your API keys:

```
CEREBRAS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

## Usage

1. Paste your notes, textbook excerpt, or lecture transcript into the text area
2. Choose a mode: **Flashcards**, **Quiz**, or **Mixed**
3. Click **Generate Study Set**
4. Study with interactive flashcards (flip + self-grade) or quizzes (multiple-choice + explanations)

## Tech Stack

- React 19 + Vite 8
- Plain CSS with CSS custom properties
- Cerebras API (primary) / Google Gemini (fallback)
- No TypeScript — JSDoc for type annotations

## AI-Usage Note

This project uses AI (Cerebras / Gemini) to generate structured study material from free-form text input. The AI returns JSON that is validated on the frontend before rendering. API keys are held server-side via a backend proxy — they never reach the browser.

## Known Limitations

- Backend proxy not yet implemented — API calls are not wired up
- No dark mode
- No save/load sessions
- No streaming response rendering
- Quiz is multiple-choice only (no free-text grading)

## Time Spent

~4 hours (scaffolding, design system, input/mode UI, schema, AGENTS.md)

## License

MIT
