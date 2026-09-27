import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: HomeView },
      {
        path: '/read/:chapter/:section?',
        name: 'read',
        component: () => import('@/reader/ReaderView.vue'),
      },
      {
        path: '/practice/:chapter/:set',
        name: 'practice',
        component: () => import('@/practice/PracticeView.vue'),
      },
      {
        path: '/exercises/:chapterId/:exerciseType',
        name: 'legacy-exercise',
        redirect: (to) => ({ name: 'read', params: { chapter: String(to.params.chapterId) } }),
      },
      { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
      {
        path: '/chapters/:id',
        redirect: (to) => ({ name: 'read', params: { chapter: String(to.params.id) } }),
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
      },
    ],
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      // Moving between sections of the same chapter is handled by the reader itself.
      if (to.name === 'read' && from.name === 'read' && to.params.chapter === from.params.chapter) return false
      if (to.hash) return { el: to.hash, top: 80 }
      return { top: 0 }
    },
  })
}

export default createAppRouter()
