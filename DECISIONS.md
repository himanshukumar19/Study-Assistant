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

### Response validator salvage policy
Salvage valid items from partially-valid arrays rather than rejecting
the whole response. Reason: for a study tool, partial content is better
than none — the student still gets usable flashcards/quizzes from a
mostly-correct AI response. Reject only when zero items survive validation.

### Stale-response guard
Monotonically increasing `requestId` token stored in a ref (single
source of truth). Each response carries its token; reducer compares
against current `state.requestId` and discards if mismatched. Reason:
prevents a slow, stale response from overwriting fresher data when
the user fires multiple requests quickly.

### FlashcardSection design
CSS 3D flip (`rotateY(180deg)`) with `backface-visibility: hidden`.
Two-face card inside a perspective container. "Got it" / "Review again"
pill buttons with progress dots. Keyboard: Space/Enter to flip,
arrow keys to navigate. `prefers-reduced-motion` skips JS setTimeout
animation and CSS transitions degrade instantly.

### QuizSection design
Select-then-lock mechanic: user picks an option, then clicks "Lock in".
Once locked, selection is permanent — options become disabled. Correct
answer highlighted with checkmark icon + "Correct!" text. Incorrect
shows cross icon + "Incorrect". Explanation reveals only after locking.
No color-only distinction: paired with SVG icons and text labels per
accessibility requirement.

### Accessibility: no color-only distinction
Both FlashcardSection and QuizSection use icons + text labels alongside
color for correct/incorrect/known/review-again states. Reason: color
blind users cannot distinguish states from color alone. Pattern:
checkmark icon + "Correct!" label, cross icon + "Incorrect" label,
"Got it" / "Review again" text buttons.
 
---
 
<!-- Add new entries below as you build -->
 