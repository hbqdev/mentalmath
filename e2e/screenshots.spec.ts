import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page, type TestInfo } from './fixtures'
import { formatAnswer } from '../src/exercises/checker'
import { findGenerated } from '../src/exercises/generators'
import { generateMany } from '../src/exercises/generators/shared'
import { createRng } from '../src/exercises/rng'
import { bookExercises } from '../src/exercises/bookSets'
import '../src/content/book-exercises'
import {
  freezeClock,
  lockUntilRead,
  sampleProgress,
  seedProgress,
  selectTheme,
  typeAnswer,
  unlockAll,
} from './helpers'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'screenshots')

async function shot(
  page: Page,
  info: TestInfo,
  area: string,
  scene: string,
  opts: { fullPage?: boolean } = {},
) {
  const dir = path.join(ROOT, area)
  mkdirSync(dir, { recursive: true })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: path.join(dir, `${scene}-${info.project.name}.png`),
    animations: 'disabled',
    fullPage: opts.fullPage ?? false,
  })
}

test.describe('screenshots', () => {
  test('home', async ({ page }, info) => {
    await freezeClock(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await shot(page, info, 'home', 'home-fresh')
  })

  test('home with progress', async ({ page }, info) => {
    await seedProgress(page, sampleProgress)
    await freezeClock(page)
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Resume/ })).toBeVisible()
    await shot(page, info, 'home', 'home-with-progress')
  })

  test('reader chapter 1', async ({ page }, info) => {
    await seedProgress(page, sampleProgress)
    await page.goto('/read/1/left-to-right-addition')
    await expect(page.locator('#left-to-right-addition')).toBeVisible()
    await shot(page, info, 'reader', 'chapter-1')
  })

  test('reader focus and dark', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop')
    await seedProgress(page, {
      ...sampleProgress,
      settings: { ...sampleProgress.settings, focus: true },
    })
    await page.goto('/read/0/instant-multiplication')
    await expect(page.locator('#instant-multiplication')).toBeVisible()
    await shot(page, info, 'reader', 'chapter-0-focus')
    await page.getByTestId('focus-toggle').click()
    await selectTheme(page, 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await shot(page, info, 'reader', 'chapter-0-dark')
    await selectTheme(page, 'bright')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'bright')
    await shot(page, info, 'reader', 'chapter-0-bright')
  })

  test('reader text settings open', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop')
    await seedProgress(page, sampleProgress)
    await page.goto('/read/1/left-to-right-addition')
    await page.getByTestId('text-toggle').click()
    await page.getByTestId('font-size').fill('21')
    await page.getByTestId('font-sans').click()
    await expect(page.getByTestId('text-panel')).toBeVisible()
    await shot(page, info, 'reader', 'text-settings')
  })

  test('reader paged section on a phone', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop')
    await seedProgress(page, sampleProgress)
    await page.goto('/read/1/left-to-right-addition')
    await expect(page.getByTestId('section-page')).toBeVisible()
    await shot(page, info, 'reader', 'chapter-1-paged')
    await page.getByTestId('practice-this').scrollIntoViewIfNeeded()
    await shot(page, info, 'reader', 'chapter-1-paged-footer')
  })

  test('reader sheet open', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop')
    await seedProgress(page, sampleProgress)
    await page.goto('/read/1')
    await page.getByTestId('pill-practice').click()
    await expect(page.getByTestId('sheet')).toBeVisible()
    await shot(page, info, 'reader', 'chapter-1-sheet-open')
  })

  test('practice prompt, wrong answer, results', async ({ page }, info) => {
    await unlockAll(page)
    await freezeClock(page)
    const def = findGenerated('gen1-two-digit-addition')!
    const answers = generateMany(def, 10, 'mixed', createRng(42)).map((e) => formatAnswer(e.answer))
    await page.goto('/practice/1/gen1-two-digit-addition?mode=generated&seed=42')
    await expect(page.getByTestId('practice-prompt')).toBeVisible()
    await shot(page, info, 'practice', 'session-prompt')
    await typeAnswer(page, '0')
    if (info.project.name !== 'desktop') await page.getByTestId('drill-steps-toggle').click()
    await expect(page.getByTestId('solution-steps')).toBeVisible()
    await shot(page, info, 'practice', 'session-wrong-answer')
    await page.getByTestId('next-button').click()
    for (let i = 1; i < answers.length; i++) {
      await typeAnswer(page, answers[i]!)
      await page.getByTestId('next-button').click()
    }
    await expect(page.getByTestId('results')).toBeVisible()
    await shot(page, info, 'practice', 'session-results')
  })

  test('practice prompts gallery', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop')
    await unlockAll(page)
    for (const [set, chapter] of [
      ['gen4-multiplying-fractions', '4'],
      ['gen6-columns-of-numbers', '6'],
      ['gen4-divisibility', '4'],
      ['gen7-number-to-word', '7'],
    ] as const) {
      await page.goto(`/practice/${chapter}/${set}?mode=generated&seed=11`)
      await expect(page.getByTestId('practice-prompt')).toBeVisible()
      await shot(page, info, 'practice', `prompt-${set}`)
    }
  })

  test('book session prompt, steps, results', async ({ page }, info) => {
    await unlockAll(page)
    await freezeClock(page)
    const problems = bookExercises('ch1-three-digit-subtraction')
    await page.goto('/practice/1/ch1-three-digit-subtraction?view=one')
    await expect(page.getByTestId('practice-prompt')).toBeVisible()
    await shot(page, info, 'practice', 'book-session-prompt')
    await typeAnswer(page, '0')
    if (info.project.name !== 'desktop') await page.getByTestId('drill-steps-toggle').click()
    await expect(page.getByTestId('solution-steps')).toBeVisible()
    await shot(page, info, 'practice', 'book-session-steps')
    await page.getByTestId('next-button').click()
    for (let i = 1; i < problems.length; i++) {
      await typeAnswer(page, formatAnswer(problems[i]!.answer))
      await page.getByTestId('next-button').click()
    }
    await expect(page.getByTestId('results')).toBeVisible()
    await shot(page, info, 'practice', 'book-session-results')
  })

  test('date prompt with weekday choices', async ({ page }, info) => {
    await unlockAll(page)
    await page.goto('/practice/9/ch9-a-day-for-any-date?view=one')
    await expect(page.getByTestId('choice-monday')).toBeVisible()
    await shot(page, info, 'practice', 'book-date-prompt')
  })

  test('book worksheet', async ({ page }, info) => {
    await unlockAll(page)
    await freezeClock(page)
    const problems = bookExercises('ch1-two-digit-addition')
    await page.goto('/practice/1/ch1-two-digit-addition')
    await expect(page.getByTestId('worksheet')).toBeVisible()
    await page.getByTestId('sheet-input-1').fill(formatAnswer(problems[0]!.answer))
    await page.getByTestId('sheet-check-1').click()
    await page.getByTestId('sheet-input-2').fill('0')
    await page.getByTestId('sheet-check-2').click()
    await expect(page.getByTestId('sheet-verdict-2')).toBeVisible()
    await shot(page, info, 'practice', 'book-worksheet')
  })

  test('settings and progress', async ({ page }, info) => {
    await seedProgress(page, sampleProgress)
    await page.goto('/settings')
    await expect(page.getByTestId('setting-paged')).toBeVisible()
    await shot(page, info, 'home', 'settings')
    await page.goto('/progress')
    await expect(page.getByTestId('progress-totals')).toBeVisible()
    await shot(page, info, 'home', 'progress')
  })

  test('practice hub', async ({ page }, info) => {
    await seedProgress(page, sampleProgress)
    await page.goto('/practice')
    await expect(page.getByTestId('technique-gen1-two-digit-addition')).toBeVisible()
    await shot(page, info, 'practice', 'hub')
  })

  test('locked set', async ({ page }, info) => {
    await lockUntilRead(page)
    await page.goto('/practice/1/ch1-two-digit-addition')
    await expect(page.getByTestId('locked')).toBeVisible()
    await shot(page, info, 'practice', 'set-locked')
  })

  test.describe('figures', () => {
    // Typeset worked examples replace the EPUB images; each scene scrolls one figure into view.
    async function figureShot(
      page: Page,
      info: TestInfo,
      url: string,
      figureId: string,
      scene: string,
    ) {
      await page.goto(url)
      const fig = page.locator(`[data-figure="${figureId}"]`)
      await expect(fig).toHaveAttribute('data-override', /.+/)
      await fig.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await shot(page, info, 'figures', scene)
    }

    test('chapter 1 worked examples', async ({ page }, info) => {
      await seedProgress(page, sampleProgress)
      await figureShot(
        page,
        info,
        '/read/1/left-to-right-addition',
        'ch1-f018',
        'chapter-1-worked-examples',
      )
    })

    test('chapter 1 dark and large font', async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop')
      await seedProgress(page, {
        ...sampleProgress,
        settings: { ...sampleProgress.settings, theme: 'dark' },
      })
      await figureShot(
        page,
        info,
        '/read/1/left-to-right-subtraction',
        'ch1-f043',
        'chapter-1-dark',
      )
      await page.evaluate(() => {
        const raw = JSON.parse(localStorage.getItem('mentalmath.v1') ?? '{}')
        raw.settings = { ...raw.settings, theme: 'light', fontSize: 22 }
        localStorage.setItem('mentalmath.v1', JSON.stringify(raw))
      })
      await figureShot(
        page,
        info,
        '/read/1/left-to-right-addition',
        'ch1-f019',
        'chapter-1-large-font',
      )
    })

    test('chapter 2 table, partial products and squares', async ({ page }, info) => {
      await seedProgress(page, sampleProgress)
      await figureShot(
        page,
        info,
        '/read/2/multiplication-table-of-numbers-1-10',
        'ch2-f001',
        'chapter-2-multiplication-table',
      )
      await figureShot(
        page,
        info,
        '/read/2/3-by-1-multiplication-problems',
        'ch2-f019',
        'chapter-2-partial-products',
      )
      await figureShot(
        page,
        info,
        '/read/2/be-there-or-b2-squaring-two-digit-numbers',
        'ch2-f029',
        'chapter-2-distance-table',
      )
      await figureShot(
        page,
        info,
        '/read/2/be-there-or-b2-squaring-two-digit-numbers',
        'ch2-f035',
        'chapter-2-squares',
      )
    })

    test('chapter 3 eleven glyph, side-by-side routes and nested squares', async ({
      page,
    }, info) => {
      await seedProgress(page, sampleProgress)
      await figureShot(
        page,
        info,
        '/read/3/2-by-2-multiplication-problems',
        'ch3-f009',
        'chapter-3-eleven',
      )
      await figureShot(
        page,
        info,
        '/read/3/2-by-2-multiplication-problems',
        'ch3-f025',
        'chapter-3-or-routes',
      )
      await figureShot(
        page,
        info,
        '/read/3/three-digit-squares',
        'ch3-f036',
        'chapter-3-nested-squares',
      )
      await figureShot(
        page,
        info,
        '/read/3/three-digit-squares',
        'ch3-f041',
        'chapter-3-figure-with-callout',
      )
    })

    test('chapters 4 to 9: division, tables, criss-cross, mod sums, big squares, magic squares', async ({
      page,
    }, info) => {
      await seedProgress(page, sampleProgress)
      await figureShot(
        page,
        info,
        '/read/4/one-digit-division',
        'ch4-f003',
        'chapter-4-long-division',
      )
      await figureShot(
        page,
        info,
        '/read/4/matching-wits-with-a-calculator-learning-decimalization',
        'ch4-f036',
        'chapter-4-decimal-table',
      )
      await figureShot(
        page,
        info,
        '/read/4/matching-wits-with-a-calculator-learning-decimalization',
        'ch4-f099',
        'chapter-4-fractions',
      )
      await figureShot(
        page,
        info,
        '/read/5/addition-guesstimation',
        'ch5-f005',
        'chapter-5-receipts',
      )
      await figureShot(
        page,
        info,
        '/read/5/square-root-estimation-divide-and-average',
        'ch5-f023',
        'chapter-5-divide-and-average',
      )
      await figureShot(page, info, '/read/6/mod-sums', 'ch6-f002', 'chapter-6-mod-sums')
      await figureShot(
        page,
        info,
        '/read/6/pencil-and-paper-square-roots',
        'ch6-f005',
        'chapter-6-square-root',
      )
      await figureShot(
        page,
        info,
        '/read/6/pencil-and-paper-multiplication',
        'ch6-f020',
        'chapter-6-crisscross',
      )
      await figureShot(page, info, '/read/7/the-phonetic-code', 'ch7-f002', 'chapter-7-mnemonic')
      await figureShot(page, info, '/read/8/four-digit-squares', 'ch8-f003', 'chapter-8-big-square')
      await figureShot(
        page,
        info,
        '/read/8/3-by-3-multiplication',
        'ch8-f044',
        'chapter-8-close-together',
      )
      await figureShot(
        page,
        info,
        '/read/8/5-by-5-multiplication',
        'ch8-f070',
        'chapter-8-five-by-five',
      )
      await figureShot(page, info, '/read/9/magic-squares', 'ch9-f009', 'chapter-9-magic-square')
      await figureShot(page, info, '/read/9/a-day-for-any-date', 'ch9-f016', 'chapter-9-year-codes')
    })
  })
})
