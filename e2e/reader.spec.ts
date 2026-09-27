import { expect, test } from '@playwright/test'

test.describe('reader', () => {
  test('renders chapter 1 with its title and sections', async ({ page }) => {
    await page.goto('/read/1')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('A Little Give and Take')
    await expect(page.locator('section.book-section')).toHaveCount(3)
    await expect(page.locator('.prose').first()).toContainText('add and subtract numbers from left to right')
  })

  test('outline navigation updates the section in the URL', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'outline column is desktop only')
    await page.goto('/read/1')
    await page.getByTestId('outline').getByRole('link', { name: 'Left-to-Right Subtraction' }).click()
    await expect(page).toHaveURL(/\/read\/1\/left-to-right-subtraction$/)
    await expect(page.locator('#left-to-right-subtraction h2')).toBeInViewport()
  })

  test('reading a section unlocks its exercise callout after two seconds', async ({ page }) => {
    await page.goto('/read/1/left-to-right-addition')
    const callout = page.getByTestId('exercise-callout').first()
    await expect(callout).toContainText('Unlocks after you read')
    await callout.scrollIntoViewIfNeeded()
    await expect(callout.getByRole('link', { name: 'Book set' })).toBeVisible({ timeout: 6_000 })
    await expect(callout.getByRole('link', { name: 'Generate' })).toHaveAttribute('href', /gen1-two-digit-addition\?mode=generated/)
  })

  test('focus mode hides the practice rail and the theme toggle switches palettes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'rail is hidden on phones anyway')
    await page.goto('/read/1')
    await expect(page.getByTestId('practice-rail')).toBeVisible()
    await page.getByTestId('focus-toggle').click()
    await expect(page.getByTestId('practice-rail')).toHaveCount(0)
    await page.getByTestId('focus-toggle').click()
    await expect(page.getByTestId('practice-rail')).toBeVisible()

    const html = page.locator('html')
    const before = await html.getAttribute('data-theme')
    await page.getByTestId('theme-toggle').click() // system -> light
    await page.getByTestId('theme-toggle').click() // light -> dark
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
})
