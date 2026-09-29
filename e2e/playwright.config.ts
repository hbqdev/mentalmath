import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PORT = 4173
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: '.',
  outputDir: '.results',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: process.env.PHONE_SERIAL ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 5'] } },
    // The installed app on a paired device: `PHONE_SERIAL=ip:port npx playwright test --project=android`.
    // Screenshot scenes and the service-worker offline proof belong to the web build.
    ...(process.env.PHONE_SERIAL
      ? [
          {
            name: 'android',
            timeout: 120_000,
            testIgnore: ['**/screenshots.spec.ts', '**/offline.spec.ts'],
            use: { baseURL: 'http://localhost' },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    cwd: repoRoot,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
