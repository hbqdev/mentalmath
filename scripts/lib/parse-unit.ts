import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { AnyNode, Element } from 'domhandler'
import path from 'node:path'
import type { Block, ChapterDoc, SectionDoc } from '../../src/content/types'
import { sanitizeHtml } from './sanitize'
import { collapseWs, slugify, titleCase, uniqueSlug } from './text'

export interface UnitInput {
  id: string
  kicker: string
  titleOverride?: string
  files: Array<{ path: string; html: string; tocLabel?: string }>
}
export interface ParseOptions {
  /** figure id -> set id: the figure IS the exercise list; it is replaced by an exercise block */
  exerciseSets: Record<string, string>
  /** figure id -> set id: the figure stays and an exercise block is inserted right after it */
  exerciseAfter?: Record<string, string>
  imageSize: (imagePath: string) => { width: number; height: number }
  figureSrc: (unitId: string, figureId: string) => string
}
export interface FigureRef {
  id: string
  unitId: string
  sourcePath: string
}
export interface ExerciseCandidate {
  figureId: string
  after: string
}
export interface ParsedUnit {
  doc: ChapterDoc
  figures: FigureRef[]
  candidates: ExerciseCandidate[]
}

const P_CLASS: Record<string, string | null> = {
  indent: null,
  nonindent: null,
  nonindentt: null,
  nonindentt1: null,
  nonindentbz: null,
  indentt: null,
  indent1: null,
  textbox1: null,
  textbox2: null,
  center: 'center',
  bl_center: 'center',
  right: 'right',
  extract: 'extract',
  extract1: 'extract',
  hanging: 'hanging',
  bl_hanging: 'hanging',
  bl_hangings: 'hanging',
  bl_hanginga: 'hanging',
  bl_nonindent: 'list-line',
  footnote1: 'footnote',
  textboxh: 'aside-title',
}
const BLOCK_DIVS = new Set(['block1', 'block2', 'blockk', 'hangings', 'footnote'])

interface Meta {
  number: number | null
  title: string
  byline?: string
  firstPage?: number
}

class UnitBuilder {
  readonly sections: SectionDoc[] = []
  readonly figures: FigureRef[] = []
  readonly candidates: ExerciseCandidate[] = []
  private used = new Set<string>(['overview'])
  private current: SectionDoc | null = null
  private buffer: string[] = []
  private page: number | undefined
  private figureCount = 0

  constructor(
    private unitId: string,
    private opts: ParseOptions,
  ) {}

  get unitLabel() {
    return this.unitId
  }

  startSection(title: string, id?: string) {
    this.flush()
    const t = titleCase(title)
    const sid = id ?? uniqueSlug(slugify(t), this.used)
    this.current = { id: sid, title: t, blocks: [] }
    this.sections.push(this.current)
  }

  ensureSection() {
    if (!this.current) {
      this.current = { id: 'overview', title: 'Overview', blocks: [] }
      this.sections.push(this.current)
    }
    return this.current
  }

  addHtml(fragment: string, page?: number) {
    if (page !== undefined && this.page === undefined) this.page = page
    if (fragment.trim()) this.buffer.push(fragment)
  }

  addFigure(sourcePath: string) {
    const sec = this.ensureSection()
    const preceding = this.buffer.join('')
    this.flush()
    const id = this.nextFigureId()
    const setId = this.opts.exerciseSets[id]
    if (setId) {
      this.pushExercise(sec, setId)
    } else {
      const text = collapseWs(cheerio.load(preceding).text())
      if (/exercis/i.test(text)) this.candidates.push({ figureId: id, after: text.slice(-160) })
      const { width, height } = this.opts.imageSize(sourcePath)
      sec.blocks.push({
        type: 'figure',
        id,
        src: this.opts.figureSrc(this.unitId, id),
        width,
        height,
      })
      this.figures.push({ id, unitId: this.unitId, sourcePath })
    }
    const after = this.opts.exerciseAfter?.[id]
    if (after) this.pushExercise(sec, after)
  }

  /** One exercise block per set per section: heading images and split lists collapse into one. */
  private pushExercise(sec: SectionDoc, setId: string) {
    if (sec.blocks.some((b) => b.type === 'exercise' && b.setId === setId)) return
    sec.blocks.push({ type: 'exercise', setId })
  }

  inlineFigure(sourcePath: string): string {
    const id = this.nextFigureId()
    const { width, height } = this.opts.imageSize(sourcePath)
    this.figures.push({ id, unitId: this.unitId, sourcePath })
    return `<img src="${this.opts.figureSrc(this.unitId, id)}" width="${width}" height="${height}" alt="" class="inline">`
  }

