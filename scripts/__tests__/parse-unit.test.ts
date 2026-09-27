// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseUnit, type ParseOptions } from '../lib/parse-unit'

const fx = (name: string) => readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8')

const opts: ParseOptions = {
  exerciseSets: { 'ch0-f002': 'ch0-sample-set' },
  imageSize: () => ({ width: 32, height: 70 }),
  figureSrc: (unit, id) => `/book/figures/${unit}/${id}.jpeg`,
}

function parseSample() {
  return parseUnit(
    {
      id: '0',
      kicker: 'Chapter 0',
      files: [
        { path: 'text/a.html', html: fx('chapter-sample.html') },
        { path: 'text/b.html', html: fx('chapter-sample-2.html') },
      ],
    },
    opts,
  )
}

describe('parseUnit', () => {
  it('reads chapter number and title from the h1 pair', () => {
    const { doc } = parseSample()
    expect(doc.id).toBe('0')
    expect(doc.number).toBe(0)
    expect(doc.title).toBe('Quick Tricks: Easy (and Impressive) Calculations')
    expect(doc.kicker).toBe('Chapter 0')
  })

  it('splits sections at h2, title-cases them and keeps repeats unique in order', () => {
    const { doc } = parseSample()
    expect(doc.sections.map((s) => s.id)).toEqual([
      'overview',
      'instant-multiplication',
      'why-this-trick-works',
      'why-this-trick-works-2',
      '3-by-2-multiplication',
    ])
    expect(doc.sections[1]?.title).toBe('Instant Multiplication')
    expect(doc.sections[4]?.title).toBe('3-by-2 Multiplication')
  })

  it('numbers figures across files and swaps mapped ones for exercise blocks', () => {
    const { doc, figures } = parseSample()
    const im = doc.sections[1]!
    const types = im.blocks.map((b) => b.type)
    expect(types).toEqual(['html', 'figure', 'html', 'exercise', 'html'])
    expect(im.blocks[1]).toEqual({
      type: 'figure',
      id: 'ch0-f001',
      src: '/book/figures/0/ch0-f001.jpeg',
      width: 32,
      height: 70,
    })
    expect(im.blocks[3]).toEqual({ type: 'exercise', setId: 'ch0-sample-set' })
    expect(figures.map((f) => f.id)).toEqual(['ch0-f001', 'ch0-f003', 'ch0-f004'])
    expect(figures[0]?.sourcePath).toBe('images/00008.jpeg')
    const last = doc.sections[4]!
    expect(last.blocks[1]).toMatchObject({ type: 'figure', id: 'ch0-f003' })
    expect(last.blocks[2]).toMatchObject({ type: 'html' })
    expect((last.blocks[2] as { html: string }).html).toContain(
      '<img src="/book/figures/0/ch0-f004.jpeg" width="32" height="70" alt="" class="inline">',
    )
  })

  it('reports unmapped figures that follow exercise text as candidates', () => {
    // Already-mapped figures need no curation, so they are not reported.
    expect(parseSample().candidates).toEqual([])
    const { candidates } = parseUnit(
      {
        id: '0',
        kicker: 'Chapter 0',
        files: [{ path: 'text/a.html', html: fx('chapter-sample.html') }],
      },
      { ...opts, exerciseSets: {} },
    )
    expect(candidates).toEqual([
      { figureId: 'ch0-f002', after: expect.stringContaining('exercises below') },
    ])
  })

  it('maps calibre markup to semantic html and records page numbers', () => {
    const { doc } = parseSample()
    const im = doc.sections[1]!
    const first = im.blocks[0] as { html: string; page?: number }
    expect(first.html).toBe(
      '<p>Consider the problem:</p><p class="center"><strong>3<u>5</u>2</strong></p><p>Think of the problem this way:</p>',
    )
    expect(first.page).toBe(2)
    const aside = im.blocks[4] as { html: string }
    expect(aside.html).toBe(
      '<h3>Three-Digit Addition</h3><aside><p class="aside-title"><strong>Carl Friedrich Gauss</strong></p><p>A prodigy is a talented child.</p></aside>',
    )
    const why = doc.sections[2]!.blocks[0] as { html: string }
    expect(why.html).toBe(
      '<p>Because 11 = 10 + 1. See this page.</p><table><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
    )
    const why2 = doc.sections[3]!.blocks[0] as { html: string }
    expect(why2.html).toBe('<p>Again. Frac: <sup>1</sup>/2</p>')
  })

  it('drops the leading big-letter wrapper and keeps the overview text', () => {
    const { doc } = parseSample()
    const ov = doc.sections[0]!.blocks[0] as { html: string; page?: number }
    expect(ov.html).toBe('<p>In the pages that follow, you will learn to do math in your head.</p>')
    expect(ov.page).toBe(1)
  })

  it('builds the intro unit with one section per file titled from the toc', () => {
    const { doc } = parseUnit(
      {
        id: 'intro',
        kicker: 'Before you begin',
        titleOverride: 'Forewords and Introduction',
        files: [
          {
            path: 'text/f.html',
            tocLabel: 'Foreword by Bill Nye',
            html: '<html><body><h1 class="preface">Foreword</h1><h1 class="subchapterpre">by Bill Nye</h1><p class="nonindent">Hi.</p></body></html>',
          },
          {
            path: 'text/i.html',
            tocLabel: 'Introduction by Arthur Benjamin',
            html: '<html><body><h1 class="itr">Introduction</h1><p class="nonindent">Numbers.</p></body></html>',
          },
        ],
      },
      opts,
    )
    expect(doc.number).toBeNull()
    expect(doc.title).toBe('Forewords and Introduction')
    expect(doc.sections.map((s) => [s.id, s.title])).toEqual([
      ['foreword-by-bill-nye', 'Foreword by Bill Nye'],
      ['introduction-by-arthur-benjamin', 'Introduction by Arthur Benjamin'],
    ])
    expect(doc.sections[0]?.blocks).toEqual([{ type: 'html', html: '<p>Hi.</p>' }])
  })

  it('parses Chapter ∞ as the epilogue with a null number', () => {
    const { doc } = parseUnit(
      {
        id: 'epilogue',
        kicker: 'Chapter ∞',
        files: [
          {
            path: 'text/e.html',
            html: '<html><body><h1 class="chapter"><strong class="calibre5">Chapter</strong> ∞</h1><h1 class="subchapter"><strong class="calibre5">Epilogue: How Math Helps</strong></h1><h1 class="subchapterpre1"><strong class="calibre5">by Michael Shermer</strong></h1><p class="nonindent">As the publisher.</p></body></html>',
          },
        ],
      },
      opts,
    )
    expect(doc.number).toBeNull()
    expect(doc.title).toBe('Epilogue: How Math Helps, by Michael Shermer')
    expect(doc.sections.map((s) => s.id)).toEqual(['overview'])
    expect(doc.sections[0]?.title).toBe('Epilogue')
  })
})

