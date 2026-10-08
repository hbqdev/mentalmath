// Opens an Appium (XCUITest) session on the device named by IOS_DEVICE (a substring such as "iPad"
// or "iPhone") and returns helpers that act inside the app's web view with the same data-testid
// selectors as the web e2e. Runs on the Mac; Appium listens on 127.0.0.1:4723 there.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { remote } from 'webdriverio'

export const BUNDLE = 'dev.hbq.mentalmath'
const TEAM = 'P7G23CKH62'
export const ORIGIN = 'capacitor://localhost'

export function findDevice(want = process.env.IOS_DEVICE || 'iPad') {
  execFileSync(
    'xcrun',
    ['devicectl', 'list', 'devices', '--json-output', '/tmp/mm-e2e-devices.json'],
    {
      stdio: 'ignore',
    },
  )
  const devs = JSON.parse(readFileSync('/tmp/mm-e2e-devices.json', 'utf8')).result.devices
  const d = devs.find(
    (x) =>
      x.hardwareProperties?.reality === 'physical' &&
      x.deviceProperties?.name?.toLowerCase().includes(want.toLowerCase()),
  )
  if (!d) throw new Error(`no connected device matching "${want}"`)
  return {
    udid: d.hardwareProperties.udid,
    name: d.deviceProperties.name,
    os: d.deviceProperties.osVersionNumber,
    ipad: /ipad/i.test(d.hardwareProperties.deviceType ?? d.deviceProperties.name),
  }
}

export async function openApp() {
  const dev = findDevice()
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    logLevel: 'error',
    connectionRetryTimeout: 600_000,
    capabilities: {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:udid': dev.udid,
      'appium:platformVersion': dev.os,
      'appium:bundleId': BUNDLE,
      'appium:noReset': true,
      'appium:xcodeOrgId': TEAM,
      'appium:xcodeSigningId': 'Apple Development',
      'appium:updatedWDABundleId': 'dev.hbq.mentalmath.wda',
      'appium:allowProvisioningDeviceRegistration': true,
      // WebDriverAgent is built and signed beforehand by `mentalmath.sh ios:wda` (Appium's own build
      // fails with the personal team); Appium only launches it.
      'appium:usePrebuiltWDA': true,
      'appium:showXcodeLog': true,
      'appium:derivedDataPath': `${homedir()}/dev/MentalMath/build-wda`,
      'appium:wdaLaunchTimeout': 300_000,
      'appium:wdaConnectionTimeout': 300_000,
      'appium:newCommandTimeout': 300,
      'appium:webviewConnectTimeout': 30_000,
      'appium:includeSafariInWebviews': false,
    },
  })
  await driver.setTimeout({ script: 15_000 })
  const app = new App(driver, dev)
  await app.enterWebView()
  return app
}

export class App {
  constructor(driver, device) {
    this.d = driver
    this.device = device
  }

  /** Switch into the app's web view (the context name changes between launches). */
  async enterWebView() {
    for (let i = 0; i < 30; i++) {
      const ctxs = await this.d.getContexts()
      const web = ctxs.find((c) => String(c.id ?? c).startsWith('WEBVIEW'))
      if (web) {
        await this.d.switchContext(String(web.id ?? web))
        return
      }
      await this.d.pause(1000)
    }
    throw new Error('the app web view never appeared')
  }

  async native(fn) {
    await this.d.switchContext('NATIVE_APP')
    try {
      return await fn(this.d)
    } finally {
      await this.enterWebView()
    }
  }

  /** In-app route change without a reload, the way a tap on a link would do it. */
  async go(path) {
    await this.d.execute((p) => {
      const r = window.__mmRouter
      if (r) return r.push(p)
      window.location.assign(p)
    }, path)
    await this.d.pause(400)
  }

  /** Full reload at a path (fresh app state from storage). */
  async load(path = '/') {
    await this.d.url(ORIGIN + path)
    await this.waitFor('#app > *')
  }

  async resetStorage(seed) {
    await this.d.execute((s) => {
      localStorage.clear()
      sessionStorage.clear()
      if (s) localStorage.setItem('mentalmath.v1', JSON.stringify(s))
    }, seed ?? null)
  }

  $(testid) {
    return this.d.$(`[data-testid="${testid}"]`)
  }

  async waitFor(selector, timeout = 15_000) {
    const el = await this.d.$(
      selector.startsWith('[') || selector.startsWith('#')
        ? selector
        : `[data-testid="${selector}"]`,
    )
    await el.waitForExist({ timeout })
    return el
  }

  async tap(testid) {
    const el = await this.waitFor(testid)
    await el.click()
  }

  async text(testid) {
    const el = await this.waitFor(testid)
    return (await el.getText()).trim()
  }

  async exists(testid) {
    return (await this.d.$$(`[data-testid="${testid}"]`)).length > 0
  }

  async rect(testid) {
    return this.d.execute((t) => {
      const e = document.querySelector(`[data-testid="${t}"]`)
      if (!e) return null
      const r = e.getBoundingClientRect()
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        width: r.width,
        height: r.height,
      }
    }, testid)
  }

  /** Waits until fn() is truthy, polling. */
  async until(fn, what, timeout = 15_000) {
    const end = Date.now() + timeout
    let last
    while (Date.now() < end) {
      last = await fn()
      if (last) return last
      await this.d.pause(250)
    }
    throw new Error(`timed out waiting for ${what} (last: ${JSON.stringify(last)})`)
  }

  async close() {
    await this.d.deleteSession().catch(() => {})
  }
}
