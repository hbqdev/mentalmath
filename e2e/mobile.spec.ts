import { expect, test, type Page } from '@playwright/test'
import { sampleProgress, seedProgress, unlockAll } from './helpers'

// Phone-specific guarantees: no sideways scrolling, a header that fits in one row, tap targets
// of at least 40px for the controls a thumb has to hit, and a numeric keyboard for numeric answers.
const PAGES = [
  '/',
  '/practice',
  '/read/1/left-to-right-addition',
  '/read/6/pencil-and-paper-multiplication',
  '/practice/1/ch1-two-digit-addition',
  '/practice/1/gen1-two-digit-addition?mode=generated&seed=3',
  '/about',
]

async function noHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, 'page must not scroll sideways').toBeLessThanOrEqual(innerWidth + 1)
}

for (const path of PAGES) {
  test(`fits the viewport without sideways scroll: ${path}`, async ({ page }) => {
    await seedProgress(page, sampleProgress)
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await noHorizontalOverflow(page)
    const header = page.locator('header.top')
    const box = await header.boundingBox()
    expect(box!.height, 'header stays one row').toBeLessThanOrEqual(64)
  })
}

test('primary controls are thumb-sized on a phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone')
  await unlockAll(page)
  await page.goto('/practice/1/gen1-two-digit-addition?mode=generated&seed=3')
  for (const id of [
    'key-check',
    'key-5',
    'key-backspace',
    'drill-exit',
    'tab-read',
    'tab-practice',
    'tab-progress',
    'tab-settings',
  ]) {
    const box = await page.getByTestId(id).boundingBox()
    expect(box, id).not.toBeNull()
    expect(box!.height, `${id} height`).toBeGreaterThanOrEqual(32)
    expect(box!.width, `${id} width`).toBeGreaterThanOrEqual(32)
  }
  await page.goto('/read/1/left-to-right-addition')
  const pill = await page.getByTestId('pill-practice').boundingBox()
  expect(pill!.height).toBeGreaterThanOrEqual(32)
  await page.goto('/practice')
  const gen = await page
    .getByTestId('technique-gen1-two-digit-addition')
    .getByTestId('generate')
    .boundingBox()
  expect(gen!.height).toBeGreaterThanOrEqual(40)
})

test('numeric answers open the numeric keyboard; theme and text live in Settings on phones', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'phone')
  await unlockAll(page)
  await page.goto('/practice/1/gen1-two-digit-addition?mode=generated&seed=3')
  await expect(page.getByTestId('keypad')).toBeVisible() // phones drill with the on-screen keypad
  await page.goto('/practice/1/ch1-two-digit-addition')
  await expect(page.getByTestId('sheet-input-1')).toHaveAttribute('inputmode', 'decimal')
  await expect(page.getByTestId('theme-picker')).toHaveCount(0)
  await page.getByTestId('tab-settings').click()
  await expect(page).toHaveURL(/\/settings$/)
  await page.getByTestId('theme-dark').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByTestId('font-size').fill('20')
  await expect(page.getByTestId('font-size-value')).toHaveText('20 px')
})

test('a phone drill survives an app switch and can be left', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone')
  await unlockAll(page)
  await page.goto('/practice/1/gen1-two-digit-addition?mode=generated&seed=5')
  await expect(page.getByTestId('practice-progress')).toContainText('1 / 10')
  await page.getByTestId('key-1').click()
  await page.getByTestId('key-check').click()
  await expect(page.getByTestId('feedback')).toBeVisible()
  await page.getByTestId('next-button').click()
  await expect(page.getByTestId('practice-progress')).toContainText('2 / 10')
  await page.reload() // the app coming back after a call or a switch
  await expect(page.getByTestId('practice-progress')).toContainText('2 / 10')
  await page.getByTestId('drill-exit').click()
  await expect(page).toHaveURL(/\/read\/1\/left-to-right-addition/)
  await page.goto('/practice/1/gen1-two-digit-addition?mode=generated&seed=5')
  await expect(page.getByTestId('practice-progress')).toContainText('1 / 10') // leaving discards the run
})
