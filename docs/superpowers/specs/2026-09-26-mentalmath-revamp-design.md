# Mental Math Trainer revamp: EPUB reader, exercise engine, UI

Date: 2026-09-26
Status: approved design, awaiting implementation plan
Branch: `dev-newchapters`

## 1. Goal

Turn the Mental Math Trainer from a screenshot viewer with half-finished
exercises into a complete interactive edition of *Secrets of Mental Math*
(Benjamin and Shermer, 2006):

1. Read every chapter as real, responsive text extracted from the EPUB.
2. Practice every technique the book teaches, both with the book's own
   problem sets (with the authors' worked answers) and with endless
   generated problems.
3. A new UI that combines a textbook look, a practice rail with progress,
   and a distraction-free phone layout.

Success: on a phone or desktop a reader can open any chapter as text, see
the book's exercise sets exactly where the book places them, practice them
or generated equivalents, get the book's own steps when wrong, and see
progress persist between visits.

## 2. Current state (what we are replacing)

- Vue 3 + Vite, JavaScript, no tests.
- Reading: 279 PNG page screenshots (83 MB) bundled through
  `import.meta.glob`, one page shown at a time.
- Exercises: generators for chapters 0 to 7 return a question string;
  `ExerciseView.vue` re-parses that string with substring checks to pick a
  display and a checker. Chapter 7 is special-cased throughout.
- Chapter metadata for 8, 9, 10 describes chapters that do not exist in the
  book. The real chapter 8 is Advanced Multiplication, chapter 9 is
  Mathematical Magic, and "chapter 10" is Shermer's Epilogue (Chapter ∞).
- `mammoth` and `mathjax-vue3` are installed and unused.
- README promises progress tracking and timed tests; neither exists.

## 3. Source material facts (verified)

- EPUB is a calibre conversion: 89 HTML files, about 50k words, 522 JPEG
  figures totalling 4.8 MB. Fonts are obfuscated and irrelevant.
- Table of contents (toc.ncx) maps cleanly: front matter (two forewords,
  prologue, introduction), chapters 0 to 9, Epilogue, Answers,
  Bibliography, About the Author.
- Worked-problem layouts (vertical addition, carries, etc.) are tiny JPEGs,
  typically 30 by 70 pixels. They look soft when enlarged.
- The exercise problem lists inside chapters are images, not text.
- The Answers section is text for chapter 1. For chapters 2 to 6 and 8 the
  worked answers are images. Chapters 0 and 7 have no answer sets. The
  only chapter 9 set, "A Day for Any Date", is filed under the chapter 8
  heading in the Answers section; it belongs to chapter 9.
- Headings use `h1.subchapter`, `h2.section`, `h3.section1`. Paragraphs
  use `p.indent` / `p.nonindent`. Figures sit in `div.dis_img`. Sidebars
  (for example the Gauss story) use `div.textbox`.

## 4. Decisions already made

| Topic | Decision |
|---|---|
| Content delivery | Build-time extraction to committed JSON; EPUB never shipped or parsed at runtime |
| Language | TypeScript, strict mode, converted as code is rewritten |
| Framework | Vue 3.5 + vue-router 4 stay |
| State | VueUse `useStorage` over localStorage, no Pinia, no backend |
| Styling | Plain CSS with custom-property tokens, two palettes, no Tailwind |
| Fonts | Fontsource self-hosted: humanist sans for headings, book serif for body, JetBrains Mono for digits |
| Math rendering | CSS layouts, no MathJax or KaTeX |
| Tests | Vitest + Vue Test Utils |
| Extraction tooling | Node script using `fflate` (unzip) and `cheerio` (HTML), run with `tsx` |
| Gamification | Streak and section-based unlocks are in |
| PWA | Later, optional, via `vite-plugin-pwa` |
| EPUB file | Stays out of git; only extracted content is committed |

## 5. Architecture overview

```
scripts/extract-book.ts  ──reads──▶  book.epub (local only)
        │
        ├─▶ src/content/chapters/*.json      (sections, blocks, figure refs)
        ├─▶ public/book/figures/**/*.jpeg    (copied images)
        └─▶ scripts/book-map.json            (curated: exercise placement, figure ids)

src/content/book-exercises/*.json   (curated: problems + authors' steps)
src/exercises/generators/*.ts       (generated problems + method steps)
src/exercises/engine/               (types, checker, session)

src/app/                             (shell, theme, focus, progress store)
src/reader/                          (outline, content renderer, callouts, rail)
src/practice/                        (session view, prompt renderers, results)
```

Three layers, each testable alone:

1. **Content**: static JSON produced offline, plus curated datasets.
2. **Exercise engine**: pure TypeScript, no Vue. Types, generators,
   checker, session logic.
3. **UI**: Vue components that render content and engine output.

## 6. Content pipeline

### 6.1 Extraction script

`scripts/extract-book.ts`, run with `npm run extract -- <path-to-epub>`.

Steps:

1. Unzip in memory, read `content.opf` and `toc.ncx`.
2. Group spine files into units using the TOC: `intro` (forewords,
   prologue, introduction), `0` to `9`, `epilogue`. Answers,
   Bibliography and About the Author are read but not emitted as
   chapters. Answers feed the book-exercise seed (6.3).
3. For each unit, split into sections at `h2.section` boundaries, keeping
   `h3.section1` as sub-headings inside a section.
4. Convert each section body into an ordered list of **blocks**:
   - `{ type: 'html', html }` for runs of prose. Calibre classes are mapped
     to semantic markup: `p.indent`/`p.nonindent` to `<p>`, `.extract` to
     `<blockquote>`, `.center` to `<p class="center">`, `div.textbox` to
     `<aside>`, `em`/`strong` kept, tables kept, `<a id="pageN">` anchors
     converted to `data-page` attributes on the enclosing block for later
     cross-reference and then dropped from inline flow.
   - `{ type: 'figure', id, src, width, height }` for each `div.dis_img`.
     Figure ids are stable: `ch<unit>-f<NNN>` in document order.
   - `{ type: 'exercise', setId }` where a figure is identified as an
     exercise set. Identification comes from `scripts/book-map.json`
     (figure id to set id). The script proposes candidates by heuristic
     (a figure directly after a paragraph mentioning "exercises" and
     "answers") and prints them; a human confirms in the map file.
5. Sanitize output: only an allow-list of tags and attributes survives.
6. Write `src/content/chapters/<unit>.json` and copy referenced images to
   `public/book/figures/<unit>/`.

The script is idempotent. Re-running against the same EPUB yields a
byte-identical output, which a test asserts on a fixture subset.

### 6.2 Chapter JSON shape

```ts
interface ChapterDoc {
  id: string            // 'intro' | '0'..'9' | 'epilogue'
  number: number | null // 0..9, null for intro and epilogue
  title: string         // "Quick Tricks: Easy (and Impressive) Calculations"
  kicker: string        // "Chapter 0" | "Chapter ∞" | "Before you begin"
  sections: SectionDoc[]
}
interface SectionDoc {
  id: string            // slug, unique within chapter
  title: string
  blocks: Block[]
}
type Block =
  | { type: 'html'; html: string; page?: number }
  | { type: 'figure'; id: string; src: string; width: number; height: number }
  | { type: 'exercise'; setId: string }
```

Chapter metadata that the app needs at startup (titles, numbers, section
lists) is generated into `src/content/index.ts` so the home page does not
load every chapter body. Chapter bodies are lazy-loaded per route.

### 6.3 Book exercise dataset

Location: `src/content/book-exercises/<unit>.json`. Curated by hand,
seeded by the script where the Answers text allows (chapter 1). For the
image-only answers, problems and steps are transcribed from the figures
in batches. Every transcribed problem whose answer is computable (all
arithmetic sets) is verified programmatically in a test: the stated answer
must equal the computed answer. Estimation sets are verified within their
stated tolerance.

```ts
interface BookSet {
  id: string          // 'ch1-two-digit-addition'
  chapterId: string
  title: string       // "Two-Digit Addition"
  problems: Exercise[] // source: 'book', with solution steps
}
```

Sets per chapter, from the Answers headings: ch1 (4 sets), ch2 (2), ch3
(3), ch4 (9), ch5 (6), ch6 (4), ch8 (2), ch9 (1, day for any date).
Chapters 0 and 7 have no book sets, only generated practice.

### 6.4 Figures

Phase one: figures render as `<img>` from `public/book/figures`, with
`width`/`height` attributes to avoid layout shift and a max width tied to
the text column. Rendering is done by `FigureBlock.vue`.

Phase two: a registry `src/content/figures/overrides.ts` maps figure ids to
a typed layout spec rendered by `FigureLayout.vue`, for example:

```ts
{ kind: 'vertical', rows: [['8','13','5']], carries: [{ col: 1, value: 1 }], result: '935' }
{ kind: 'steps', lines: ['47 + 32', '47 + 30 = 77', '77 + 2 = 79'] }
```

Overrides are added incrementally, chapters 0 to 3 first. A figure with an
override never loads its JPEG.

## 7. Exercise engine

Pure TypeScript under `src/exercises/`. No Vue imports.

### 7.1 Types

```ts
type Op = '+' | '-' | '×' | '÷'
interface Frac { num: number; den: number }

type Prompt =
  | { kind: 'binary'; a: number; b: number; op: Op }
  | { kind: 'columns'; numbers: number[] }                 // column addition
  | { kind: 'power'; base: number; exp: 2 | 3 | 4 }
  | { kind: 'root'; radicand: number; degree: 2 | 3 }
  | { kind: 'fraction-binary'; a: Frac; b: Frac; op: Op }
  | { kind: 'fraction-task'; value: Frac; task: 'simplify' | 'to-decimal' }
  | { kind: 'percent'; percent: number; of: number }
  | { kind: 'divisible'; n: number; by: number }
  | { kind: 'date'; iso: string }                          // day of the week
  | { kind: 'text'; text: string; emphasis?: string }      // phonetic code, word problems

type AnswerSpec =
  | { kind: 'integer'; value: number }
  | { kind: 'decimal'; value: number; tolerance: number }
  | { kind: 'fraction'; value: Frac; acceptDecimal: boolean }
  | { kind: 'quotient-remainder'; q: number; r: number }
  | { kind: 'choice'; options: string[]; correct: string } // yes/no, weekdays
  | { kind: 'text'; accept: string[]; normalize: 'lower' | 'digits' | 'none' }
  | { kind: 'phonetic'; digits: string }                   // chapter 7 code words
  | { kind: 'estimate'; value: number; relTolerance: number }

interface Exercise {
  id: string
  setId: string
  source: 'book' | 'generated'
  difficulty?: 'easy' | 'medium' | 'hard'
  prompt: Prompt
  answer: AnswerSpec
  solution?: { steps: string[] }   // book's steps or generator's method steps
}
```

### 7.2 Checker

`check(answer: AnswerSpec, input: string): { correct: boolean; shown: string }`.
One function per `AnswerSpec` kind, exhaustively switched so a new kind
fails to compile until handled. `shown` is the canonical answer string for
feedback. Input normalisation (whitespace, commas, "r" vs "remainder",
"3/4" vs "0.75" when allowed) lives here and nowhere else.

### 7.3 Generators

One module per chapter under `src/exercises/generators/`, each exporting
`sets: GeneratedSetDef[]` where a set has an id, title, description and a
`generate(difficulty, rng)` function returning an `Exercise`. Generators
take an injectable random source so tests are deterministic.

Every generator returns `solution.steps` following the book's method for
that technique (left-to-right addition, complements for subtraction,
factoring or addition method for multiplication, and so on). Steps are
short strings such as `"538 + 300 = 838"`.

Existing chapter 0 to 7 generators are ported to this shape. New sets:

- Chapter 8: four-digit squares, 3-by-2 multiplication (factoring,
  addition, subtraction variants), five-digit squares, 3-by-3
  multiplication, 5-by-5 multiplication.
- Chapter 9: psychic math (predict the result), magic 1089, missing-digit
  trick, leapfrog addition (Fibonacci sum), quick cube roots, simplified
  square roots, day for any date.
- Chapter 7 gains the fourth type (digit to sound) already coded but not
  registered.

A registry `src/exercises/registry.ts` lists, per chapter, book sets and
generated sets in the order they appear in the text, with the section id
each one anchors to. The reader uses it to place callouts and to decide
unlocks.

### 7.4 Session

`createSession(exercises, options)` returns a small state machine: current
index, answer submission, feedback, results, elapsed time. A book session
is the set's problems in order. A generated session is 10 problems, mixed
difficulty by default with a selectable fixed difficulty, and an optional
timed mode. Session logic is pure so it is unit tested without the DOM.

## 8. Application

### 8.1 Routes

| Path | View |
|---|---|
| `/` | Home: cover, table of contents with per-chapter progress, resume link |
| `/read/:chapter/:section?` | Reader |
| `/practice/:chapter/:set` | Practice session (query `mode=timed`, `difficulty=`) |
| `/about` | About, attribution, disclaimer |

Old routes `/chapters/:id` and `/exercises/:id/:type` redirect to the new
ones.

### 8.2 Layout and components

Desktop (≥ 1024 px): three columns, outline 220 px, text column up to
720 px, practice rail 280 px. Tablet (≥ 720 px): outline collapses into a
popover, rail stays. Phone: single column, outline behind a menu, rail
becomes a bottom sheet, a floating pill offers previous/next section and
"Practice · n".

Focus mode hides outline and rail at every width and widens the text
column. Theme follows the system with a manual override. Font scale has
three steps. All three persist.

Components:

- `AppShell`: header (wordmark, chapter switcher, focus, theme, progress
  ring, streak), router outlet, footer.
- `ReaderView`: loads the chapter doc, tracks the visible section with an
  intersection observer, records reading progress.
- `ChapterOutline`, `SectionPill`, `BottomSheet`.
- `ContentBlocks`: renders `Block[]`. `html` blocks via `v-html` on
  sanitized content, `figure` via `FigureBlock`, `exercise` via
  `ExerciseCallout`.
- `PracticeRail`: book sets and generated sets for the chapter with best
  score, last attempt, lock state, recent sessions across chapters.
- `PracticeView`: runs a session. `PromptRenderer` switches on
  `Prompt.kind` with one small component per kind. `AnswerInput` adapts
  to `AnswerSpec.kind` (text field, yes/no buttons, weekday picker).
  `SolutionSteps` shows steps after an answer. `SessionResults` shows the
  score, time and a retry button.

### 8.3 Progress store

`src/app/progress.ts` wraps `useStorage('mentalmath.v1', defaults)`.

```ts
interface ProgressState {
  reading: Record<string, { lastSection: string; visited: string[]; updatedAt: string }>
  practice: Record<string, { attempts: Attempt[]; best: number }>
  streak: { current: number; lastActiveDay: string }   // YYYY-MM-DD local
  settings: { theme: 'system' | 'light' | 'dark'; focus: boolean; fontScale: 0 | 1 | 2; unlockAll: boolean }
}
interface Attempt { at: string; correct: number; total: number; seconds: number; mode: 'book' | 'generated' | 'timed' }
```

Rules:

- A section counts as visited once it has been on screen for 2 seconds.
- A practice set unlocks when its anchoring section is visited, or when
  `unlockAll` is on. Book sets and generated sets share the anchor.
- The streak increments the first time on a local calendar day that the
  reader either finishes a session or visits a new section. It resets when
  a day is skipped.
- Old sessionStorage keys from the current app are ignored.

### 8.4 Visual design tokens

Light palette: paper `#f6f1e7`, surface `#fbf8f1`, ink `#2b2622`, muted
`#6b6259`, rule `#e3d9c6`, accent `#8b2e2e`, warm `#b8894a`.
Dark palette: paper `#0f1720`, surface `#0b1118`, ink `#e6edf3`, muted
`#9fb0c0`, rule `#1f2a36`, accent `#f5a524`, warm `#f5a524`.

Type: headings in a humanist sans (Alegreya Sans via Fontsource), body in
a book serif (Source Serif 4), digits and figures in JetBrains Mono with
tabular numerals. Body 18 px on desktop, 17 px on phone, line height 1.6,
measure about 68 characters.

## 9. Removal and migration

- Delete `src/data/chapter*/` screenshots, `chapterLoader.js`,
  `chapter_raw.js`, `TheWelcome.vue`, `WelcomeItem.vue`, the icon
  components, and the old `ExerciseView.vue` string parser.
- Remove `mammoth`, `mathjax-vue3`. Remove the MathJax cleanup code in
  `App.vue` and the `setTimeout` navigation guard in the router.
- Add `.superpowers/`, `.playwright-mcp/` and `*.epub` to `.gitignore`.
- Rewrite README: what it is, how to run, how to re-extract content, how
  to add a generator, attribution.

## 10. Testing

- **Extraction**: fixture of three EPUB files (front matter, a chapter with
  figures and an exercise set, the chapter 1 answers) checked into
  `scripts/__fixtures__`. Tests assert block structure, sanitization,
  stable figure ids and idempotence.
- **Book exercises**: every problem with a computable answer is recomputed
  and compared. Every set id in the dataset exists in the registry and
  vice versa.
- **Generators**: with a seeded RNG, each set produces valid exercises for
  each difficulty, answers match a reference computation, steps are
  non-empty and end at the answer.
- **Checker**: table-driven tests per `AnswerSpec` kind including
  normalisation edge cases.
- **Session**: state transitions, scoring, timer.
- **Components**: `PromptRenderer` renders every `Prompt.kind`,
  `AnswerInput` renders every `AnswerSpec.kind`, `ContentBlocks` mounts a
  callout for an exercise block. Smoke tests only, no snapshot churn.
- Lint and `vue-tsc --noEmit` run in `npm test`.

## 11. Non-goals

- Accounts, cloud sync, leaderboards.
- Full-text search (candidate for later).
- Exercises for the Epilogue or front matter.
- Re-typesetting every figure. The override registry makes it incremental.
- Editing the book text beyond structural cleanup and obvious OCR fixes.

## 12. Risks and mitigations

- **Transcription errors** in image-only book answers. Mitigated by the
  computed-answer test and by keeping the source figure id on each
  transcribed problem for spot checks.
- **Figure legibility** until overrides exist. Mitigated by sizing rules
  and by prioritising chapters 0 to 3.
- **Scope of generators** for chapters 8 and 9. Some tricks (magic
  squares, psychic math) are performances rather than drills; they get a
  guided "try it" prompt rather than scored problems, marked
  `answer.kind = 'text'` with a single accepted result.
- **Copyright**: the extracted text has the same status as the screenshots
  already in the repository. Keeping the repository private is the owner's
  call and is unchanged by this design.

## 13. Delivery phases (for the implementation plan)

1. Foundation: TypeScript, Vitest, VueUse, tokens, fonts, app shell,
   progress store, routes with redirects.
2. Content: extraction script, chapter JSON, reader with outline, blocks,
   figures as images, phone layout, focus mode.
3. Engine: types, checker, session, port chapters 0 to 7 generators with
   steps, registry, practice view, rail, callouts, unlocks, streak.
4. Book exercises: seed chapter 1 from text, transcribe the rest in
   batches, verification tests.
5. Chapters 8 and 9 generators, metadata rewrite.
6. Figure overrides for chapters 0 to 3, cleanup, README, PWA if desired.