describe('parseUnit exercise mapping extras', () => {
  const two = `<html><body>
<h2 class="section"><strong>SET</strong></h2>
<p class="indent">Heading image then list image:</p>
<div class="dis_img"><img src="../images/h.jpeg" alt=""/></div>
<div class="dis_img"><img src="../images/l.jpeg" alt=""/></div>
<p class="indent">A worked example that also carries the next list:</p>
<div class="dis_img"><img src="../images/mixed.jpeg" alt=""/></div>
<p class="indent">Tail.</p>
</body></html>`

  it('collapses several figures mapped to the same set into one exercise block per section', () => {
    const { doc, figures } = parseUnit(
      { id: '2', kicker: 'Chapter 2', files: [{ path: 'text/x.html', html: two }] },
      { ...opts, exerciseSets: { 'ch2-f001': 'ch2-two-digit-squares', 'ch2-f002': 'ch2-two-digit-squares' } },
    )
    const types = doc.sections[0]!.blocks.map((b) => (b.type === 'exercise' ? `exercise:${b.setId}` : b.type))
    expect(types).toEqual(['html', 'exercise:ch2-two-digit-squares', 'html', 'figure', 'html'])
    expect(figures.map((f) => f.id)).toEqual(['ch2-f003'])
  })

  it('keeps a figure and inserts an exercise block after it when listed in exerciseAfter', () => {
    const { doc, figures } = parseUnit(
      { id: '3', kicker: 'Chapter 3', files: [{ path: 'text/x.html', html: two }] },
      { ...opts, exerciseSets: {}, exerciseAfter: { 'ch3-f003': 'ch3-three-digit-squares' } },
    )
    const types = doc.sections[0]!.blocks.map((b) => (b.type === 'exercise' ? `exercise:${b.setId}` : b.type))
    expect(types).toEqual(['html', 'figure', 'figure', 'html', 'figure', 'exercise:ch3-three-digit-squares', 'html'])
    expect(figures.map((f) => f.id)).toEqual(['ch3-f001', 'ch3-f002', 'ch3-f003'])
  })
})

describe('parseUnit figures nested in block divs', () => {
  it('emits a figure block for div.dis_img inside div.block1 and keeps numbering in document order', () => {
    const html = `<html><body>
<h2 class="section"><strong>SUB</strong></h2>
<p class="indent">Lead.</p>
<div class="block1">
<p class="bl_hanging">First line</p>
<div class="dis_img"><img src="../images/a.jpeg" alt=""/></div>
<p class="bl_hanging">Second line</p>
</div>
<div class="dis_img"><img src="../images/b.jpeg" alt=""/></div>
</body></html>`
    const { doc, figures } = parseUnit(
      { id: '1', kicker: 'Chapter 1', files: [{ path: 'text/x.html', html }] },
      { ...opts, exerciseSets: {} },
    )
    const blocks = doc.sections[0]!.blocks
    expect(blocks.map((b) => b.type)).toEqual(['html', 'figure', 'html', 'figure'])
    expect((blocks[0] as { html: string }).html).toBe('<p>Lead.</p><div class="block"><p class="hanging">First line</p></div>')
    expect(blocks[1]).toMatchObject({ id: 'ch1-f001' })
    expect((blocks[2] as { html: string }).html).toBe('<div class="block"><p class="hanging">Second line</p></div>')
    expect(blocks[3]).toMatchObject({ id: 'ch1-f002' })
    expect(figures.map((f) => f.sourcePath)).toEqual(['images/a.jpeg', 'images/b.jpeg'])
  })
})
