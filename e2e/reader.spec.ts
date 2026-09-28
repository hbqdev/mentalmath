import { lockUntilRead, sampleProgress, seedProgress, selectTheme } from './helpers'
import { expect, test } from '@playwright/test'

test.describe('reader', () => {
  test('renders chapter 1 with its title and sections', async ({ page }) => {
    await page.goto('/read/1')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('A Little Give and Take')
    await expect(page.locator('section.book-section')).toHaveCount(3)
    await expect(page.locator('.prose').first()).toContainText(
      'add and subtract numbers from left to right',
    )
  })

  test('outline navigation updates the section in the URL', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'outline column is desktop only')
    await page.goto('/read/1')
    await page
      .getByTestId('outline')
      .getByRole('link', { name: 'Left-to-Right Subtraction' })
      .click()
    await expect(page).toHaveURL(/\/read\/1\/left-to-right-subtraction$/)
    await expect(page.locator('#left-to-right-subtraction h2')).toBeInViewport()
  })

  test('reading a section unlocks its exercise callout after a moment', async ({ page }) => {
    await lockUntilRead(page)
    await page.goto('/read/1/left-to-right-addition')
    const callout = page.getByTestId('exercise-callout').first()
    await expect(callout).toContainText('Unlocks after you read')
    await callout.scrollIntoViewIfNeeded()
    await expect(callout.getByRole('link', { name: 'Book set' })).toBeVisible({ timeout: 6_000 })
    await expect(callout.getByRole('link', { name: 'Generate' })).toHaveAttribute(
      'href',
      /gen1-two-digit-addition\?mode=generated/,
    )
  })

  test('focus mode hides the practice rail and the theme toggle switches palettes', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'rail is hidden on phones anyway')
    await page.goto('/read/1')
    await expect(page.getByTestId('practice-rail')).toBeVisible()
    await page.getByTestId('focus-toggle').click()
    await expect(page.getByTestId('practice-rail')).toHaveCount(0)
    await page.getByTestId('focus-toggle').click()
    await expect(page.getByTestId('practice-rail')).toBeVisible()

    const html = page.locator('html')
    const before = await html.getAttribute('data-theme')
    await selectTheme(page, 'dark')
    await expect(html).toHaveAttribute('data-theme', 'dark')
    expect(before).not.toBeNull()
    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'dark')
  })

  test('phone: the pill opens the practice sheet with the outline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'phone layout only')
    await page.goto('/read/1')
    await expect(page.locator('.col-rail')).toHaveCount(0)
    await expect(page.getByTestId('sheet')).not.toBeVisible()
    await page.getByTestId('pill-practice').click()
    const sheet = page.getByTestId('sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet).toContainText('Two-Digit Addition')
    await sheet.getByRole('link', { name: 'Left-to-Right Subtraction' }).click()
    await expect(page).toHaveURL(/left-to-right-subtraction$/)
  })

  test('unknown chapter shows the not-found state', async ({ page }) => {
    await page.goto('/read/42')
    await expect(page.getByText('not in this book')).toBeVisible()
  })

  test('legacy bookmarks redirect', async ({ page }) => {
    await page.goto('/chapters/3')
    await expect(page).toHaveURL(/\/read\/3$/)
    await page.goto('/exercises/1/left-to-right-addition')
    await expect(page).toHaveURL(/\/read\/1$/)
  })

  test('focus mode can always be left from inside the reader', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop')
    await seedProgress(page, {
      ...sampleProgress,
      settings: { ...sampleProgress.settings, focus: true },
    })
    await page.goto('/read/3/cubing')
    await expect(page.locator('.col-outline')).toHaveCount(0)
    await page.getByTestId('exit-focus').click()
    await expect(page.locator('.col-outline')).toBeVisible()
    await expect(page.getByTestId('practice-rail')).toBeVisible()
  })

  test('text size slider and font choice change the reading text', async ({ page }, info) => {
    const phone = info.project.name === 'phone'
    await page.goto('/read/1/left-to-right-addition')
    const size = () =>
      page
        .locator('.prose p')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    const before = await size()
    if (phone) await page.goto('/settings')
    else await page.getByTestId('text-toggle').click()
    await page.getByTestId('font-size').fill('23')
    await expect(page.getByTestId('font-size-value')).toHaveText('23 px')
    await page.getByTestId('font-mono').click()
    await expect(page.locator('html')).toHaveAttribute('data-font', 'mono')
    if (phone) await page.goto('/read/1/left-to-right-addition')
    expect(await size()).toBeGreaterThan(before)
    const family = await page
      .locator('.prose p')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toMatch(/JetBrains Mono|monospace/)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-font', 'mono')
    expect(await size()).toBeCloseTo(23, 0)
  })

  test('phones read one section per page with arrows, swipe and a practice footer', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'phone')
    await page.goto('/read/1')
    const pageEl = page.getByTestId('section-page')
    await expect(pageEl).toBeVisible()
    await expect(page.locator('.book-section')).toHaveCount(1)
    await expect(page.getByTestId('page-prev')).toBeDisabled()
    await page.getByTestId('page-next').click()
    await expect(page).toHaveURL(/\/read\/1\/left-to-right-addition$/)
    await expect(page.getByTestId('practice-this')).toContainText('Two-Digit Addition')
    await expect(page.getByTestId('practice-this')).toContainText('Generate')
    // swipe left → next section
    const box = (await pageEl.boundingBox())!
    await page.mouse.move(box.x + box.width - 20, box.y + 200)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + 200, { steps: 8 })
    await page.mouse.move(box.x + 20, box.y + 200, { steps: 8 })
    await page.mouse.up()
    await expect(page).toHaveURL(/\/read\/1\/left-to-right-subtraction$/)
    // the pill still counts pages, and a viewed page is marked read
    await expect(page.locator('text=Section 3 / 3')).toBeVisible()
    await page.goto('/settings')
    await page.getByTestId('setting-paged').uncheck()
    await page.goto('/read/1')
    await expect(page.locator('.book-section')).toHaveCount(3)
  })
})
