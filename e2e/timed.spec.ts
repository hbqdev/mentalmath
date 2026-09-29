import { expect, test } from './fixtures'
import { formatAnswer } from '../src/exercises/checker'
import { findGenerated } from '../src/exercises/generators'
import { generateMany } from '../src/exercises/generators/shared'
import { createRng } from '../src/exercises/rng'
import { seedProgress, typeAnswer, unlockAll } from './helpers'

const SET = 'gen1-two-digit-addition'
const firstAnswer = (seed: number) =>
  formatAnswer(generateMany(findGenerated(SET)!, 1, 'mixed', createRng(seed))[0]!.answer)

test.describe('timed drills', () => {
  test('the hub opens the timed sheet and starts a sprint that ends when the clock runs out', async ({
    page,
  }) => {
    await unlockAll(page)
    await page.clock.install()
    await page.goto('/practice')
    await page.getByTestId(`technique-${SET}`).getByTestId('timed').click()
    await expect(page.getByTestId('timed-sheet')).toBeVisible()
    await page.getByTestId('len-60').click()
    await expect(page.getByTestId('timed-summary')).toHaveText('1 min sprint')
    await page.getByTestId('timed-start').click()
    await expect(page).toHaveURL(/\/practice\/1\/gen1-two-digit-addition\?.*len=1m/)
    await expect(page.getByTestId('practice-progress')).toHaveText('0 answered')
    const seed = Number(new URL(page.url()).searchParams.get('seed'))
    await typeAnswer(page, firstAnswer(seed))
    await expect(page.getByTestId('feedback')).toContainText('Correct')
    await page.getByTestId('next-button').click()
    await expect(page.getByTestId('practice-progress')).toHaveText('1 answered')
    await page.clock.fastForward(61_000)
    await expect(page.getByTestId('results-score')).toHaveText('1 / 1')
    await expect(page.getByTestId('results-timed')).toHaveText('1 min sprint')
    await expect(page.getByTestId('results-best')).toContainText('New best: 1 in 1 min')
    await page.goto('/practice')
    await expect(page.getByTestId(`technique-${SET}`).getByTestId('best-line')).toContainText(
      '1 in 1 min',
    )
  })

  test('a shot clock counts down and times a problem out', async ({ page }) => {
    await unlockAll(page)
    await page.clock.install()
    await page.goto(`/practice/1/${SET}?mode=generated&shot=10&seed=5`)
    await expect(page.getByTestId('shot-clock')).toBeVisible()
    await page.clock.fastForward(10_500)
    await expect(page.getByTestId('feedback')).toContainText("Time's up")
    await page.getByTestId('next-button').click()
    await expect(page.getByTestId('practice-progress')).toContainText('2 / 10')
  })

  test('the timed chip on a practice page reopens the sheet with the current options', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'the chip sits in the desktop toolbar')
    await unlockAll(page)
    await page.goto(`/practice/1/${SET}?mode=generated&len=2m&shot=20&seed=5`)
    await expect(page.getByTestId('timed-open')).toContainText('2 min sprint · 20 s per problem')
    await page.getByTestId('timed-open').click()
    await expect(page.getByTestId('len-120')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('shot-20')).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('timed-close').click()
    await expect(page.getByTestId('timed-sheet')).toHaveCount(0)
  })
})

test.describe('spaced review', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  test('Home and the Practice tab list what is due, most overdue first', async ({ page }) => {
    await seedProgress(page, {
      settings: { lockUntilRead: false },
      practice: {
        [SET]: {
          attempts: [{ at: daysAgo(6), correct: 3, total: 10, seconds: 60, mode: 'generated' }],
          best: 3,
        },
        'gen1-two-digit-subtraction': {
          attempts: [{ at: daysAgo(4), correct: 8, total: 10, seconds: 60, mode: 'generated' }],
          best: 8,
        },
        'gen2-2-by-1-multiplication': {
          attempts: [{ at: daysAgo(0), correct: 10, total: 10, seconds: 60, mode: 'generated' }],
          best: 10,
        },
      },
    })
    await page.goto('/')
    const due = page.getByTestId('due-today')
    await expect(due).toBeVisible()
    const items = due.locator('[data-testid^="due-item-"]')
    await expect(items).toHaveCount(2)
    await expect(items.first()).toContainText('Two-digit addition')
    await expect(items.first()).toContainText('5 days overdue')
    await page.goto('/practice')
    await expect(page.getByTestId('due-today').locator('[data-testid^="due-item-"]')).toHaveCount(2)
    await page.getByTestId(`due-item-${SET}`).getByRole('link', { name: 'Practice' }).click()
    await expect(page).toHaveURL(/\/practice\/1\/gen1-two-digit-addition\?mode=generated&seed=/)
    await expect(page.getByTestId('practice-progress')).toContainText('1 / 10')
  })

  test('a new user sees no review block', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('due-today')).toHaveCount(0)
  })

  test('nothing due shows what comes next', async ({ page }) => {
    await seedProgress(page, {
      practice: {
        [SET]: {
          attempts: [{ at: daysAgo(0), correct: 10, total: 10, seconds: 50, mode: 'generated' }],
          best: 10,
        },
      },
    })
    await page.goto('/')
    await expect(page.getByTestId('due-empty')).toContainText('Nothing due today')
    await expect(page.getByTestId('due-next')).toContainText('Two-digit addition')
  })
})
