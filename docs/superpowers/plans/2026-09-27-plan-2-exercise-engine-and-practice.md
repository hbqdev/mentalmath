# Plan 2: Exercise Engine, Practice UI, E2E Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy string-parsed exercise flow with a typed exercise engine, a practice screen that runs book and generated sessions, generated sets with method steps for chapters 0 to 7, and a Playwright end-to-end suite with committed screenshots.

**Architecture:** `src/exercises/` is pure TypeScript: discriminated-union types, a seeded RNG, a checker keyed on answer kind, a session state machine, and one generator module per chapter exporting `sets`. A static registry joins generated sets with the book sets that the extraction now lists per chapter (id and anchoring section). `src/practice/` renders a session: one prompt component per prompt kind, one input component per answer kind, solution steps, results. The reader's callouts and rail read from the registry. `e2e/` holds Playwright tests and the screenshot spec.

**Tech Stack:** as Plan 1, plus `@playwright/test` 1.63 (already installed, Chromium downloaded).

**Spec:** `docs/superpowers/specs/2026-09-26-mentalmath-revamp-design.md` sections 6.3 (set ids), 7, 8.1 to 8.3, 9, 10; addendum `docs/superpowers/specs/2026-09-27-addendum-e2e-and-ui-driven.md`.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies (Node 20.19, TypeScript strict, no Tailwind, palette tokens, breakpoints, storage key `mentalmath.v1`).
- The engine (`src/exercises/**`) imports nothing from Vue or the DOM.
- Generators take an injected RNG and are deterministic for a seed. Every generated `Exercise` carries `solution.steps` that end with the answer.
- A generated session is 10 problems, mixed difficulty by default; a book session is the set's problems in order.
- Answer kinds and their checking rules come from spec 7.1 and 7.2 verbatim.
- E2E runs against a production build via `vite preview`; screenshots go under `screenshots/<area>/<scene>-<project>.png`.
- Commit after every task with the session's attribution lines.

## Review Focus

1. **Answer normalisation edge cases**: "1,368" vs 1368, "45 r 8" vs "45 remainder 8" vs "45 8/9", "0.75" for 3/4 when decimals allowed, leading "+" or trailing "." Test in Task 3.
2. **Generated problems must obey the technique's precondition** (for example the "squares ending in 5" set never yields 42, the subtraction-method set always has a second factor within 1 to 3 of a multiple of 10). Test per set in Tasks 6 to 8.
3. **Session end and re-entry**: finishing a session records exactly one attempt, "Practice again" starts a fresh seeded session, browser back from results returns to the chapter not to a dead session. Test in Tasks 4 and 10.
4. **Locked sets reached by URL**: opening `/practice/1/ch1-two-digit-addition` before visiting the section shows a locked state with a link to the section, never a session. Test in Task 10.
5. **Unknown set id or set from another chapter in the URL**: not-found state, no throw. Test in Task 10.

---

## File structure

```
src/exercises/
  types.ts            Op, Frac, Difficulty, Prompt, AnswerSpec, Exercise, GeneratedSetDef, BookSet
  rng.ts              createRng(seed) -> { int, pick, chance, shuffle, seed }
  checker.ts          check(spec, input), formatAnswer(spec), normalise helpers
  format.ts           promptText(prompt) plain text; fracText, opSymbol
  session.ts          createSession(exercises, opts) pure state machine
  generators/
    shared.ts         digit helpers, step builders (leftToRightAdd, complement...)
    chapter0.ts ... chapter7.ts    each exports `sets: GeneratedSetDef[]`
    index.ts          generatedSets: GeneratedSetDef[]
  registry.ts         allSetsFor(chapterId), findSet(chapterId, setId), generatedFor(bookSetId)
  __tests__/          rng, checker, format, session, generators/*.test.ts, registry.test.ts

src/practice/
  PracticeView.vue    route /practice/:chapter/:set  (query: mode, difficulty, seed, timed)
  usePracticeSession.ts   wraps session.ts in refs + timer + attempt recording
  PromptRenderer.vue  switch on prompt.kind
  prompts/BinaryPrompt.vue ColumnsPrompt.vue PowerPrompt.vue RootPrompt.vue
          FractionBinaryPrompt.vue FractionTaskPrompt.vue PercentPrompt.vue
          DivisiblePrompt.vue DatePrompt.vue TextPrompt.vue FractionGlyph.vue
  AnswerInput.vue     text field / choice buttons keyed on answer.kind
  SolutionSteps.vue
  SessionResults.vue
  SetLockedView.vue
  __tests__/

src/content/types.ts   ChapterMeta gains `sets: Array<{ id: string; sectionId: string }>`
scripts/lib/write-index.ts, scripts/extract-book.ts   emit `sets`
src/reader/ExerciseCallout.vue, PracticeRail.vue   read from registry; callout Generate link
src/router/index.ts    practice route -> PracticeView; legacy /exercises/:c/:t redirects to /read/:c
e2e/playwright.config.ts, e2e/reader.spec.ts, e2e/practice.spec.ts, e2e/screenshots.spec.ts, e2e/helpers.ts
screenshots/reader|practice|home/*.png
package.json scripts: e2e, e2e:ui, shots
```

