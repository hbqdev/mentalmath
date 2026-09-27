import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FigureLayout from '../FigureLayout.vue'
import FigureBlock from '../FigureBlock.vue'
import type { FigureSpec } from '@/content/figures/types'

const mountSpec = (spec: FigureSpec) => mount(FigureLayout, { props: { spec } })

describe('FigureLayout', () => {
  it('renders a column with a rule under the operator line', () => {
    const w = mountSpec({
      kind: 'column',
      lines: [{ value: '47' }, { op: '+', value: '32', rule: true, note: '(30 + 2)' }],
    })
    const values = w.findAll('.value')
    expect(values.map((v) => v.text())).toEqual(['47', '32'])
    expect(values[1]!.classes()).toContain('rule')
    expect(w.findAll('.note').map((n) => n.text())).toEqual(['', '(30 + 2)'])
  })

  it('renders a chain with notes under the equals signs', () => {
    const w = mountSpec({
      kind: 'chain',
      steps: ['47 + 32', '77 + 2', '79'],
      notes: ['(first add 30)', '(then add 2)'],
    })
    expect(w.findAll('.step').map((s) => s.text())).toEqual(['47 + 32', '77 + 2', '79'])
    expect(w.findAll('.link').length).toBe(2)
    expect(w.findAll('.under').map((u) => u.text())).toEqual(['(first add 30)', '(then add 2)'])
  })

  it('renders a table with a highlighted row', () => {
    const w = mountSpec({
      kind: 'table',
      head: ['a', 'b'],
      rows: [
        ['1', '2'],
        ['3', '4'],
      ],
      highlight: 1,
    })
    expect(w.findAll('th').length).toBe(2)
    expect(w.findAll('tbody tr')[1]!.classes()).toContain('hi')
  })

  it('renders the squaring diagram and the eleven glyph', () => {
    const split = mountSpec({
      kind: 'split',
      base: '13²',
      up: '16',
      down: '10',
      upLabel: '+3',
      downLabel: '−3',
      result: '160 + 3² = 169',
    })
    expect(split.find('.base').text()).toBe('13²')
    expect(split.findAll('svg').length).toBe(2)
    expect(split.find('.result').text()).toBe('160 + 3² = 169')
    const open = mountSpec({
      kind: 'split',
      base: '863²',
      up: '900',
      down: '8??',
      upLabel: '+37',
      downLabel: '−37',
    })
    expect(open.findAll('svg').length).toBe(1)
    const eleven = mountSpec({ kind: 'eleven', n: '42', sum: '6', result: '462' })
    expect(eleven.text()).toContain('462')
    expect(eleven.find('.sum').text()).toBe('6')
  })

  it('renders long division, criss-cross lines, grids, pre and inline glyphs with rich markup', () => {
    const ld = mountSpec({
      kind: 'longdiv',
      divisor: '7',
      dividend: '179',
      quotient: '25',
      lines: [
        { value: '− 140', rule: true },
        { value: '39' },
        { value: '− 35', rule: true },
        { value: '4', note: '← remainder' },
      ],
      answer: 'Answer: 25 with a remainder of 4, or 25{4/7}',
    })
    expect(ld.find('.quot').text()).toBe('25')
    expect(ld.findAll('.ldl.rule').length).toBe(2)
    expect(ld.find('.ldl .note').text()).toBe('← remainder')
    expect(ld.find('.answer .rt-num').text()).toBe('4')
    expect(ld.find('.answer .rt-den').text()).toBe('7')
    const cc = mountSpec({
      kind: 'crisscross',
      top: ['4', '7'],
      bottom: ['3', '4'],
      links: [
        [0, 1],
        [1, 0],
      ],
    })
    expect(cc.findAll('line').length).toBe(2)
    expect(cc.findAll('text').map((t) => t.text())).toEqual(['4', '7', '3', '4'])
    const grid = mountSpec({
      kind: 'grid',
      rows: [
        ['4328', '→', '17'],
        ['884', '→', '20'],
      ],
    })
    expect(grid.findAll('.gcell').length).toBe(6)
    expect(grid.findAll('.gcell.arrow').length).toBe(2)
    const pre = mountSpec({
      kind: 'pre',
      lines: ['   4. 3 5 8', ' √~19.000000~', '‹8›3 × ‹3› = 2 49'],
    })
    expect(pre.find('.rt-over').text()).toBe('19.000000')
    expect(pre.findAll('.rt-under').map((u) => u.text())).toEqual(['8', '3'])
    const inline = mountSpec({ kind: 'inline', text: '{1/2}' })
    expect(inline.find('.rt-frac').exists()).toBe(true)
    const chain = mountSpec({
      kind: 'chain',
      steps: ['{29/45}', '{58/90}', '≈ .6~44~'],
      notes: ['× 2', '÷ 10'],
    })
    expect(chain.findAll('.rt-frac').length).toBe(2)
    expect(chain.findAll('.sign').map((x) => x.text())).toEqual(['=', '≈'])
    expect(chain.find('.rt-over').text()).toBe('44')
    const sup = mountSpec({ kind: 'text', lines: ['M = {Pi(1 + i)^N^/(1 + i)^N^ − 1}'] })
    expect(sup.findAll('.rt-sup').length).toBe(2)
  })

  it('nests rows and stacks', () => {
    const w = mountSpec({
      kind: 'row',
      sep: 'or',
      items: [
        { kind: 'text', lines: ['a'] },
        {
          kind: 'stack',
          items: [
            { kind: 'text', lines: ['b'] },
            { kind: 'text', lines: ['c'] },
          ],
        },
      ],
    })
    expect(w.find('.sep').text()).toBe('or')
    expect(
      w
        .find('.stack')
        .findAll('p')
        .map((p) => p.text()),
    ).toEqual(['b', 'c'])
  })
})

describe('FigureBlock', () => {
  const block = (id: string) => ({
    type: 'figure' as const,
    id,
    src: `/book/figures/0/${id}.jpeg`,
    width: 32,
    height: 70,
  })

  it('prefers the typeset override to the image', () => {
    const w = mount(FigureBlock, { props: { block: block('ch0-f001') } })
    expect(w.find('img').exists()).toBe(false)
    expect(w.attributes('data-figure')).toBe('ch0-f001')
    expect(w.attributes('data-override')).toBe('column')
    expect(w.text()).toContain('935')
  })

  it('falls back to the image when there is no override', () => {
    const w = mount(FigureBlock, { props: { block: block('ch0-f999') } })
    expect(w.find('img').attributes('src')).toBe('/book/figures/0/ch0-f999.jpeg')
    expect(w.attributes('data-override')).toBeUndefined()
  })
})
