import { createRouter, createWebHistory } from 'vue-router'
import { useStore } from '../composables/useStore'

// Импорты страниц (пока создадим заглушки)
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import GroupsView from '../views/GroupsView.vue'
import GroupWorksView from '../views/GroupWorksView.vue'
import WorkDetailView from '../views/WorkDetailView.vue'
import CreateWorkView from '../views/CreateWorkView.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }, // доступ без авторизации
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },

  {
    path: '/groups/:groupId',
    name: 'GroupWorks',
    component: GroupWorksView,
    meta: { requiresAuth: true, role: 'Teacher' },
  },
  {
    path: '/works/create',
    name: 'CreateWork',
    component: CreateWorkView,
    meta: { requiresAuth: true, role: 'Teacher' },
  },
  {
    path: '/works/:workId',
    name: 'WorkDetail',
    component: WorkDetailView,
    meta: { requiresAuth: true },
  },
  // Можно добавить страницу 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Глобальный guard
router.beforeEach(async (to, from, next) => {
  const store = useStore()
  const { state, setAuth, clearAuth, loadTokenFromStorage } = store

  // Если токен есть в localStorage, но ещё не загружен в store – загружаем
  if (!state.token) {
    loadTokenFromStorage()
  }

  // Если маршрут публичный – пропускаем
  if (to.meta.public) {
    // Если уже авторизован и пытается зайти на логин – перенаправляем на дашборд
    if (state.isAuthenticated && to.name === 'Login') {
      return next({ name: 'Dashboard' })
    }
    return next()
  }

  // Если маршрут требует авторизации
  if (to.meta.requiresAuth) {
    // Проверяем, есть ли токен
    if (!state.token) {
      // Нет токена – на логин
      return next({ name: 'Login' })
    }

    // Если пользователь ещё не загружен (нет данных), пробуем получить профиль
    if (!state.user) {
      try {
        const { getProfile } = await import('../api/auth')
        const userData = await getProfile()
        // Предполагаем, что userData содержит { id, name, role }
        setAuth(state.token, userData)
      } catch (error) {
        // Если не удалось получить профиль – токен невалидный
        clearAuth()
        return next({ name: 'Login' })
      }
    }

    // Проверка роли, если требуется
    if (to.meta.role && state.role !== to.meta.role) {
      // Если роль не совпадает – перенаправляем на дашборд
      return next({ name: 'Dashboard' })
    }

    // Всё хорошо – пропускаем
    return next()
  }

  // Если ничего не подошло – на логин
  return next({ name: 'Login' })
})

export default router