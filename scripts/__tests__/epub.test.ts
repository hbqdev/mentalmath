// @vitest-environment node
import { readFileSync } from 'node:fs'
import { zipSync, strToU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { openEpub, planUnits, readSpine, readText, readToc } from '../lib/epub'

const fx = (name: string) =>
  readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')

function miniEpub() {
  const container = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
  return zipSync({
    mimetype: strToU8('application/epub+zip'),
    'META-INF/container.xml': strToU8(container),
    'content.opf': strToU8(fx('mini.opf')),
    'toc.ncx': strToU8(fx('mini.ncx')),
    'text/part0005.html': strToU8('<html><body><p>f</p></body></html>'),
  })
}

describe('epub container', () => {
  it('finds the opf through container.xml and reads files', () => {
    const a = openEpub(miniEpub())
    expect(a.opfPath).toBe('content.opf')
    expect(a.opfDir).toBe('')
    expect(readText(a, 'text/part0005.html')).toContain('<p>f</p>')
  })
  it('returns the spine as hrefs in order', () => {
    const a = openEpub(miniEpub())
    expect(readSpine(a)).toEqual([
      'text/part0005.html',
      'text/part0008.html',
      'text/part0009_split_000.html',
      'text/part0009_split_001.html',
      'text/part0019.html',
      'text/part0020.html',
      'text/part0022.html',
    ])
  })
  it('returns toc entries without fragments', () => {
    const a = openEpub(miniEpub())
    expect(readToc(a)[2]).toEqual({
      label: 'Chapter 0 Quick Tricks: Easy (and Impressive) Calculations',
      href: 'text/part0009_split_000.html',
    })
  })
})

describe('planUnits', () => {
  it('groups spine files into intro, chapters, epilogue and answers', () => {
    const a = openEpub(miniEpub())
    const units = planUnits(readSpine(a), readToc(a))
    expect(units.map((u) => u.id)).toEqual(['intro', '0', 'epilogue', 'answers'])
    expect(units[0]).toEqual({
      id: 'intro',
      kicker: 'Before you begin',
      titleOverride: 'Forewords and Introduction',
      files: [
        { path: 'text/part0005.html', tocLabel: 'Foreword by Bill Nye (the Science Guy®)' },
        { path: 'text/part0008.html', tocLabel: 'Introduction by Arthur Benjamin' },
      ],
    })
    expect(units[1]).toEqual({
      id: '0',
      kicker: 'Chapter 0',
      files: [{ path: 'text/part0009_split_000.html' }, { path: 'text/part0009_split_001.html' }],
    })
    expect(units[2]).toEqual({
      id: 'epilogue',
      kicker: 'Chapter ∞',
      files: [{ path: 'text/part0019.html' }],
    })
    expect(units[3]?.files).toEqual([{ path: 'text/part0020.html' }])
  })
})
