// App Store screenshots from a simulator (runs on the Mac, after `mentalmath.sh ios:sync`).
// usage: IOS_SIM="iPhone 18 Pro Max" OUT=~/dev/MentalMath/store-shots/iphone node store-shots.mjs
//
// The simulator does not expose the app's web view to automation, so this builds a screenshot-only
// variant of the Mac's copy with a small script in index.html. The script polls a command file in
// the app's Documents folder (written here), seeds progress, sets the theme, opens the screen, does
// one optional action (open the timed sheet, answer the problem) and writes a ready file back; the
// screenshot follows. The shipped app is not touched; the next `ios:sync` restores the copy.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'

const SIM = process.env.IOS_SIM || 'iPhone 18 Pro Max'
const ROOT = `${homedir()}/dev/MentalMath`
const OUT = process.env.OUT || `${ROOT}/store-shots/${SIM.replace(/\W+/g, '-')}`
const IOS = `${ROOT}/ios/App`
const fx = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

// ---- progress that makes the screens look lived-in, dated relative to today
const day = 86_400_000
const ago = (d, h = 9) => new Date(Date.now() - d * day + (h - 12) * 3_600_000).toISOString()
const attempt = (d, correct, seconds = 80) => ({
  at: ago(d),
  correct,
  total: 10,
  seconds,
  mode: 'generated',
})
const seed = {
  settings: { lockUntilRead: false, theme: 'light' },
  reading: {
    0: {
      lastSection: 'overview',
      visited: ['overview', 'adding-and-subtracting'],
      updatedAt: ago(9),
    },
    1: {
      lastSection: 'left-to-right-addition',
      visited: ['overview', 'left-to-right-addition', 'left-to-right-subtraction'],
      updatedAt: ago(0, 8),
    },
    2: { lastSection: 'overview', visited: ['overview'], updatedAt: ago(3) },
  },
  practice: {
    'gen1-two-digit-addition': {
      attempts: [attempt(8, 7), attempt(5, 9), attempt(1, 10, 52)],
      best: 10,
      bests: { clean10: 52, sprint60: 14 },
    },
    'gen1-two-digit-subtraction': { attempts: [attempt(6, 6), attempt(4, 8)], best: 8 },
    'gen2-2-by-1-multiplication': { attempts: [attempt(5, 5)], best: 5 },
    'gen0-multiply-by-11': { attempts: [attempt(2, 10, 40)], best: 10 },
  },
  streak: { current: 6, lastActiveDay: ago(1).slice(0, 10) },
}

// ---- the screenshot-only build
const RUNNER = `<script data-mmshots>(function () {
  var KEY = 'mentalmath.v1';
  function q(id) { return document.querySelector('[data-testid="' + id + '"]'); }
  function act(a, t) {
    if (a === 'timed') {
      q('technique-gen1-two-digit-addition').querySelector('[data-testid="timed"]').click();
      setTimeout(function () { q('len-120').click(); q('shot-10').click(); }, 400);
    }
    if (a === 'answer') {
      if (q('keypad')) { t.split('').concat(['check']).forEach(function (c, n) { setTimeout(function () { q('key-' + c).click(); }, 250 * n); }); }
      else { var i = q('answer-input'); i.value = t; i.dispatchEvent(new Event('input', { bubbles: true })); q('answer-submit').click(); }
      setTimeout(function () { var s = q('drill-steps-toggle'); if (s) s.click(); }, 1500);
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var C = window.Capacitor; if (!C) return;
    var FS = (C.Plugins && C.Plugins.Filesystem) || C.registerPlugin('Filesystem');
    var cur = sessionStorage.getItem('mm-cur');
    if (cur !== null) {
      setTimeout(function () {
        act(sessionStorage.getItem('mm-action') || '', sessionStorage.getItem('mm-type') || '');
        setTimeout(function () {
          // no on-screen keyboard in the shot (wide layouts focus the answer box)
          if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        }, 2000);
        setTimeout(function () {
          FS.writeFile({ path: 'mmshots-ready.txt', directory: 'DOCUMENTS', data: cur, encoding: 'utf8' });
        }, 3000);
      }, 1200);
    }
    setInterval(function () {
      FS.readFile({ path: 'mmshots-cmd.json', directory: 'DOCUMENTS', encoding: 'utf8' }).then(function (r) {
        var c = JSON.parse(r.data);
        if (String(c.i) === sessionStorage.getItem('mm-cur')) return;
        if (c.seed) localStorage.setItem(KEY, c.seed);
        if (c.theme) {
          var s = JSON.parse(localStorage.getItem(KEY) || '{}');
          s.settings = Object.assign({}, s.settings, { theme: c.theme });
          localStorage.setItem(KEY, JSON.stringify(s));
        }
        sessionStorage.setItem('mm-cur', String(c.i));
        sessionStorage.setItem('mm-action', c.action || '');
        sessionStorage.setItem('mm-type', c.type || '');
        location.replace(c.path);
      }, function () {});
    }, 400);
  });
})();</script>`

