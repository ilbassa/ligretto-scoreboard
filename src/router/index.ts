import { createRouter, createWebHashHistory } from 'vue-router'
import { gameRepository } from '@/repositories/gameRepository'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: () => import('@/views/LandingView.vue') },
    { path: '/nuova-partita', name: 'setup', component: () => import('@/views/GameSetupView.vue') },
    { path: '/partita', name: 'scoreboard', component: () => import('@/views/ScoreboardView.vue'), meta: { requiresGame: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => to.meta.requiresGame && !gameRepository.hasActiveGame() ? { name: 'landing' } : true)

export default router
