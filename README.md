# Mental Math Trainer

An interactive edition of *Secrets of Mental Math* (Arthur Benjamin and Michael Shermer): read each chapter as text, then practice every technique with the book's own problem sets and generated drills. Not affiliated with the authors or publisher.

## Run

    npm install
    npm run dev        # http://localhost:5173
    npm test           # typecheck, lint, unit tests
    npm run build      # static site in dist/

Requires Node 20.19 or newer and npm 10 or newer (npm 9 fails to resolve this dependency tree; `npx npm@10 install` works on older systems).

## Content

Chapter text is extracted once from the EPUB and committed as JSON under `src/content/chapters/`, with figures under `public/book/figures/`. The EPUB itself is not in the repository. To re-extract:

    npm run extract -- /path/to/book.epub

The script prints "exercise-set candidates". Confirmed ones are recorded in `scripts/book-map.json`, which maps figure ids to practice-set ids so the reader renders a callout in place of the problem-list image (`exerciseSets`) or right after a figure that also holds a worked example (`exerciseAfter`).

## Layout

- `scripts/` extraction pipeline and its tests
- `src/content/` generated content, its types and loader
- `src/app/` shell, theme, persisted progress
- `src/reader/` chapter reader
- `src/practice/` practice registry (sets, generators), filled in the next phase
- `docs/superpowers/` design spec and implementation plans

## Status

Phase 1 (reader) is complete. The practice engine with book and generated exercise sets is the next phase; until then the legacy exercise view remains reachable at `/exercises/:chapter/:type`.
