/**
 * Rasterises public/favicon.svg into the PNG sizes the web manifest needs, using the
 * Chromium that Playwright already installs for the e2e suite (no image library needed).
 * The app's serif is loaded so the mark's "M²" matches the header. Run: npx tsx scripts/make-icons.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'icons')
const svg = readFileSync(path.join(root, 'public', 'favicon.svg'), 'utf8')
const font = path.join(root, 'node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2')

async function render(name: string, size: number, maskable: boolean) {
  const b = await chromium.launch()
  const page = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
  // Maskable and Apple icons must fill the square; the platform rounds the corners itself.
  const body = maskable ? svg.replace('rx="14"', 'rx="0"').replace('viewBox="0 0 64 64"', 'viewBox="6 6 52 52"') : svg
  await page.setContent(`<!doctype html><style>
    @font-face { font-family: 'Source Serif 4'; src: url('file://${font}') format('woff2'); font-weight: 200 900; }
    html, body { margin: 0; background: transparent; }
    svg { display: block; width: ${size}px; height: ${size}px; }
  </style>${body}`)
  await page.evaluate('document.fonts.ready')
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
  await b.close()
  writeFileSync(path.join(out, name), png)
  console.log(`wrote public/icons/${name}`)
}

mkdirSync(out, { recursive: true })
await render('icon-32.png', 32, false)
await render('icon-192.png', 192, false)
await render('icon-512.png', 512, false)
await render('maskable-512.png', 512, true)
await render('apple-touch-icon.png', 180, true)
