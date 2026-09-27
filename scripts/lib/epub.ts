import * as cheerio from 'cheerio'
import { strFromU8, unzipSync } from 'fflate'
import path from 'node:path'

export interface EpubArchive {
  files: Map<string, Uint8Array>
  opfPath: string
  opfDir: string
}
export interface TocEntry {
  label: string
  href: string
}
export interface UnitPlan {
  id: string
  kicker: string
  titleOverride?: string
  files: Array<{ path: string; tocLabel?: string }>
}

export function openEpub(bytes: Uint8Array): EpubArchive {
  const raw = unzipSync(bytes)
  const files = new Map<string, Uint8Array>(Object.entries(raw))
  const container = files.get('META-INF/container.xml')
  if (!container) throw new Error('Not an EPUB: META-INF/container.xml missing')
  const $ = cheerio.load(strFromU8(container), { xml: true })
  const opfPath = $('rootfile').first().attr('full-path')
  if (!opfPath) throw new Error('container.xml has no rootfile')
  const dir = path.posix.dirname(opfPath)
  return { files, opfPath, opfDir: dir === '.' ? '' : dir }
}

export function readText(a: EpubArchive, pathFromRoot: string): string {
  const bytes = a.files.get(pathFromRoot)
  if (!bytes) throw new Error(`Missing file in EPUB: ${pathFromRoot}`)
  return strFromU8(bytes)
}

function fromOpf(a: EpubArchive, href: string): string {
  return path.posix.normalize(a.opfDir ? path.posix.join(a.opfDir, href) : href)
}

export function readSpine(a: EpubArchive): string[] {
  const $ = cheerio.load(readText(a, a.opfPath), { xml: true })
  const hrefById = new Map<string, string>()
  $('manifest > item').each((_, el) => {
    const id = $(el).attr('id')
    const href = $(el).attr('href')
    if (id && href) hrefById.set(id, href)
  })
  const out: string[] = []
  $('spine > itemref').each((_, el) => {
    const href = hrefById.get($(el).attr('idref') ?? '')
    if (href && /\.x?html?$/i.test(href)) out.push(fromOpf(a, href))
  })
  return out
}

export function readToc(a: EpubArchive): TocEntry[] {
  const $opf = cheerio.load(readText(a, a.opfPath), { xml: true })
  const ncxHref =
    $opf('manifest > item[media-type="application/x-dtbncx+xml"]').attr('href') ?? 'toc.ncx'
  const $ = cheerio.load(readText(a, fromOpf(a, ncxHref)), { xml: true })
  const entries: TocEntry[] = []
  $('navPoint').each((_, el) => {
    const label = $(el)
      .children('navLabel')
      .children('text')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim()
    const src = $(el).children('content').attr('src') ?? ''
    const href = fromOpf(a, src.split('#')[0] ?? '')
    if (label && href) entries.push({ label, href })
  })
  return entries
}

function classify(label: string): { id: string; kicker: string; titleOverride?: string } | null {
  const m = /^Chapter (\d+)\b/.exec(label)
  if (m) return { id: m[1]!, kicker: `Chapter ${m[1]}` }
  if (/^Chapter ∞/.test(label)) return { id: 'epilogue', kicker: 'Chapter ∞' }
  if (/^(Foreword|Prologue|Introduction)\b/.test(label)) {
    return { id: 'intro', kicker: 'Before you begin', titleOverride: 'Forewords and Introduction' }
  }
  if (/^Answers\b/.test(label)) return { id: 'answers', kicker: 'Answers' }
  return null
}

export function planUnits(spine: string[], toc: TocEntry[]): UnitPlan[] {
  const units = new Map<string, UnitPlan>()
  for (let i = 0; i < toc.length; i++) {
    const entry = toc[i]!
    const kind = classify(entry.label)
    if (!kind) continue
    const start = spine.indexOf(entry.href)
    if (start < 0) continue
    const next = toc
      .slice(i + 1)
      .map((t) => spine.indexOf(t.href))
      .find((idx) => idx > start)
    const end = next ?? spine.length
    const files = spine
      .slice(start, end)
      .map((p) => (kind.id === 'intro' ? { path: p, tocLabel: entry.label } : { path: p }))
    const existing = units.get(kind.id)
    if (existing) existing.files.push(...files)
    else units.set(kind.id, { ...kind, files })
  }
  const order = ['intro', ...Array.from({ length: 10 }, (_, i) => String(i)), 'epilogue', 'answers']
  return order.flatMap((id) => (units.has(id) ? [units.get(id)!] : []))
}