Deleted in this plan: `src/views/ExerciseView.vue`, `src/views/PracticePlaceholderView.vue`, `src/utils/**`, `src/data/**`, `src/practice/registry.ts` (replaced by `src/exercises/registry.ts`), the `app/legacy-until-plan-2` lint ignore.

---

### Task 1: Engine types, RNG and prompt formatting

**Files:** create `src/exercises/types.ts`, `src/exercises/rng.ts`, `src/exercises/format.ts`; tests `src/exercises/__tests__/rng.test.ts`, `format.test.ts`.

**Interfaces (produces):**
```ts
// types.ts (spec 7.1 verbatim, plus set definitions)
export type Op = '+' | '-' | '×' | '÷'
export type Difficulty = 'easy' | 'medium' | 'hard'
export interface Frac { num: number; den: number }
export type Prompt =
  | { kind: 'binary'; a: number; b: number; op: Op }
  | { kind: 'columns'; numbers: number[] }
  | { kind: 'power'; base: number; exp: 2 | 3 }
  | { kind: 'root'; radicand: number; degree: 2 | 3 }
  | { kind: 'fraction-binary'; a: Frac; b: Frac; op: Op }
  | { kind: 'fraction-task'; value: Frac; task: 'simplify' | 'to-decimal' }
  | { kind: 'percent'; percent: number; of: number }
  | { kind: 'divisible'; n: number; by: number }
  | { kind: 'date'; iso: string }
  | { kind: 'text'; text: string; emphasis?: string }
export type AnswerSpec =
  | { kind: 'integer'; value: number }
  | { kind: 'decimal'; value: number; tolerance: number }
  | { kind: 'fraction'; value: Frac; acceptDecimal: boolean }
  | { kind: 'quotient-remainder'; q: number; r: number; divisor: number }
  | { kind: 'choice'; options: string[]; correct: string }
  | { kind: 'text'; accept: string[]; normalize: 'lower' | 'digits' | 'none' }
  | { kind: 'phonetic'; digits: string }
  | { kind: 'estimate'; value: number; relTolerance: number }
export interface Exercise {
  id: string; setId: string; source: 'book' | 'generated'; difficulty?: Difficulty
  prompt: Prompt; answer: AnswerSpec; solution?: { steps: string[] }
}
export interface Rng { seed: number; int(min: number, max: number): number; pick<T>(xs: readonly T[]): T; chance(p: number): boolean; shuffle<T>(xs: readonly T[]): T[] }
export interface GeneratedSetDef {
  id: string; chapterId: string; sectionId: string; title: string; description: string
  coversBookSets?: string[]              // book set ids this drill is the generated twin of
  generate(difficulty: Difficulty, rng: Rng): Omit<Exercise, 'id' | 'setId' | 'source'>
}
export interface BookSetRef { id: string; chapterId: string; sectionId: string; title: string }
// rng.ts
export function createRng(seed?: number): Rng      // mulberry32; seed defaults to Date.now() & 0xffffffff
// format.ts
export function promptText(p: Prompt): string      // '47 + 32', '318 ÷ 9', '14²', '√17', '3/5 × 2/7', 'Simplify 14/24', '15% of 88', 'Is 3932 divisible by 4?', 'January 19, 2007', text
export function fracText(f: Frac): string
```

Steps: write `rng.test.ts` (same seed → same sequence; `int` inclusive bounds over 1000 draws; `pick` never out of range; `shuffle` is a permutation) and `format.test.ts` (one case per prompt kind, table-driven), run RED, implement, run GREEN, commit `feat(engine): types, seeded rng and prompt formatting`.

