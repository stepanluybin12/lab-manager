import { reactive, readonly } from 'vue'

const state = reactive({
  user: null,
  token: null,
  userId: null,
  role: null,
  isAuthenticated: false,
  // Новые поля
  groups: [],               // все группы
  currentGroupId: null,     // ID выбранной группы
  works: [],                // работы для текущей группы
  currentWorkId: null,      // ID выбранной работы
  submissions: [],          // сдачи для текущей работы
})

export function useStore() {
  const setAuth = (token, user, userId) => {
    state.token = token
    state.userId = userId
    state.user = user
    state.role = user?.role || null
    state.isAuthenticated = !!token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  const clearAuth = () => {
    state.token = null
    state.user = null
    state.userId = null
    state.role = null
    state.isAuthenticated = false
    localStorage.removeItem('token')
    // Очищаем данные при выходе
    state.groups = []
    state.works = []
    state.submissions = []
    state.currentGroupId = null
    state.currentWorkId = null
  }

  const loadTokenFromStorage = () => {
    const token = localStorage.getItem('token')
    if (token) {
      state.token = token
      state.isAuthenticated = true
    }
    return token
  }

  // Дополнительные методы для работы с группами и работами
  const setGroups = (groups) => { state.groups = groups }
  const setCurrentGroupId = (id) => { state.currentGroupId = id }
  const setWorks = (works) => { state.works = works }
  const setCurrentWorkId = (id) => { state.currentWorkId = id }
  const setSubmissions = (submissions) => { state.submissions = submissions }

  return {
    state: readonly(state),
    setAuth,
    clearAuth,
    loadTokenFromStorage,
    setGroups,
    setCurrentGroupId,
    setWorks,
    setCurrentWorkId,
    setSubmissions,
  }
}