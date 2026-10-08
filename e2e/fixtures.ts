/**
 * Test fixtures. Desktop and phone projects use Playwright's own Chromium against `vite preview`.
 * The `android` project (enabled with PHONE_SERIAL=ip:port or a USB serial) runs the same specs
 * inside the installed debug APK on a real device, through the WebView's DevTools socket.
 */
import { test as base } from '@playwright/test'
import { _android as android, type AndroidDevice, type Page } from 'playwright'

export * from '@playwright/test'

export const APP_PKG = 'dev.hbq.mentalmath'
export const APP_ORIGIN = 'http://localhost'

let device: AndroidDevice | null = null
let appPage: Page | null = null

async function androidPage(serial: string): Promise<Page> {
  if (appPage && !appPage.isClosed()) return appPage
  const devices = await android.devices()
  device = devices.find((d) => d.serial() === serial) ?? devices[0] ?? null
  if (!device) throw new Error(`no Android device ${serial}; pair and connect it first`)
  await device.shell(`am force-stop ${APP_PKG}`)
  await device.shell(`am start -n ${APP_PKG}/.MainActivity`)
  const webView = await device.webView({ pkg: APP_PKG }, { timeout: 30_000 })
  const page = await webView.page()
  // Let the app finish its own launch navigation first; a test that navigates while it is still
  // in flight leaves Playwright waiting on a navigation that never settles.
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForFunction(
    () => (document.querySelector('#app')?.childElementCount ?? 0) > 0,
    null,
    {
      timeout: 30_000,
    },
  )
  ;(page as Page & { __android?: boolean }).__android = true
  // relative goto() against the app's own origin, as the web projects do against baseURL
  const goto = page.goto.bind(page)
  page.goto = ((url: string, opts?: Parameters<Page['goto']>[1]) =>
    goto(new URL(url, APP_ORIGIN).toString(), opts)) as Page['goto']
  appPage = page
  return page
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    if (testInfo.project.name !== 'android') {
      await use(page)
      return
    }
    const p = await androidPage(process.env.PHONE_SERIAL ?? '')
    // each test starts from a clean profile, like a fresh browser context
    await p.goto('/')
    await p.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await use(p)
  },
})
