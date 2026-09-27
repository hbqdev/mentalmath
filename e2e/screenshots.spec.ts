import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { formatAnswer } from '../src/exercises/checker'
import { findGenerated } from '../src/exercises/generators'
import { generateMany } from '../src/exercises/generators/shared'
import { createRng } from '../src/exercises/rng'
import { freezeClock, sampleProgress, seedProgress, unlockAll } from './helpers'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'screenshots')

async function shot(page: Page, info: TestInfo, area: string, scene: string, opts: { fullPage?: boolean } = {}) {
  const dir = path.join(ROOT, area)
  mkdirSync(dir, { recursive: true })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(dir, `${scene}-${info.project.name}.png`), animations: 'disabled', fullPage: opts.fullPage ?? false })
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
    await seedProgress(page, { ...sampleProgress, settings: { ...sampleProgress.settings, focus: true } })
    await page.goto('/read/0/instant-multiplication')
    await expect(page.locator('#instant-multiplication')).toBeVisible()
    await shot(page, info, 'reader', 'chapter-0-focus')
    await page.getByTestId('focus-toggle').click()
    await page.getByTestId('theme-toggle').click() // light -> dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await shot(page, info, 'reader', 'chapter-0-dark')
  })

  test('reader sheet open', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone')
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
    await page.getByTestId('answer-input').fill('0')
    await page.getByTestId('answer-input').press('Enter')
    await expect(page.getByTestId('solution-steps')).toBeVisible()
    await shot(page, info, 'practice', 'session-wrong-answer')
    await page.getByTestId('next-button').click()
    for (let i = 1; i < answers.length; i++) {
      await page.getByTestId('answer-input').fill(answers[i]!)
      await page.getByTestId('answer-input').press('Enter')
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

  test('locked set', async ({ page }, info) => {
    await page.goto('/practice/1/ch1-two-digit-addition')
    await expect(page.getByTestId('locked')).toBeVisible()
    await shot(page, info, 'practice', 'set-locked')
  })
})