  flush() {
    if (this.buffer.length === 0) {
      this.page = undefined
      return
    }
    const sec = this.ensureSection()
    const html = sanitizeHtml(this.buffer.join(''))
    const block: Block =
      this.page === undefined ? { type: 'html', html } : { type: 'html', html, page: this.page }
    sec.blocks.push(block)
    this.buffer = []
    this.page = undefined
  }

  finish(): SectionDoc[] {
    this.flush()
    return this.sections.filter((s) => s.blocks.length > 0)
  }

  private nextFigureId() {
    this.figureCount += 1
    return `ch${this.unitId}-f${String(this.figureCount).padStart(3, '0')}`
  }
}

function imagePath(fileDir: string, src: string): string {
  return path.posix.normalize(path.posix.join(fileDir, src))
}

/** Heading text with <br> treated as a space (calibre breaks long headings across lines). */
function headingText($: CheerioAPI, el: Element): string {
  return collapseWs(($(el).html() ?? '').replace(/<br[^>]*>/g, ' ').replace(/<[^>]+>/g, ''))
}

function pageOf(el: Element): number | undefined {
  const m = /^page(\d+)$/.exec(el.attribs.id ?? '')
  return m ? Number(m[1]) : undefined
}

function classesOf(el: Element): string[] {
  return (el.attribs.class ?? '').split(/\s+/).filter(Boolean)
}

/** Serialise inline content, applying the inline map. Returns html and the first page anchor seen. */
function inlineHtml(el: Element, b: UnitBuilder, fileDir: string): { html: string; page?: number } {
  let page: number | undefined
  const render = (node: AnyNode): string => {
    if (node.type === 'text') return node.data
    if (node.type !== 'tag') return ''
    const e = node as Element
    const tag = e.tagName.toLowerCase()
    const cls = classesOf(e)
    const inner = () => e.children.map(render).join('')
    switch (tag) {
      case 'strong':
        return `<strong>${inner()}</strong>`
      case 'em':
        return `<em>${inner()}</em>`
      case 'sup':
        return `<sup>${inner()}</sup>`
      case 'sub':
        return `<sub>${inner()}</sub>`
      case 'br':
        return '<br>'
      case 'u':
        return `<u>${inner()}</u>`
      case 'span':
        if (cls.includes('underline')) return `<u>${inner()}</u>`
        if (cls.includes('border')) return `<span class="boxed">${inner()}</span>`
        return inner()
      case 'a': {
        const p = pageOf(e)
        if (p !== undefined) {
          page ??= p
          return ''
        }
        return inner()
      }
      case 'img':
        return b.inlineFigure(imagePath(fileDir, e.attribs.src ?? ''))
      default:
        return inner()
    }
  }
  const html = el.children.map(render).join('')
  return page === undefined ? { html } : { html, page }
}

function isImageOnly(el: Element): Element | null {
  const kids = el.children.filter((c) => !(c.type === 'text' && c.data.trim() === ''))
  const only = kids.length === 1 ? kids[0] : undefined
  if (only && only.type === 'tag' && (only as Element).tagName.toLowerCase() === 'img') {
    return only as Element
  }
  return null
}

function paragraph(el: Element, b: UnitBuilder, fileDir: string): { html: string; page?: number } {
  let mapped: string | null = null
  for (const c of classesOf(el)) {
    if (c in P_CLASS) {
      mapped = P_CLASS[c] ?? null
      break
    }
  }
  const { html, page } = inlineHtml(el, b, fileDir)
  const body = collapseWs(html)
  if (!body) return { html: '' }
  const open = mapped ? `<p class="${mapped}">` : '<p>'
  const out = `${open}${body}</p>`
  return page === undefined ? { html: out } : { html: out, page }
}

/**
 * Children of a block-level wrapper (textbox, block1, hangings, ...): runs of <p> become one
 * wrapper fragment; a nested div.dis_img becomes a figure block, closing and reopening the wrapper.
 */
