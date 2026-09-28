// Drive the app inside the Android emulator over the WebView's DevTools socket (raw CDP, since
// Playwright cannot attach to a WebView) and save device screenshots under screenshots/android/.
// Run through `scripts/mentalmath.sh emu:shots` after `emu:start` and `emu:install`.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import WebSocket from 'ws'

const serial = 'emulator-5554'
const pkg = 'dev.hbq.mentalmath'
const adb = (...args) => execFileSync('adb', ['-s', serial, ...args], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 << 20 })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const out = 'screenshots/android'
mkdirSync(out, { recursive: true })

adb('shell', 'am', 'force-stop', pkg)
adb('shell', 'am', 'start', '-n', `${pkg}/.MainActivity`)
await sleep(4000)
const pid = adb('shell', 'pidof', pkg).toString().trim()
adb('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`)
const pages = await (await fetch('http://127.0.0.1:9222/json')).json()
const target = pages.find((p) => p.type === 'page' && /localhost/.test(p.url)) ?? pages[0]
if (!target) throw new Error('no WebView page target')

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((res, rej) => ws.once('open', res).once('error', rej))
let seq = 0
const pending = new Map()
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString())
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) rej(new Error(msg.error.message))
    else res(msg.result)
  }
})
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })) })
async function js(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
  return r.result.value
}
const q = (sel) => `document.querySelector(${JSON.stringify(sel)})`
async function waitFor(sel, ms = 8000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await js(`!!${q(sel)}`)) return
    await sleep(150)
  }
  throw new Error(`timeout waiting for ${sel}`)
}
const click = (sel) => js(`${q(sel)}.click(); true`)
const fill = (sel, value) => js(`(() => { const el = ${q(sel)}; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
async function go(path) {
  await js(`window.history.pushState({}, '', ${JSON.stringify(path)}); window.dispatchEvent(new PopStateEvent('popstate')); true`)
  await sleep(700)
}
async function shot(name) {
  await js('document.fonts.ready.then(() => true)')
  await sleep(600)
  writeFileSync(`${out}/${name}.png`, adb('exec-out', 'screencap', '-p'))
  console.log(`wrote ${out}/${name}.png`)
}

await js('localStorage.clear(); true')
await send('Page.reload')
await sleep(2500)
await waitFor('h1')
await shot('home')
await go('/practice')
await waitFor('[data-testid="technique-gen1-two-digit-addition"]')
await shot('practice-hub')
await go('/read/1/left-to-right-addition')
await waitFor('#left-to-right-addition')
await shot('reader-chapter-1')
await click('[data-testid="pill-practice"]')
await waitFor('[data-testid="sheet"].open')
await shot('reader-sheet-open')
await click('[data-testid="sheet-close"]')
await go('/practice/1/ch1-two-digit-addition')
await waitFor('[data-testid="worksheet"]')
await fill('[data-testid="sheet-input-1"]', '0')
await click('[data-testid="sheet-check-1"]')
await waitFor('[data-testid="sheet-verdict-1"]')
await shot('worksheet')
await go('/practice/1/gen1-two-digit-addition?mode=generated&seed=3')
await waitFor('[data-testid="answer-input"]')
await js(`${q('[data-testid="answer-input"]')}.focus(); true`)
adb('shell', 'input', 'tap', '540', '1500')
await sleep(900)
await shot('session-keyboard')
await click('[data-testid="theme-toggle"]')
await click('[data-testid="theme-dark"]')
await sleep(400)
await shot('session-dark')
ws.close()
