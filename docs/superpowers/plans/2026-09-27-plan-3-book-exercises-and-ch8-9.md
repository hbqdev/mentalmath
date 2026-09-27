# Plan 3: Book Exercise Data and Chapters 8–9 Generators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every one of the 40 book exercise sets has its problems and the authors' answers (with steps) as typed data, verified by computation; chapters 8 and 9 get generated drills; the practice screen runs book sessions end to end.

**Architecture:** Book data lives in TypeScript files `src/content/book-exercises/chN.ts`, one exported `BookSetData[]` per chapter, built with small constructor helpers so each problem is one readable line. `src/content/book-exercises/index.ts` registers them into `src/exercises/bookSets.ts` at import time (imported once from `src/exercises/registry.ts`). A test suite recomputes every computable answer and checks step endings, set ids against `scripts/book-map.json`, and problem counts against the figures. Generators for chapters 8 and 9 follow the Plan 2 shape.

**Tech Stack:** as Plan 2.

**Spec:** `docs/superpowers/specs/2026-09-26-mentalmath-revamp-design.md` sections 6.3, 7.3 (chapter 8/9 sets), 10; addendum (book e2e coverage).

## Global Constraints

- Plan 1 and Plan 2 constraints apply.
- Problem prompts come from the exercise-list figures located in Plan 1 (`scripts/book-map.json`); answers and steps come from the Answers section (text for chapter 1, chapter 3 factoring and cubes, chapter 5 everyday math; images `images/00456–00524.jpeg` of the EPUB for the rest, copied to the scratchpad `answers/` folder). Where an image is unreadable, compute the answer and write steps in the book's method; note it in the data file with `// computed` and in the ledger.
- Every arithmetic answer is verified by recomputation in tests; estimation answers carry the book's stated figure with the tolerance used by the matching generated set.
- Set ids are exactly the 40 in `book-map.json`. Problem numbering follows the book.
- Commit per task with the session's attribution lines; regenerate screenshots when UI changes.

## Review Focus

1. **Transcription slips**: a digit swapped in a prompt or answer. Test in Task 1 (recompute) plus a count-per-set assertion in each data task.
2. **Book sessions of odd length** (3 problems, 36 problems): progress display, results, attempt recording with `total` ≠ 10. Test in Task 8.
3. **Day-of-week algorithm** across centuries, leap years and the "June 31" trick question in the book's own set. Test in Task 7.
4. **Estimation sets** must accept the book's estimate and the exact value. Test in Task 5.
5. **Column-addition prompts with dollar amounts** must display and check cents. Test in Task 6.

---

## File structure

```
src/content/book-exercises/
  helpers.ts        add(), sub(), mul(), div(), sq(), cube(), frac ops, est(), text(), col(), day()
  ch1.ts … ch6.ts, ch8.ts, ch9.ts   export const sets: BookSetData[]
  index.ts          registers all sets (side-effect import)
  __tests__/book-exercises.test.ts
src/exercises/bookSets.ts           BookSetData type, register/lookup (extend)
src/exercises/generators/chapter8.ts, chapter9.ts, index.ts (append)
src/exercises/__tests__/generators/chapter8-9.test.ts
src/exercises/dates.ts              dayOfWeek(iso), book codes (month/year/century) + steps
e2e/book.spec.ts                    one book session per chapter with sets
screenshots/practice/book-session-*.png
```

```ts
// bookSets.ts additions
export interface BookProblem { n: number; prompt: Prompt; answer: AnswerSpec; steps: string[] }
export interface BookSetData { id: string; problems: BookProblem[] }
export function bookExercises(setId: string): Exercise[]   // maps BookProblem -> Exercise { id: `${setId}-${n}`, source: 'book', solution: { steps } }
```

---

### Task 1: Data format, helpers, registration, verification test

Create `helpers.ts` (constructors return `BookProblem`; they compute the answer themselves from the operands so a transcription slip in the answer is impossible, and take the book's steps as the last argument; `est()` takes the book's estimate explicitly), `index.ts`, extend `bookSets.ts`, write `book-exercises.test.ts`:

- every id in `book-map.json` (both maps) has a registered set with ≥ 1 problem, and no registered set lacks a map entry;
- problem numbers are 1..n contiguous per set;
- for computable prompts (`referenceFor` from the Plan 2 harness) the answer matches;
- each `steps` array is non-empty and its last step contains the shown answer (phonetic/text kinds excepted);
- `bookExercises('ch1-two-digit-addition')` returns Exercises with `source: 'book'`.

Seed with chapter 1 (all four sets, text answers above) so the test suite is meaningful from the start. Commit `feat(book): typed book exercise data with chapter 1 and verification tests`.

