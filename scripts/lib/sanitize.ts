import * as cheerio from 'cheerio'
import type { AnyNode, Element } from 'domhandler'

export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'p', 'h3', 'strong', 'em', 'u', 'sup', 'sub', 'br', 'span', 'aside', 'div', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'ol', 'ul', 'li',
])

export const ALLOWED_CLASSES: ReadonlySet<string> = new Set([
  'center', 'right', 'extract', 'hanging', 'list-line', 'footnote', 'aside-title', 'block',
  'boxed', 'inline',
])

const ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  img: new Set(['src', 'width', 'height', 'alt', 'class']),
  td: new Set(['colspan', 'rowspan', 'class']),
  th: new Set(['colspan', 'rowspan', 'class']),
}
const DEFAULT_ATTRS: ReadonlySet<string> = new Set(['class'])
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'title', 'head'])

function clean(el: Element): void {
  const tag = el.tagName.toLowerCase()
  const allowed = ALLOWED_ATTRS[tag] ?? DEFAULT_ATTRS
  for (const name of Object.keys(el.attribs)) {
    if (!allowed.has(name)) delete el.attribs[name]
  }
  if (el.attribs.class !== undefined) {
    const kept = el.attribs.class.split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c))
    if (kept.length) el.attribs.class = kept.join(' ')
    else delete el.attribs.class
  }
}

export function sanitizeHtml(html: string): string {
  const $ = cheerio.load(`<body>${html}</body>`, { xml: false })
  const body = $('body')

  // Depth-first: process children before parents so unwrapping keeps order.
  const walk = (node: AnyNode): void => {
    if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') return
    const el = node as Element
    for (const child of [...el.children]) walk(child)
    const tag = el.tagName.toLowerCase()
    if (tag === 'body') return
    if (DROP_WITH_CONTENT.has(tag)) {
      $(el).remove()
      return
    }
    if (!ALLOWED_TAGS.has(tag)) {
      $(el).replaceWith($(el).contents())
      return
    }
    clean(el)
  }
  for (const child of [...body.contents()]) walk(child)
  return body.html() ?? ''
}
