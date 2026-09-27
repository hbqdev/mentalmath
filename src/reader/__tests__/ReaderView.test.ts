import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { disposeProgressStore } from '@/app/progress'
import ReaderView from '../ReaderView.vue'

vi.mock('@/content/loader', async () => {
  const actual = await vi.importActual<typeof import('@/content/loader')>('@/content/loader')
  const meta = {
    id: '1',
    number: 1,
    title: 'A Little Give and Take',
    kicker: 'Chapter 1',
    sections: [
      { id: 'overview', title: 'Overview' },
      { id: 'two-digit-addition', title: 'Two-Digit Addition' },
    ],
  }
  return {
    ...actual,
    loadChapter: async (id: string) => {
      if (id !== '1') throw new actual.ChapterNotFound(id)
      return {
        ...meta,
        sections: [
          { id: 'overview', title: 'Overview', blocks: [{ type: 'html', html: '<p>Intro</p>' }] },
          {
            id: 'two-digit-addition',
            title: 'Two-Digit Addition',
            blocks: [
              { type: 'html', html: '<p>Add</p>' },
              { type: 'exercise', setId: 'ch1-two-digit-addition' },
            ],
          },
        ],
      }
    },
    getChapterMeta: (id: string) => (id === '1' ? meta : undefined),
  }
})

async function mountAt(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  const w = mount(ReaderView, { global: { plugins: [router], stubs: { Teleport: true } } })
  await flushPromises()
  return { w, router }
}

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

describe('ReaderView', () => {
  it('renders the chapter title, outline and both sections', async () => {
    const { w } = await mountAt('/read/1')
    expect(w.text()).toContain('A Little Give and Take')
    expect(w.findAll('section.book-section')).toHaveLength(2)
    expect(w.find('nav.outline').text()).toContain('Two-Digit Addition')
  })

  it('shows a not-found state for an unknown chapter without throwing', async () => {
    const { w } = await mountAt('/read/42')
    expect(w.text()).toMatch(/not in this book|not found/i)
  })

  it('falls back to the first section when the section param is unknown', async () => {
    const { w, router } = await mountAt('/read/1/nope')
    await flushPromises()
    const section = router.currentRoute.value.params.section
    expect(section === undefined || section === '' || section === 'overview').toBe(true)
    expect(w.findAll('section.book-section')).toHaveLength(2)
  })
})
