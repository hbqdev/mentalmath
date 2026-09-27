import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { disposeProgressStore, useProgress } from '@/app/progress'
import HomeView from '../HomeView.vue'

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

describe('HomeView', () => {
  it('lists every readable chapter with a link into the reader', () => {
    const w = mount(HomeView, { global: { plugins: [createAppRouter(createMemoryHistory())] } })
    const links = w.findAll('a[href^="/read/"]').map((a) => a.attributes('href'))
    expect(links).toContain('/read/intro')
    expect(links).toContain('/read/0')
    expect(links).toContain('/read/9')
    expect(links).toContain('/read/epilogue')
    expect(w.text()).toContain('The Tough Stuff Made Easy')
  })

  it('offers to resume the last chapter read', () => {
    const p = useProgress()
    p.markVisited('3', 'overview')
    const w = mount(HomeView, { global: { plugins: [createAppRouter(createMemoryHistory())] } })
    expect(w.find('a.resume').attributes('href')).toBe('/read/3/overview')
  })
})
