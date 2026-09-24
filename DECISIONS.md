# Decisions Log
 
Format: what was decided, why, and what alternative was rejected.
Append new entries as the project progresses — this feeds the README's
"known limitations" section later.
 
---
 
### Project selection
Chose Study Assistant over Fridge-to-Recipe and Trip Planner. Reason:
best ratio of genuine interactive complexity (retest/review-again loop)
to implementation risk — avoids drag-and-drop/nested-state complexity
that Trip Planner would require, while being richer than Fridge-to-Recipe.
 
### Mixed mode presentation
Sectioned (all flashcards, then the full quiz) rather than interleaved.
Reason: flashcards and quiz items use different interaction models
(flip + self-grade vs. select + deterministic correctness) that don't
compose cleanly in a single interleaved stream. Sectioned is simpler to
implement, easier to explain, and still demonstrates multi-block
rendering from one AI response.
 
### Retest / review pools
Flashcard "review again" and quiz "retest" are kept as two independent
pools, not merged. Reason: self-reported confidence (flashcards) and
objective correctness (quiz) are different signals — merging them would
require inventing an equivalence that's hard to defend.
 
### Quiz answer format
Multiple-choice only, no free-text grading. Reason: keeps correctness
deterministic and the schema simple; avoids fuzzy string-matching
complexity that would expand the validation/failure surface area
significantly for limited benefit.
 
### AI provider
Cerebras as primary provider (OpenAI-compatible endpoint, fast
inference), Google Gemini as fallback. Model: `gpt-oss-120b` — supports
`response_format: { type: "json_object" }` for structured output. Note:
this model uses reasoning tokens internally, so `max_completion_tokens`
must be set high enough (8192) to leave room for actual output.
 
### API key handling
Never exposed client-side. All provider calls go through a backend
proxy that holds the key server-side.
 
### State management
`useReducer` + plain hooks, no external state library. Reason: scope of
this app doesn't justify Redux/Zustand, and hooks-only is easier to
explain and defend live in an interview.
 
---
 
<!-- Add new entries below as you build -->
 