### Task 2: Chapter 2 and 3 data
Sets: ch2-2-by-1-multiplication (20), ch2-3-by-1-multiplication (36), ch2-two-digit-squares (20), ch3-multiplying-by-11, ch3-2-by-2-addition-method (11), ch3-2-by-2-subtraction-method (11), ch3-2-by-2-factoring-method (12, text answers), ch3-2-by-2-general-multiplication (33), ch3-three-digit-squares (11), ch3-two-digit-cubes (16, text answers). Steps for image answers transcribed from `answers/00456–00473`. Commit.

### Task 3: Chapter 4 data
Ten sets; answers `answers/00474–00485`. Fractions as `fraction` answers; divisibility as `choice`; decimalization as `decimal` (book gives repeating forms: use 3-decimal rounding with tolerance 0.001 and mention the repeating form in the steps). Commit.

### Task 4: Chapter 5 data
Six sets; answers `answers/00486–00493` plus the everyday-math text. Estimation answers use `estimate` with the book's exact value as `value` and tolerances 0.02 (add/sub/sqrt) or 0.05 (mul/div); steps quote the book's rounding. The $ column becomes a `columns` prompt in cents with a `decimal` answer. Commit.

### Task 5: Chapter 6 data
Four sets; answers `answers/00494–00497`. Columns of numbers → `columns` prompts (dollar column as decimal); subtracting on paper → `binary`; square roots → `decimal` (book gives to two decimals); pencil-and-paper multiplication → `binary` with criss-cross steps from the image. Commit.

### Task 6: Chapter 8 and 9 data
ch8: four-digit squares (6), 3-by-2 (34), five-digit squares (6), 3-by-3 (19), 5-by-5 (4); answers `answers/00498–00524` (the 3-by-3 answers span 18 images). ch9: a-day-for-any-date (10 dates from the text; answers computed by `dayOfWeek`, steps via the book's code method; "June 31, 2468" is the book's trick: answer text "No such date"). Commit.

### Task 7: Chapters 8 and 9 generators
`dates.ts`: month codes (Jan 6, Feb 2, Mar 2, Apr 5, May 0, Jun 3, Jul 5, Aug 1, Sep 4, Oct 6, Nov 2, Dec 4; leap-year Jan 5, Feb 1), year code = (y + floor(y/4)) mod 7 for 2000s, century adjustments (1900s +1, 1800s +3, 1700s +5, 2100s +5 … per the book), day = (month + day + year) mod 7 with 1 = Monday … 0 = Sunday; `dayOfWeek(iso)` verified against `Date`. Generators: `gen8-four-digit-squares`, `gen8-3-by-2`, `gen8-five-digit-squares`, `gen8-3-by-3`, `gen8-5-by-5` (steps: factoring/addition/subtraction choice, squares by rounding to thousands with the phonetic mnemonic omitted); `gen9-day-for-any-date` (`date` prompt, `choice` of weekdays), `gen9-cube-roots` (perfect cubes of 2-digit numbers; steps: last digit rule and range), `gen9-square-roots` (perfect squares of 2-digit numbers), `gen9-magic-1089` (text: "reverse, subtract, add" predicting 1089; integer), `gen9-leapfrog` (columns prompt of the 10 Fibonacci-style numbers; integer; steps: 11 × 7th number), `gen9-missing-digit` (text prompt: the sum of the visible digits; integer 0–9 via digit root), `gen9-psychic-math` (text: predicted result 7 for the 2x+12 ÷2 − x trick; integer). Tests with the Plan 2 harness plus date property tests. Register in `generators/index.ts`. Commit.

### Task 8: Practice polish for book sessions, e2e, screenshots
- `PracticeView`: book sessions show "Problem n of N" from the book numbering; the results screen for a book set offers "Generated twin" as well; a set with fewer than 10 problems works.
- Tests: PracticeView book session (ch1 two-digit addition, 10 problems, wrong answer shows the book's steps), a 3-problem set.
- `e2e/book.spec.ts`: for chapters 1, 2, 3, 4, 5, 6, 8, 9 open the first book set from the chapter's rail, answer using the committed data (import `src/content/book-exercises/chN`), reach results.
- Screenshots: `book-session-prompt`, `book-session-steps`, `book-session-results` (desktop and phone). View and fix.
- README: book data authoring notes. Commit.

## Self-review notes
- Spec 6.3 → Tasks 1–6; 7.3 chapter 8/9 sets → Task 7; addendum book e2e → Task 8.
- Review Focus 1 → Task 1 test; 2 → Task 8; 3 → Task 7; 4 → Task 4; 5 → Tasks 4/5.
