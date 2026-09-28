import { expect, test, type Page } from '@playwright/test'
import { formatAnswer } from '../src/exercises/checker'
import { bookExercises } from '../src/exercises/bookSets'
import '../src/content/book-exercises'
import { typeAnswer, unlockAll } from './helpers'

// One book set per chapter that has them; answers come from the committed data.
const SETS: Array<[string, string]> = [
  ['1', 'ch1-two-digit-subtraction'],
  ['2', 'ch2-two-digit-squares'],
  ['3', 'ch3-multiplying-by-11'],
  ['4', 'ch4-dividing-fractions'],
  ['5', 'ch5-square-root-guesstimation'],
  ['6', 'ch6-subtracting-on-paper'],
  ['8', 'ch8-four-digit-squares'],
  ['9', 'ch9-a-day-for-any-date'],
]

async function answer(page: Page, spec: ReturnType<typeof bookExercises>[number]['answer']) {
  if (spec.kind === 'choice') {
    await page.getByTestId(`choice-${spec.correct.toLowerCase()}`).click()
    return
  }
  const text = spec.kind === 'text' ? spec.accept[0]! : formatAnswer(spec).replace(/^≈ /, '')
  await typeAnswer(page, text)
}

for (const [chapter, setId] of SETS) {
  test(`book set ${setId} runs to results`, async ({ page }) => {
    await unlockAll(page)
    const problems = bookExercises(setId)
    expect(problems.length).toBeGreaterThan(0)
    await page.goto(`/practice/${chapter}/${setId}?view=one`)
    for (let i = 0; i < problems.length; i++) {
      await expect(page.getByTestId('practice-progress')).toContainText(
        `${i + 1} / ${problems.length}`,
      )
      await answer(page, problems[i]!.answer)
      await expect(page.getByTestId('feedback')).toContainText('Correct')
      if (i === 0) {
        const toggle = page.getByTestId('drill-steps-toggle')
        if (await toggle.count()) await toggle.click()
        await expect(page.getByTestId('solution-steps')).toBeVisible()
      }
      await page.getByTestId('next-button').click()
    }
    await expect(page.getByTestId('results-score')).toHaveText(
      `${problems.length} / ${problems.length}`,
    )
    await expect(page.getByTestId('generated-twin')).toBeVisible()
  })
}

test('a book callout leads from the text into the book set', async ({ page }) => {
  await unlockAll(page)
  await page.goto('/read/1/left-to-right-addition')
  await page.getByTestId('exercise-callout').first().getByRole('link', { name: 'Book set' }).click()
  await expect(page).toHaveURL(/\/practice\/1\/ch1-two-digit-addition/)
  await expect(page.getByTestId('worksheet')).toBeVisible()
  await expect(page.getByTestId('sheet-progress')).toContainText('0 / 10')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Two-Digit Addition')
})

test('a book set is a worksheet: every problem visible, answered in any order', async ({
  page,
}) => {
  await unlockAll(page)
  const problems = bookExercises('ch1-two-digit-addition')
  await page.goto('/practice/1/ch1-two-digit-addition')
  await expect(page.getByTestId('worksheet')).toBeVisible()
  await expect(page.locator('[data-testid^="sheet-item-"]')).toHaveCount(problems.length)
  const last = problems.length
  await page.getByTestId(`sheet-input-${last}`).fill(formatAnswer(problems[last - 1]!.answer))
  await page.getByTestId(`sheet-input-${last}`).press('Enter')
  await expect(page.getByTestId(`sheet-verdict-${last}`)).toContainText('Correct')
  await page.getByTestId('sheet-input-1').fill('0')
  await page.getByTestId('sheet-check-1').click()
  await expect(page.getByTestId('sheet-item-1').getByTestId('solution-steps')).toBeVisible()
  await expect(page.getByTestId('sheet-progress')).toContainText(`2 / ${last} answered · 1 correct`)
  await page.getByTestId('reveal-rest').click()
  await expect(page.getByTestId('sheet-summary')).toContainText(`1 / ${last}`)
  await page.getByTestId('view-one').click()
  await expect(page.getByTestId('practice-progress')).toContainText(`1 / ${last}`)
})