---

### Task 2: Checker

**Files:** create `src/exercises/checker.ts`; test `src/exercises/__tests__/checker.test.ts`.

**Interfaces (produces):**
```ts
export interface CheckResult { correct: boolean; shown: string }   // shown = canonical answer for feedback
export function check(spec: AnswerSpec, input: string): CheckResult
export function formatAnswer(spec: AnswerSpec): string
export function normalizeNumber(s: string): number | null     // strips spaces, commas, leading +, trailing '.', unicode minus
export function parseFraction(s: string): Frac | null           // '3/4', '3 / 4', '1 1/2' (mixed) -> improper
export function parseQuotientRemainder(s: string): { q: number; r: number } | null  // '45 r 8', '45 R8', '45 remainder 8', '45 rem 8', '45 8/9' with divisor check done by caller
```
Rules per kind: integer → exact after normalise; decimal → |x − value| ≤ tolerance; fraction → equal after reducing both, or decimal within 0.005 when `acceptDecimal`; quotient-remainder → q and r match, also accept `q r/divisor` and the exact decimal q + r/divisor within 0.005; choice → case-insensitive match of an option or its first letter when options are yes/no; text → normalise per `normalize` then membership in `accept`; phonetic → consonant skeleton of the word maps to `digits` using the chapter 7 code (port `isValidPhoneticWord` logic from the legacy generator: s/z/soft c→0, t/d→1, n→2, m→3, r→4, l→5, j/sh/ch/soft g→6, k/hard c/hard g/q→7, f/v/ph→8, p/b→9, ignore vowels/w/h/y and doubled letters); estimate → |x − value| / |value| ≤ relTolerance.

Table-driven tests including Review Focus 1 cases. Commit `feat(engine): answer checker with input normalisation`.

---

### Task 3: Session state machine

**Files:** create `src/exercises/session.ts`; test `src/exercises/__tests__/session.test.ts`.

```ts
export interface SessionOptions { timed?: boolean; now?: () => number }
export interface SessionState {
  index: number; total: number; current: Exercise | null; phase: 'answering' | 'feedback' | 'done'
  lastResult?: CheckResult & { input: string }; correct: number; startedAt: number; finishedAt?: number
  history: Array<{ exercise: Exercise; input: string; correct: boolean; ms: number }>
}
export interface Session { state: () => SessionState; submit(input: string): CheckResult; next(): void; elapsedMs(): number }
export function createSession(exercises: Exercise[], opts?: SessionOptions): Session
```
Rules: `submit` ignored unless phase is answering; empty/whitespace input returns `{correct:false, shown}` but does not advance phase (caller shows "enter an answer"); `next` from feedback moves to the next exercise or `done`; `elapsedMs` freezes at `finishedAt`. Tests cover the full walk, double-submit, empty input, timer freeze. Commit `feat(engine): practice session state machine`.

---

### Task 4: Shared step builders and generators for chapters 0 to 3

**Files:** create `src/exercises/generators/shared.ts`, `chapter0.ts`, `chapter1.ts`, `chapter2.ts`, `chapter3.ts`; tests `src/exercises/__tests__/generators/chapter0-3.test.ts` plus `generators.shared.test.ts`.

`shared.ts` (produces):
```ts
export function digits(n: number): number[]
export function stepsLeftToRightAdd(a: number, b: number): string[]      // '538 + 300 = 838', '838 + 20 = 858', '858 + 7 = 865'
export function stepsLeftToRightSub(a: number, b: number): string[]      // complements when the ones digit borrows: '94 − 39 = 94 − 40 + 1', ...
export function stepsMultiplyByDigit(a: number, d: number): string[]     // '40 × 7 = 280', '2 × 7 = 14', '280 + 14 = 294'
export function stepsSquareNear(n: number): string[]                     // (n±d)(n∓d)+d² per chapter 2/3
export function stepsFactoring(a: number, b: number, f1: number, f2: number): string[]
export function stepsAdditionMethod(a: number, b: number): string[]      // a × b = a × (tens of b) + a × (ones of b)
export function stepsSubtractionMethod(a: number, b: number): string[]   // a × b = a × (b+k) − a × k with k ≤ 3
export function nearestFactorPair(n: number): [number, number] | null     // both ≤ 12
export function makeExercise(setId: string, i: number, e: Omit<Exercise,'id'|'setId'|'source'>): Exercise
export function generateMany(def: GeneratedSetDef, count: number, difficulty: Difficulty | 'mixed', rng: Rng): Exercise[]
```