function wrappedChildren(
  $: CheerioAPI,
  el: Element,
  b: UnitBuilder,
  fileDir: string,
  open: string,
  close: string,
): void {
  let run: string[] = []
  const flushRun = () => {
    if (run.length) b.addHtml(`${open}${run.join('')}${close}`)
    run = []
  }
  for (const child of el.children) {
    if (child.type !== 'tag') continue
    const c = child as Element
    const tag = c.tagName.toLowerCase()
    if (tag === 'p') {
      const img = isImageOnly(c)
      if (img) {
        flushRun()
        b.addFigure(imagePath(fileDir, img.attribs.src ?? ''))
      } else {
        run.push(paragraph(c, b, fileDir).html)
      }
    } else if (tag === 'div' && classesOf(c).includes('dis_img')) {
      flushRun()
      for (const img of $(c).find('img').toArray())
        b.addFigure(imagePath(fileDir, img.attribs.src ?? ''))
    } else {
      console.warn(`parse-unit: unhandled <${tag}> inside wrapper, dropped`)
    }
  }
  flushRun()
}

function walkBody(
  $: CheerioAPI,
  nodes: AnyNode[],
  b: UnitBuilder,
  fileDir: string,
  meta: Meta,
): void {
  for (const node of nodes) {
    if (node.type !== 'tag') continue
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const cls = classesOf(el)

    if (tag === 'h1') {
      const text = collapseWs($(el).text())
      if (cls.includes('chapter')) {
        const m = /(\d+)/.exec(text)
        meta.number = m ? Number(m[1]) : null
        const p = $(el).find('a[id^=page]').first().attr('id')
        if (p) meta.firstPage = Number(p.replace('page', '')) || undefined
      } else if (cls.includes('subchapter')) {
        meta.title = collapseWs(
          ($(el).html() ?? '').replace(/<br[^>]*>/g, ' ').replace(/<[^>]+>/g, ''),
        )
      } else if (cls.includes('subchapterpre1')) {
        meta.byline = text
      }
      continue
    }
    if (tag === 'h2') {
      b.startSection(headingText($, el))
      continue
    }
    if (tag === 'h3') {
      b.addHtml(`<h3>${collapseWs($(el).text())}</h3>`)
      continue
    }
    if (tag === 'div') {
      if (cls.includes('dis_img')) {
        for (const img of $(el).find('img').toArray()) {
          b.addFigure(imagePath(fileDir, img.attribs.src ?? ''))
        }
        continue
      }
      if (cls.includes('textbox')) {
        wrappedChildren($, el, b, fileDir, '<aside>', '</aside>')
        continue
      }
      if (cls.some((c) => BLOCK_DIVS.has(c))) {
        wrappedChildren($, el, b, fileDir, '<div class="block">', '</div>')
        continue
      }
      walkBody($, el.children, b, fileDir, meta)
      continue
    }
    if (tag === 'p') {
      const img = isImageOnly(el)
      if (img) {
        b.addFigure(imagePath(fileDir, img.attribs.src ?? ''))
        continue
      }
      const { html, page } = paragraph(el, b, fileDir)
      b.addHtml(html, page)
      continue
    }
    if (tag === 'table') {
      const rows = $(el)
        .find('tr')
        .toArray()
        .map((tr) => {
          const cells = $(tr)
            .children('td,th')
            .toArray()
            .map((td) => `<td>${collapseWs(inlineHtml(td, b, fileDir).html)}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
      b.addHtml(`<table>${rows}</table>`)
      continue
    }
    console.warn(`parse-unit: unhandled top-level <${tag}> in unit ${b.unitLabel}, dropped`)
  }
}

export function parseUnit(unit: UnitInput, opts: ParseOptions): ParsedUnit {
  const b = new UnitBuilder(unit.id, opts)
  const meta: Meta = { number: null, title: '' }
  for (const file of unit.files) {
    const $ = cheerio.load(file.html, { xml: false })
    const fileDir = path.posix.dirname(file.path)
    if (unit.id === 'intro') b.startSection(file.tocLabel ?? 'Section')
    if (unit.id === 'epilogue' && b.sections.length === 0) b.startSection('Epilogue', 'overview')
    walkBody($, $('body').contents().toArray(), b, fileDir, meta)
    if (unit.id === 'intro') b.flush()
  }
  const sections = b.finish()
  const title = unit.titleOverride ?? (meta.byline ? `${meta.title}, ${meta.byline}` : meta.title)
  const first = sections[0]
  if (
    meta.firstPage !== undefined &&
    first?.id === 'overview' &&
    first.blocks[0]?.type === 'html' &&
    first.blocks[0].page === undefined
  ) {
    first.blocks[0].page = meta.firstPage
  }
  const doc: ChapterDoc = {
    id: unit.id,
    number: unit.id === 'intro' ? null : meta.number,
    title,
    kicker: unit.kicker,
    sections,
  }
  return { doc, figures: b.figures, candidates: b.candidates }
}
