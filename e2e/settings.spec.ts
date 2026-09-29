import { expect, test } from './fixtures'
import { sampleProgress, seedProgress } from './helpers'

test.describe('settings and progress', () => {
  test('backup, restore and reset round-trip the local data', async ({ page }, info) => {
    test.skip(
      info.project.name === 'android',
      'the app hands the backup to the share sheet; file dialogs are outside the WebView',
    )
    await seedProgress(page, sampleProgress)
    await page.goto('/settings')
    const download = page.waitForEvent('download')
    await page.getByTestId('export-progress').click()
    const file = await download
    const text = (await (await file.createReadStream()).toArray()).join('')
    expect(JSON.parse(text)).toMatchObject({
      app: 'mentalmath',
      progress: { streak: { current: 2 } },
    })
    page.once('dialog', (d) => d.accept())
    await page.getByTestId('reset-progress').click()
    await expect(page.getByTestId('settings-notice')).toHaveText('Everything reset.')
    await page.goto('/progress')
    await expect(page.getByTestId('progress-empty')).toBeVisible()
    await page.goto('/settings')
    await page.getByTestId('import-file').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    })
    await expect(page.getByTestId('settings-notice')).toHaveText('Progress restored.')
    await page.goto('/progress')
    await expect(page.getByTestId('progress-techniques')).toContainText('Two-digit addition')
    await expect(page.getByTestId('progress-totals')).toContainText('2')
  })

  test('settings toggles persist', async ({ page }) => {
    await page.goto('/settings')
    await page.getByTestId('setting-timer').check()
    await page.getByTestId('setting-lock').check()
    await page.reload()
    await expect(page.getByTestId('setting-timer')).toBeChecked()
    await expect(page.getByTestId('setting-lock')).toBeChecked()
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('We collect nothing')
  })
})
