import { expect, test } from '@playwright/test'
import { formatAnswer } from '../src/exercises/checker'
import { findGenerated } from '../src/exercises/generators'
import { generateMany } from '../src/exercises/generators/shared'
import { createRng } from '../src/exercises/rng'
import { unlockAll } from './helpers'

const SET = 'gen1-two-digit-addition'

function expectedAnswers(seed: number) {
  const def = findGenerated(SET)
  if (!def) throw new Error('missing generator')
  return generateMany(def, 10, 'mixed', createRng(seed)).map((e) => formatAnswer(e.answer))
}

test.describe('practice', () => {
  test('a seeded generated session runs to a perfect score and updates the rail', async ({ page }) => {
    await unlockAll(page)
    await page.goto(`/practice/1/${SET}?mode=generated&seed=42`)
    const answers = expectedAnswers(42)
    for (let i = 0; i < answers.length; i++) {
      await expect(page.getByTestId('practice-progress')).toContainText(`${i + 1} / 10`)
      await page.getByTestId('answer-input').fill(answers[i]!)
      await page.getByTestId('answer-input').press('Enter')
      await expect(page.getByTestId('feedback')).toContainText('Correct')
      if (i % 3 === 0) await page.getByTestId('next-button').click()
      else await page.getByTestId('answer-input').press('Enter')
    }
    await expect(page.getByTestId('results-score')).toHaveText('10 / 10')
    await expect(page.getByTestId('results')).toContainText('Seed 42')
    await page.getByTestId('back-to-chapter').click()
    await expect(page).toHaveURL(/\/read\/1\/left-to-right-addition$/)
    await page.goto('/')
    await expect(page.getByTestId('recent-sessions')).toContainText('10 / 10')
  })

  test('a wrong answer shows the correct one with the book method', async ({ page }) => {
    await unlockAll(page)
    await page.goto(`/practice/1/${SET}?mode=generated&seed=7`)
    const [first] = expectedAnswers(7)
    await page.getByTestId('answer-input').fill('0')
    await page.getByTestId('answer-submit').click()
    await expect(page.getByTestId('feedback')).toContainText(`The answer is ${first}`)
    await expect(page.getByTestId('solution-steps').locator('li')).not.toHaveCount(0)
    await expect(page.getByTestId('answer-input')).toBeDisabled()
  })

  test('a locked set explains itself and links to its section', async ({ page }) => {
    await page.goto('/practice/1/ch1-two-digit-addition')
    await expect(page.getByTestId('locked')).toBeVisible()
    await page.getByRole('link', { name: /Read “Left-to-Right Addition”/ }).click()
    await expect(page).toHaveURL(/\/read\/1\/left-to-right-addition$/)
  })

  test('choice answers use buttons', async ({ page }) => {
    await unlockAll(page)
    await page.goto('/practice/4/gen4-divisibility?mode=generated&seed=3')
    await expect(page.getByTestId('choice-yes')).toBeVisible()
    await page.getByTestId('choice-no').click()
    await expect(page.getByTestId('feedback')).toBeVisible()
  })

  test('an unknown set shows not-found', async ({ page }) => {
    await page.goto('/practice/1/nope')
    await expect(page.getByTestId('set-not-found')).toBeVisible()
  })
})
