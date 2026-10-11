// Screen recording for App Review: launches the app on a connected device and walks the typical flow
// (home, reading, a drill with feedback and worked steps, a timed sprint, progress, settings).
// Runs on the Mac with Appium up: IOS_DEVICE=iPhone node review-video.mjs → out/review.mp4
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { BUNDLE, openApp } from './session.mjs'

const fx = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))
const OUT = new URL('./out/', import.meta.url)
const app = await openApp()
const pause = (ms) => app.d.pause(ms)
const scroll = (y) =>
  app.d.execute((dy) => window.scrollBy({ top: dy, behavior: 'smooth' }), y).then(() => pause(1200))

/** The phone tab bar or, on iPad, the top navigation. */
async function nav(id) {
  await app.tap((await app.exists(`tab-${id}`)) ? `tab-${id}` : `nav-${id}`)
}

async function answer(text) {
  if (await app.exists('keypad')) {
    for (const ch of text) {
      await app.tap(`key-${ch}`)
      await pause(250)
    }
    await app.tap('key-check')
  } else {
    const box = await app.waitFor('answer-input')
    await box.setValue(text)
    await app.d.keys('Enter')
  }
  await pause(1400)
}

try {
  // a clean learner, so the recording shows the first-run experience
  await app.load('/')
  await app.resetStorage({ settings: { lockUntilRead: false } })
  await app.native(async (d) => {
    await d.execute('mobile: terminateApp', { bundleId: BUNDLE })
    await d.execute('mobile: startXCTestScreenRecording', { fps: 24 })
    await d.execute('mobile: activateApp', { bundleId: BUNDLE })
  })
  await app.waitFor('book-cover')
  await pause(2500)
  await scroll(500)

  // read: a chapter section, paging forward
  await app.go('/read/1/left-to-right-addition')
  await pause(2500)
  await scroll(400)
  for (let i = 0; i < 2; i++) {
    if (await app.exists('page-next')) await app.tap('page-next')
    await pause(2000)
  }

  // practice hub, then a drill: three right answers and one wrong one with the worked steps
  await nav('practice')
  await pause(2000)
  await scroll(400)
  await app.go(`/practice/1/${fx.set}?mode=generated&seed=42`)
  await pause(1500)
  for (let i = 0; i < 3; i++) {
    await answer(fx.seed42[i])
    await app.tap('next-button')
    await pause(1000)
  }
  await answer('0')
  if (await app.exists('drill-steps-toggle')) await app.tap('drill-steps-toggle')
  await pause(3500)

  // a timed sprint from the hub
  await nav('practice')
  await pause(1500)
  const card = await app.waitFor(`technique-${fx.set}`)
  await (await card.$('[data-testid="timed"]')).click()
  await pause(1500)
  await app.tap('len-120')
  await pause(600)
  await app.tap('shot-10')
  await pause(1000)
  await app.tap('timed-start')
  await pause(5000)

  // progress and settings (backup, privacy)
  await nav('progress')
  await pause(2500)
  await scroll(500)
  await nav('settings')
  await pause(2000)
  await scroll(700)
  await pause(1500)
} finally {
  const r = await app.native((d) => d.execute('mobile: stopXCTestScreenRecording', {}))
  mkdirSync(OUT, { recursive: true })
  writeFileSync(new URL('review.mp4', OUT), Buffer.from(r.payload, 'base64'))
  console.log('wrote out/review.mp4', Math.round((r.payload.length * 3) / 4 / 1024), 'KB')
  await app.close()
}
