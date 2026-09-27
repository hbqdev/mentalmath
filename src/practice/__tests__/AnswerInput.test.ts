import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AnswerInput from '../AnswerInput.vue'

describe('AnswerInput', () => {
  it('renders a numeric-friendly text field for integer answers and submits on Enter', async () => {
    const w = mount(AnswerInput, {
      props: { spec: { kind: 'integer', value: 79 }, disabled: false },
    })
    const input = w.find('input[data-testid="answer-input"]')
    expect(input.attributes('inputmode')).toBe('decimal')
    await input.setValue('79')
    await input.trigger('keyup.enter')
    expect(w.emitted('submit')?.[0]).toEqual(['79'])
  })
  it('submits through the button too and clears after reset()', async () => {
    const w = mount(AnswerInput, {
      props: {
        spec: { kind: 'fraction', value: { num: 3, den: 4 }, acceptDecimal: false },
        disabled: false,
      },
    })
    const input = w.find('input')
    expect(input.attributes('placeholder')).toMatch(/3\/4|e\.g\./)
    await input.setValue('3/4')
    await w.find('[data-testid="answer-submit"]').trigger('click')
    expect(w.emitted('submit')?.[0]).toEqual(['3/4'])
    ;(w.vm as unknown as { reset: () => void }).reset()
    await w.vm.$nextTick()
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
  })
  it('renders one button per option for choice answers', async () => {
    const w = mount(AnswerInput, {
      props: { spec: { kind: 'choice', options: ['Yes', 'No'], correct: 'Yes' }, disabled: false },
    })
    expect(w.find('input').exists()).toBe(false)
    const buttons = w.findAll('button[data-testid^="choice-"]')
    expect(buttons.map((b) => b.text())).toEqual(['Yes', 'No'])
    await buttons[1]!.trigger('click')
    expect(w.emitted('submit')?.[0]).toEqual(['No'])
  })
  it('disables everything while feedback is shown', () => {
    const w = mount(AnswerInput, { props: { spec: { kind: 'integer', value: 1 }, disabled: true } })
    expect(w.find('input').attributes('readonly')).toBeDefined()
    expect(w.find('[data-testid="answer-submit"]').attributes('disabled')).toBeDefined()
  })
  it('asks for an answer instead of submitting an empty one', async () => {
    const w = mount(AnswerInput, {
      props: { spec: { kind: 'integer', value: 1 }, disabled: false },
    })
    await w.find('[data-testid="answer-submit"]').trigger('click')
    expect(w.emitted('submit')).toBeUndefined()
    expect(w.find('[data-testid="empty-hint"]').text()).toBe('Type an answer first')
    await w.find('input').setValue('1')
    expect(w.find('[data-testid="empty-hint"]').exists()).toBe(false)
  })
  it('marks the chosen option after answering', async () => {
    const w = mount(AnswerInput, {
      props: { spec: { kind: 'choice', options: ['Yes', 'No'], correct: 'Yes' }, disabled: false },
    })
    await w.find('[data-testid="choice-no"]').trigger('click')
    await w.setProps({ disabled: true })
    expect(w.find('[data-testid="choice-no"]').classes()).toContain('chosen')
    expect(w.find('[data-testid="choice-no"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('[data-testid="choice-yes"]').classes()).not.toContain('chosen')
    ;(w.vm as unknown as { reset: () => void }).reset()
    await w.vm.$nextTick()
    expect(w.find('[data-testid="choice-no"]').classes()).not.toContain('chosen')
  })
})
