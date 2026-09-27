import type { Page } from '@playwright/test'

export const STORAGE_KEY = 'mentalmath.v1'

/** Seed localStorage before the app boots. Missing fields are filled by the app's defaults merge. */
export async function seedProgress(page: Page, partial: Record<string, unknown>) {
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
  await seedProgress(page, { settings: { unlockAll: true }, ...extra })
}

export async function freezeClock(page: Page, iso = '2026-09-27T12:00:00Z') {
  await page.clock.setFixedTime(new Date(iso))
}

export const sampleProgress = {
  reading: {
    '0': { lastSection: 'squaring-and-more', visited: ['overview', 'instant-multiplication', 'squaring-and-more'], updatedAt: '2026-09-26T10:00:00.000Z' },
    '1': { lastSection: 'left-to-right-addition', visited: ['overview', 'left-to-right-addition'], updatedAt: '2026-09-27T09:00:00.000Z' },
  },
  practice: {
    'gen1-two-digit-addition': {
      attempts: [{ at: '2026-09-27T09:30:00.000Z', correct: 8, total: 10, seconds: 95, mode: 'generated' }],
      best: 8,
    },
    'gen0-multiply-by-11': {
      attempts: [{ at: '2026-09-26T10:30:00.000Z', correct: 10, total: 10, seconds: 61, mode: 'generated' }],
      best: 10,
    },
  },
  streak: { current: 2, lastActiveDay: '2026-09-27' },
  settings: { theme: 'light', focus: false, fontScale: 1, unlockAll: false },
}
