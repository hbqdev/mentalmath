// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from '../lib/sanitize'

describe('sanitizeHtml', () => {
  it('keeps allowed inline formatting and tables', () => {
    const html =
      '<p class="center"><strong>3<u>5</u>2</strong> <sup>2</sup><br></p><table><tbody><tr><td colspan="2">x</td></tr></tbody></table>'
    expect(sanitizeHtml(html)).toBe(html)
  })
  it('strips scripts, event handlers, styles and unknown attributes', () => {
    const html = '<p id="c01" style="color:red" onclick="x()">Hi<script>alert(1)</script></p>'
    expect(sanitizeHtml(html)).toBe('<p>Hi</p>')
  })
  it('drops classes outside the allow-list but keeps the element', () => {
    expect(sanitizeHtml('<p class="calibre5 center">x</p>')).toBe('<p class="center">x</p>')
    expect(sanitizeHtml('<span class="calibre9">x</span>')).toBe('<span>x</span>')
  })
  it('unwraps disallowed elements instead of deleting their text', () => {
    expect(sanitizeHtml('<p><font color="red">keep me</font></p>')).toBe('<p>keep me</p>')
  })
  it('keeps img src width height alt only', () => {
    expect(
      sanitizeHtml(
        '<img src="/book/figures/1/ch1-f001.jpeg" width="32" height="70" alt="" class="inline" data-x="1">',
      ),
    ).toBe('<img src="/book/figures/1/ch1-f001.jpeg" width="32" height="70" alt="" class="inline">')
  })
})