Sets (id · sectionId · prompt/answer · precondition · steps):
- Chapter 0 (sections: instant-multiplication, squaring-and-more, more-practical-tips): `gen0-multiply-by-11` (binary a×11, a two-digit easy/medium, three-digit hard; steps: digit sums and carries), `gen0-square-ending-in-5` (power exp 2, base ends in 5; steps `n(n+1)`,`25`), `gen0-same-tens-sum-10` (binary, same tens digit, ones sum to 10), `gen0-sum-to-100-percent` in more-practical-tips is not a drill: skip.
- Chapter 1 (left-to-right-addition, left-to-right-subtraction): `gen1-two-digit-addition`, `gen1-three-digit-addition`, `gen1-two-digit-subtraction`, `gen1-three-digit-subtraction` (each `coversBookSets: ['ch1-…']`), integer answers, steps from shared builders. Hard adds a fourth digit as the book does.
- Chapter 2 (2-by-1-multiplication-problems, 3-by-1-multiplication-problems, be-there-or-b2-squaring-two-digit-numbers): `gen2-2-by-1`, `gen2-3-by-1`, `gen2-two-digit-squares` (steps via stepsSquareNear, always the nearest multiple of 10).
- Chapter 3 (2-by-2-multiplication-problems, approaching-multiplication-creatively, three-digit-squares, cubing): `gen3-multiplying-by-11` (two and three digit), `gen3-2-by-2-addition-method`, `gen3-2-by-2-subtraction-method` (b within 1..3 below a multiple of 10), `gen3-2-by-2-factoring-method` (one factor has a factor pair ≤ 12), `gen3-2-by-2-general`, `gen3-three-digit-squares` (steps: round to nearest hundred, (n+d)(n−d)+d², d² itself via two-digit square steps), `gen3-two-digit-cubes` (steps per book: n³ = (n−d)·n·(n+d) + d²·n).

Generator tests (one describe per set, seeded RNG, 200 draws): answer equals a reference computation, prompt values within the documented ranges per difficulty, precondition holds, `solution.steps` non-empty and last step ends with the answer digits. Commit `feat(engine): generators for chapters 0 to 3 with method steps`.

---

### Task 5: Generators for chapters 4 to 7

**Files:** create `src/exercises/generators/chapter4.ts` … `chapter7.ts`, `src/exercises/generators/index.ts`; tests `chapter4-7.test.ts`.

- Chapter 4 (sections: one-digit-division, the-rule-of-thumb, two-digit-division, matching-wits-with-a-calculator-learning-decimalization): `gen4-one-digit-division` (quotient-remainder; steps: chunking, e.g. '318 ÷ 9: 9 × 35 = 315, remainder 3'), `gen4-two-digit-division` (quotient-remainder; steps: simplify by common factor when possible then estimate), `gen4-decimalization` (fraction-task to-decimal; answer decimal tolerance 0.001 or the exact repeating form via `text` accept list for 1/3-type), `gen4-divisibility` (divisible; choice yes/no; steps: the rule for that divisor), `gen4-multiplying-fractions`, `gen4-dividing-fractions`, `gen4-simplifying-fractions`, `gen4-adding-fractions` (equal and unequal), `gen4-subtracting-fractions` (fraction answers, acceptDecimal false, steps show cross-multiplication or common denominator).
- Chapter 5 (addition-guesstimation … square-root-estimation, more-tips-on-tips, not-too-taxing-calculations, some-interest-ing-calculations): `gen5-addition-guesstimation` (estimate, relTolerance 0.02, steps: round to leading digits), `gen5-subtraction-guesstimation`, `gen5-division-guesstimation`, `gen5-multiplication-guesstimation` (relTolerance 0.05), `gen5-square-root-guesstimation` (root degree 2, estimate relTolerance 0.02, steps: divide-and-average), `gen5-tips` (percent 15/20 of a bill, decimal tolerance 0.01), `gen5-sales-tax` (percent 6.5–8.5), `gen5-interest` (text prompt "How many years to double at 6%?" using the rule of 70, integer).
- Chapter 6 (columns-of-numbers, mod-sums, subtracting-on-paper, pencil-and-paper-square-roots, pencil-and-paper-multiplication, casting-out-elevens): `gen6-columns-of-numbers` (columns prompt, 5 to 8 numbers, integer; steps: running total), `gen6-mod-sums` (text prompt "What is the mod sum (digit root) of 4,236?", integer 1–9), `gen6-subtracting-on-paper` (binary 5-digit subtraction, integer), `gen6-square-roots` (root, decimal tolerance 0.01 for non-perfect squares, integer for perfect), `gen6-criss-cross` (binary 2-by-2 and 3-by-3, integer, steps: criss-cross partial products), `gen6-casting-out-elevens` (text prompt asking for the mod-11 check digit, integer 0–10).
- Chapter 7 (the-phonetic-code, memory-magic): `gen7-number-to-word` (text prompt number; phonetic answer), `gen7-word-to-number` (text prompt word; text accept digits), `gen7-digit-sounds` (text prompt sound; choice of digits), `gen7-memory-chain` (text prompt sequence of 6 to 12 digits; phonetic answer allowing multiple words: treat spaces and punctuation as separators, concatenate skeletons).

