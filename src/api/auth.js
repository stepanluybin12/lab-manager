// src/api/auth.js
import { mockLogin, mockProfile } from './mocks'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'  // добавим переменную в .env

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function login(email, password) {
  if (USE_MOCK) {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockLogin(email, password)
  }

  // Реальный запрос
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Ошибка входа')
  }
  return response.json()
}

export async function getProfile() {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Токен берём из store, но в моке можно передать вручную
    // Лучше просто вернуть данные по сохранённому токену
    const token = localStorage.getItem('token')
    return mockProfile(token)
  }

  // Реальный запрос через fetchWithAuth
  // но проще: используем ту же обёртку, но она требует store, поэтому лучше сделать отдельную функцию
  // Вместо fetchWithAuth можно использовать обычный fetch с токеном
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Ошибка получения профиля')
  return response.json()
}