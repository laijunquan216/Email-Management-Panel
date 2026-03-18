import { createRouter, createWebHistory } from 'vue-router'

import LayoutView from '@/views/layout/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
    },
    {
      path: '/',
      name: 'index',
      component: LayoutView,
      redirect: '/home',
      children: [
        {
          path: '/home',
          name: 'home',
          component: () => import('@/views/home/index.vue'),
        },
        {
          path: '/email',
          name: 'email',
          component: () => import('@/views/email/index.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  if (to.path === '/login') {
    next()
    return
  }

  try {
    const response = await fetch('/auth/status', { credentials: 'include' })
    const data = await response.json()
    const required = data?.data?.required
    const authenticated = data?.data?.authenticated

    if (!required || authenticated) {
      next()
      return
    }

    next('/login')
  } catch (_error) {
    next('/login')
  }
})

export default router
