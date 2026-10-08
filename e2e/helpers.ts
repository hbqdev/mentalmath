import type { Page } from '@playwright/test'

export const STORAGE_KEY = 'mentalmath.v1'

/** Seed localStorage before the app boots. Missing fields are filled by the app's defaults merge. */
export async function seedProgress(page: Page, partial: Record<string, unknown>) {
  // Inside the installed app the page already sits on the app's origin: seed its storage directly,
  // so the next goto boots with it, whether or not init scripts reach the WebView.
  if ((page as Page & { __android?: boolean }).__android) {
    await page.evaluate(
      ([key, value]) => {
        if (window.localStorage.getItem(key as string) === null) {
          window.localStorage.setItem(key as string, JSON.stringify(value))
        }
      },
      [STORAGE_KEY, partial] as const,
    )
  }
  await page.addInitScript(
    ([key, value]) => {
      // Init scripts run on every document load; only seed a fresh profile so the app's own writes survive reloads.
      if (window.localStorage.getItem(key as string) === null) {
        window.localStorage.setItem(key as string, JSON.stringify(value))
      }
    },
    [STORAGE_KEY, partial] as const,
  )
}

export async function unlockAll(page: Page, extra: Record<string, unknown> = {}) {
  await seedProgress(page, { settings: { lockUntilRead: false }, ...extra })
}

export async function freezeClock(page: Page, iso = '2026-09-27T12:00:00Z') {
  await page.clock.setFixedTime(new Date(iso))
}

export const sampleProgress = {
  reading: {
    '0': {
      lastSection: 'squaring-and-more',
      visited: ['overview', 'instant-multiplication', 'squaring-and-more'],
      updatedAt: '2026-09-26T10:00:00.000Z',
    },
    '1': {
      lastSection: 'left-to-right-addition',
      visited: ['overview', 'left-to-right-addition'],
      updatedAt: '2026-09-27T09:00:00.000Z',
    },
  },
  practice: {
    'gen1-two-digit-addition': {
      attempts: [
        { at: '2026-09-27T09:30:00.000Z', correct: 8, total: 10, seconds: 95, mode: 'generated' },
      ],
      best: 8,
    },
    'gen0-multiply-by-11': {
      attempts: [
        { at: '2026-09-26T10:30:00.000Z', correct: 10, total: 10, seconds: 61, mode: 'generated' },
      ],
      best: 10,
    },
  },
  streak: { current: 2, lastActiveDay: '2026-09-27' },
  settings: { theme: 'light', focus: false, fontSize: 18, font: 'serif', lockUntilRead: false },
}

/** Opt into the reading gate so locked-set behaviour can be exercised. */
export async function lockUntilRead(page: Page) {
  await seedProgress(page, { settings: { lockUntilRead: true } })
}

/** Pick a theme through the icon picker; on phones the row sits behind the current-theme button. */
export async function selectTheme(page: Page, theme: 'system' | 'light' | 'bright' | 'dark') {
  const opt = page.getByTestId(`theme-${theme}`)
  if (!(await opt.isVisible())) await page.getByTestId('theme-toggle').click()
  await opt.click()
}

/**
 * Enter an answer the way the current layout expects it: the keypad on phones (one-at-a-time
 * drills), the text box elsewhere. Letters and symbols the keypad lacks go through the text box.
 */
export async function typeAnswer(page: Page, text: string) {
  const keypad = page.getByTestId('keypad')
  if (await keypad.isVisible().catch(() => false)) {
    for (const ch of text.replace(/,/g, '')) {
      const key = ch === ' ' ? 'extra-1' : ch
      const btn = page.getByTestId(`key-${key}`)
      if (await btn.count()) await btn.click()
      else if (ch === '/') await page.getByTestId('key-extra-0').click()
      else if (ch === '-' || ch === '.')
        await page.getByTestId(`key-extra-${ch === '.' ? 0 : 1}`).click()
      else if (ch === 'r') await page.getByTestId('key-extra-0').click()
      else throw new Error(`keypad cannot type ${JSON.stringify(ch)}`)
    }
    // Inside the Android WebView Playwright sometimes waits forever for a "scheduled navigation"
    // after a click; the keypad never navigates, and the next assertion would catch it if it did.
    await page.getByTestId('key-check').click({ noWaitAfter: true })
    return
  }
  await page.getByTestId('answer-input').fill(text)
  await page.getByTestId('answer-input').press('Enter')
}