`index.ts`: `export const generatedSets: GeneratedSetDef[] = [...ch0, ...ch7]` and `export function findGenerated(id): GeneratedSetDef | undefined`. Test also asserts all set ids unique and every `sectionId` exists in `chapterIndex`. Commit `feat(engine): generators for chapters 4 to 7`.

---

### Task 6: Extraction emits book-set anchors; registry

**Files:** modify `src/content/types.ts` (ChapterMeta.sets), `scripts/lib/write-index.ts`, `scripts/extract-book.ts`, `scripts/__tests__/extract-cli.test.ts`; regenerate `src/content/index.ts` with `npm run extract`; create `src/exercises/registry.ts`, `src/exercises/__tests__/registry.test.ts`; delete `src/practice/registry.ts` and update its importers (`ExerciseCallout.vue`, `PracticeRail.vue`, `ReaderView.vue`).

Registry (produces):
```ts
export type SetRef = { kind: 'book'; ref: BookSetRef } | { kind: 'generated'; def: GeneratedSetDef }
export function bookSetsFor(chapterId: string): BookSetRef[]          // from chapterIndex[].sets, title via setTitle
export function generatedSetsFor(chapterId: string): GeneratedSetDef[]
export function allSetsFor(chapterId: string): SetRef[]               // ordered by section order, book before generated within a section
export function findSet(chapterId: string, setId: string): SetRef | undefined
export function generatedTwin(bookSetId: string): GeneratedSetDef | undefined   // via coversBookSets
export function setTitle(setId: string): string                       // moved from practice/registry, 'any' removed from small words (review minor)
```
Tests: every book set id in `book-map.json` appears in `bookSetsFor`; every `coversBookSets` id exists; `setTitle('ch9-a-day-for-any-date') === 'A Day for Any Date'`. Commit `feat(engine): set registry backed by extraction anchors`.

---

### Task 7: Practice view, prompt and input components

**Files:** create `src/practice/usePracticeSession.ts`, `PracticeView.vue`, `PromptRenderer.vue`, `prompts/*.vue`, `AnswerInput.vue`, `SolutionSteps.vue`, `SessionResults.vue`, `SetLockedView.vue`; modify `src/router/index.ts` (practice → PracticeView; delete placeholder route; `/exercises/:chapterId/:exerciseType` → redirect `/read/:chapterId`); delete `src/views/PracticePlaceholderView.vue`, `src/views/ExerciseView.vue`, `src/utils/**`, `src/data/**`; remove the legacy lint ignore. Tests: `src/practice/__tests__/PromptRenderer.test.ts` (renders every prompt kind), `AnswerInput.test.ts` (every answer kind, Enter submits, choice buttons), `PracticeView.test.ts` (seeded generated session end to end in happy-dom: 10 answers, results, attempt recorded; locked state; unknown set).

