import { expect, test } from '@playwright/test'
import { seedProgress, sampleProgress } from './helpers'

// After one online visit the service worker has precached the app shell, chapter data and
// figures, so a chapter reads offline, including a figure that is still an image.
test('a chapter reads offline after one visit', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'service workers are exercised in Chromium only')
  await seedProgress(page, sampleProgress)
  await page.goto('/read/1/left-to-right-addition')
  await expect(page.locator('#left-to-right-addition')).toBeVisible()
  // Wait for the worker to finish installing (precache happens during install) and take control.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      )
    }
    return reg.active?.state
  })
  await context.setOffline(true)
  try {
    await page.goto('/read/4/one-digit-division')
    await expect(page.locator('#one-digit-division')).toBeVisible()
    const img = page.locator('figure[data-figure] img').first()
    await img.scrollIntoViewIfNeeded()
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0)
    // typeset figures need no network at all
    await page.goto('/read/1/left-to-right-addition')
    await expect(page.locator('[data-figure="ch1-f001"]')).toHaveAttribute(
      'data-override',
      'column',
    )
  } finally {
    await context.setOffline(false)
  }
})
