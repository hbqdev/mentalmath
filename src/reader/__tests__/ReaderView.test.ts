import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { disposeProgressStore } from '@/app/progress'
import ReaderView from '../ReaderView.vue'

const ctl = vi.hoisted(() => ({ resolve2: null as null | (() => void) }))

vi.mock('@/content/loader', async () => {
  const actual = await vi.importActual<typeof import('@/content/loader')>('@/content/loader')
  const slow = {
    id: '2',
    number: 2,
    title: 'Products of a Misspent Youth',
    kicker: 'Chapter 2',
    sections: [
      { id: 'overview', title: 'Overview', blocks: [{ type: 'html', html: '<p>Two</p>' }] },
    ],
  }
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
      if (id === '2') return new Promise((res) => (ctl.resolve2 = () => res(slow)))
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
    getChapterMeta: (id: string) => (id === '1' ? meta : id === '2' ? slow : undefined),
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

describe('ReaderView robustness', () => {
  it('ignores a slow earlier chapter load that resolves after navigating away', async () => {
    const { w, router } = await mountAt('/read/2')
    await router.push('/read/1')
    await flushPromises()
    expect(w.find('h1').text()).toBe('A Little Give and Take')
    ctl.resolve2?.()
    await flushPromises()
    expect(w.find('h1').text()).toBe('A Little Give and Take')
  })

  it('offers section navigation at tablet width where the outline column is hidden', async () => {
    const hd = (
      window as unknown as {
        happyDOM: { setViewport: (v: { width: number; height: number }) => void }
      }
    ).happyDOM
    hd.setViewport({ width: 800, height: 900 })
    try {
      const { w } = await mountAt('/read/1')
      // The desktop outline column is gone, and the pill (which opens the sheet with the outline) is present.
      expect(w.find('.col-outline').exists()).toBe(false)
      expect(w.find('.pill').exists()).toBe(true)
    } finally {
      hd.setViewport({ width: 1024, height: 768 })
    }
  })
})

describe('PracticeRail in the reader', () => {
  it('lists book and generated sets for the chapter with kind badges', async () => {
    const { w } = await mountAt('/read/1')
    const rail = w.find('aside.rail')
    expect(rail.exists()).toBe(true)
    expect(rail.text()).toContain('Two-Digit Addition')
    expect(rail.text()).toContain('Book set')
    expect(rail.text()).toContain('Generated')
  })
})