Behaviour:
- Query: `mode=book|generated` (default: book if the set is a book set, generated otherwise), `difficulty=mixed|easy|medium|hard`, `seed=<int>`, `timed=1`.
- Book set with no problems yet (Plan 3 fills them): show "Book problems for this set arrive soon" and a button to the generated twin when one exists.
- Prompt layout follows the book: binary problems stacked vertically with the operator on the second line and a rule, digits in `--font-mono` tabular numerals, phone-friendly sizes.
- Input: numeric keypad hint (`inputmode="decimal"`) for numeric kinds; Enter submits; after feedback Enter advances; focus returns to the input on next.
- Feedback shows correct/incorrect, the canonical answer, and `SolutionSteps` when present.
- Results: score, time, seed, "Practice again" (new seed), "Back to chapter". `recordAttempt` is called once, with `mode` 'timed' when timed else the session mode.
- Locked (`!isUnlocked(chapterId, sectionId)` and `!unlockAll`): `SetLockedView` with a link to `/read/:chapter/:section`.

Commit `feat(practice): practice session view with prompts, inputs, steps and results`.

---

### Task 8: Reader integration

**Files:** modify `src/reader/ExerciseCallout.vue` (Generate button links to the twin's practice route when it exists; remove disabled state), `src/reader/PracticeRail.vue` (list `allSetsFor`, show best score and last attempt per set, kind badge), `src/reader/ReaderView.vue` (drop `registerDiscoveredSets`), `src/views/HomeView.vue` (recent sessions line under the hero: last three attempts across chapters). Update tests accordingly. Commit `feat(reader): callouts and rail read the set registry`.

---

### Task 9: Playwright scaffold, first e2e specs, screenshots

**Files:** create `e2e/playwright.config.ts`, `e2e/helpers.ts` (seed storage helpers: `withProgress(page, state)`, `unlockAll(page)`), `e2e/reader.spec.ts`, `e2e/practice.spec.ts`, `e2e/screenshots.spec.ts`; `screenshots/{reader,practice,home}/`; `package.json` scripts `"e2e": "npm run build && playwright test -c e2e/playwright.config.ts"`, `"e2e:ui": "playwright test -c e2e/playwright.config.ts --ui"`, `"shots": "npm run build && playwright test -c e2e/playwright.config.ts e2e/screenshots.spec.ts"`; `.gitignore` adds `e2e/.results/`, `test-results/`, `playwright-report/`.

Config: `webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI }`, projects `desktop` (viewport 1280×900) and `phone` (Playwright `devices['Pixel 5']`), `use: { baseURL, trace: 'retain-on-failure' }`, `outputDir: 'e2e/.results'`, `reporter: 'list'`.

Reader spec: chapter 1 renders title and outline; clicking an outline item updates the URL section param; after 2.5 s in a section the callout switches from locked to "Book set"; Focus hides the rail; theme toggle flips `data-theme`; phone: pill visible, Practice opens the sheet.

Practice spec: `?mode=generated&seed=42` on `gen1-two-digit-addition`; the test imports `createRng`/the generator through Playwright's Node side (`import { generatedSets } from '../src/exercises/generators'` via tsconfig paths in the e2e config `tsconfig`) to compute the same 10 answers; enters them; asserts results show 10/10 and the rail's best score updates after returning to the chapter; second run answers one wrong and asserts steps are visible.

Screenshots spec: home (fresh and with progress), chapter 1 desktop and phone, chapter 1 with sheet open (phone), focus mode, dark theme, practice prompt, wrong-answer feedback with steps, results. Names per addendum. Uses `page.clock.setFixedTime` and `animations: 'disabled'`.

Steps: write specs, run `npm run e2e` (RED for missing data-testids), add `data-testid` attributes where needed, GREEN, run `npm run shots`, **view every screenshot** and fix visual problems found, commit `test(e2e): playwright suite and committed screenshots`.

---

### Task 10: README, cleanup verification

Update README (practice usage, seed parameter, e2e and shots commands, screenshots folder purpose). Verify `git grep -n "legacy" src` shows nothing, `npm test` and `npm run e2e` green. Commit `docs: practice, e2e and screenshot workflow`.

---

## Self-review notes

- Spec 7.1/7.2/7.3/7.4 → Tasks 1–5; 8.1 practice route → Task 7; 8.2 practice components → Task 7; 8.3 attempts → Task 7; 9 removals → Task 7; 10 generator/checker/session/component tests → Tasks 2–7; addendum e2e and screenshots → Task 9.
- Chapter 8 and 9 generators and book problem data are Plan 3 by spec section 13.
- Review Focus 1 → Task 2; 2 → Tasks 4–5; 3 → Tasks 3, 7, 9; 4, 5 → Task 7.
