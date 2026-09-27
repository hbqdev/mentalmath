import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PromptRenderer from '../PromptRenderer.vue'
import type { Prompt } from '@/exercises/types'

const cases: Array<[string, Prompt, string[]]> = [
  ['binary', { kind: 'binary', a: 47, b: 32, op: '+' }, ['47', '32', '+']],
  ['division', { kind: 'binary', a: 318, b: 9, op: '÷' }, ['318', '9', '÷']],
  ['columns', { kind: 'columns', numbers: [672, 1367, 107] }, ['672', '1,367', '107']],
  ['power', { kind: 'power', base: 14, exp: 2 }, ['14', '2']],
  ['root', { kind: 'root', radicand: 17, degree: 2 }, ['√', '17']],
  ['fraction-binary', { kind: 'fraction-binary', a: { num: 3, den: 5 }, b: { num: 2, den: 7 }, op: '×' }, ['3', '5', '2', '7', '×']],
  ['fraction-task', { kind: 'fraction-task', value: { num: 14, den: 24 }, task: 'simplify' }, ['Simplify', '14', '24']],
  ['percent', { kind: 'percent', percent: 15, of: 88 }, ['15%', '88']],
  ['divisible', { kind: 'divisible', n: 3932, by: 4 }, ['3,932', '4']],
  ['date', { kind: 'date', iso: '2007-01-19' }, ['January 19, 2007']],
  ['text', { kind: 'text', text: 'Find a word for 42', emphasis: '42' }, ['Find a word for', '42']],
]

describe('PromptRenderer', () => {
  it.each(cases)('renders %s', (_name, prompt, fragments) => {
    const w = mount(PromptRenderer, { props: { prompt } })
    expect(w.attributes('data-testid')).toBe('practice-prompt')
    for (const f of fragments) expect(w.text(), f).toContain(f)
  })
  it('stacks vertical arithmetic with the operator on the second line', () => {
    const w = mount(PromptRenderer, { props: { prompt: { kind: 'binary', a: 47, b: 32, op: '+' } } })
    const rows = w.findAll('.row')
    expect(rows).toHaveLength(2)
    expect(rows[1]!.text()).toContain('+')
  })
})
