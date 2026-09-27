# Addendum to the revamp spec: end-to-end tests and UI-driven development

Date: 2026-09-27
Amends: `2026-09-26-mentalmath-revamp-design.md`
Status: approved by the owner in conversation ("full test end to end, UI driving design and testing, create a folder to store the screenshots for UI driven development"); completion criteria met at the end of Plan 4 (2026-09-27): unit, lint, typecheck, build and end-to-end suites green, screenshots regenerated from the final UI.

## 1. End-to-end tests are in scope now, not later

Section 10 of the spec listed Playwright as a later option. It is now part of
every remaining plan.

- Tooling: `@playwright/test` with Chromium only. Config at `e2e/playwright.config.ts`.
- Two projects: `desktop` (1280 by 900) and `phone` (393 by 851, touch, device scale 2).
- The suite runs against `vite preview` of a fresh production build, so it
  exercises the same bundle a user gets. `npm run e2e` builds then tests;
  `npm run e2e:ui` opens Playwright's UI for local debugging.
- Coverage required by the end of Plan 4:
  - Reader: open a chapter, outline navigation, section visit unlocks its
    exercise callout, focus mode, theme toggle, phone pill and sheet.
  - Practice: a full generated session with a seeded RNG (`?seed=`) so the
    test can compute expected answers, wrong answer shows solution steps,
    results recorded and visible in the rail and on the home page.
  - Book sets: a full book session for at least one set per chapter that has
    them, answers taken from the committed dataset.
  - Home: resume link and progress bars reflect stored progress.
  - Streak and unlock-all setting.
- Determinism: practice accepts a `seed` query parameter that seeds the
  generator RNG. Without it a random seed is used and shown in the results
  screen so a session can be reproduced.

## 2. UI-driven development with committed screenshots

- Folder: `screenshots/` at the repository root, committed. Subfolders per
  area: `screenshots/reader/`, `screenshots/practice/`, `screenshots/home/`,
  `screenshots/figures/`. File names: `<scene>-<project>.png`, for example
  `chapter-1-desktop.png`, `session-wrong-answer-phone.png`.
- A dedicated spec `e2e/screenshots.spec.ts` regenerates every screenshot;
  `npm run shots` runs only that spec. Screenshots are taken with animations
  disabled and a fixed clock so they are stable.
- Loop: every UI task ends by regenerating screenshots, viewing them, and
  fixing what looks wrong before the task is marked complete. The reviewer
  of each plan views the screenshots too.
- Screenshots are documentation, not assertions. Visual regression
  comparison is not enabled; the committed images are for human review and
  for the design conversation.

## 3. Completion criteria for "the entire book"

The owner's definition of done for the remaining plans:

1. Every chapter 0 to 9 has generated practice for every technique the
   chapter teaches, with method steps.
2. Every book exercise set (40 sets located in Plan 1) has its problems and
   the authors' answers transcribed, verified by computation where possible.
3. Plans 2, 3 and 4 executed with the unit suite, lint, typecheck, build and
   the end-to-end suite all green.
4. Screenshots in `screenshots/` reflect the final UI.
