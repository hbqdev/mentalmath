import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { disposeProgressStore } from '@/app/progress'
import ContentBlocks from '../ContentBlocks.vue'
import type { Block } from '@/content/types'

const router = createAppRouter(createMemoryHistory())

const blocks: Block[] = [
  { type: 'html', html: '<p>Hello <u>5</u></p>', page: 12 },
  { type: 'figure', id: 'ch1-f001', src: '/book/figures/1/ch1-f001.jpeg', width: 32, height: 70 },
  { type: 'exercise', setId: 'ch1-two-digit-addition' },
]

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

describe('ContentBlocks', () => {
  it('renders prose, figures and exercise callouts in order', () => {
    const w = mount(ContentBlocks, {
      props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' },
      global: { plugins: [router] },
    })
    const kids = w.element.children
    expect(kids[0]?.classList.contains('prose')).toBe(true)
    expect(kids[0]?.innerHTML).toContain('<u>5</u>')
    expect(kids[0]?.getAttribute('data-page')).toBe('12')
    const img = w.find('img')
    expect(img.attributes('src')).toBe('/book/figures/1/ch1-f001.jpeg')
    expect(img.attributes('width')).toBe('32')
    expect(img.attributes('loading')).toBe('lazy')
    expect(w.text()).toContain('Two-Digit Addition')
  })

  it('shows the callout as locked until the section is visited', () => {
    const w = mount(ContentBlocks, {
      props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' },
      global: { plugins: [router] },
    })
    expect(w.text()).toMatch(/unlocks|locked/i)
  })
})
