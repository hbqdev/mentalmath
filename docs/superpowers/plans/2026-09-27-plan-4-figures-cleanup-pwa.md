# Plan 4: Figure Overrides, Cleanup and Offline Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the soft EPUB JPEGs of worked examples in chapters 0 to 3 with crisp HTML layouts, make the app installable and readable offline, clear the deferred minors that affect readers, and leave the repository documented and green across unit and end-to-end suites.

**Architecture:** `src/content/figures/overrides.ts` maps figure ids to a typed `FigureSpec` (vertical arithmetic, arrow/diagram squares, equation lines, tables). `FigureLayout.vue` renders a spec; `FigureBlock.vue` prefers an override and falls back to the image. Specs are transcribed by viewing each figure (the same images are in `public/book/figures/<unit>/`). `vite-plugin-pwa` adds a service worker that precaches the app shell, chapter JSON and figures.

**Spec:** design spec sections 6.4 (phase two), 9, 11; addendum sections 2 and 3.

## Global Constraints

- Plan 1–3 constraints apply. Node 20.19: `vite-plugin-pwa` must accept Vite 7 on this Node; if it does not, skip PWA with a ledger ruling (the spec calls it optional).
- Overrides must reproduce the figure's numbers exactly; a test recomputes every arithmetic line in a spec (`a op b = c`) and fails on a mismatch.
- No layout in the reader may shift when an override replaces an image: `FigureLayout` is inline-sized like the prose.
- Commit per task; regenerate screenshots after UI tasks and view them.

## Review Focus

1. **Transcription mistakes in overrides**: wrong digit in a worked example teaches the wrong thing. Test in Task 1 (line recomputation) and a per-chapter count in Tasks 2–4.
2. **Figures that carry an exercise list**: `exerciseAfter` figures (ch3-f041) keep both the worked example override and the callout. Test in Task 3.
3. **Offline first load**: after one visit, `/read/1` works with the network disabled, including its figures. Test in Task 6 (e2e with `context.setOffline`).
4. **Dark theme legibility of overrides** (rules, carries, arrows use `currentColor`/tokens). Screenshot in Task 2.
5. **Font-scale changes** must scale overrides with the prose (em units only). Screenshot in Task 2 at scale 2.

---

## File structure

```
src/content/figures/types.ts        FigureSpec union
src/content/figures/overrides.ts    Record<figureId, FigureSpec> (chapters 0–3)
src/content/figures/__tests__/overrides.test.ts
src/reader/FigureLayout.vue         renders a FigureSpec
src/reader/FigureBlock.vue          override-first
e2e/offline.spec.ts, screenshots/figures/*.png
vite.config.ts (+ VitePWA), public/icons/*, index.html (theme-color, manifest)
```

```ts
export type FigureSpec =
  | { kind: 'vertical'; rows: string[]; op?: string; result: string; carries?: Array<{ col: number; value: string }>; note?: string }
  | { kind: 'lines'; lines: string[]; align?: 'left' | 'center' }          // equation lines, one per row, monospaced
  | { kind: 'split'; expr: string; up: string; down: string; upLabel: string; downLabel: string; result: string }  // the (n+d)(n−d)+d² diagram
  | { kind: 'partials'; top: string; factor: string; parts: Array<[string, string]>; result: string }   // 42 (40+2) × 7 style
  | { kind: 'table'; head: string[]; rows: string[][] }
```

### Task 1: Figure spec types, renderer, override-first block, recomputation test
Create the types, `FigureLayout.vue` (vertical: right-aligned mono rows with an underline; lines; split with two branches and arrows drawn in CSS; partials; table), switch `FigureBlock.vue` to render an override when `overrides[block.id]` exists, keep `data-figure`. Test: renderer mounts each kind; `overrides.test.ts` recomputes every `a op b = c` inside `lines`/`partials`/`vertical` (parsing `+ − × ÷ =`, commas allowed) and asserts equality; block test asserts override wins over `<img>`. Seed with the three chapter 0 figures on the first page (ch0-f001..f003) transcribed from the images. Commit.

### Task 2: Chapter 0 and 1 overrides
View `public/book/figures/0/*.jpeg` (13) and `/1/*.jpeg` (47, minus the mapped exercise figures) and transcribe each into a spec. Screenshot `screenshots/figures/chapter-1-worked-examples-{desktop,phone}.png` (a section with several overrides), plus a dark and a large-font variant. View and fix. Count test: every chapter 0/1 figure id has an override. Commit.

### Task 3: Chapter 2 overrides
34 figures, including the multiplication table (`table` kind) and the squares diagrams (`split`). Commit.

### Task 4: Chapter 3 overrides
34 figures, including the mixed worked-example-plus-exercise figure ch3-f041 (override keeps the worked example; the callout follows). Commit.

### Task 5: Reader and practice polish from the deferred minors
- Empty submit shows "Type an answer first" inline.
- Percent prompt shows `$` consistently for money amounts.
- Choice buttons mark the chosen option after answering.
- Bottom sheet: Escape closes, focus moves into the sheet on open and back to the pill on close, `inert` when closed.
- Header progress ring (spec 8.2): a small conic ring next to the streak showing the current chapter's completion.
- Theme applied before first paint: inline script in `index.html` reads `mentalmath.v1` and sets `data-theme`.
- App test files typechecked (`tsconfig.vitest.json` or include them in the app project with test types).
Tests for each; screenshots regenerated. Commit.

### Task 6: PWA and offline
`vite-plugin-pwa` with `registerType: 'autoUpdate'`, precache `**/*.{js,css,html,woff,woff2,json}` and `book/figures/**/*.jpeg` (about 4 MB), manifest with name, theme colour, icons (generate 192/512 PNGs from `public/favicon.svg` using a small script with `sharp` if available, otherwise commit hand-made PNGs). e2e: visit `/` and `/read/1` online, `context.setOffline(true)`, reload `/read/1`, expect text and a figure image to be present. Commit.

### Task 7: Final verification and docs
`npm test`, `npm run e2e`, `npm run shots`; README updated (figures, PWA, deferred list); spec addendum status updated to done. Commit.

## Self-review notes
Spec 6.4 phase two → Tasks 1–4; 9 → done in earlier plans, README in Task 7; addendum 2 → Task 2 screenshots; addendum 3 completion criteria → Task 7; PWA (spec 4, "later, optional") → Task 6.
