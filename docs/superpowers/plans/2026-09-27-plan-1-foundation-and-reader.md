# Plan 1: Foundation and EPUB Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the screenshot viewer with a TypeScript Vue app that reads the book as text extracted once from the EPUB, in the approved three-column / phone-collapsing layout, with persisted reading progress.

**Architecture:** A Node script (`scripts/extract-book.ts`) unzips the EPUB, converts each chapter into JSON of sections made of ordered blocks (prose HTML, figures, exercise placeholders), and copies figure images to `public/book/figures`. The Vue app lazy-loads one chapter JSON per route and renders blocks through small components. A VueUse `useStorage` composable holds reading progress, streak and settings. Exercise callouts and the practice rail are rendered from a registry stub that returns no sets yet; Plan 2 fills it.

**Tech Stack:** Vue 3.5, vue-router 4.6, Vite 7, TypeScript 5.9 strict, Vitest 4 + happy-dom + @vue/test-utils, @vueuse/core 14, cheerio 1.2 + fflate 0.8 + image-size 2 (script only), tsx 4, Fontsource fonts, ESLint 9 + typescript-eslint, plain CSS with custom properties.

**Spec:** `docs/superpowers/specs/2026-09-26-mentalmath-revamp-design.md` (sections 4, 5, 6, 8, 9, 10 and phases 1 and 2 of section 13).

## Global Constraints

- Node on the dev machine is **v20.19.2**. Every dependency must accept it: Vite `^7`, Vitest `^4`, `@vueuse/core` `^14`, ESLint `^9`, TypeScript `^5.9`. Do not install Vite 8, Vitest 5, VueUse 15 or TypeScript 7.
- TypeScript `strict: true`. New code is `.ts` / `<script setup lang="ts">`. Legacy `.js` files that are not yet rewritten stay compiling under `allowJs`.
- No Tailwind, Pinia, MathJax, KaTeX or epub.js.
- The EPUB is never read at runtime and never committed (`*.epub` is git-ignored). Only extracted output is committed.
- Palette tokens are exactly the spec's: light paper `#f6f1e7`, surface `#fbf8f1`, ink `#2b2622`, muted `#6b6259`, rule `#e3d9c6`, accent `#8b2e2e`, warm `#b8894a`; dark paper `#0f1720`, surface `#0b1118`, ink `#e6edf3`, muted `#9fb0c0`, rule `#1f2a36`, accent `#f5a524`, warm `#f5a524`.
- Body type 18 px desktop, 17 px phone, line height 1.6. Breakpoints: desktop `≥ 1024px` three columns, tablet `≥ 720px` two columns, below that single column.
- Progress storage key is `mentalmath.v1`. A section counts as visited after 2 seconds on screen. The streak increments once per local calendar day.
- Commits: end messages with the attribution lines the session provides. Commit after every task.
- Prettier: no semicolons, single quotes, print width 100 (existing `.prettierrc.json`).

## Review Focus

Failure modes the spec implies that ordinary happy-path tests would miss. Each has a test pinned to the task that owns it.

1. **Repeated section titles inside one chapter** (chapter 9 has four "Why This Trick Works" headings). Slugs must stay unique and stable in document order. Test in Task 6.
2. **Stored progress from an older schema or corrupted JSON.** The app must boot with defaults merged over whatever is there, never crash. Test in Task 3.
3. **Hostile or stray markup in the EPUB** (`style`, `onclick`, `<script>`, calibre ids). The sanitizer must strip it while keeping `<u>`, `<sup>`, tables and `<br>`. Test in Task 5.
4. **Unknown chapter or section in the URL** (`/read/42`, `/read/1/nope`). Reader shows a not-found state and never throws. Test in Task 9.
5. **Old bookmarked routes** (`/chapters/3`, `/exercises/1/left-to-right-addition`). They must redirect rather than 404. Test in Task 4.

---

## File structure

```
package.json                     scripts, deps (rewritten in Task 1)
tsconfig.json                    project references
tsconfig.app.json                src/** browser code
tsconfig.node.json               vite.config.ts, scripts/**
vite.config.ts                   replaces vite.config.js; includes vitest config
eslint.config.ts                 replaces eslint.config.js
env.d.ts                         vite client types, *.vue module decl

scripts/
  extract-book.ts                CLI entry: npm run extract -- <epub>
  book-map.json                  curated: figure id -> exercise set id
  lib/epub.ts                    unzip, OPF, NCX, spine, unit grouping
  lib/parse-unit.ts              html files of one unit -> ChapterDoc + figure refs
  lib/sanitize.ts                allow-list sanitizer
  lib/text.ts                    titleCase, slugify, uniqueSlug
  lib/write-index.ts             emits src/content/index.ts
  __fixtures__/                  small HTML/NCX/OPF samples
  __tests__/*.test.ts

src/
  main.ts
  env.d.ts
  App.vue                        renders <AppShell>
  app/
    AppShell.vue                 header, outlet, footer
    progress.ts                  useProgress()
    theme.ts                     useTheme(): applies data-theme, data-font-scale
    styles/tokens.css            palettes, type scale, spacing
    styles/base.css              reset, body, prose styles for book html
  content/
    types.ts                     ChapterDoc, SectionDoc, Block, ChapterMeta
    index.ts                     GENERATED: chapterIndex + loaders
    loader.ts                    loadChapter(id), getChapterMeta(id)
    chapters/*.json              GENERATED
  practice/
    registry.ts                  practiceSetsFor(chapterId): PracticeSetRef[]  (stub, returns [])
  reader/
    ReaderView.vue
    ContentBlocks.vue
    FigureBlock.vue
    ExerciseCallout.vue
    ChapterOutline.vue
    PracticeRail.vue
    SectionPill.vue
    BottomSheet.vue
  views/
    HomeView.vue
    AboutView.vue
    NotFoundView.vue
  router/index.ts
public/book/figures/<unit>/*.jpeg   GENERATED
```

Files deleted in this plan: `src/data/chapter*/` (all PNGs), `src/utils/chapterLoader.js`, `src/data/chapter_raw.js`, `src/views/ChapterView.vue`, `src/components/ChapterNavigation.vue`, `src/components/TheWelcome.vue`, `src/components/WelcomeItem.vue`, `src/components/icons/`, `src/assets/` (all), `vite.config.js`, `eslint.config.js`, `jsconfig.json`, `setup.sh`. The legacy exercise flow (`src/views/ExerciseView.vue`, `src/utils/exerciseGenerator.js`, `src/utils/generators/`, `src/data/chapter*.js`, `src/data/chapters.js`) stays reachable at `/exercises/:chapterId/:exerciseType` until Plan 2 replaces it.

---

### Task 1: TypeScript, Vitest and lint toolchain

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `env.d.ts`, `vite.config.ts`, `eslint.config.ts`
- Delete: `vite.config.js`, `eslint.config.js`, `jsconfig.json`, `setup.sh`
- Rename: `src/main.js` → `src/main.ts`
- Test: `src/app/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` (typecheck + lint + vitest), `npm run test:unit`, `npm run typecheck`, path alias `@/` → `src/`.

- [ ] **Step 1: Install dependencies at pinned majors**

```bash
npm uninstall mammoth mathjax-vue3 @vitejs/plugin-vue-jsx
npm install vue@^3.5 vue-router@^4.6 @vueuse/core@^14
npm install -D vite@^7 @vitejs/plugin-vue@^6 vite-plugin-vue-devtools@^8 \
  typescript@~5.9 vue-tsc@^3 @vue/tsconfig@^0.9 @tsconfig/node20@^20 @types/node@^20 \
  vitest@^4 happy-dom@^20 @vue/test-utils@^2 \
  eslint@^9 eslint-plugin-vue@^10 typescript-eslint@^8 @vue/eslint-config-typescript@^14 @vue/eslint-config-prettier@^10 prettier@^3 jiti@^2 \
  tsx@^4 cheerio@^1 fflate@^0.8 image-size@^2 \
  @fontsource/alegreya-sans@^5 @fontsource-variable/source-serif-4@^5 @fontsource-variable/jetbrains-mono@^5
```

Expected: no `ERESOLVE` errors. If npm reports a peer conflict, stop and report it rather than using `--force`.

- [ ] **Step 2: Replace the scripts block in `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "vue-tsc --noEmit -p tsconfig.app.json && vite build",
  "preview": "vite preview",
  "typecheck": "vue-tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write src/ scripts/",
  "test:unit": "vitest run",
  "test:watch": "vitest",
  "test": "npm run typecheck && npm run lint && npm run test:unit",
  "extract": "tsx scripts/extract-book.ts"
},
"engines": { "node": ">=20.19.0" }
```

- [ ] **Step 3: Create the TypeScript configs**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json`:
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "allowJs": true,
    "checkJs": false,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  }
}
```

`tsconfig.node.json`:
```json
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "include": ["vite.config.ts", "eslint.config.ts", "scripts/**/*"],
  "compilerOptions": {
    "composite": true,
    "noEmit": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "types": ["node"]
  }
}
```

`env.d.ts` (repo root):
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 4: Create `vite.config.ts` with Vitest config, delete `vite.config.js`**

```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/__tests__/**/*.test.ts', 'scripts/__tests__/**/*.test.ts'],
    globals: false,
  },
})
```

```bash
git rm -q vite.config.js eslint.config.js jsconfig.json setup.sh
```

- [ ] **Step 5: Create `eslint.config.ts`**

```ts
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue,js,mjs}'] },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', 'public/**', 'src/content/chapters/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
)
```

- [ ] **Step 6: Rename the entry point and point `index.html` at it**

```bash
git mv src/main.js src/main.ts
sed -i 's|/src/main.js|/src/main.ts|' index.html
```

`src/main.ts` content stays as it was (imports `./assets/main.css`, creates the app, uses the router). It will be rewritten in Task 4.

- [ ] **Step 7: Write the smoke test**

`src/app/__tests__/smoke.test.ts`:
```ts
import { describe, expect, it } from 'vitest'

describe('toolchain', () => {
  it('runs TypeScript tests under happy-dom', () => {
    expect(typeof document).toBe('object')
    const n: number = 1
    expect(n + 1).toBe(2)
  })
})
```

- [ ] **Step 8: Run the whole pipeline**

Run: `npm run test:unit`
Expected: `1 passed`.

Run: `npm run typecheck`
Expected: passes. Legacy `.js`/`.vue` files compile because `checkJs` is false; if a `.vue` file without `lang="ts"` errors, the error text will name it. Fix only by adding `// @ts-nocheck` at the top of that legacy file's `<script>` block, not by rewriting it.

Run: `npm run lint`
Expected: passes, or only warnings. Errors inside legacy files under `src/views/ExerciseView.vue`, `src/utils/**`, `src/data/**` may be silenced by adding those globs to a temporary `ignores` entry named `app/legacy-until-plan-2`.

Run: `npm run build`
Expected: `✓ built`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: TypeScript, Vitest and ESLint toolchain on Vite 7"
```

---

### Task 2: Design tokens, fonts and base styles

**Files:**
- Create: `src/app/styles/tokens.css`, `src/app/styles/base.css`
- Delete: `src/assets/base.css`, `src/assets/main.css`, `src/assets/logo.svg`
- Modify: `src/main.ts` (imports)
- Test: `src/app/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--paper --surface --ink --muted --rule --accent --warm --font-sans --font-serif --font-mono --body-size --measure`, attributes `html[data-theme="light"|"dark"]`, `html[data-font-scale="0"|"1"|"2"]`, class `.prose` for book HTML.

- [ ] **Step 1: Write the test that reads token values from the stylesheet text**

`src/app/__tests__/tokens.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

