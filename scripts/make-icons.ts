/**
 * Rasterises the app icon (the favicon's rounded square with a multiplication sign) into the
 * PNG sizes a web manifest needs, with no image library: pixels are shaded by geometry and
 * written through zlib. Run: npx tsx scripts/make-icons.ts
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ACCENT = [0x8b, 0x2e, 0x2e] as const
const PAPER = [0xf6, 0xf1, 0xe7] as const

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** Signed distance helpers, all in a 64-unit design space scaled to the target size. */
function coverage(x: number, y: number, size: number, maskable: boolean): number {
  const s = size / 64
  // rounded square (or full bleed for the maskable variant)
  if (maskable) return 1 // full bleed: the platform applies its own mask
  const r = 14 * s
  // signed distance to a rounded box centred in the canvas
  const qx = Math.abs(x - size / 2) - (size / 2 - r)
  const qy = Math.abs(y - size / 2) - (size / 2 - r)
  const dSquare = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
  return Math.min(1, Math.max(0, 0.5 - dSquare))
}
function crossCoverage(x: number, y: number, size: number, maskable: boolean): number {
  const s = size / 64
  const pad = maskable ? 6 * s : 0
  const half = 13 * s - pad / 2
  const w = 3.5 * s
  const cx = size / 2
  const cy = size / 2
  const seg = (ux: number, uy: number) => {
    // distance from (x,y) to the segment from centre-half·u to centre+half·u
    const px = x - cx
    const py = y - cy
    const t = Math.max(-half, Math.min(half, px * ux + py * uy))
    return Math.hypot(px - t * ux, py - t * uy)
  }
  const d = Math.min(seg(Math.SQRT1_2, Math.SQRT1_2), seg(Math.SQRT1_2, -Math.SQRT1_2)) - w
  return Math.min(1, Math.max(0, 0.5 - d))
}

export function renderIcon(size: number, maskable = false): Buffer {
  const rows: Buffer[] = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    row[0] = 0
    for (let x = 0; x < size; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const a = coverage(px, py, size, maskable)
      const c = crossCoverage(px, py, size, maskable)
      const o = 1 + x * 4
      row[o] = Math.round(ACCENT[0] + (PAPER[0] - ACCENT[0]) * c)
      row[o + 1] = Math.round(ACCENT[1] + (PAPER[1] - ACCENT[1]) * c)
      row[o + 2] = Math.round(ACCENT[2] + (PAPER[2] - ACCENT[2]) * c)
      row[o + 3] = Math.round(255 * a)
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ])
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
  mkdirSync(out, { recursive: true })
  for (const [name, size, maskable] of [
    ['icon-192.png', 192, false],
    ['icon-512.png', 512, false],
    ['maskable-512.png', 512, true],
    ['apple-touch-icon.png', 180, true],
  ] as const) {
    writeFileSync(path.join(out, name), renderIcon(size, maskable))
    console.log(`wrote public/icons/${name}`)
  }
}
