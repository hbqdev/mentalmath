// The installed iOS app, driven on a real device (IOS_DEVICE=iPad|iPhone). Covers what the web e2e
// in WebKit cannot: the native shell, safe areas, app lifecycle and the Capacitor plugins.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, describe, test } from 'node:test'
import { openApp } from '../session.mjs'

const fx = JSON.parse(readFileSync(new URL('../fixtures.json', import.meta.url), 'utf8'))
const UNLOCKED = { settings: { lockUntilRead: false } }
let app
let phone = false

/** Enter an answer the way the layout offers it: the keypad on phones, the text box on wider screens. */
async function answer(text) {
  if (await app.exists('keypad')) {
    for (const ch of text) await app.tap(`key-${ch}`)
    await app.tap('key-check')
  } else {
    const box = await app.waitFor('answer-input')
    await box.setValue(text)
    await app.d.keys('Enter')
  }
}

/** Calls a Capacitor plugin method inside the web view and returns its result (or "error: …"). */
function plugin(name, method, arg) {
  return app.d.executeAsync(
    (n, m, a, done) => {
      const p = window.Capacitor?.Plugins?.[n]
      if (!p) return done(`error: no plugin ${n}`)
      Promise.resolve(p[m](a)).then(
        (r) => done(r ?? 'ok'),
        (e) => done(`error: ${e?.message ?? e}`),
      )
    },
    name,
    method,
    arg ?? {},
  )
}

describe('iOS app', () => {
  before(async () => {
    app = await openApp()
    await app.load('/')
    await app.resetStorage(UNLOCKED)
    await app.load('/')
    phone = await app.exists('tab-bar')
  })
  after(async () => app?.close())

  test('opens on the home screen inside the safe area, without sideways scroll', async () => {
    await app.waitFor('book-cover')
    const m = await app.d.execute(() => {
      const probe = document.createElement('div')
      probe.style.cssText = 'position:fixed;top:0;padding-top:env(safe-area-inset-top)'
      document.body.append(probe)
      const inset = parseFloat(getComputedStyle(probe).paddingTop) || 0
      probe.remove()
      const logo = document.querySelector('header a, header .wordmark, .top a')
      return {
        inset,
        logoTop: logo ? logo.getBoundingClientRect().top : -1,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      }
    })
    assert.ok(
      m.logoTop >= m.inset,
      `header content at ${m.logoTop} sits under the status bar (${m.inset})`,
    )
    assert.ok(m.overflow <= 1, `page scrolls sideways by ${m.overflow}px`)
  })

  test('the layout matches the device: tab bar on phones, top navigation on iPad', async () => {
    if (app.device.ipad) {
      assert.equal(phone, false, 'iPad should get the wide layout, not the phone tab bar')
    } else {
      assert.equal(phone, true, 'phones get the bottom tab bar')
    }
  })

  test('a seeded generated set runs to a perfect score', async () => {
    await app.load(`/practice/1/${fx.set}?mode=generated&seed=42`)
    for (let i = 0; i < 10; i++) {
      await app.until(
        async () => (await app.text('practice-progress')).includes(`${i + 1} / 10`),
        `problem ${i + 1}`,
      )
      await answer(fx.seed42[i])
      await app.until(
        async () => (await app.text('feedback')).includes('Correct'),
        `feedback ${i + 1}`,
      )
      await app.tap('next-button')
    }
    assert.equal(await app.text('results-score'), '10 / 10')
  })

  test('a wrong answer shows the right one with the worked steps', async () => {
    await app.load(`/practice/1/${fx.set}?mode=generated&seed=7`)
    await answer('0')
    await app.until(
      async () => (await app.text('feedback')).includes(`The answer is ${fx.seed7[0]}`),
      'feedback',
    )
    if (await app.exists('drill-steps-toggle')) await app.tap('drill-steps-toggle')
    await app.waitFor('solution-steps')
  })

  test('on phones the whole keypad sits above the tab bar', async (t) => {
    if (!phone) return t.skip('phones only')
    await app.load(`/practice/1/${fx.set}?mode=generated&seed=42`)
    const check = await app.rect('key-check')
    const tabs = await app.rect('tab-bar')
    assert.ok(
      check.bottom <= tabs.top,
      `Check ends at ${check.bottom}, tab bar starts at ${tabs.top}`,
    )
  })

  test('a drill in progress survives the app going to the background', async () => {
    await app.load(`/practice/1/${fx.set}?mode=generated&seed=42`)
    await answer(fx.seed42[0])
    await app.until(async () => (await app.text('feedback')).includes('Correct'), 'feedback')
    await app.tap('next-button')
    await app.until(
      async () => (await app.text('practice-progress')).includes('2 / 10'),
      'second problem',
    )
    await app.native((d) => d.execute('mobile: backgroundApp', { seconds: 3 }))
    await app.until(
      async () => (await app.text('practice-progress')).includes('2 / 10'),
      'still on problem 2',
    )
  })

  test('the screen stays awake during a drill', async () => {
    await app.load(`/practice/1/${fx.set}?mode=generated&seed=42`)
    await app.waitFor('practice-progress')
    const r = await app.until(async () => {
      const v = await plugin('KeepAwake', 'isKeptAwake')
      return v?.isKeptAwake === true ? v : null
    }, 'keep-awake on')
    assert.equal(r.isKeptAwake, true)
  })

  test('haptics fire without error', async () => {
    const r = await plugin('Haptics', 'notification', { type: 'SUCCESS' })
    assert.ok(!String(r).startsWith('error'), String(r))
  })

  test('settings survive quitting and relaunching the app', async () => {
    await app.load('/settings')
    const box = await app.waitFor('setting-timer')
    if (!(await box.isSelected())) await box.click()
    await app.until(async () => (await app.waitFor('setting-timer')).isSelected(), 'timer checked')
    await app.native(async (d) => {
      await d.execute('mobile: terminateApp', { bundleId: 'dev.hbq.mentalmath' })
      await d.execute('mobile: activateApp', { bundleId: 'dev.hbq.mentalmath' })
    })
    await app.load('/settings')
    assert.equal(await (await app.waitFor('setting-timer')).isSelected(), true)
  })

  test('Save a backup opens the iOS share sheet', async () => {
    await app.load('/settings')
    await app.tap('export-progress')
    const found = await app.native(async (d) => {
      const sheet = await d.$(
        '-ios predicate string:type == "XCUIElementTypeOther" AND name CONTAINS "ActivityListView"',
      )
      const ok = await sheet.waitForExist({ timeout: 15_000 }).then(
        () => true,
        () => false,
      )
      // Dismiss: the Close button on newer iOS, otherwise tap outside the popover.
      const close = await d.$(
        '-ios predicate string:type == "XCUIElementTypeButton" AND (name == "Close" OR label == "Close")',
      )
      if (await close.isExisting()) await close.click()
      else await d.execute('mobile: tap', { x: 20, y: 200 })
      return ok
    })
    assert.equal(found, true, 'the share sheet did not appear')
  })
})
