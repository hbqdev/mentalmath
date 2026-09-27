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
    expect(w.findAll('.eq').length).toBe(2)
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
