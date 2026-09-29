// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { zipSync, strToU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { extract } from '../extract-book'

const fx = (name: string) =>
  readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')
// A real 32x70 figure copied out of the EPUB
const JPEG = new Uint8Array(readFileSync(new URL('../__fixtures__/fig.jpeg', import.meta.url)))

function miniEpub() {
  const container = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
  return zipSync({
    mimetype: strToU8('application/epub+zip'),
    'META-INF/container.xml': strToU8(container),
    'content.opf': strToU8(fx('mini.opf')),
    'toc.ncx': strToU8(fx('mini.ncx')),
    'text/part0005.html': strToU8(
      '<html><body><h1 class="preface">Foreword</h1><p class="nonindent">Hi.</p></body></html>',
    ),
    'text/part0008.html': strToU8(
      '<html><body><h1 class="itr">Introduction</h1><p class="nonindent">Numbers.</p></body></html>',
    ),
    'text/part0009_split_000.html': strToU8(fx('chapter-sample.html')),
    'text/part0009_split_001.html': strToU8(fx('chapter-sample-2.html')),
    'text/part0019.html': strToU8(
      '<html><body><h1 class="chapter">Chapter ∞</h1><h1 class="subchapter">Epilogue</h1><p class="nonindent">End.</p></body></html>',
    ),
    'text/part0020.html': strToU8(
      '<html><body><h2 class="section">CHAPTER 1: X</h2></body></html>',
    ),
    'text/part0022.html': strToU8('<html><body><p>about</p></body></html>'),
    'images/00008.jpeg': JPEG,
    'images/00009.jpeg': JPEG,
    'images/00010.jpeg': JPEG,
    'images/00011.jpeg': JPEG,
  })
}

describe('extract()', () => {
  it('writes chapter json, figures, index and reports candidates', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'mm-extract-'))
    const result = extract(miniEpub(), {
      contentDir: path.join(out, 'content'),
      figuresDir: path.join(out, 'figures'),
      publicPrefix: '/book/figures',
      exerciseSets: { 'ch0-f002': 'ch0-sample-set' },
    })
    expect(readdirSync(path.join(out, 'content', 'chapters')).sort()).toEqual([
      '0.json',
      'epilogue.json',
      'intro.json',
    ])
    const ch0 = JSON.parse(readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8'))
    expect(ch0.title).toBe('Quick Tricks: Easy (and Impressive) Calculations')
    const fig = ch0.sections[1].blocks[1]
    expect(fig).toMatchObject({ type: 'figure', id: 'ch0-f001', width: 32, height: 70 })
    expect(existsSync(path.join(out, 'figures', '0', 'ch0-f001.jpeg'))).toBe(true)
    expect(existsSync(path.join(out, 'figures', '0', 'ch0-f002.jpeg'))).toBe(false)
    const index = readFileSync(path.join(out, 'content', 'index.ts'), 'utf8')
    expect(index).toContain(`'intro': () => import('./chapters/intro.json')`)
    const meta = JSON.parse(readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8'))
    expect(meta.id).toBe('0')
    const indexJson = index.slice(
      index.indexOf('= [') + 2,
      index.indexOf('\n\nexport const chapterLoaders'),
    )
    const metas = JSON.parse(indexJson) as Array<{
      id: string
      sets: Array<{ id: string; sectionId: string }>
    }>
    expect(metas.find((m) => m.id === '0')?.sets).toEqual([
      { id: 'ch0-sample-set', sectionId: 'instant-multiplication' },
    ])
    expect(metas.find((m) => m.id === 'intro')?.sets).toEqual([])
    expect(result.candidates).toEqual([])
    expect(result.units.map((u) => u.id)).toEqual(['intro', '0', 'epilogue'])
    expect(result.answersHtml.length).toBeGreaterThan(0)
  })

  it('is idempotent: a second run produces identical bytes', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'mm-extract-'))
    const opts = {
      contentDir: path.join(out, 'content'),
      figuresDir: path.join(out, 'figures'),
      publicPrefix: '/book/figures',
      exerciseSets: {},
    }
    extract(miniEpub(), opts)
    const first = readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8')
    extract(miniEpub(), opts)
    expect(readFileSync(path.join(out, 'content', 'chapters', '0.json'), 'utf8')).toBe(first)
  })
})
