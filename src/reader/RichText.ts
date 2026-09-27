import { h, type VNodeChild } from 'vue'

/** Renders the figure markup: {a/b} fractions, ~x~ overlines, ‹x› underlines, ^x^ superscripts. */
export function richText(text: string): VNodeChild[] {
  const out: VNodeChild[] = []
  const re = /\{([^/{}]+)\/([^/{}]+)\}|~([^~]+)~|‹([^›]+)›|\^([^^]+)\^/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined)
      out.push(
        h('span', { class: 'rt-frac' }, [
          h('span', { class: 'rt-num' }, richText(m[1])),
          h('span', { class: 'rt-den' }, richText(m[2]!)),
        ]),
      )
    else if (m[3] !== undefined) out.push(h('span', { class: 'rt-over' }, m[3]))
    else if (m[4] !== undefined) out.push(h('span', { class: 'rt-under' }, m[4]))
    else out.push(h('sup', { class: 'rt-sup' }, m[5]))
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export const RichText = (props: { text: string }) =>
  h('span', { class: 'rt' }, richText(props.text))
RichText.props = { text: { type: String, required: true } }
