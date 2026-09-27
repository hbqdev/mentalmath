import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BottomSheet from '../BottomSheet.vue'

describe('BottomSheet', () => {
  it('is inert while closed, takes focus when opened, returns it and closes on Escape', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const w = mount(BottomSheet, {
      props: { open: false, title: 'Practice' },
      attachTo: document.body,
    })
    const sheet = () => document.querySelector('[data-testid="sheet"]') as HTMLElement
    expect(sheet().hasAttribute('inert')).toBe(true)
    await w.setProps({ open: true })
    await w.vm.$nextTick()
    expect(sheet().hasAttribute('inert')).toBe(false)
    expect(document.activeElement?.getAttribute('data-testid')).toBe('sheet-close')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.emitted('close')?.length).toBe(1)
    await w.setProps({ open: false })
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(opener)
    w.unmount()
    opener.remove()
  })
})