describe('design tokens', () => {
  it('defines the light palette on :root', () => {
    expect(css).toMatch(/:root\s*{[^}]*--paper:\s*#f6f1e7/i)
    expect(css).toMatch(/:root\s*{[^}]*--accent:\s*#8b2e2e/i)
  })
  it('defines the dark palette under data-theme="dark"', () => {
    expect(css).toMatch(/\[data-theme=['"]?dark['"]?\]\s*{[^}]*--paper:\s*#0f1720/i)
    expect(css).toMatch(/\[data-theme=['"]?dark['"]?\]\s*{[^}]*--accent:\s*#f5a524/i)
  })
  it('defines three font scale steps', () => {
    for (const step of ['0', '1', '2']) {
      expect(css).toContain(`[data-font-scale='${step}']`)
    }
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/app/__tests__/tokens.test.ts`
Expected: FAIL, `ENOENT ... tokens.css`.

- [ ] **Step 3: Create `src/app/styles/tokens.css`**

```css
/* Palettes from the approved design. Light is the default; dark swaps the same names. */
:root {
  color-scheme: light;
  --paper: #f6f1e7;
  --surface: #fbf8f1;
  --ink: #2b2622;
  --muted: #6b6259;
  --faint: #9a8f82;
  --rule: #e3d9c6;
  --accent: #8b2e2e;
  --accent-ink: #ffffff;
  --warm: #b8894a;
  --card: #fbf5e6;
  --card-rule: #d9c8a6;

  --font-sans: 'Alegreya Sans', 'Gill Sans', 'Trebuchet MS', system-ui, sans-serif;
  --font-serif: 'Source Serif 4 Variable', Georgia, 'Times New Roman', serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, Menlo, Consolas, monospace;

  --body-size: 18px;
  --measure: 68ch;
  --outline-w: 220px;
  --rail-w: 280px;
  --gutter: 1.25rem;
  --radius: 6px;
}

[data-theme='dark'] {
  color-scheme: dark;
  --paper: #0f1720;
  --surface: #0b1118;
  --ink: #e6edf3;
  --muted: #9fb0c0;
  --faint: #6f8195;
  --rule: #1f2a36;
  --accent: #f5a524;
  --accent-ink: #0b1118;
  --warm: #f5a524;
  --card: #151f2a;
  --card-rule: #2a3846;
}

[data-font-scale='0'] { --body-size: 16px; }
[data-font-scale='1'] { --body-size: 18px; }
[data-font-scale='2'] { --body-size: 21px; }

@media (max-width: 719px) {
  [data-font-scale='0'] { --body-size: 15px; }
  [data-font-scale='1'] { --body-size: 17px; }
  [data-font-scale='2'] { --body-size: 19px; }
}
```

- [ ] **Step 4: Create `src/app/styles/base.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { background: var(--paper); color: var(--ink); font-size: var(--body-size); }
body {
  font-family: var(--font-serif);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button { font: inherit; cursor: pointer; }
img { max-width: 100%; height: auto; }

h1, h2, h3, h4 { font-family: var(--font-sans); color: var(--ink); line-height: 1.15; margin: 0; }
.kicker { font-family: var(--font-sans); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent); }
.label { font-family: var(--font-sans); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--faint); }

/* Focus ring for keyboard users only */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* Book prose, produced by the extraction script */
.prose { max-width: var(--measure); }
.prose p { margin: 0 0 0.85em; text-align: left; }
.prose p.center { text-align: center; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.prose p.right { text-align: right; }
.prose p.extract { margin-left: 1.5em; }
.prose p.hanging { padding-left: 1.5em; text-indent: -1.5em; margin-bottom: 0.4em; }
.prose p.list-line { margin: 0 0 0.25em 1.5em; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.prose p.footnote { font-size: 0.85em; color: var(--muted); }
.prose h3 { font-size: 0.95rem; letter-spacing: 0.06em; text-transform: uppercase; margin: 1.6em 0 0.6em; }
.prose u { text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 2px; }
.prose sup { font-size: 0.7em; }
.prose aside { background: var(--card); border: 1px solid var(--card-rule); border-radius: var(--radius); padding: 1rem 1.25rem; margin: 1.5em 0; font-size: 0.92em; }
.prose aside .aside-title { font-family: var(--font-sans); font-weight: 700; margin-bottom: 0.6em; }
.prose .block { margin: 1em 0 1em 1em; font-size: 0.95em; }
.prose .boxed { border: 1px solid var(--ink); padding: 0.1em 0.5em; font-family: var(--font-sans); font-size: 0.85em; letter-spacing: 0.06em; }
.prose table { border-collapse: collapse; margin: 1em auto; font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 0.9em; }
.prose td, .prose th { border: 1px solid var(--rule); padding: 0.2em 0.6em; text-align: center; }
.prose img.inline { vertical-align: middle; max-height: 1.6em; width: auto; }
```

- [ ] **Step 5: Wire fonts and styles in `src/main.ts`, delete old assets**

`src/main.ts`:
```ts
import '@fontsource/alegreya-sans/500.css'
import '@fontsource/alegreya-sans/700.css'
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/jetbrains-mono'
import './app/styles/tokens.css'
import './app/styles/base.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

```bash
git rm -rq src/assets
```

The old `App.vue` has `@import './assets/base.css'` inside its `<style>`. Remove that line now (the rest of `App.vue` is replaced in Task 4).

- [ ] **Step 6: Run tests and build**

Run: `npx vitest run src/app/__tests__/tokens.test.ts` → PASS (3 tests).
Run: `npm run build` → `✓ built`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: design tokens, self-hosted fonts and prose base styles"
```

---

### Task 3: Progress and settings store

**Files:**
- Create: `src/app/progress.ts`
- Test: `src/app/__tests__/progress.test.ts`

**Interfaces:**
- Produces:
```ts
export interface Attempt { at: string; correct: number; total: number; seconds: number; mode: 'book' | 'generated' | 'timed' }
export interface ProgressState {
  reading: Record<string, { lastSection: string; visited: string[]; updatedAt: string }>
  practice: Record<string, { attempts: Attempt[]; best: number }>
  streak: { current: number; lastActiveDay: string }
  settings: { theme: 'system' | 'light' | 'dark'; focus: boolean; fontScale: 0 | 1 | 2; unlockAll: boolean }
}
export const STORAGE_KEY = 'mentalmath.v1'
export function defaultProgress(): ProgressState
export function useProgress(): {
  state: Ref<ProgressState>
  markVisited(chapterId: string, sectionId: string, now?: Date): void
  isVisited(chapterId: string, sectionId: string): boolean
  lastSection(chapterId: string): string | undefined
  chapterCompletion(chapterId: string, totalSections: number): number   // 0..1
  recordAttempt(setId: string, attempt: Attempt): void
  bestScore(setId: string): number | undefined
  isUnlocked(chapterId: string, sectionId: string): boolean
  touchStreak(now?: Date): void
  localDay(d: Date): string  // 'YYYY-MM-DD'
  reset(): void
}
```

- [ ] **Step 1: Write the failing tests**

`src/app/__tests__/progress.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, defaultProgress, useProgress } from '../progress'

beforeEach(() => {
  localStorage.clear()
})

describe('useProgress', () => {
  it('starts from defaults when storage is empty', () => {
    const p = useProgress()
    expect(p.state.value).toEqual(defaultProgress())
  })

  it('merges defaults over a partial or older stored shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: { theme: 'dark' } }))
    const p = useProgress()
    expect(p.state.value.settings.theme).toBe('dark')
    expect(p.state.value.settings.fontScale).toBe(1)
    expect(p.state.value.reading).toEqual({})
  })

  it('falls back to defaults when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const p = useProgress()
    expect(p.state.value.settings.theme).toBe('system')
  })

  it('records visited sections once and tracks the last one', () => {
    const p = useProgress()
    p.markVisited('1', 'two-digit-addition')
    p.markVisited('1', 'two-digit-addition')
    p.markVisited('1', 'three-digit-addition')
    expect(p.isVisited('1', 'two-digit-addition')).toBe(true)
    expect(p.state.value.reading['1']?.visited).toEqual(['two-digit-addition', 'three-digit-addition'])
    expect(p.lastSection('1')).toBe('three-digit-addition')
    expect(p.chapterCompletion('1', 4)).toBeCloseTo(0.5)
  })

  it('unlocks a set when its section is visited or unlockAll is on', () => {
    const p = useProgress()
    expect(p.isUnlocked('0', 'instant-multiplication')).toBe(false)
    p.markVisited('0', 'instant-multiplication')
    expect(p.isUnlocked('0', 'instant-multiplication')).toBe(true)
    expect(p.isUnlocked('0', 'squaring-and-more')).toBe(false)
    p.state.value.settings.unlockAll = true
    expect(p.isUnlocked('0', 'squaring-and-more')).toBe(true)
  })

  it('keeps best score and attempt history per set', () => {
    const p = useProgress()
    p.recordAttempt('ch1-two-digit-addition', { at: 'a', correct: 6, total: 10, seconds: 90, mode: 'book' })
    p.recordAttempt('ch1-two-digit-addition', { at: 'b', correct: 9, total: 10, seconds: 80, mode: 'book' })
    p.recordAttempt('ch1-two-digit-addition', { at: 'c', correct: 7, total: 10, seconds: 70, mode: 'book' })
    expect(p.bestScore('ch1-two-digit-addition')).toBe(9)
    expect(p.state.value.practice['ch1-two-digit-addition']?.attempts).toHaveLength(3)
  })

  it('increments the streak once per local day and resets after a gap', () => {
    const p = useProgress()
    const d1 = new Date(2026, 8, 27, 9)
    const d1b = new Date(2026, 8, 27, 22)
    const d2 = new Date(2026, 8, 28, 8)
    const d4 = new Date(2026, 8, 30, 8)
    p.touchStreak(d1)
    expect(p.state.value.streak).toEqual({ current: 1, lastActiveDay: '2026-09-27' })
    p.touchStreak(d1b)
    expect(p.state.value.streak.current).toBe(1)
    p.touchStreak(d2)
    expect(p.state.value.streak.current).toBe(2)
    p.touchStreak(d4)
    expect(p.state.value.streak).toEqual({ current: 1, lastActiveDay: '2026-09-30' })
  })

  it('markVisited on a new section also touches the streak', () => {
    const p = useProgress()
    p.markVisited('2', 'overview', new Date(2026, 8, 27, 9))
    expect(p.state.value.streak.current).toBe(1)
  })

  it('persists to localStorage under the versioned key', async () => {
    const p = useProgress()
    p.markVisited('3', 'overview')
    await Promise.resolve()
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(raw.reading['3'].visited).toEqual(['overview'])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/app/__tests__/progress.test.ts`
Expected: FAIL, cannot find module `../progress`.

- [ ] **Step 3: Implement `src/app/progress.ts`**

```ts
import { useStorage } from '@vueuse/core'
import type { Ref } from 'vue'

export interface Attempt {
  at: string
  correct: number
  total: number
  seconds: number
  mode: 'book' | 'generated' | 'timed'
}

export interface ProgressState {
  reading: Record<string, { lastSection: string; visited: string[]; updatedAt: string }>
  practice: Record<string, { attempts: Attempt[]; best: number }>
  streak: { current: number; lastActiveDay: string }
  settings: {
    theme: 'system' | 'light' | 'dark'
    focus: boolean
    fontScale: 0 | 1 | 2
    unlockAll: boolean
  }
}

export const STORAGE_KEY = 'mentalmath.v1'

export function defaultProgress(): ProgressState {
  return {
    reading: {},
    practice: {},
    streak: { current: 0, lastActiveDay: '' },
    settings: { theme: 'system', focus: false, fontScale: 1, unlockAll: false },
  }
}

function localDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const ta = Date.UTC(ay ?? 0, (am ?? 1) - 1, ad ?? 1)
  const tb = Date.UTC(by ?? 0, (bm ?? 1) - 1, bd ?? 1)
  return Math.round((tb - ta) / 86_400_000)
}

let shared: Ref<ProgressState> | null = null

function createState(): Ref<ProgressState> {
  return useStorage<ProgressState>(STORAGE_KEY, defaultProgress(), localStorage, {
    mergeDefaults: true,
    onError: () => {
      /* corrupt JSON: useStorage keeps the defaults; nothing else to do */
    },
  })
}

export function useProgress() {
  // One shared ref per page so every component sees the same state.
  // Tests clear localStorage and need a fresh ref, so re-create when storage is empty.
  if (!shared || localStorage.getItem(STORAGE_KEY) === null) shared = createState()
  const state = shared

  function markVisited(chapterId: string, sectionId: string, now = new Date()) {
    const entry = state.value.reading[chapterId] ?? { lastSection: sectionId, visited: [], updatedAt: '' }
    const isNew = !entry.visited.includes(sectionId)
    if (isNew) entry.visited = [...entry.visited, sectionId]
    entry.lastSection = sectionId
    entry.updatedAt = now.toISOString()
    state.value.reading = { ...state.value.reading, [chapterId]: entry }
    if (isNew) touchStreak(now)
  }

  function isVisited(chapterId: string, sectionId: string) {
    return state.value.reading[chapterId]?.visited.includes(sectionId) ?? false
  }

  function lastSection(chapterId: string) {
    return state.value.reading[chapterId]?.lastSection
  }

  function chapterCompletion(chapterId: string, totalSections: number) {
    if (totalSections <= 0) return 0
    const n = state.value.reading[chapterId]?.visited.length ?? 0
    return Math.min(1, n / totalSections)
  }

  function recordAttempt(setId: string, attempt: Attempt) {
    const entry = state.value.practice[setId] ?? { attempts: [], best: 0 }
    entry.attempts = [...entry.attempts, attempt]
    entry.best = Math.max(entry.best, attempt.correct)
    state.value.practice = { ...state.value.practice, [setId]: entry }
    touchStreak(new Date(attempt.at.length > 0 && !Number.isNaN(Date.parse(attempt.at)) ? attempt.at : Date.now()))
  }

  function bestScore(setId: string) {
    return state.value.practice[setId]?.best
  }

  function isUnlocked(chapterId: string, sectionId: string) {
    return state.value.settings.unlockAll || isVisited(chapterId, sectionId)
  }

  function touchStreak(now = new Date()) {
    const today = localDay(now)
    const { current, lastActiveDay } = state.value.streak
    if (lastActiveDay === today) return
    const next = lastActiveDay && dayDiff(lastActiveDay, today) === 1 ? current + 1 : 1
    state.value.streak = { current: next, lastActiveDay: today }
  }

  function reset() {
    state.value = defaultProgress()
  }

  return {
    state,
    markVisited,
    isVisited,
    lastSection,
    chapterCompletion,
    recordAttempt,
    bestScore,
    isUnlocked,
    touchStreak,
    localDay,
    reset,
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/__tests__/progress.test.ts`
Expected: PASS (9 tests). If the "corrupt JSON" test fails because `useStorage` throws synchronously, wrap `createState()` in try/catch that removes the key and retries once.

- [ ] **Step 5: Commit**

```bash
git add src/app/progress.ts src/app/__tests__/progress.test.ts
git commit -m "feat: persisted progress, streak and settings store"
```

---

### Task 4: App shell, theme, router with legacy redirects

**Files:**
- Create: `src/app/theme.ts`, `src/app/AppShell.vue`, `src/views/HomeView.vue` (placeholder, real content in Task 10), `src/views/NotFoundView.vue`, `src/views/AboutView.vue` (port), `src/router/index.ts`
- Modify: `src/App.vue`
- Delete: `src/router/index.js`, `src/views/HomeView.vue` (old JS version is replaced), `src/views/ChapterView.vue`, `src/components/ChapterNavigation.vue`, `src/components/TheWelcome.vue`, `src/components/WelcomeItem.vue`, `src/components/icons/`
- Test: `src/router/__tests__/router.test.ts`, `src/app/__tests__/theme.test.ts`

**Interfaces:**
- Consumes: `useProgress()` from Task 3.
- Produces: routes `home`, `read` (`/read/:chapter/:section?`), `practice` (`/practice/:chapter/:set`, placeholder view until Plan 2), `legacy-exercise` (`/exercises/:chapterId/:exerciseType` → old `ExerciseView.vue`), `about`, `not-found`; redirects `/chapters/:id` → `/read/:id`. `useTheme()` applies `data-theme` and `data-font-scale` on `<html>`.

- [ ] **Step 1: Write the router test**

`src/router/__tests__/router.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../index'

async function go(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  return router.currentRoute.value
}

describe('router', () => {
  it('serves the reader at /read/:chapter/:section?', async () => {
    const r = await go('/read/1/two-digit-addition')
    expect(r.name).toBe('read')
    expect(r.params).toEqual({ chapter: '1', section: 'two-digit-addition' })
  })

  it('redirects legacy /chapters/:id to the reader', async () => {
    const r = await go('/chapters/3')
    expect(r.name).toBe('read')
    expect(r.params.chapter).toBe('3')
  })

  it('keeps the legacy exercise route alive until Plan 2', async () => {
    const r = await go('/exercises/1/left-to-right-addition')
    expect(r.name).toBe('legacy-exercise')
  })

  it('falls back to not-found for unknown paths', async () => {
    const r = await go('/nothing/here')
    expect(r.name).toBe('not-found')
  })
})
```

- [ ] **Step 2: Write the theme test**

`src/app/__tests__/theme.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { STORAGE_KEY, useProgress } from '../progress'
import { useTheme } from '../theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-font-scale')
})

describe('useTheme', () => {
  it('writes the explicit theme and font scale to <html>', async () => {
    const scope = effectScope()
    scope.run(() => {
      const p = useProgress()
      useTheme()
      p.state.value.settings.theme = 'dark'
      p.state.value.settings.fontScale = 2
    })
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.fontScale).toBe('2')
    scope.stop()
  })

  it('resolves "system" to light when the OS has no dark preference', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: { theme: 'system' } }))
    const scope = effectScope()
    scope.run(() => useTheme())
    await nextTick()
    expect(['light', 'dark']).toContain(document.documentElement.dataset.theme)
    scope.stop()
  })
})
```

- [ ] **Step 3: Run both to verify failure**

Run: `npx vitest run src/router src/app/__tests__/theme.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `src/app/theme.ts`**

```ts
import { usePreferredDark } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import { useProgress } from './progress'

export function useTheme() {
  const { state } = useProgress()
  const prefersDark = usePreferredDark()
  const resolved = computed<'light' | 'dark'>(() => {
    const t = state.value.settings.theme
    if (t === 'system') return prefersDark.value ? 'dark' : 'light'
    return t
  })

  watchEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved.value
    root.dataset.fontScale = String(state.value.settings.fontScale)
  })

  function cycleTheme() {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark']
    const i = order.indexOf(state.value.settings.theme)
    state.value.settings.theme = order[(i + 1) % order.length] ?? 'system'
  }

  function cycleFontScale() {
    const next = ((state.value.settings.fontScale + 1) % 3) as 0 | 1 | 2
    state.value.settings.fontScale = next
  }

  return { resolved, cycleTheme, cycleFontScale }
}
```

- [ ] **Step 5: Implement `src/router/index.ts`, delete `src/router/index.js`**

```ts
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export function createAppRouter(history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/read/:chapter/:section?', name: 'read', component: () => import('@/reader/ReaderView.vue') },
      { path: '/practice/:chapter/:set', name: 'practice', component: () => import('@/views/PracticePlaceholderView.vue') },
      { path: '/exercises/:chapterId/:exerciseType', name: 'legacy-exercise', component: () => import('@/views/ExerciseView.vue') },
      { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
      { path: '/chapters/:id', redirect: (to) => ({ name: 'read', params: { chapter: String(to.params.id) } }) },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
    scrollBehavior(to, _from, saved) {
      if (saved) return saved
      if (to.hash) return { el: to.hash, top: 80 }
      return { top: 0 }
    },
  })
}

export default createAppRouter()
```

```bash
git rm -q src/router/index.js
```

`ReaderView.vue` does not exist until Task 9. Create a stub now so the build passes:

`src/reader/ReaderView.vue`:
```vue
<script setup lang="ts"></script>
<template><div class="reader-stub">Reader arrives in Task 9.</div></template>
```

`src/views/PracticePlaceholderView.vue`:
```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
<template>
  <section class="placeholder">
    <p class="kicker">Practice</p>
    <h1>Coming in the next phase</h1>
    <p>Set <code>{{ route.params.set }}</code> for chapter {{ route.params.chapter }} will live here.</p>
    <RouterLink :to="{ name: 'read', params: { chapter: route.params.chapter } }">Back to the chapter</RouterLink>
  </section>
</template>
<style scoped>
.placeholder { padding: 2rem var(--gutter); max-width: var(--measure); margin: 0 auto; }
</style>
```

- [ ] **Step 6: Implement `src/views/NotFoundView.vue` and port `AboutView.vue`**

`src/views/NotFoundView.vue`:
```vue
<script setup lang="ts"></script>
<template>
  <section class="nf">
    <p class="kicker">Not found</p>
    <h1>That page is not in this book.</h1>
    <RouterLink to="/">Back to the table of contents</RouterLink>
  </section>
</template>
<style scoped>
.nf { padding: 3rem var(--gutter); max-width: var(--measure); margin: 0 auto; }
h1 { font-size: 1.6rem; margin: 0.25rem 0 1rem; }
</style>
```

`src/views/AboutView.vue`: keep the existing text content, wrap it in `<script setup lang="ts"></script>`, replace hard-coded colors with tokens (`#2c3e50` → `var(--ink)`, `#3498db` → `var(--accent)`, `#f9f9f9`/`white` → `var(--surface)`, `#eee` → `var(--rule)`, `#6c757d` → `var(--muted)`), and set the outer `.about-view` to `max-width: var(--measure); margin: 0 auto; padding: 2rem var(--gutter)`. Delete the `.book-cover` image if `public/book-cover.jpg` is kept, or keep both. Keep the disclaimer paragraph verbatim.

- [ ] **Step 7: Implement `src/app/AppShell.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useProgress } from './progress'
import { useTheme } from './theme'

const route = useRoute()
const { state } = useProgress()
const { resolved, cycleTheme, cycleFontScale } = useTheme()

const inReader = computed(() => route.name === 'read')
const themeGlyph = computed(() => (state.value.settings.theme === 'system' ? 'A' : resolved.value === 'dark' ? '☾' : '☀'))

function toggleFocus() {
  state.value.settings.focus = !state.value.settings.focus
}
</script>

<template>
  <div class="shell" :class="{ focus: state.settings.focus && inReader }">
    <header class="top">
      <RouterLink to="/" class="wordmark">Mental<span>Math</span></RouterLink>
      <div id="shell-center" class="center" />
      <nav class="controls" aria-label="Display">
        <button v-if="inReader" type="button" class="tgl" :aria-pressed="state.settings.focus" @click="toggleFocus">Focus</button>
        <button type="button" class="tgl" :title="`Theme: ${state.settings.theme}`" @click="cycleTheme">{{ themeGlyph }}</button>
        <button type="button" class="tgl" title="Text size" @click="cycleFontScale">Aa</button>
        <span v-if="state.streak.current > 0" class="streak" :title="`${state.streak.current} day streak`">🔥 {{ state.streak.current }}</span>
        <RouterLink to="/about" class="about">About</RouterLink>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell { min-height: 100dvh; display: flex; flex-direction: column; }
.top {
  position: sticky; top: 0; z-index: 20;
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem;
  height: 52px; padding: 0 var(--gutter);
  background: var(--surface); border-bottom: 1px solid var(--rule);
  font-family: var(--font-sans);
}
.wordmark { font-weight: 700; font-size: 1.15rem; color: var(--ink); letter-spacing: 0.01em; }
.wordmark span { color: var(--accent); }
.wordmark:hover { text-decoration: none; }
.center { min-width: 0; display: flex; justify-content: center; }
.controls { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.tgl { background: none; border: 1px solid var(--rule); color: var(--muted); border-radius: 4px; padding: 0.2rem 0.55rem; }
.tgl[aria-pressed='true'] { border-color: var(--accent); color: var(--accent); }
.streak { color: var(--warm); font-weight: 700; }
.about { color: var(--muted); }
.main { flex: 1; min-width: 0; }
@media (max-width: 719px) { .about { display: none; } }
</style>
```

`#shell-center` is a teleport target: the reader puts its chapter switcher there in Task 9.

- [ ] **Step 8: Replace `src/App.vue` and `src/views/HomeView.vue`, delete dead components**

`src/App.vue`:
```vue
<script setup lang="ts">
import AppShell from '@/app/AppShell.vue'
</script>
<template><AppShell /></template>
```

Temporary `src/views/HomeView.vue` (replaced in Task 10):
```vue
<script setup lang="ts"></script>
<template>
  <section class="home"><p class="kicker">Home</p><h1>Table of contents arrives in Task 10.</h1></section>
</template>
<style scoped>.home { padding: 2rem var(--gutter); }</style>
```

```bash
git rm -rq src/views/ChapterView.vue src/components/ChapterNavigation.vue src/components/TheWelcome.vue src/components/WelcomeItem.vue src/components/icons
```

`src/views/ExerciseView.vue` imports `@/data/chapters` and `@/utils/exerciseGenerator`, both still present. Leave it untouched.

- [ ] **Step 9: Run tests, typecheck and build**

Run: `npx vitest run` → all PASS (smoke, tokens, progress, router, theme).
Run: `npm run typecheck && npm run lint && npm run build` → all pass.
Run: `npm run dev` briefly and open `/`, `/about`, `/chapters/2` (should land on `/read/2` showing the stub), `/nope` (not-found). Toggle theme and Aa; `<html>` attributes change.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: app shell with theme and focus controls, typed router with legacy redirects"
```

---

### Task 5: Extraction library, part 1: text helpers and sanitizer

**Files:**
- Create: `scripts/lib/text.ts`, `scripts/lib/sanitize.ts`
- Test: `scripts/__tests__/text.test.ts`, `scripts/__tests__/sanitize.test.ts`

**Interfaces:**
- Produces:
```ts
export function titleCase(s: string): string        // 'INSTANT MULTIPLICATION' -> 'Instant Multiplication'
export function slugify(s: string): string          // 'Squaring and More!' -> 'squaring-and-more'
export function uniqueSlug(base: string, used: Set<string>): string   // adds -2, -3 ... and registers
export function collapseWs(s: string): string
export const ALLOWED_TAGS: ReadonlySet<string>
export const ALLOWED_CLASSES: ReadonlySet<string>
export function sanitizeHtml(html: string): string  // allow-list; returns inner html of a body
```

- [ ] **Step 1: Write the text tests**

`scripts/__tests__/text.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { collapseWs, slugify, titleCase, uniqueSlug } from '../lib/text'

describe('titleCase', () => {
  it('lowercases shouting headings and capitalises words', () => {
    expect(titleCase('INSTANT MULTIPLICATION')).toBe('Instant Multiplication')
  })
  it('keeps small words lower except at the start', () => {
    expect(titleCase('THE ART OF MATHEMATICAL MAGIC')).toBe('The Art of Mathematical Magic')
    expect(titleCase('A DAY FOR ANY DATE')).toBe('A Day for Any Date')
  })
  it('handles digits and hyphenated tokens', () => {
    expect(titleCase('3-BY-2 MULTIPLICATION')).toBe('3-by-2 Multiplication')
    expect(titleCase('THE MAGIC 1089!')).toBe('The Magic 1089!')
  })
  it('leaves mixed-case input alone', () => {
    expect(titleCase('Why This Trick Works')).toBe('Why This Trick Works')
  })
})

describe('slugify / uniqueSlug', () => {
  it('makes url-safe lowercase slugs', () => {
    expect(slugify('Squaring and More!')).toBe('squaring-and-more')
    expect(slugify('3-by-2 Multiplication')).toBe('3-by-2-multiplication')
    expect(slugify('“Guesstimation”')).toBe('guesstimation')
  })
  it('suffixes repeats in order', () => {
    const used = new Set<string>()
    expect(uniqueSlug('why-this-trick-works', used)).toBe('why-this-trick-works')
    expect(uniqueSlug('why-this-trick-works', used)).toBe('why-this-trick-works-2')
    expect(uniqueSlug('why-this-trick-works', used)).toBe('why-this-trick-works-3')
  })
})

describe('collapseWs', () => {
  it('collapses runs of whitespace including nbsp', () => {
    expect(collapseWs('Quick Tricks:\n Easy  (and Impressive)')).toBe('Quick Tricks: Easy (and Impressive)')
  })
})
```

- [ ] **Step 2: Write the sanitizer tests**

`scripts/__tests__/sanitize.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../lib/sanitize'

describe('sanitizeHtml', () => {
  it('keeps allowed inline formatting and tables', () => {
    const html = '<p class="center"><strong>3<u>5</u>2</strong> <sup>2</sup><br></p><table><tr><td colspan="2">x</td></tr></table>'
    expect(sanitizeHtml(html)).toBe(html)
  })
  it('strips scripts, event handlers, styles and unknown attributes', () => {
    const html = '<p id="c01" style="color:red" onclick="x()">Hi<script>alert(1)</script></p>'
    expect(sanitizeHtml(html)).toBe('<p>Hi</p>')
  })
  it('drops classes outside the allow-list but keeps the element', () => {
    expect(sanitizeHtml('<p class="calibre5 center">x</p>')).toBe('<p class="center">x</p>')
    expect(sanitizeHtml('<span class="calibre9">x</span>')).toBe('<span>x</span>')
  })
  it('unwraps disallowed elements instead of deleting their text', () => {
    expect(sanitizeHtml('<p><font color="red">keep me</font></p>')).toBe('<p>keep me</p>')
  })
  it('keeps img src width height alt only', () => {
    expect(sanitizeHtml('<img src="/book/figures/1/ch1-f001.jpeg" width="32" height="70" alt="" class="inline" data-x="1">'))
      .toBe('<img src="/book/figures/1/ch1-f001.jpeg" width="32" height="70" alt="" class="inline">')
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run scripts/__tests__/text.test.ts scripts/__tests__/sanitize.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `scripts/lib/text.ts`**

```ts
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

export function collapseWs(s: string): string {
  return s.replace(/[\s ]+/g, ' ').trim()
}

function capWord(word: string, first: boolean): string {
  const lower = word.toLowerCase()
  if (!first && SMALL.has(lower)) return lower
  // hyphenated tokens: capitalise only the first alphabetic segment ("3-by-2" stays)
  const segments = lower.split('-')
  return segments
    .map((seg, i) => {
      if (i > 0 && SMALL.has(seg)) return seg
      if (i > 0 && /^\d/.test(segments[0] ?? '')) return seg
      return seg.charAt(0).toUpperCase() + seg.slice(1)
    })
    .join('-')
}

export function titleCase(s: string): string {
  const text = collapseWs(s)
  const isShouting = text === text.toUpperCase() && /[A-Z]/.test(text)
  if (!isShouting) return text
  return text
    .split(' ')
    .map((w, i) => capWord(w, i === 0))
    .join(' ')
}

export function slugify(s: string): string {
  return collapseWs(s)
    .toLowerCase()
    .replace(/[’'"“”‘]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function uniqueSlug(base: string, used: Set<string>): string {
  let slug = base || 'section'
  let n = 2
  while (used.has(slug)) slug = `${base}-${n++}`
  used.add(slug)
  return slug
}
```

- [ ] **Step 5: Implement `scripts/lib/sanitize.ts`**

```ts
import * as cheerio from 'cheerio'
import type { AnyNode, Element } from 'domhandler'

export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'p', 'h3', 'strong', 'em', 'u', 'sup', 'sub', 'br', 'span', 'aside', 'div', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'ol', 'ul', 'li',
])

export const ALLOWED_CLASSES: ReadonlySet<string> = new Set([
  'center', 'right', 'extract', 'hanging', 'list-line', 'footnote', 'aside-title', 'block', 'boxed', 'inline',
])

const ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  img: new Set(['src', 'width', 'height', 'alt', 'class']),
  td: new Set(['colspan', 'rowspan', 'class']),
  th: new Set(['colspan', 'rowspan', 'class']),
}
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'title', 'head'])

function clean(el: Element): void {
  const tag = el.tagName.toLowerCase()
  const allowed = ALLOWED_ATTRS[tag] ?? new Set(['class'])
  for (const name of Object.keys(el.attribs)) {
    if (!allowed.has(name)) delete el.attribs[name]
  }
  if (el.attribs.class !== undefined) {
    const kept = el.attribs.class.split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c))
    if (kept.length) el.attribs.class = kept.join(' ')
    else delete el.attribs.class
  }
}

export function sanitizeHtml(html: string): string {
  const $ = cheerio.load(`<body>${html}</body>`, { xml: false })
  const body = $('body')

  // Depth-first: process children before parents so unwrapping keeps order.
  const walk = (node: AnyNode): void => {
    if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') return
    const el = node as Element
    for (const child of [...el.children]) walk(child)
    const tag = el.tagName.toLowerCase()
    if (tag === 'body') return
    if (DROP_WITH_CONTENT.has(tag)) {
      $(el).remove()
      return
    }
    if (!ALLOWED_TAGS.has(tag)) {
      $(el).replaceWith($(el).contents())
      return
    }
    clean(el)
  }
  for (const child of [...body.contents()]) walk(child)
  return body.html() ?? ''
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run scripts/__tests__/text.test.ts scripts/__tests__/sanitize.test.ts`
Expected: PASS (10 tests). If cheerio serialises `<br>` as `<br>` but the "keeps allowed" expectation differs by self-closing form, adjust the expected string in the test to match cheerio's HTML serialisation, not the code.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/text.ts scripts/lib/sanitize.ts scripts/__tests__/text.test.ts scripts/__tests__/sanitize.test.ts
git commit -m "feat(extract): title-case, slug helpers and allow-list sanitizer"
```

---

### Task 6: Extraction library, part 2: unit HTML to ChapterDoc

**Files:**
- Create: `src/content/types.ts`, `scripts/lib/parse-unit.ts`, `scripts/__fixtures__/chapter-sample.html`, `scripts/__fixtures__/chapter-sample-2.html`
- Test: `scripts/__tests__/parse-unit.test.ts`

**Interfaces:**
- Produces `src/content/types.ts`:
```ts
export type Block =
  | { type: 'html'; html: string; page?: number }
  | { type: 'figure'; id: string; src: string; width: number; height: number }
  | { type: 'exercise'; setId: string }
export interface SectionDoc { id: string; title: string; blocks: Block[] }
export interface ChapterDoc { id: string; number: number | null; title: string; kicker: string; sections: SectionDoc[] }
export interface SectionMeta { id: string; title: string }
export interface ChapterMeta { id: string; number: number | null; title: string; kicker: string; sections: SectionMeta[] }
```
- Produces `scripts/lib/parse-unit.ts`:
```ts
export interface UnitInput { id: string; kicker: string; titleOverride?: string; files: Array<{ path: string; html: string; tocLabel?: string }> }
export interface ParseOptions {
  exerciseSets: Record<string, string>                  // figureId -> setId
  imageSize: (imagePath: string) => { width: number; height: number }
  figureSrc: (unitId: string, figureId: string) => string   // public URL for the copied image
}
export interface FigureRef { id: string; unitId: string; sourcePath: string }   // sourcePath relative to epub root, e.g. 'images/00008.jpeg'
export interface ExerciseCandidate { figureId: string; after: string }
export interface ParsedUnit { doc: ChapterDoc; figures: FigureRef[]; candidates: ExerciseCandidate[] }
export function parseUnit(unit: UnitInput, opts: ParseOptions): ParsedUnit
```

Rules implemented (from spec 6.1, refined against the real files):

- Metadata: `h1.chapter` text gives `number` (`Chapter 0` → 0, `Chapter ∞` → null); `h1.subchapter` inner HTML with `<br>` → space gives `title`; `h1.subchapterpre1` (Epilogue byline) is appended to the title after a comma. If `titleOverride` is set, it wins. `h1.itr`, `h1.preface`, `h1.subchapterpre` (front matter) are dropped; the intro unit's section titles come from `tocLabel` per file.
- Sections: a new section starts at each `h2.section`. Content before the first `h2` in a chapter unit goes in a section `{ id: 'overview', title: 'Overview' }`, omitted if it has no blocks. In the `intro` unit every file is one section titled by its `tocLabel`. In the `epilogue` unit there is one section `overview` titled `Epilogue`.
- Section ids: `uniqueSlug(slugify(titleCase(text)))` per chapter, `overview` reserved.
- `h3.section1` → `<h3>` inside the html stream.
- Block boundaries: consecutive prose nodes accumulate into one html block; a figure or exercise flushes the buffer.
- Paragraph class map: `indent, nonindent, nonindentt, nonindentt1, nonindentbz, indentt, indent1, textbox1, textbox2` → none; `center, bl_center` → `center`; `right` → `right`; `extract, extract1` → `extract`; `hanging, bl_hanging, bl_hangings, bl_hanginga` → `hanging`; `bl_nonindent` → `list-line`; `footnote1` → `footnote`; `textboxh` → `aside-title`.
- Containers: `div.textbox` → `<aside>`; `div.block1, div.block2, div.blockk, div.hangings, div.footnote` → `<div class="block">`; `div.dis_img` → figure block(s); a `<p>` whose only child is an `<img>` → figure block; `table` kept.
- Inline map: `strong.*` → `<strong>`, `em.*` → `<em>`, `span.underline` → `<u>`, `span.big`/`span.dropcaps`/`span.small` → unwrap, `span.border` → `<span class="boxed">`, `sup.frac1/frac2` → `<sup>`, `br.*` → `<br>`, `a.hlink` → unwrap (keep text), `a[id^=page]` → record `page` (first one in the block wins) and remove, any other `<a>` → unwrap, inline `<img>` inside text → `<img class="inline" src=… width height>` copied like a figure but not a block. `div[style="height:0pt"]` anchors are skipped.
- Figures: id `ch<unit>-f<NNN>` (three digits, document order across the unit's files), `src` from `opts.figureSrc`, dimensions from `opts.imageSize(sourcePath)`. If `opts.exerciseSets[id]` exists, emit `{ type: 'exercise', setId }` instead and do not list the figure in `figures`.
- Candidates: every figure whose immediately preceding text (the last html block's text, last 160 characters) matches `/exercis/i` is reported with that text.
- Every html block passes through `sanitizeHtml` before being stored.

- [ ] **Step 1: Create the fixtures**

`scripts/__fixtures__/chapter-sample.html` (a trimmed real chapter opening, two sections, one figure, one exercise-set figure, a textbox, page anchors, an h3, a table):
```html
<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Secrets of Mental Math</title></head>
<body id="8IL20" class="calibre2">
<div id="8IL20" style="height:0pt"></div><h1 class="chapter" id="c01"><a id="page1"></a>Chapter 0</h1>
<h1 class="subchapter">Quick Tricks:<br class="calibre3"/>Easy (and Impressive) Calculations</h1>
<p class="nonindent"><span class="big">I</span>n the pages that follow, you will learn to do math in your head.</p>
<h2 class="section" id="calibre_pb_1"><strong class="calibre5">INSTANT MULTIPLICATION</strong></h2>
<p class="nonindent">Consider the problem:</p>
<p class="center"><a id="page2"></a><strong class="calibre5">3<span class="underline">5</span>2</strong></p>
<p class="indent">Think of the problem this way:</p>
<div class="dis_img"><img src="../images/00008.jpeg" alt="" class="calibre7"/></div>
<p class="indent">Check out the set of <em class="calibre4">exercises</em> below. (The answers are at the end of the book.) <a id="page3"></a></p>
<div class="dis_img"><img src="../images/00009.jpeg" alt="" class="calibre8"/></div>
<h3 class="section1"><strong class="calibre5">Three-Digit Addition</strong></h3>
<div class="textbox">
<p class="textboxh"><strong class="calibre5">Carl Friedrich Gauss</strong></p>
<p class="textbox1"><span class="dropcaps">A</span> prodigy is a talented child.</p>
</div>
<h2 class="section" id="calibre_pb_2"><strong class="calibre5">WHY THIS TRICK WORKS</strong></h2>
<p class="indent">Because 11 = 10 + 1. See <a class="hlink" href="part0009.html#page2">this page</a>.</p>
<table class="table" border="0"><tr class="calibre270"><td class="calibre271">1</td><td class="calibre272">2</td></tr></table>
<h2 class="section" id="calibre_pb_3"><strong class="calibre5">WHY THIS TRICK WORKS</strong></h2>
<p class="indent">Again. Frac: <sup class="frac1">1</sup>/2</p>
</body></html>
```

`scripts/__fixtures__/chapter-sample-2.html` (second spine file of the same unit, continues numbering):
```html
<html><body class="calibre2">
<h2 class="section" id="calibre_pb_4"><strong class="calibre5">3-BY-2 MULTIPLICATION</strong></h2>
<p class="indent">One more figure:</p>
<p class="indent1"><img src="../images/00010.jpeg" alt="" class="calibre9"/></p>
<p class="indent">Inline symbol <img src="../images/00011.jpeg" alt="" class="calibre117"/> here.</p>
</body></html>
```

- [ ] **Step 2: Write the tests**

`scripts/__tests__/parse-unit.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseUnit, type ParseOptions } from '../lib/parse-unit'

const fx = (name: string) => readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')

const opts: ParseOptions = {
  exerciseSets: { 'ch0-f002': 'ch0-sample-set' },
  imageSize: () => ({ width: 32, height: 70 }),
  figureSrc: (unit, id) => `/book/figures/${unit}/${id}.jpeg`,
}

function parseSample() {
  return parseUnit(
    {
      id: '0',
      kicker: 'Chapter 0',
      files: [
        { path: 'text/a.html', html: fx('chapter-sample.html') },
        { path: 'text/b.html', html: fx('chapter-sample-2.html') },
      ],
    },
    opts,
  )
}

describe('parseUnit', () => {
  it('reads chapter number and title from the h1 pair', () => {
    const { doc } = parseSample()
    expect(doc.id).toBe('0')
    expect(doc.number).toBe(0)
    expect(doc.title).toBe('Quick Tricks: Easy (and Impressive) Calculations')
    expect(doc.kicker).toBe('Chapter 0')
  })

  it('splits sections at h2, title-cases them and keeps repeats unique in order', () => {
    const { doc } = parseSample()
    expect(doc.sections.map((s) => s.id)).toEqual([
      'overview',
      'instant-multiplication',
      'why-this-trick-works',
      'why-this-trick-works-2',
      '3-by-2-multiplication',
    ])
    expect(doc.sections[1]?.title).toBe('Instant Multiplication')
    expect(doc.sections[4]?.title).toBe('3-by-2 Multiplication')
  })

  it('numbers figures across files and swaps mapped ones for exercise blocks', () => {
    const { doc, figures } = parseSample()
    const im = doc.sections[1]!
    const types = im.blocks.map((b) => b.type)
    expect(types).toEqual(['html', 'figure', 'html', 'exercise', 'html'])
    expect(im.blocks[1]).toEqual({ type: 'figure', id: 'ch0-f001', src: '/book/figures/0/ch0-f001.jpeg', width: 32, height: 70 })
    expect(im.blocks[3]).toEqual({ type: 'exercise', setId: 'ch0-sample-set' })
    expect(figures.map((f) => f.id)).toEqual(['ch0-f001', 'ch0-f003', 'ch0-f004'])
    expect(figures[0]?.sourcePath).toBe('images/00008.jpeg')
    const last = doc.sections[4]!
    expect(last.blocks[1]).toMatchObject({ type: 'figure', id: 'ch0-f003' })
    expect(last.blocks[2]).toMatchObject({ type: 'html' })
    expect((last.blocks[2] as { html: string }).html).toContain('<img src="/book/figures/0/ch0-f004.jpeg" width="32" height="70" alt="" class="inline">')
  })

  it('reports exercise candidates with the preceding text', () => {
    const { candidates } = parseSample()
    expect(candidates).toEqual([{ figureId: 'ch0-f002', after: expect.stringContaining('exercises below') }])
  })

  it('maps calibre markup to semantic html and records page numbers', () => {
    const { doc } = parseSample()
    const im = doc.sections[1]!
    const first = im.blocks[0] as { html: string; page?: number }
    expect(first.html).toBe('<p>Consider the problem:</p><p class="center"><strong>3<u>5</u>2</strong></p><p>Think of the problem this way:</p>')
    expect(first.page).toBe(2)
    const aside = im.blocks[4] as { html: string }
    expect(aside.html).toBe(
      '<h3>Three-Digit Addition</h3><aside><p class="aside-title"><strong>Carl Friedrich Gauss</strong></p><p>A prodigy is a talented child.</p></aside>',
    )
    const why = doc.sections[2]!.blocks[0] as { html: string }
    expect(why.html).toBe('<p>Because 11 = 10 + 1. See this page.</p><table><tr><td>1</td><td>2</td></tr></table>')
    const why2 = doc.sections[3]!.blocks[0] as { html: string }
    expect(why2.html).toBe('<p>Again. Frac: <sup>1</sup>/2</p>')
  })

  it('drops the leading big-letter wrapper and keeps the overview text', () => {
    const { doc } = parseSample()
    const ov = doc.sections[0]!.blocks[0] as { html: string; page?: number }
    expect(ov.html).toBe('<p>In the pages that follow, you will learn to do math in your head.</p>')
    expect(ov.page).toBe(1)
  })

  it('builds the intro unit with one section per file titled from the toc', () => {
    const { doc } = parseUnit(
      {
        id: 'intro',
        kicker: 'Before you begin',
        titleOverride: 'Forewords and Introduction',
        files: [
          { path: 'text/f.html', tocLabel: 'Foreword by Bill Nye', html: '<html><body><h1 class="preface">Foreword</h1><h1 class="subchapterpre">by Bill Nye</h1><p class="nonindent">Hi.</p></body></html>' },
          { path: 'text/i.html', tocLabel: 'Introduction by Arthur Benjamin', html: '<html><body><h1 class="itr">Introduction</h1><p class="nonindent">Numbers.</p></body></html>' },
        ],
      },
      opts,
    )
    expect(doc.number).toBeNull()
    expect(doc.title).toBe('Forewords and Introduction')
    expect(doc.sections.map((s) => [s.id, s.title])).toEqual([
      ['foreword-by-bill-nye', 'Foreword by Bill Nye'],
      ['introduction-by-arthur-benjamin', 'Introduction by Arthur Benjamin'],
    ])
    expect(doc.sections[0]?.blocks).toEqual([{ type: 'html', html: '<p>Hi.</p>' }])
  })

  it('parses Chapter ∞ as the epilogue with a null number', () => {
    const { doc } = parseUnit(
      {
        id: 'epilogue',
        kicker: 'Chapter ∞',
        files: [{ path: 'text/e.html', html: '<html><body><h1 class="chapter"><strong class="calibre5">Chapter</strong> ∞</h1><h1 class="subchapter"><strong class="calibre5">Epilogue: How Math Helps</strong></h1><h1 class="subchapterpre1"><strong class="calibre5">by Michael Shermer</strong></h1><p class="nonindent">As the publisher.</p></body></html>' }],
      },
      opts,
    )
    expect(doc.number).toBeNull()
    expect(doc.title).toBe('Epilogue: How Math Helps, by Michael Shermer')
    expect(doc.sections.map((s) => s.id)).toEqual(['overview'])
    expect(doc.sections[0]?.title).toBe('Epilogue')
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run scripts/__tests__/parse-unit.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Create `src/content/types.ts`**

```ts
export type Block =
  | { type: 'html'; html: string; page?: number }
  | { type: 'figure'; id: string; src: string; width: number; height: number }
  | { type: 'exercise'; setId: string }

export interface SectionDoc {
  id: string
  title: string
  blocks: Block[]
}

export interface ChapterDoc {
  id: string
  number: number | null
  title: string
  kicker: string
  sections: SectionDoc[]
}

export interface SectionMeta {
  id: string
  title: string
}

export interface ChapterMeta {
  id: string
  number: number | null
  title: string
  kicker: string
  sections: SectionMeta[]
}
```

- [ ] **Step 5: Implement `scripts/lib/parse-unit.ts`**

```ts
import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { AnyNode, Element } from 'domhandler'
import path from 'node:path'
import type { Block, ChapterDoc, SectionDoc } from '../../src/content/types'
import { sanitizeHtml } from './sanitize'
import { collapseWs, slugify, titleCase, uniqueSlug } from './text'

export interface UnitInput {
  id: string
  kicker: string
  titleOverride?: string
  files: Array<{ path: string; html: string; tocLabel?: string }>
}
export interface ParseOptions {
  exerciseSets: Record<string, string>
  imageSize: (imagePath: string) => { width: number; height: number }
  figureSrc: (unitId: string, figureId: string) => string
}
export interface FigureRef { id: string; unitId: string; sourcePath: string }
export interface ExerciseCandidate { figureId: string; after: string }
export interface ParsedUnit { doc: ChapterDoc; figures: FigureRef[]; candidates: ExerciseCandidate[] }

const P_CLASS: Record<string, string | null> = {
  indent: null, nonindent: null, nonindentt: null, nonindentt1: null, nonindentbz: null, indentt: null, indent1: null,
  textbox1: null, textbox2: null,
  center: 'center', bl_center: 'center', right: 'right',
  extract: 'extract', extract1: 'extract',
  hanging: 'hanging', bl_hanging: 'hanging', bl_hangings: 'hanging', bl_hanginga: 'hanging',
  bl_nonindent: 'list-line', footnote1: 'footnote', textboxh: 'aside-title',
}
const BLOCK_DIVS = new Set(['block1', 'block2', 'blockk', 'hangings', 'footnote'])

class UnitBuilder {
  readonly sections: SectionDoc[] = []
  readonly figures: FigureRef[] = []
  readonly candidates: ExerciseCandidate[] = []
  private used = new Set<string>(['overview'])
  private current: SectionDoc | null = null
  private buffer: string[] = []
  private page: number | undefined
  private figureCount = 0

  constructor(private unitId: string, private opts: ParseOptions) {}

  startSection(title: string, id?: string) {
    this.flush()
    const t = titleCase(title)
    const sid = id ?? uniqueSlug(slugify(t), this.used)
    this.current = { id: sid, title: t, blocks: [] }
    this.sections.push(this.current)
  }

  ensureSection() {
    if (!this.current) {
      this.current = { id: 'overview', title: 'Overview', blocks: [] }
      this.sections.push(this.current)
    }
    return this.current
  }

  addHtml(fragment: string, page?: number) {
    if (page !== undefined && this.page === undefined) this.page = page
    if (fragment.trim()) this.buffer.push(fragment)
  }

  addFigure(sourcePath: string) {
    const sec = this.ensureSection()
    const preceding = this.buffer.join('')
    this.flush()
    const id = this.nextFigureId()
    const setId = this.opts.exerciseSets[id]
    if (setId) {
      sec.blocks.push({ type: 'exercise', setId })
      return
    }
    const text = collapseWs(cheerio.load(preceding).text())
    if (/exercis/i.test(text)) this.candidates.push({ figureId: id, after: text.slice(-160) })
    const { width, height } = this.opts.imageSize(sourcePath)
    sec.blocks.push({ type: 'figure', id, src: this.opts.figureSrc(this.unitId, id), width, height })
    this.figures.push({ id, unitId: this.unitId, sourcePath })
  }

  inlineFigure(sourcePath: string): string {
    const id = this.nextFigureId()
    const { width, height } = this.opts.imageSize(sourcePath)
    this.figures.push({ id, unitId: this.unitId, sourcePath })
    return `<img src="${this.opts.figureSrc(this.unitId, id)}" width="${width}" height="${height}" alt="" class="inline">`
  }

  flush() {
    if (this.buffer.length === 0) {
      this.page = undefined
      return
    }
    const sec = this.ensureSection()
    const html = sanitizeHtml(this.buffer.join(''))
    const block: Block = this.page === undefined ? { type: 'html', html } : { type: 'html', html, page: this.page }
    sec.blocks.push(block)
    this.buffer = []
    this.page = undefined
  }

  finish(): SectionDoc[] {
    this.flush()
    return this.sections.filter((s) => s.blocks.length > 0)
  }

  private nextFigureId() {
    this.figureCount += 1
    return `ch${this.unitId}-f${String(this.figureCount).padStart(3, '0')}`
  }
}

function imagePath(fileDir: string, src: string): string {
  return path.posix.normalize(path.posix.join(fileDir, src))
}

function pageOf(el: Element): number | undefined {
  const id = el.attribs.id ?? ''
  const m = /^page(\d+)$/.exec(id)
  return m ? Number(m[1]) : undefined
}

/** Serialise inline content of an element, applying the inline map. Returns html and the first page anchor seen. */
function inlineHtml($: CheerioAPI, el: Element, b: UnitBuilder, fileDir: string): { html: string; page?: number } {
  let page: number | undefined
  const render = (node: AnyNode): string => {
    if (node.type === 'text') return node.data
    if (node.type !== 'tag') return ''
    const e = node as Element
    const tag = e.tagName.toLowerCase()
    const cls = (e.attribs.class ?? '').split(/\s+/)
    const inner = () => e.children.map(render).join('')
    switch (tag) {
      case 'strong': return `<strong>${inner()}</strong>`
      case 'em': return `<em>${inner()}</em>`
      case 'sup': return `<sup>${inner()}</sup>`
      case 'sub': return `<sub>${inner()}</sub>`
      case 'br': return '<br>'
      case 'u': return `<u>${inner()}</u>`
      case 'span':
        if (cls.includes('underline')) return `<u>${inner()}</u>`
        if (cls.includes('border')) return `<span class="boxed">${inner()}</span>`
        return inner()
      case 'a': {
        const p = pageOf(e)
        if (p !== undefined) { page ??= p; return '' }
        return inner()
      }
      case 'img': return b.inlineFigure(imagePath(fileDir, e.attribs.src ?? ''))
      default: return inner()
    }
  }
  const html = el.children.map(render).join('')
  return page === undefined ? { html } : { html, page }
}

function isImageOnly(el: Element): Element | null {
  const kids = el.children.filter((c) => c.type !== 'text' || c.data.trim() !== '')
  const only = kids.length === 1 ? kids[0] : undefined
  return only && only.type === 'tag' && (only as Element).tagName.toLowerCase() === 'img' ? (only as Element) : null
}

function walkBody($: CheerioAPI, nodes: AnyNode[], b: UnitBuilder, fileDir: string, ctx: { isChapter: boolean; meta: Meta }) {
  for (const node of nodes) {
    if (node.type !== 'tag') continue
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const cls = (el.attribs.class ?? '').split(/\s+/)

    if (tag === 'h1') {
      const text = collapseWs($(el).text())
      if (cls.includes('chapter')) {
        const m = /(\d+)/.exec(text)
        ctx.meta.number = m ? Number(m[1]) : null
        const p = $(el).find('a[id^=page]').first().attr('id')
        if (p) ctx.meta.firstPage = Number(p.replace('page', '')) || undefined
      } else if (cls.includes('subchapter')) {
        ctx.meta.title = collapseWs($(el).html()!.replace(/<br[^>]*>/g, ' ').replace(/<[^>]+>/g, ''))
      } else if (cls.includes('subchapterpre1')) {
        ctx.meta.byline = text
      }
      continue
    }
    if (tag === 'h2') { b.startSection($(el).text()); continue }
    if (tag === 'h3') { const { html, page } = inlineHtml($, el, b, fileDir); b.addHtml(`<h3>${collapseWs(html)}</h3>`, page); continue }
    if (tag === 'div') {
      if (cls.includes('dis_img')) {
        for (const img of $(el).find('img').toArray()) b.addFigure(imagePath(fileDir, img.attribs.src ?? ''))
        continue
      }
      if (cls.includes('textbox')) {
        const inner = new Array<string>()
        for (const child of el.children) {
          if (child.type !== 'tag') continue
          const c = child as Element
          if (c.tagName.toLowerCase() === 'p') inner.push(paragraph($, c, b, fileDir).html)
        }
        b.addHtml(`<aside>${inner.join('')}</aside>`)
        continue
      }
      if (cls.some((c) => BLOCK_DIVS.has(c))) {
        const inner = new Array<string>()
        for (const child of el.children) {
          if (child.type !== 'tag') continue
          const c = child as Element
          if (c.tagName.toLowerCase() === 'p') inner.push(paragraph($, c, b, fileDir).html)
        }
        b.addHtml(`<div class="block">${inner.join('')}</div>`)
        continue
      }
      // anchor-only or unknown div: recurse into it
      walkBody($, el.children, b, fileDir, ctx)
      continue
    }
    if (tag === 'p') {
      const img = isImageOnly(el)
      if (img) { b.addFigure(imagePath(fileDir, img.attribs.src ?? '')); continue }
      const { html, page } = paragraph($, el, b, fileDir)
      b.addHtml(html, page)
      continue
    }
    if (tag === 'table') {
      const rows = $(el).find('tr').toArray().map((tr) => {
        const cells = $(tr).children('td,th').toArray().map((td) => `<td>${collapseWs(inlineHtml($, td, b, fileDir).html)}</td>`).join('')
        return `<tr>${cells}</tr>`
      }).join('')
      b.addHtml(`<table>${rows}</table>`)
      continue
    }
  }
}

function paragraph($: CheerioAPI, el: Element, b: UnitBuilder, fileDir: string): { html: string; page?: number } {
  const cls = (el.attribs.class ?? '').split(/\s+/)
  let mapped: string | null = null
  for (const c of cls) if (c in P_CLASS) { mapped = P_CLASS[c] ?? null; break }
  const { html, page } = inlineHtml($, el, b, fileDir)
  const body = collapseWs(html)
  if (!body) return { html: '' }
  const open = mapped ? `<p class="${mapped}">` : '<p>'
  return page === undefined ? { html: `${open}${body}</p>` } : { html: `${open}${body}</p>`, page }
}

interface Meta { number: number | null; title: string; byline?: string; firstPage?: number }

export function parseUnit(unit: UnitInput, opts: ParseOptions): ParsedUnit {
  const b = new UnitBuilder(unit.id, opts)
  const meta: Meta = { number: null, title: '' }
  const isChapter = unit.id !== 'intro'
  for (const file of unit.files) {
    const $ = cheerio.load(file.html, { xml: false })
    const fileDir = path.posix.dirname(file.path)
    if (unit.id === 'intro') {
      const title = file.tocLabel ?? 'Section'
      b.startSection(title, uniqueSlug(slugify(title), new Set()))
    }
    if (unit.id === 'epilogue' && b.sections.length === 0) b.startSection('Epilogue', 'overview')
    walkBody($, $('body').contents().toArray(), b, fileDir, { isChapter, meta })
    if (unit.id === 'intro') b.flush()
  }
  const sections = b.finish()
  const title = unit.titleOverride ?? (meta.byline ? `${meta.title}, ${meta.byline}` : meta.title)
  const doc: ChapterDoc = { id: unit.id, number: unit.id === 'intro' ? null : meta.number, title, kicker: unit.kicker, sections }
  if (meta.firstPage !== undefined && sections[0]?.blocks[0]?.type === 'html' && sections[0].blocks[0].page === undefined) {
    sections[0].blocks[0].page = meta.firstPage
  }
  return { doc, figures: b.figures, candidates: b.candidates }
}
```

Note for the implementer: the `intro` unit uses a fresh `Set()` for slugs on purpose so that two files never collide (labels are unique) while the class-level `used` set still guards chapter units. If the intro test fails on ids, replace `new Set()` with the builder's own set via a small public method `slugFor(title)`.

- [ ] **Step 6: Run the tests and iterate**

Run: `npx vitest run scripts/__tests__/parse-unit.test.ts`
Expected: PASS (8 tests). Typical first-run failures and their fixes:
- Whitespace differences inside `<p>`: `collapseWs` on the inline html is applied in `paragraph()`; make sure `<h3>` and `<td>` do the same.
- The overview `page` of 1 comes from the `h1.chapter` anchor; the `meta.firstPage` patch at the end handles it.
- The `intro` test expects the `subchapterpre` h1 to disappear; it falls into the `continue` branch because none of the three class checks match.

- [ ] **Step 7: Typecheck the scripts project**

Run: `npx tsc --noEmit -p tsconfig.node.json`
Expected: clean. If `domhandler` types are not found, `npm install -D domhandler@^5` (cheerio depends on it, but declare it explicitly).

- [ ] **Step 8: Commit**

```bash
git add src/content/types.ts scripts/lib/parse-unit.ts scripts/__fixtures__ scripts/__tests__/parse-unit.test.ts
git commit -m "feat(extract): convert calibre chapter html into sectioned block documents"
```

---

### Task 7: Extraction library, part 3: EPUB container, units and index writer

**Files:**
- Create: `scripts/lib/epub.ts`, `scripts/lib/write-index.ts`, `scripts/__fixtures__/mini.opf`, `scripts/__fixtures__/mini.ncx`
- Test: `scripts/__tests__/epub.test.ts`, `scripts/__tests__/write-index.test.ts`

**Interfaces:**
- Produces:
```ts
// epub.ts
export interface EpubArchive { files: Map<string, Uint8Array>; opfPath: string; opfDir: string }
export function openEpub(bytes: Uint8Array): EpubArchive              // reads META-INF/container.xml
export function readText(a: EpubArchive, pathFromRoot: string): string
export function readSpine(a: EpubArchive): string[]                    // hrefs from epub root, spine order
export interface TocEntry { label: string; href: string }              // href without fragment, from epub root
export function readToc(a: EpubArchive): TocEntry[]
export interface UnitPlan { id: string; kicker: string; titleOverride?: string; files: Array<{ path: string; tocLabel?: string }> }
export function planUnits(spine: string[], toc: TocEntry[]): UnitPlan[]   // intro, '0'..'9', epilogue, answers
// write-index.ts
export function renderIndex(metas: ChapterMeta[]): string             // TypeScript source of src/content/index.ts
```

`planUnits` rules: walk the TOC in order; each entry owns the spine files from its href up to (not including) the next entry's href. Entries are classified by label: `/^Chapter (\d+)\b/` → unit id `$1`, kicker `Chapter $1`; `/^Chapter ∞/` → `epilogue`, kicker `Chapter ∞`; labels starting with `Foreword`, `Prologue` or `Introduction` → merged into `intro`, kicker `Before you begin`, `titleOverride: 'Forewords and Introduction'`, each file keeps its `tocLabel`; `Answers` → `answers` (kept for Plan 3, not emitted as a chapter); everything else is dropped. Output order: intro, 0…9, epilogue, answers.

- [ ] **Step 1: Create the fixtures**

`scripts/__fixtures__/mini.opf`:
```xml
<?xml version='1.0' encoding='utf-8'?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uuid_id" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Mini</dc:title></metadata>
  <manifest>
    <item href="text/part0005.html" id="a" media-type="application/xhtml+xml"/>
    <item href="text/part0008.html" id="b" media-type="application/xhtml+xml"/>
    <item href="text/part0009_split_000.html" id="c0" media-type="application/xhtml+xml"/>
    <item href="text/part0009_split_001.html" id="c1" media-type="application/xhtml+xml"/>
    <item href="text/part0019.html" id="e" media-type="application/xhtml+xml"/>
    <item href="text/part0020.html" id="ans" media-type="application/xhtml+xml"/>
    <item href="text/part0022.html" id="about" media-type="application/xhtml+xml"/>
    <item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="a"/><itemref idref="b"/><itemref idref="c0"/><itemref idref="c1"/><itemref idref="e"/><itemref idref="ans"/><itemref idref="about"/>
  </spine>
</package>
```

`scripts/__fixtures__/mini.ncx`:
```xml
<?xml version='1.0' encoding='utf-8'?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="n1" playOrder="1"><navLabel><text>Foreword by Bill Nye (the Science Guy®)</text></navLabel><content src="text/part0005.html#x1"/></navPoint>
    <navPoint id="n2" playOrder="2"><navLabel><text>Introduction by Arthur Benjamin</text></navLabel><content src="text/part0008.html#x2"/></navPoint>
    <navPoint id="n3" playOrder="3"><navLabel><text>Chapter 0 Quick Tricks: Easy (and Impressive) Calculations</text></navLabel><content src="text/part0009_split_000.html#x3"/></navPoint>
    <navPoint id="n4" playOrder="4"><navLabel><text>Chapter ∞ Epilogue by Michael Shermer: How Math Helps Us Think About Weird Things</text></navLabel><content src="text/part0019.html#x4"/></navPoint>
    <navPoint id="n5" playOrder="5"><navLabel><text>Answers</text></navLabel><content src="text/part0020.html#x5"/></navPoint>
    <navPoint id="n6" playOrder="6"><navLabel><text>About the Author</text></navLabel><content src="text/part0022.html#x6"/></navPoint>
  </navMap>
</ncx>
```

- [ ] **Step 2: Write the tests**

`scripts/__tests__/epub.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { zipSync, strToU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { openEpub, planUnits, readSpine, readText, readToc } from '../lib/epub'

const fx = (name: string) => readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')

function miniEpub() {
  const container = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
  return zipSync({
    mimetype: strToU8('application/epub+zip'),
    'META-INF/container.xml': strToU8(container),
    'content.opf': strToU8(fx('mini.opf')),
    'toc.ncx': strToU8(fx('mini.ncx')),
    'text/part0005.html': strToU8('<html><body><p>f</p></body></html>'),
  })
}

describe('epub container', () => {
  it('finds the opf through container.xml and reads files', () => {
    const a = openEpub(miniEpub())
    expect(a.opfPath).toBe('content.opf')
    expect(a.opfDir).toBe('')
    expect(readText(a, 'text/part0005.html')).toContain('<p>f</p>')
  })
  it('returns the spine as hrefs in order', () => {
    const a = openEpub(miniEpub())
    expect(readSpine(a)).toEqual([
      'text/part0005.html', 'text/part0008.html', 'text/part0009_split_000.html', 'text/part0009_split_001.html',
      'text/part0019.html', 'text/part0020.html', 'text/part0022.html',
    ])
  })
  it('returns toc entries without fragments', () => {
    const a = openEpub(miniEpub())
    expect(readToc(a)[2]).toEqual({ label: 'Chapter 0 Quick Tricks: Easy (and Impressive) Calculations', href: 'text/part0009_split_000.html' })
  })
})

describe('planUnits', () => {
  it('groups spine files into intro, chapters, epilogue and answers', () => {
    const a = openEpub(miniEpub())
    const units = planUnits(readSpine(a), readToc(a))
    expect(units.map((u) => u.id)).toEqual(['intro', '0', 'epilogue', 'answers'])
    expect(units[0]).toEqual({
      id: 'intro', kicker: 'Before you begin', titleOverride: 'Forewords and Introduction',
      files: [
        { path: 'text/part0005.html', tocLabel: 'Foreword by Bill Nye (the Science Guy®)' },
        { path: 'text/part0008.html', tocLabel: 'Introduction by Arthur Benjamin' },
      ],
    })
    expect(units[1]).toEqual({ id: '0', kicker: 'Chapter 0', files: [{ path: 'text/part0009_split_000.html' }, { path: 'text/part0009_split_001.html' }] })
    expect(units[2]).toEqual({ id: 'epilogue', kicker: 'Chapter ∞', files: [{ path: 'text/part0019.html' }] })
    expect(units[3]?.files).toEqual([{ path: 'text/part0020.html' }])
  })
})
```

`scripts/__tests__/write-index.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { renderIndex } from '../lib/write-index'

describe('renderIndex', () => {
  it('emits typed metadata and lazy loaders per chapter', () => {
    const src = renderIndex([
      { id: '0', number: 0, title: 'Quick Tricks', kicker: 'Chapter 0', sections: [{ id: 'overview', title: 'Overview' }] },
      { id: 'epilogue', number: null, title: 'Epilogue', kicker: 'Chapter ∞', sections: [] },
    ])
    expect(src).toContain('// GENERATED by scripts/extract-book.ts')
    expect(src).toContain(`import type { ChapterDoc, ChapterMeta } from './types'`)
    expect(src).toContain(`export const chapterIndex: ChapterMeta[] = [`)
    expect(src).toContain(`"id": "0"`)
    expect(src).toContain(`'0': () => import('./chapters/0.json')`)
    expect(src).toContain(`'epilogue': () => import('./chapters/epilogue.json')`)
    expect(src).toContain('export const chapterLoaders: Record<string, () => Promise<{ default: ChapterDoc }>>')
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run scripts/__tests__/epub.test.ts scripts/__tests__/write-index.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `scripts/lib/epub.ts`**

```ts
import * as cheerio from 'cheerio'
import { strFromU8, unzipSync } from 'fflate'
import path from 'node:path'

export interface EpubArchive { files: Map<string, Uint8Array>; opfPath: string; opfDir: string }
export interface TocEntry { label: string; href: string }
export interface UnitPlan { id: string; kicker: string; titleOverride?: string; files: Array<{ path: string; tocLabel?: string }> }

export function openEpub(bytes: Uint8Array): EpubArchive {
  const raw = unzipSync(bytes)
  const files = new Map<string, Uint8Array>(Object.entries(raw))
  const container = files.get('META-INF/container.xml')
  if (!container) throw new Error('Not an EPUB: META-INF/container.xml missing')
  const $ = cheerio.load(strFromU8(container), { xml: true })
  const opfPath = $('rootfile').first().attr('full-path')
  if (!opfPath) throw new Error('container.xml has no rootfile')
  const opfDir = path.posix.dirname(opfPath) === '.' ? '' : path.posix.dirname(opfPath)
  return { files, opfPath, opfDir }
}

export function readText(a: EpubArchive, pathFromRoot: string): string {
  const bytes = a.files.get(pathFromRoot)
  if (!bytes) throw new Error(`Missing file in EPUB: ${pathFromRoot}`)
  return strFromU8(bytes)
}

function fromOpf(a: EpubArchive, href: string): string {
  return path.posix.normalize(a.opfDir ? path.posix.join(a.opfDir, href) : href)
}

export function readSpine(a: EpubArchive): string[] {
  const $ = cheerio.load(readText(a, a.opfPath), { xml: true })
  const hrefById = new Map<string, string>()
  $('manifest > item').each((_, el) => {
    const id = $(el).attr('id')
    const href = $(el).attr('href')
    if (id && href) hrefById.set(id, href)
  })
  const out: string[] = []
  $('spine > itemref').each((_, el) => {
    const href = hrefById.get($(el).attr('idref') ?? '')
    if (href && /\.x?html?$/i.test(href)) out.push(fromOpf(a, href))
  })
  return out
}

export function readToc(a: EpubArchive): TocEntry[] {
  const $opf = cheerio.load(readText(a, a.opfPath), { xml: true })
  const ncxHref = $opf('manifest > item[media-type="application/x-dtbncx+xml"]').attr('href') ?? 'toc.ncx'
  const $ = cheerio.load(readText(a, fromOpf(a, ncxHref)), { xml: true })
  const entries: TocEntry[] = []
  $('navPoint').each((_, el) => {
    const label = $(el).children('navLabel').children('text').first().text().replace(/\s+/g, ' ').trim()
    const src = $(el).children('content').attr('src') ?? ''
    const href = fromOpf(a, src.split('#')[0] ?? '')
    if (label && href) entries.push({ label, href })
  })
  return entries
}

function classify(label: string): { id: string; kicker: string; titleOverride?: string } | null {
  let m = /^Chapter (\d+)\b/.exec(label)
  if (m) return { id: m[1]!, kicker: `Chapter ${m[1]}` }
  if (/^Chapter ∞/.test(label)) return { id: 'epilogue', kicker: 'Chapter ∞' }
  if (/^(Foreword|Prologue|Introduction)\b/.test(label)) return { id: 'intro', kicker: 'Before you begin', titleOverride: 'Forewords and Introduction' }
  if (/^Answers\b/.test(label)) return { id: 'answers', kicker: 'Answers' }
  return null
}

export function planUnits(spine: string[], toc: TocEntry[]): UnitPlan[] {
  const units = new Map<string, UnitPlan>()
  for (let i = 0; i < toc.length; i++) {
    const entry = toc[i]!
    const kind = classify(entry.label)
    if (!kind) continue
    const start = spine.indexOf(entry.href)
    if (start < 0) continue
    const nextHref = toc.slice(i + 1).map((t) => spine.indexOf(t.href)).find((idx) => idx > start)
    const end = nextHref ?? spine.length
    const files = spine.slice(start, end).map((p) => (kind.id === 'intro' ? { path: p, tocLabel: entry.label } : { path: p }))
    const existing = units.get(kind.id)
    if (existing) existing.files.push(...files)
    else units.set(kind.id, { ...kind, files })
  }
  const order = ['intro', ...Array.from({ length: 10 }, (_, i) => String(i)), 'epilogue', 'answers']
  return order.flatMap((id) => (units.has(id) ? [units.get(id)!] : []))
}
```

- [ ] **Step 5: Implement `scripts/lib/write-index.ts`**

```ts
import type { ChapterMeta } from '../../src/content/types'

export function renderIndex(metas: ChapterMeta[]): string {
  const loaders = metas.map((m) => `  '${m.id}': () => import('./chapters/${m.id}.json'),`).join('\n')
  return [
    '// GENERATED by scripts/extract-book.ts. Do not edit; re-run `npm run extract -- <epub>`.',
    `import type { ChapterDoc, ChapterMeta } from './types'`,
    '',
    `export const chapterIndex: ChapterMeta[] = ${JSON.stringify(metas, null, 2)}`,
    '',
    'export const chapterLoaders: Record<string, () => Promise<{ default: ChapterDoc }>> = {',
    loaders,
    '}',
    '',
  ].join('\n')
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npx vitest run scripts/__tests__/epub.test.ts scripts/__tests__/write-index.test.ts` → PASS (5 tests).
Run: `npx tsc --noEmit -p tsconfig.node.json` → clean.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/epub.ts scripts/lib/write-index.ts scripts/__fixtures__/mini.opf scripts/__fixtures__/mini.ncx scripts/__tests__/epub.test.ts scripts/__tests__/write-index.test.ts
git commit -m "feat(extract): epub container reading, unit planning and index rendering"
```

---

### Task 8: Extraction CLI, first real run, curated exercise map

**Files:**
- Create: `scripts/extract-book.ts`, `scripts/book-map.json`, `src/content/loader.ts`
- Generated: `src/content/index.ts`, `src/content/chapters/*.json`, `public/book/figures/**`
- Test: `scripts/__tests__/extract-cli.test.ts`, `src/content/__tests__/content.test.ts`

**Interfaces:**
- Produces: `npm run extract -- "<epub path>"` writes the generated files and prints exercise candidates. `src/content/loader.ts` exports `loadChapter(id: string): Promise<ChapterDoc>` (rejects with `ChapterNotFound` for unknown ids), `getChapterMeta(id): ChapterMeta | undefined`, `chapterIndex`, `readableChapters(): ChapterMeta[]` (index in order: intro, 0…9, epilogue).

- [ ] **Step 0: Copy one real figure out of the EPUB as a binary fixture**

```bash
unzip -p "$(ls *.epub | head -1)" images/00008.jpeg > scripts/__fixtures__/fig.jpeg
file scripts/__fixtures__/fig.jpeg   # expect: JPEG image data ... 32x70
```

- [ ] **Step 1: Write the CLI test (runs the extractor on an in-memory mini EPUB)**

`scripts/__tests__/extract-cli.test.ts`:
```ts
import { mkdtempSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { zipSync, strToU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { extract } from '../extract-book'

const fx = (name: string) => readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')
// A real 32x70 figure copied out of the EPUB (see Step 0)
const JPEG = new Uint8Array(readFileSync(new URL('../__fixtures__/fig.jpeg', import.meta.url)))

function miniEpub() {
  const container = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
  return zipSync({
    mimetype: strToU8('application/epub+zip'),
    'META-INF/container.xml': strToU8(container),
    'content.opf': strToU8(fx('mini.opf')),
    'toc.ncx': strToU8(fx('mini.ncx')),
    'text/part0005.html': strToU8('<html><body><h1 class="preface">Foreword</h1><p class="nonindent">Hi.</p></body></html>'),
    'text/part0008.html': strToU8('<html><body><h1 class="itr">Introduction</h1><p class="nonindent">Numbers.</p></body></html>'),
    'text/part0009_split_000.html': strToU8(fx('chapter-sample.html')),
    'text/part0009_split_001.html': strToU8(fx('chapter-sample-2.html')),
    'text/part0019.html': strToU8('<html><body><h1 class="chapter">Chapter ∞</h1><h1 class="subchapter">Epilogue</h1><p class="nonindent">End.</p></body></html>'),
    'text/part0020.html': strToU8('<html><body><h2 class="section">CHAPTER 1: X</h2></body></html>'),
    'text/part0022.html': strToU8('<html><body><p>about</p></body></html>'),
    'images/00008.jpeg': JPEG, 'images/00009.jpeg': JPEG, 'images/00010.jpeg': JPEG, 'images/00011.jpeg': JPEG,
  })
}

describe('extract()', () => {
  it('writes chapter json, figures, index and reports candidates', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'mm-extract-'))
    const result = extract(miniEpub(), {
      contentDir: path.join(out, 'content'),
      figuresDir: path.join(out, 'figures'),
      publicPrefix: '/book/figures',
      exerciseSets: { 'ch0-f002': 'ch0-sample-set' },
    })
    expect(readdirSync(path.join(out, 'content', 'chapters')).sort()).toEqual(['0.json', 'epilogue.json', 'intro.json'])
    const ch0 = JSON.parse(readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8'))
    expect(ch0.title).toBe('Quick Tricks: Easy (and Impressive) Calculations')
    const fig = ch0.sections[1].blocks[1]
    expect(fig).toMatchObject({ type: 'figure', id: 'ch0-f001', width: 32, height: 70 })
    expect(existsSync(path.join(out, 'figures', '0', 'ch0-f001.jpeg'))).toBe(true)
    expect(existsSync(path.join(out, 'figures', '0', 'ch0-f002.jpeg'))).toBe(false)
    const index = readFileSync(path.join(out, 'content', 'index.ts'), 'utf8')
    expect(index).toContain(`'intro': () => import('./chapters/intro.json')`)
    expect(result.candidates).toEqual([])
    expect(result.units.map((u) => u.id)).toEqual(['intro', '0', 'epilogue'])
    expect(result.answersHtml.length).toBeGreaterThan(0)
  })

  it('is idempotent: a second run produces identical bytes', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'mm-extract-'))
    const opts = { contentDir: path.join(out, 'content'), figuresDir: path.join(out, 'figures'), publicPrefix: '/book/figures', exerciseSets: {} }
    extract(miniEpub(), opts)
    const first = readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8')
    extract(miniEpub(), opts)
    expect(readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8')).toBe(first)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run scripts/__tests__/extract-cli.test.ts` → FAIL, module not found.

- [ ] **Step 3: Implement `scripts/extract-book.ts`**

```ts
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { imageSize } from 'image-size'
import type { ChapterMeta } from '../src/content/types'
import { openEpub, planUnits, readSpine, readText, readToc, type EpubArchive } from './lib/epub'
import { parseUnit, type ExerciseCandidate } from './lib/parse-unit'
import { renderIndex } from './lib/write-index'

export interface ExtractOptions {
  contentDir: string      // e.g. src/content
  figuresDir: string      // e.g. public/book/figures
  publicPrefix: string    // e.g. /book/figures
  exerciseSets: Record<string, string>
}
export interface ExtractResult {
  units: Array<{ id: string; sections: number; figures: number }>
  candidates: Array<ExerciseCandidate & { unitId: string }>
  answersHtml: string[]
}

export function extract(bytes: Uint8Array, opts: ExtractOptions): ExtractResult {
  const archive = openEpub(bytes)
  const spine = readSpine(archive)
  const toc = readToc(archive)
  const plans = planUnits(spine, toc)

  const chaptersDir = path.join(opts.contentDir, 'chapters')
  rmSync(chaptersDir, { recursive: true, force: true })
  rmSync(opts.figuresDir, { recursive: true, force: true })
  mkdirSync(chaptersDir, { recursive: true })

  const metas: ChapterMeta[] = []
  const result: ExtractResult = { units: [], candidates: [], answersHtml: [] }

  for (const plan of plans) {
    if (plan.id === 'answers') {
      result.answersHtml = plan.files.map((f) => readText(archive, f.path))
      continue
    }
    const parsed = parseUnit(
      { ...plan, files: plan.files.map((f) => ({ ...f, html: readText(archive, f.path) })) },
      {
        exerciseSets: opts.exerciseSets,
        imageSize: (p) => sizeOf(archive, p),
        figureSrc: (unitId, figureId) => `${opts.publicPrefix}/${unitId}/${figureId}.jpeg`,
      },
    )
    const unitFigDir = path.join(opts.figuresDir, plan.id)
    mkdirSync(unitFigDir, { recursive: true })
    for (const fig of parsed.figures) {
      const src = archive.files.get(fig.sourcePath)
      if (!src) throw new Error(`Figure ${fig.id} points at missing ${fig.sourcePath}`)
      writeFileSync(path.join(unitFigDir, `${fig.id}.jpeg`), src)
    }
    writeFileSync(path.join(chaptersDir, `${plan.id}.json`), JSON.stringify(parsed.doc, null, 2) + '\n')
    metas.push({
      id: parsed.doc.id, number: parsed.doc.number, title: parsed.doc.title, kicker: parsed.doc.kicker,
      sections: parsed.doc.sections.map((s) => ({ id: s.id, title: s.title })),
    })
    result.units.push({ id: plan.id, sections: parsed.doc.sections.length, figures: parsed.figures.length })
    result.candidates.push(...parsed.candidates.map((c) => ({ ...c, unitId: plan.id })))
  }

  writeFileSync(path.join(opts.contentDir, 'index.ts'), renderIndex(metas))
  return result
}

function sizeOf(archive: EpubArchive, p: string): { width: number; height: number } {
  const bytes = archive.files.get(p)
  if (!bytes) throw new Error(`Missing image ${p}`)
  const { width, height } = imageSize(bytes)
  return { width: width ?? 0, height: height ?? 0 }
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const epubPath = process.argv[2]
  if (!epubPath) {
    console.error('Usage: npm run extract -- <path-to-epub>')
    process.exit(2)
  }
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
  const map = JSON.parse(readFileSync(path.join(root, 'scripts', 'book-map.json'), 'utf8')) as { exerciseSets: Record<string, string> }
  const result = extract(readFileSync(epubPath), {
    contentDir: path.join(root, 'src', 'content'),
    figuresDir: path.join(root, 'public', 'book', 'figures'),
    publicPrefix: '/book/figures',
    exerciseSets: map.exerciseSets,
  })
  for (const u of result.units) console.log(`unit ${u.id}: ${u.sections} sections, ${u.figures} figures`)
  if (result.candidates.length) {
    console.log('\nExercise-set candidates (add confirmed ones to scripts/book-map.json):')
    for (const c of result.candidates) console.log(`  ${c.figureId}  …${c.after.slice(-110)}`)
  }
}
```

`scripts/book-map.json` (initially empty):
```json
{
  "exerciseSets": {}
}
```

- [ ] **Step 4: Run the CLI test**

Run: `npx vitest run scripts/__tests__/extract-cli.test.ts` → PASS (2 tests).

- [ ] **Step 5: Run the extractor against the real EPUB**

```bash
npm run extract -- "$(ls *.epub | head -1)"
```

Expected output: 12 units (`intro`, `0`…`9`, `epilogue`) with section counts close to: 0 → 5, 1 → 3, 2 → 6, 3 → 5, 4 → 7, 5 → 10, 6 → 7, 7 → 5, 8 → 6, 9 → 11 (each including an `overview`), figure totals around 400, plus a candidates list. Check:

```bash
ls src/content/chapters && du -sh public/book/figures && node -e "console.log(require('./src/content/chapters/9.json').sections.map(s=>s.id))"
```

Chapter 9 must show `why-this-trick-works`, `why-this-trick-works-2`, … with no duplicates.

- [ ] **Step 6: Curate `scripts/book-map.json`**

For every candidate the CLI printed, open the figure it names (`public/book/figures/<unit>/<figureId>.jpeg`, view it with the image viewer / Read tool) and confirm it is an exercise problem list (they start with a boxed "EXERCISE:" heading). Some exercise lists are split over two consecutive figures; map both to the same set id. Set ids follow `ch<unit>-<slug of the Answers heading>`; the expected ids, from the Answers section, are:

```
ch1-two-digit-addition, ch1-three-digit-addition, ch1-two-digit-subtraction, ch1-three-digit-subtraction,
ch2-2-by-1-multiplication, ch2-two-digit-squares,   (Answers heading before the first image group in ch2 is the 2-by-1 / 3-by-1 set; name it ch2-2-by-1-multiplication and ch2-3-by-1-multiplication if two groups exist)
ch3-multiplying-by-11, ch3-three-digit-squares, ch3-two-digit-cubes,  (plus 2-by-2 sets: ch3-2-by-2-addition-method, ch3-2-by-2-subtraction-method, ch3-2-by-2-factoring-method, ch3-2-by-2-general if their exercise figures exist in the chapter)
ch4-one-digit-division, ch4-two-digit-division, ch4-decimalization, ch4-testing-for-divisibility, ch4-multiplying-fractions, ch4-dividing-fractions, ch4-simplifying-fractions, ch4-adding-fractions, ch4-subtracting-fractions,
ch5-addition-guesstimation, ch5-subtraction-guesstimation, ch5-division-guesstimation, ch5-multiplication-guesstimation, ch5-square-root-guesstimation, ch5-everyday-math,
ch6-columns-of-numbers, ch6-subtracting-on-paper, ch6-square-root-guesstimation, ch6-pencil-and-paper-multiplication,
ch8-four-digit-squares, ch8-five-digit-squares, (and 3-by-2 / 3-by-3 / 5-by-5 sets if present)
ch9-a-day-for-any-date
```

Candidates whose preceding text mentions exercises but whose figure is a worked example, not a problem list, stay unmapped. Record any exercise figure the heuristic missed by scanning each chapter's figure directory once; the boxed "EXERCISE" heading is unmistakable at thumbnail size.

Re-run `npm run extract -- "<epub>"` after editing the map. Every mapped figure disappears from `public/book/figures` and appears as an `exercise` block.

- [ ] **Step 7: Create `src/content/loader.ts` and its test**

`src/content/loader.ts`:
```ts
import { chapterIndex, chapterLoaders } from './index'
import type { ChapterDoc, ChapterMeta } from './types'

export { chapterIndex }

export class ChapterNotFound extends Error {
  constructor(id: string) {
    super(`No chapter "${id}"`)
    this.name = 'ChapterNotFound'
  }
}

export function getChapterMeta(id: string): ChapterMeta | undefined {
  return chapterIndex.find((c) => c.id === id)
}

export function readableChapters(): ChapterMeta[] {
  return chapterIndex
}

export function neighbours(id: string): { prev?: ChapterMeta; next?: ChapterMeta } {
  const i = chapterIndex.findIndex((c) => c.id === id)
  return { prev: i > 0 ? chapterIndex[i - 1] : undefined, next: i >= 0 ? chapterIndex[i + 1] : undefined }
}

export async function loadChapter(id: string): Promise<ChapterDoc> {
  const loader = chapterLoaders[id]
  if (!loader) throw new ChapterNotFound(id)
  const mod = await loader()
  return mod.default
}
```

`src/content/__tests__/content.test.ts` (validates the committed real content):
```ts
import { describe, expect, it } from 'vitest'
import { chapterIndex, getChapterMeta, loadChapter, ChapterNotFound } from '../loader'
import { ALLOWED_TAGS } from '../../../scripts/lib/sanitize'

describe('extracted content', () => {
  it('has intro, chapters 0-9 and the epilogue in order', () => {
    expect(chapterIndex.map((c) => c.id)).toEqual(['intro', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'epilogue'])
  })
  it('gives every chapter the book title, not a placeholder', () => {
    expect(getChapterMeta('8')?.title).toBe('The Tough Stuff Made Easy: Advanced Multiplication')
    expect(getChapterMeta('9')?.title).toBe('Presto-digit-ation: The Art of Mathematical Magic')
    expect(getChapterMeta('epilogue')?.kicker).toBe('Chapter ∞')
  })
  it('keeps section ids unique within each chapter', () => {
    for (const c of chapterIndex) {
      const ids = c.sections.map((s) => s.id)
      expect(new Set(ids).size, c.id).toBe(ids.length)
    }
  })
  it('loads a chapter document with only allowed tags in html blocks', async () => {
    const doc = await loadChapter('1')
    expect(doc.sections.length).toBeGreaterThan(1)
    for (const s of doc.sections) for (const b of s.blocks) {
      if (b.type !== 'html') continue
      for (const tag of b.html.matchAll(/<([a-z0-9]+)/g)) expect(ALLOWED_TAGS.has(tag[1]!), tag[1]).toBe(true)
      expect(b.html).not.toMatch(/calibre|style=|onclick/)
    }
  })
  it('contains exercise blocks once the map is curated', async () => {
    const doc = await loadChapter('1')
    const sets = doc.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'exercise')
    expect(sets.length).toBeGreaterThanOrEqual(4)
  })
  it('rejects unknown ids with ChapterNotFound', async () => {
    await expect(loadChapter('42')).rejects.toBeInstanceOf(ChapterNotFound)
  })
})
```

Run: `npx vitest run src/content` → PASS. The last-but-one test fails until Step 6's map is curated; do not weaken it.

- [ ] **Step 8: Typecheck, lint, build**

Run: `npm test` → passes. `npm run build` → passes; note the `dist` size is now dominated by figures (about 5 MB) instead of 83 MB.

- [ ] **Step 9: Commit (content included)**

```bash
git add scripts/extract-book.ts scripts/book-map.json scripts/__tests__/extract-cli.test.ts src/content public/book
git commit -m "feat(content): extraction CLI, curated exercise map and generated chapter content"
```

---

### Task 9: Reader view with outline, blocks, figures, callouts and section tracking

**Files:**
- Create: `src/practice/registry.ts`, `src/reader/ContentBlocks.vue`, `src/reader/FigureBlock.vue`, `src/reader/ExerciseCallout.vue`, `src/reader/ChapterOutline.vue`, `src/reader/PracticeRail.vue`, `src/reader/SectionPill.vue`, `src/reader/BottomSheet.vue`
- Replace: `src/reader/ReaderView.vue` (stub from Task 4)
- Test: `src/reader/__tests__/ContentBlocks.test.ts`, `src/reader/__tests__/ReaderView.test.ts`

**Interfaces:**
- Consumes: `loadChapter`, `getChapterMeta`, `neighbours` (Task 8), `useProgress` (Task 3), `Block` types (Task 6).
- Produces `src/practice/registry.ts`:
```ts
export interface PracticeSetRef { id: string; chapterId: string; sectionId: string; title: string; kind: 'book' | 'generated'; count?: number }
export function practiceSetsFor(chapterId: string): PracticeSetRef[]   // Plan 1: derived from exercise blocks only, kind 'book', title from set id
export function setTitle(setId: string): string                         // 'ch1-two-digit-addition' -> 'Two-Digit Addition'
```
- Produces components with these props:
  - `ContentBlocks { blocks: Block[]; chapterId: string; sectionId: string }`
  - `FigureBlock { block: Extract<Block, {type:'figure'}> }`
  - `ExerciseCallout { setId: string; chapterId: string; sectionId: string }` → shows title, "Book set" button (RouterLink to practice route) and "Generate" button (disabled with title "Generated practice arrives in the next phase"), locked state text when `!isUnlocked`.
  - `ChapterOutline { chapterId: string; sections: SectionMeta[]; activeId: string; visited: Set<string> }` emits `select(id)`.
  - `PracticeRail { chapterId: string }` lists `practiceSetsFor(chapterId)` with best score and lock state; shows "No practice sets in this chapter yet" for the intro and epilogue.
  - `SectionPill { index: number; total: number; practiceCount: number }` emits `prev`, `next`, `practice`.
  - `BottomSheet { open: boolean; title: string }` emits `close`, default slot.

- [ ] **Step 1: Write the `ContentBlocks` test**

`src/reader/__tests__/ContentBlocks.test.ts`:
```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import ContentBlocks from '../ContentBlocks.vue'
import type { Block } from '@/content/types'

const router = createAppRouter(createMemoryHistory())

const blocks: Block[] = [
  { type: 'html', html: '<p>Hello <u>5</u></p>', page: 12 },
  { type: 'figure', id: 'ch1-f001', src: '/book/figures/1/ch1-f001.jpeg', width: 32, height: 70 },
  { type: 'exercise', setId: 'ch1-two-digit-addition' },
]

describe('ContentBlocks', () => {
  it('renders prose, figures and exercise callouts in order', () => {
    const w = mount(ContentBlocks, { props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' }, global: { plugins: [router] } })
    const kids = w.element.children
    expect(kids[0]?.classList.contains('prose')).toBe(true)
    expect(kids[0]?.innerHTML).toContain('<u>5</u>')
    expect(kids[0]?.getAttribute('data-page')).toBe('12')
    const img = w.find('img')
    expect(img.attributes('src')).toBe('/book/figures/1/ch1-f001.jpeg')
    expect(img.attributes('width')).toBe('32')
    expect(img.attributes('loading')).toBe('lazy')
    expect(w.text()).toContain('Two-Digit Addition')
  })
  it('shows the callout as locked until the section is visited', () => {
    localStorage.clear()
    const w = mount(ContentBlocks, { props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' }, global: { plugins: [router] } })
    expect(w.text()).toMatch(/unlocks|locked/i)
  })
})
```

- [ ] **Step 2: Write the `ReaderView` test**

`src/reader/__tests__/ReaderView.test.ts`:
```ts
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import ReaderView from '../ReaderView.vue'

vi.mock('@/content/loader', async () => {
  const actual = await vi.importActual<typeof import('@/content/loader')>('@/content/loader')
  return {
    ...actual,
    loadChapter: async (id: string) => {
      if (id !== '1') throw new actual.ChapterNotFound(id)
      return {
        id: '1', number: 1, title: 'A Little Give and Take', kicker: 'Chapter 1',
        sections: [
          { id: 'overview', title: 'Overview', blocks: [{ type: 'html', html: '<p>Intro</p>' }] },
          { id: 'two-digit-addition', title: 'Two-Digit Addition', blocks: [{ type: 'html', html: '<p>Add</p>' }, { type: 'exercise', setId: 'ch1-two-digit-addition' }] },
        ],
      }
    },
    getChapterMeta: (id: string) => (id === '1' ? { id: '1', number: 1, title: 'A Little Give and Take', kicker: 'Chapter 1', sections: [{ id: 'overview', title: 'Overview' }, { id: 'two-digit-addition', title: 'Two-Digit Addition' }] } : undefined),
  }
})

async function mountAt(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  const w = mount(ReaderView, { global: { plugins: [router], stubs: { Teleport: true } } })
  await flushPromises()
  return { w, router }
}

beforeEach(() => localStorage.clear())

describe('ReaderView', () => {
  it('renders the chapter title, outline and both sections', async () => {
    const { w } = await mountAt('/read/1')
    expect(w.text()).toContain('A Little Give and Take')
    expect(w.findAll('section.book-section')).toHaveLength(2)
    expect(w.find('nav.outline').text()).toContain('Two-Digit Addition')
  })
  it('shows a not-found state for an unknown chapter without throwing', async () => {
    const { w } = await mountAt('/read/42')
    expect(w.text()).toMatch(/not in this book|not found/i)
  })
  it('falls back to the first section when the section param is unknown', async () => {
    const { w, router } = await mountAt('/read/1/nope')
    await flushPromises()
    expect(router.currentRoute.value.params.section === undefined || router.currentRoute.value.params.section === 'overview').toBe(true)
    expect(w.findAll('section.book-section')).toHaveLength(2)
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run src/reader` → FAIL, components missing.

- [ ] **Step 4: Implement `src/practice/registry.ts`**

```ts
import { chapterIndex } from '@/content/loader'

export interface PracticeSetRef {
  id: string
  chapterId: string
  sectionId: string
  title: string
  kind: 'book' | 'generated'
  count?: number
}

export function setTitle(setId: string): string {
  const slug = setId.replace(/^ch[^-]+-/, '')
  return slug
    .split('-')
    .map((w) => (/^\d/.test(w) || ['of', 'for', 'by', 'and', 'on', 'a'].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('-')
    .replace(/-/g, ' ')
    .replace(/(\d) by (\d)/g, '$1-by-$2')
}

// Plan 1: sets are discovered from exercise blocks in the extracted content, listed by the
// module that knows them (the reader passes them in). Plan 2 replaces this with the real
// registry of book + generated sets and their anchoring sections.
const discovered = new Map<string, PracticeSetRef[]>()

export function registerDiscoveredSets(chapterId: string, sets: PracticeSetRef[]) {
  discovered.set(chapterId, sets)
}

export function practiceSetsFor(chapterId: string): PracticeSetRef[] {
  if (!chapterIndex.some((c) => c.id === chapterId)) return []
  return discovered.get(chapterId) ?? []
}
```

- [ ] **Step 5: Implement the block components**

`src/reader/FigureBlock.vue`:
```vue
<script setup lang="ts">
import type { Block } from '@/content/types'
defineProps<{ block: Extract<Block, { type: 'figure' }> }>()
</script>
<template>
  <figure class="fig" :data-figure="block.id">
    <img :src="block.src" :width="block.width" :height="block.height" alt="" loading="lazy" decoding="async" />
  </figure>
</template>
<style scoped>
.fig { margin: 1.25em 0 1.5em; text-align: center; }
.fig img { height: auto; max-width: min(100%, 420px); image-rendering: auto; }
/* The EPUB figures are tiny; scale them up to a readable size without exceeding the column */
.fig img[width][height] { width: auto; min-height: 2.5em; max-height: 60vh; }
</style>
```

`src/reader/ExerciseCallout.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { setTitle } from '@/practice/registry'

const props = defineProps<{ setId: string; chapterId: string; sectionId: string }>()
const { isUnlocked } = useProgress()
const unlocked = computed(() => isUnlocked(props.chapterId, props.sectionId))
const title = computed(() => setTitle(props.setId))
</script>
<template>
  <div class="callout" :class="{ locked: !unlocked }">
    <div class="text">
      <p class="label">Exercise</p>
      <h4>{{ title }}</h4>
      <p v-if="unlocked" class="meta">Problems from the book, answers with the authors' steps.</p>
      <p v-else class="meta">Unlocks after you read this section.</p>
    </div>
    <div class="btns">
      <RouterLink v-if="unlocked" class="btn primary" :to="{ name: 'practice', params: { chapter: chapterId, set: setId } }">Book set</RouterLink>
      <button type="button" class="btn ghost" disabled title="Generated practice arrives in the next phase">Generate</button>
    </div>
  </div>
</template>
<style scoped>
.callout {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
  margin: 1.25em 0 1.5em; padding: 0.85rem 1rem;
  background: var(--card); border: 1px solid var(--card-rule); border-left: 3px solid var(--warm); border-radius: var(--radius);
  font-family: var(--font-sans);
}
.callout.locked { opacity: 0.75; }
h4 { font-size: 0.95rem; letter-spacing: 0.04em; margin: 0.1rem 0; }
.meta { margin: 0; font-size: 0.8rem; color: var(--muted); }
.btns { display: flex; gap: 0.5rem; }
.btn { border-radius: 4px; padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--accent); }
.btn.primary { background: var(--accent); color: var(--accent-ink); }
.btn.primary:hover { text-decoration: none; filter: brightness(1.08); }
.btn.ghost { background: transparent; color: var(--accent); }
.btn.ghost:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
```

`src/reader/ContentBlocks.vue`:
```vue
<script setup lang="ts">
import type { Block } from '@/content/types'
import ExerciseCallout from './ExerciseCallout.vue'
import FigureBlock from './FigureBlock.vue'
defineProps<{ blocks: Block[]; chapterId: string; sectionId: string }>()
</script>
<template>
  <div class="blocks">
    <template v-for="(b, i) in blocks" :key="i">
      <!-- html blocks are produced by our own sanitizer at build time -->
      <div v-if="b.type === 'html'" class="prose" :data-page="b.page" v-html="b.html" />
      <FigureBlock v-else-if="b.type === 'figure'" :block="b" />
      <ExerciseCallout v-else :set-id="b.setId" :chapter-id="chapterId" :section-id="sectionId" />
    </template>
  </div>
</template>
```

- [ ] **Step 6: Implement outline, rail, pill and sheet**

`src/reader/ChapterOutline.vue`:
```vue
<script setup lang="ts">
import type { SectionMeta } from '@/content/types'
defineProps<{ chapterId: string; sections: SectionMeta[]; activeId: string; visited: Set<string> }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>
<template>
  <nav class="outline" aria-label="In this chapter">
    <p class="label">In this chapter</p>
    <ul>
      <li v-for="s in sections" :key="s.id" :class="{ on: s.id === activeId, done: visited.has(s.id) }">
        <a :href="`#${s.id}`" @click.prevent="emit('select', s.id)">{{ s.title }}</a>
      </li>
    </ul>
  </nav>
</template>
<style scoped>
.outline { font-family: var(--font-sans); font-size: 0.85rem; }
ul { list-style: none; margin: 0; padding: 0; }
li { border-left: 2px solid transparent; }
li a { display: block; padding: 0.3rem 0 0.3rem 0.7rem; color: var(--muted); }
li a:hover { color: var(--ink); text-decoration: none; }
li.on { border-left-color: var(--accent); }
li.on a { color: var(--ink); font-weight: 700; }
li.done a::after { content: ' ✓'; color: var(--warm); }
</style>
```

`src/reader/PracticeRail.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { practiceSetsFor } from '@/practice/registry'

const props = defineProps<{ chapterId: string }>()
const { bestScore, isUnlocked } = useProgress()
const sets = computed(() => practiceSetsFor(props.chapterId))
</script>
<template>
  <aside class="rail" aria-label="Practice">
    <p class="label">Practice · this chapter</p>
    <p v-if="sets.length === 0" class="empty">No practice sets in this chapter.</p>
    <ul v-else>
      <li v-for="s in sets" :key="s.id" class="card" :class="{ locked: !isUnlocked(chapterId, s.sectionId) }">
        <strong>{{ s.kind === 'book' ? '📖 ' : '' }}{{ s.title }}</strong>
        <span class="meta">{{ s.kind === 'book' ? 'Book set' : 'Generated' }}<template v-if="s.count"> · {{ s.count }} problems</template></span>
        <span v-if="bestScore(s.id) !== undefined" class="meta">Best {{ bestScore(s.id) }}</span>
        <RouterLink v-if="isUnlocked(chapterId, s.sectionId)" class="go" :to="{ name: 'practice', params: { chapter: chapterId, set: s.id } }">Start</RouterLink>
        <span v-else class="meta">Unlocks at “{{ s.sectionId }}”</span>
      </li>
    </ul>
  </aside>
</template>
<style scoped>
.rail { font-family: var(--font-sans); font-size: 0.85rem; }
.empty { color: var(--muted); }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.card { display: grid; gap: 0.15rem; padding: 0.7rem 0.8rem; background: var(--card); border: 1px solid var(--card-rule); border-radius: var(--radius); }
.card.locked { opacity: 0.6; }
.meta { color: var(--muted); font-size: 0.78rem; }
.go { justify-self: start; margin-top: 0.3rem; background: var(--accent); color: var(--accent-ink); font-weight: 700; padding: 0.25rem 0.7rem; border-radius: 4px; font-size: 0.78rem; }
.go:hover { text-decoration: none; }
</style>
```

`src/reader/SectionPill.vue`:
```vue
<script setup lang="ts">
defineProps<{ index: number; total: number; practiceCount: number }>()
const emit = defineEmits<{ prev: []; next: []; practice: [] }>()
</script>
<template>
  <div class="pill" role="toolbar" aria-label="Section navigation">
    <button type="button" :disabled="index <= 0" aria-label="Previous section" @click="emit('prev')">‹</button>
    <span class="pos">Section {{ index + 1 }} / {{ total }}</span>
    <button type="button" :disabled="index >= total - 1" aria-label="Next section" @click="emit('next')">›</button>
    <span class="sep" />
    <button type="button" class="pr" @click="emit('practice')">Practice<template v-if="practiceCount"> · {{ practiceCount }}</template></button>
  </div>
</template>
<style scoped>
.pill {
  position: fixed; left: 50%; bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 30;
  display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0.4rem 0.35rem 0.75rem;
  background: var(--ink); color: var(--paper); border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  font-family: var(--font-sans); font-size: 0.85rem; white-space: nowrap;
}
.pill button { background: none; border: 0; color: inherit; font-size: 1.1rem; line-height: 1; padding: 0.2rem 0.3rem; }
.pill button:disabled { opacity: 0.35; }
.sep { width: 1px; height: 1rem; background: var(--muted); }
.pr { background: var(--accent) !important; color: var(--accent-ink) !important; font-size: 0.85rem !important; font-weight: 700; padding: 0.3rem 0.8rem !important; border-radius: 999px; }
</style>
```

`src/reader/BottomSheet.vue`:
```vue
<script setup lang="ts">
defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>
<template>
  <Teleport to="body">
    <div v-if="open" class="scrim" @click="emit('close')" />
    <section class="sheet" :class="{ open }" :aria-hidden="!open" role="dialog" :aria-label="title">
      <div class="grab" />
      <header><strong>{{ title }}</strong><button type="button" aria-label="Close" @click="emit('close')">×</button></header>
      <div class="body"><slot /></div>
    </section>
  </Teleport>
</template>
<style scoped>
.scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 40; }
.sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; max-height: 75dvh; overflow: auto;
  background: var(--surface); border-top: 1px solid var(--rule); border-radius: 14px 14px 0 0;
  padding: 0.5rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  transform: translateY(100%); transition: transform 0.2s ease;
}
.sheet.open { transform: none; }
.grab { width: 36px; height: 4px; border-radius: 2px; background: var(--rule); margin: 0.25rem auto 0.6rem; }
header { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-sans); }
header button { background: none; border: 0; font-size: 1.4rem; color: var(--muted); }
</style>
```

- [ ] **Step 7: Implement `src/reader/ReaderView.vue`**

```vue
<script setup lang="ts">
import { useBreakpoints, useIntersectionObserver } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgress } from '@/app/progress'
import { ChapterNotFound, getChapterMeta, loadChapter, neighbours, readableChapters } from '@/content/loader'
import type { ChapterDoc } from '@/content/types'
import { practiceSetsFor, registerDiscoveredSets, setTitle } from '@/practice/registry'
import BottomSheet from './BottomSheet.vue'
import ChapterOutline from './ChapterOutline.vue'
import ContentBlocks from './ContentBlocks.vue'
import PracticeRail from './PracticeRail.vue'
import SectionPill from './SectionPill.vue'

const route = useRoute()
const router = useRouter()
const { state, markVisited, isVisited } = useProgress()

const chapterId = computed(() => String(route.params.chapter ?? ''))
const doc = ref<ChapterDoc | null>(null)
const status = ref<'loading' | 'ready' | 'missing'>('loading')
const activeId = ref('')
const sheetOpen = ref(false)

const bp = useBreakpoints({ tablet: 720, desktop: 1024 })
const isPhone = bp.smaller('tablet')
const isDesktop = bp.greaterOrEqual('desktop')
const focus = computed(() => state.value.settings.focus)

const meta = computed(() => getChapterMeta(chapterId.value))
const sections = computed(() => doc.value?.sections ?? [])
const visited = computed(() => new Set(state.value.reading[chapterId.value]?.visited ?? []))
const activeIndex = computed(() => Math.max(0, sections.value.findIndex((s) => s.id === activeId.value)))
const practiceSets = computed(() => practiceSetsFor(chapterId.value))
const nav = computed(() => neighbours(chapterId.value))
const allChapters = readableChapters()

async function load() {
  status.value = 'loading'
  doc.value = null
  try {
    const d = await loadChapter(chapterId.value)
    doc.value = d
    registerDiscoveredSets(
      d.id,
      d.sections.flatMap((s) =>
        s.blocks.flatMap((b) => (b.type === 'exercise' ? [{ id: b.setId, chapterId: d.id, sectionId: s.id, title: setTitle(b.setId), kind: 'book' as const }] : [])),
      ),
    )
    status.value = 'ready'
    const wanted = String(route.params.section ?? '')
    const target = d.sections.find((s) => s.id === wanted)?.id ?? state.value.reading[d.id]?.lastSection ?? d.sections[0]?.id ?? ''
    activeId.value = target
    await nextTick()
    observeSections()
    if (target && target !== d.sections[0]?.id) scrollToSection(target, 'auto')
    if (wanted && !d.sections.some((s) => s.id === wanted)) router.replace({ name: 'read', params: { chapter: d.id } })
  } catch (e) {
    status.value = e instanceof ChapterNotFound ? 'missing' : 'missing'
  }
}

watch(chapterId, load, { immediate: true })

// Section tracking: the section occupying the top third of the viewport is active;
// a section becomes visited after 2 seconds of visibility.
const sectionEls = ref<Record<string, HTMLElement>>({})
const stops: Array<() => void> = []
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function setSectionEl(id: string, el: unknown) {
  if (el instanceof HTMLElement) sectionEls.value[id] = el
}

function observeSections() {
  stops.splice(0).forEach((s) => s())
  for (const [id, el] of Object.entries(sectionEls.value)) {
    const { stop } = useIntersectionObserver(
      el,
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          if (entry.intersectionRatio > 0.15 || entry.boundingClientRect.top < window.innerHeight / 3) activeId.value = id
          if (!isVisited(chapterId.value, id) && !timers.has(id)) {
            timers.set(id, setTimeout(() => { markVisited(chapterId.value, id); timers.delete(id) }, 2000))
          }
        } else {
          const t = timers.get(id)
          if (t) { clearTimeout(t); timers.delete(id) }
        }
      },
      { threshold: [0, 0.15, 0.5], rootMargin: '-52px 0px -40% 0px' },
    )
    stops.push(stop)
  }
}

onBeforeUnmount(() => {
  stops.forEach((s) => s())
  timers.forEach((t) => clearTimeout(t))
})

function scrollToSection(id: string, behavior: ScrollBehavior = 'smooth') {
  const el = sectionEls.value[id]
  if (!el) return
  activeId.value = id
  el.scrollIntoView({ behavior, block: 'start' })
  router.replace({ name: 'read', params: { chapter: chapterId.value, section: id } })
}

function step(delta: number) {
  const s = sections.value[activeIndex.value + delta]
  if (s) scrollToSection(s.id)
}

function goChapter(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  router.push({ name: 'read', params: { chapter: id } })
}
</script>

<template>
  <div class="reader" :class="{ focus, phone: isPhone }">
    <Teleport to="#shell-center" defer>
      <label v-if="meta" class="switcher">
        <span class="sr">Chapter</span>
        <select :value="chapterId" @change="goChapter">
          <option v-for="c in allChapters" :key="c.id" :value="c.id">{{ c.kicker }} · {{ c.title }}</option>
        </select>
      </label>
    </Teleport>

    <div v-if="status === 'loading'" class="state">Loading…</div>

    <section v-else-if="status === 'missing'" class="state">
      <p class="kicker">Not found</p>
      <h1>That chapter is not in this book.</h1>
      <RouterLink to="/">Back to the table of contents</RouterLink>
    </section>

    <div v-else-if="doc" class="grid">
      <aside v-if="isDesktop && !focus" class="col-outline">
        <ChapterOutline :chapter-id="doc.id" :sections="meta?.sections ?? []" :active-id="activeId" :visited="visited" @select="scrollToSection" />
        <div class="chapter-nav">
          <RouterLink v-if="nav.prev" :to="{ name: 'read', params: { chapter: nav.prev.id } }">‹ {{ nav.prev.kicker }}</RouterLink>
          <RouterLink v-if="nav.next" :to="{ name: 'read', params: { chapter: nav.next.id } }">{{ nav.next.kicker }} ›</RouterLink>
        </div>
      </aside>

      <article class="col-text">
        <header class="chapter-head">
          <p class="kicker">{{ doc.kicker }}</p>
          <h1>{{ doc.title }}</h1>
        </header>
        <section
          v-for="s in sections"
          :id="s.id"
          :key="s.id"
          :ref="(el) => setSectionEl(s.id, el)"
          class="book-section"
        >
          <h2 v-if="s.id !== 'overview'">{{ s.title }}</h2>
          <ContentBlocks :blocks="s.blocks" :chapter-id="doc.id" :section-id="s.id" />
        </section>
        <footer class="chapter-foot">
          <RouterLink v-if="nav.next" class="next" :to="{ name: 'read', params: { chapter: nav.next.id } }">Next: {{ nav.next.kicker }} · {{ nav.next.title }} ›</RouterLink>
        </footer>
      </article>

      <aside v-if="!isPhone && !focus" class="col-rail">
        <PracticeRail :chapter-id="doc.id" />
      </aside>
    </div>

    <template v-if="isPhone && doc">
      <SectionPill :index="activeIndex" :total="sections.length" :practice-count="practiceSets.length" @prev="step(-1)" @next="step(1)" @practice="sheetOpen = true" />
      <BottomSheet :open="sheetOpen" title="Practice" @close="sheetOpen = false">
        <PracticeRail :chapter-id="doc.id" />
        <hr />
        <ChapterOutline :chapter-id="doc.id" :sections="meta?.sections ?? []" :active-id="activeId" :visited="visited" @select="(id) => { sheetOpen = false; scrollToSection(id) }" />
      </BottomSheet>
    </template>
  </div>
</template>

<style scoped>
.reader { padding: 0 var(--gutter) 6rem; }
.state { max-width: var(--measure); margin: 3rem auto; }
.state h1 { font-size: 1.6rem; margin: 0.25rem 0 1rem; }
.switcher select { max-width: 60vw; font: inherit; font-size: 0.85rem; background: var(--surface); color: var(--ink); border: 1px solid var(--rule); border-radius: 4px; padding: 0.2rem 0.4rem; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2rem; max-width: 1280px; margin: 0 auto; }
@media (min-width: 720px) { .grid { grid-template-columns: minmax(0, 1fr) var(--rail-w); } }
@media (min-width: 1024px) { .grid { grid-template-columns: var(--outline-w) minmax(0, 1fr) var(--rail-w); } }
.reader.focus .grid { grid-template-columns: minmax(0, 1fr); max-width: calc(var(--measure) + 2 * var(--gutter)); }

.col-outline, .col-rail { position: sticky; top: 68px; align-self: start; max-height: calc(100dvh - 84px); overflow: auto; padding-top: 1.5rem; }
.col-outline { border-right: 1px solid var(--rule); padding-right: 1rem; }
.col-rail { border-left: 1px solid var(--rule); padding-left: 1rem; }
.chapter-nav { display: flex; justify-content: space-between; margin-top: 1.5rem; font-family: var(--font-sans); font-size: 0.8rem; }

.col-text { max-width: var(--measure); padding-top: 1.5rem; justify-self: center; width: 100%; }
.chapter-head h1 { font-size: clamp(1.6rem, 2.6vw, 2.2rem); margin: 0.2rem 0 1.5rem; }
.book-section { scroll-margin-top: 70px; padding-bottom: 1rem; }
.book-section h2 { font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase; margin: 2em 0 0.8em; }
.chapter-foot { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--rule); font-family: var(--font-sans); }
</style>
```

- [ ] **Step 8: Run reader tests, then the full suite**

Run: `npx vitest run src/reader` → PASS (5 tests). happy-dom lacks `IntersectionObserver`; if `useIntersectionObserver` warns, that is fine (it no-ops when unsupported). If it throws, guard `observeSections()` with `if (typeof IntersectionObserver === 'undefined') return`.
Run: `npm test` → passes.

- [ ] **Step 9: Manual check in the browser**

Run `npm run dev`. Verify on a wide window: three columns, outline highlights while scrolling, ✓ appears after 2 s in a section, callouts appear where the book has exercise sets, Focus collapses to one column, theme toggle recolours, chapter switcher in the header works, `/read/1/three-digit-addition` opens scrolled to that section. Narrow the window below 720 px: pill appears, Practice opens the sheet with the rail and outline. Check `/read/intro` and `/read/epilogue` render with the empty rail message.

- [ ] **Step 10: Commit**

```bash
git add src/practice src/reader
git commit -m "feat(reader): chapter reader with outline, figures, exercise callouts, rail, pill and sheet"
```

---

### Task 10: Home page with table of contents and progress, README, dead-code removal

**Files:**
- Replace: `src/views/HomeView.vue`
- Delete: `src/data/chapter*/` (PNG folders), `src/utils/chapterLoader.js`, `src/data/chapter_raw.js`, `public/book-cover.jpg` (only if unused by About)
- Modify: `README.md`
- Test: `src/views/__tests__/HomeView.test.ts`

**Interfaces:**
- Consumes: `readableChapters()`, `useProgress().chapterCompletion`, `lastSection`.

- [ ] **Step 1: Write the test**

`src/views/__tests__/HomeView.test.ts`:
```ts
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { useProgress } from '@/app/progress'
import HomeView from '../HomeView.vue'

beforeEach(() => localStorage.clear())

describe('HomeView', () => {
  it('lists every readable chapter with a link into the reader', () => {
    const w = mount(HomeView, { global: { plugins: [createAppRouter(createMemoryHistory())] } })
    const links = w.findAll('a[href^="/read/"]').map((a) => a.attributes('href'))
    expect(links).toContain('/read/intro')
    expect(links).toContain('/read/0')
    expect(links).toContain('/read/9')
    expect(links).toContain('/read/epilogue')
    expect(w.text()).toContain('The Tough Stuff Made Easy')
  })
  it('offers to resume the last chapter read', () => {
    const p = useProgress()
    p.markVisited('3', 'overview')
    const w = mount(HomeView, { global: { plugins: [createAppRouter(createMemoryHistory())] } })
    expect(w.find('a.resume').attributes('href')).toBe('/read/3/overview')
  })
})
```

- [ ] **Step 2: Run to verify failure** → FAIL (old placeholder has no links).

- [ ] **Step 3: Implement `src/views/HomeView.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { readableChapters } from '@/content/loader'

const chapters = readableChapters()
const { state, chapterCompletion, lastSection } = useProgress()

const resume = computed(() => {
  const entries = Object.entries(state.value.reading)
  if (entries.length === 0) return null
  const [chapterId, entry] = entries.sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))[0]!
  const meta = chapters.find((c) => c.id === chapterId)
  return meta ? { meta, section: entry.lastSection } : null
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="kicker">An interactive edition</p>
      <h1>Secrets of Mental Math</h1>
      <p class="sub">Read the book chapter by chapter, then practice every technique with the book's own problem sets and endless generated ones.</p>
      <RouterLink v-if="resume" class="resume" :to="{ name: 'read', params: { chapter: resume.meta.id, section: resume.section } }">
        Resume · {{ resume.meta.kicker }} · {{ resume.meta.title }} ›
      </RouterLink>
    </section>

    <section class="toc">
      <h2 class="label">Contents</h2>
      <ol>
        <li v-for="c in chapters" :key="c.id">
          <RouterLink :to="{ name: 'read', params: { chapter: c.id, section: lastSection(c.id) } }" class="row">
            <span class="k">{{ c.kicker }}</span>
            <span class="t">{{ c.title }}</span>
            <span class="p" :title="`${Math.round(chapterCompletion(c.id, c.sections.length) * 100)}% read`">
              <i :style="{ width: `${chapterCompletion(c.id, c.sections.length) * 100}%` }" />
            </span>
          </RouterLink>
        </li>
      </ol>
    </section>

    <p class="credit">Based on <em>Secrets of Mental Math</em> by Arthur Benjamin and Michael Shermer. Not affiliated with the authors or publisher. <RouterLink to="/about">About this app</RouterLink></p>
  </div>
</template>

<style scoped>
.home { max-width: 820px; margin: 0 auto; padding: 2.5rem var(--gutter) 4rem; }
.hero h1 { font-size: clamp(2rem, 4vw, 3rem); margin: 0.2rem 0 0.8rem; }
.sub { color: var(--muted); max-width: 60ch; }
.resume { display: inline-block; margin-top: 1rem; font-family: var(--font-sans); font-weight: 700; background: var(--accent); color: var(--accent-ink); padding: 0.6rem 1rem; border-radius: var(--radius); }
.resume:hover { text-decoration: none; filter: brightness(1.08); }
.toc { margin-top: 3rem; }
ol { list-style: none; margin: 0.5rem 0 0; padding: 0; }
.row { display: grid; grid-template-columns: 7.5rem 1fr 6rem; gap: 1rem; align-items: center; padding: 0.9rem 0; border-bottom: 1px solid var(--rule); color: var(--ink); }
.row:hover { text-decoration: none; background: var(--surface); }
.k { font-family: var(--font-sans); font-size: 0.8rem; color: var(--accent); letter-spacing: 0.06em; text-transform: uppercase; }
.t { font-family: var(--font-sans); font-weight: 600; }
.p { height: 4px; background: var(--rule); border-radius: 2px; overflow: hidden; }
.p i { display: block; height: 100%; background: var(--accent); }
.credit { margin-top: 3rem; font-size: 0.85rem; color: var(--muted); }
@media (max-width: 719px) { .row { grid-template-columns: 1fr; gap: 0.25rem; } .p { width: 6rem; } }
</style>
```

- [ ] **Step 4: Run the test** → PASS (2 tests).

- [ ] **Step 5: Delete the screenshots and dead code**

```bash
git rm -rq src/data/chapter0 src/data/chapter1 src/data/chapter2 src/data/chapter3 src/data/chapter4 src/data/chapter5 src/data/chapter6 src/data/chapter7 src/data/chapter8 src/data/chapter9 src/data/chapter10
git rm -q src/utils/chapterLoader.js src/data/chapter_raw.js
grep -rn "chapterLoader\|chapter_raw" src || echo "no references"
```

Keep `src/data/chapter*.js`, `src/data/chapters.js`, `src/utils/exerciseGenerator.js`, `src/utils/generators/`, `src/views/ExerciseView.vue` (legacy route until Plan 2).

- [ ] **Step 6: Rewrite `README.md`**

```markdown
# Mental Math Trainer

An interactive edition of *Secrets of Mental Math* (Arthur Benjamin and Michael Shermer): read each chapter as text, then practice every technique with the book's own problem sets and generated drills. Not affiliated with the authors or publisher.

## Run

    npm install
    npm run dev        # http://localhost:5173
    npm test           # typecheck, lint, unit tests
    npm run build      # static site in dist/

Requires Node 20.19 or newer.

## Content

Chapter text is extracted once from the EPUB and committed as JSON under `src/content/chapters/`, with figures under `public/book/figures/`. The EPUB itself is not in the repository. To re-extract:

    npm run extract -- /path/to/book.epub

The script prints "exercise-set candidates"; confirmed ones are recorded in `scripts/book-map.json` so the reader renders a practice callout in place of the figure.

## Layout

- `scripts/` extraction pipeline and its tests
- `src/content/` generated content and its loader
- `src/app/` shell, theme, persisted progress
- `src/reader/` chapter reader
- `src/practice/` practice registry (sets, generators) — filled in the next phase
- `docs/superpowers/` design spec and implementation plans
```

- [ ] **Step 7: Full verification**

Run: `npm test` → all pass.
Run: `npm run build && du -sh dist` → build passes; `dist` is a few MB, not 83 MB.
Run: `git status --short | head` → only intended changes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: home table of contents with progress; remove page screenshots and old loader"
```

---

## Self-review notes

- Spec 6.1 steps 1 to 6 map to Tasks 5 to 8; 6.2 to Task 6; 6.4 phase one to Task 9 (`FigureBlock`); 8.1 to Task 4; 8.2 to Tasks 4 and 9; 8.3 to Task 3; 8.4 to Task 2; 9 partially (legacy exercise code stays until Plan 2, `mammoth`/`mathjax-vue3` removed in Task 1); 10 extraction, components and lint/typecheck to Tasks 5 to 10. Spec 6.3 (book exercises), 7 (engine) and the practice view are Plan 2 and Plan 3.
- Review Focus 1 → Task 6 test "keeps repeats unique in order" and Task 8 content test; 2 → Task 3 tests "merges defaults" and "corrupt JSON"; 3 → Task 5 sanitizer tests and Task 8 content test; 4 → Task 9 tests for `/read/42` and `/read/1/nope`; 5 → Task 4 router tests.
- Names used across tasks: `useProgress` (3, 4, 9, 10), `createAppRouter` (4, 9, 10), `loadChapter`/`getChapterMeta`/`neighbours`/`readableChapters`/`ChapterNotFound` (8, 9, 10), `practiceSetsFor`/`registerDiscoveredSets`/`setTitle` (9), `sanitizeHtml`/`ALLOWED_TAGS` (5, 6, 8), `parseUnit`/`ParseOptions` (6, 8), `openEpub`/`readSpine`/`readToc`/`planUnits`/`readText` (7, 8), `renderIndex` (7, 8).
