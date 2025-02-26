import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChapterView from '../views/ChapterView.vue'
import ExerciseView from '../views/ExerciseView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/chapters/:chapterId',
      name: 'chapter',
      component: ChapterView
    },
    {
      path: '/exercises/:chapterId/:exerciseType',
      name: 'exercise',
      component: ExerciseView
    }
  ],
  // Add this scrollBehavior to reset scroll position on navigation
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Add a global navigation guard to help with state cleanup
router.beforeEach((to, from, next) => {
  // Force any pending Vue updates to complete
  setTimeout(() => {
    next()
  }, 0)
})

export default router