function buildVariant() {
  const html = `${IOS}/App/public/index.html`
  const s = readFileSync(html, 'utf8').replace(/<script data-mmshots>[\s\S]*?<\/script>/, '')
  writeFileSync(html, s.replace('<head>', `<head>${RUNNER}`))
  const out = sh(
    'xcodebuild',
    [
      '-project',
      `${IOS}/App.xcodeproj`,
      '-scheme',
      'App',
      '-configuration',
      'Debug',
      '-sdk',
      'iphonesimulator',
      '-destination',
      `platform=iOS Simulator,name=${SIM}`,
      '-derivedDataPath',
      `${IOS}/build-shots`,
      'CODE_SIGNING_ALLOWED=NO',
      'build',
    ],
    { maxBuffer: 1 << 28 },
  )
  if (!out.includes('BUILD SUCCEEDED')) throw new Error('screenshot build failed')
}

let docs = ''
let step = 0
async function open(path, extra = {}) {
  const i = ++step
  writeFileSync(`${docs}/mmshots-cmd.json`, JSON.stringify({ i, path, ...extra }))
  for (let t = 0; t < 80; t++) {
    try {
      if (readFileSync(`${docs}/mmshots-ready.txt`, 'utf8').trim() === String(i)) return
    } catch {
      /* not yet */
    }
    await sleep(250)
  }
  throw new Error(`scene ${i} (${path}) never reported ready`)
}
let n = 0
async function shot(name, wait = 300) {
  await sleep(wait)
  sh(
    'xcrun',
    ['simctl', 'io', SIM, 'screenshot', `${OUT}/${String(++n).padStart(2, '0')}-${name}.png`],
    {
      stdio: 'ignore',
    },
  )
}

buildVariant()
try {
  sh('xcrun', ['simctl', 'shutdown', SIM], { stdio: 'ignore' }) // clears any leftover system dialog
} catch {
  /* not booted */
}
try {
  sh('xcrun', ['simctl', 'boot', SIM], { stdio: 'ignore' })
} catch {
  /* already booted */
}
sh('xcrun', ['simctl', 'bootstatus', SIM, '-b'], { stdio: 'ignore' })
sh('xcrun', [
  'simctl',
  'status_bar',
  SIM,
  'override',
  '--time',
  '9:41',
  '--batteryState',
  'charged',
  '--batteryLevel',
  '100',
  '--wifiBars',
  '3',
  '--cellularMode',
  'active',
  '--cellularBars',
  '4',
])
try {
  sh('xcrun', ['simctl', 'terminate', SIM, 'dev.hbq.mentalmath'], { stdio: 'ignore' })
} catch {
  /* not running */
}
sh('xcrun', [
  'simctl',
  'install',
  SIM,
  `${IOS}/build-shots/Build/Products/Debug-iphonesimulator/App.app`,
])
sh('xcrun', ['simctl', 'launch', SIM, 'dev.hbq.mentalmath'])
docs = `${sh('xcrun', ['simctl', 'get_app_container', SIM, 'dev.hbq.mentalmath', 'data']).trim()}/Documents`
mkdirSync(docs, { recursive: true })
for (const f of ['mmshots-cmd.json', 'mmshots-ready.txt']) rmSync(`${docs}/${f}`, { force: true })
await sleep(3000)

try {
  await open('/', { seed: JSON.stringify(seed) })
  await shot('home')
  await open('/read/1/left-to-right-addition')
  await shot('reader')
  await open('/practice/1/gen1-two-digit-addition?mode=generated&seed=3')
  await shot('drill')
  await open('/practice/1/gen1-two-digit-addition?mode=generated&seed=3', {
    action: 'answer',
    type: fx.seed3[0],
  })
  await shot('feedback')
  await open('/practice')
  await shot('practice')
  await open('/practice', { action: 'timed' })
  await shot('timed')
  await open('/progress')
  await shot('progress')
  await open('/practice/1/gen1-two-digit-addition?mode=generated&seed=8', { theme: 'dark' })
  await shot('drill-dark')
  await open('/', { theme: 'light' })
  console.log(`wrote ${n} screenshots to ${OUT}`)
} finally {
  sh('xcrun', ['simctl', 'status_bar', SIM, 'clear'], { stdio: 'ignore' })
}
