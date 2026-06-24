import { useStore } from '../composables/useStore'

export async function fetchWithAuth(url, options = {}) {
  const store = useStore()
  const token = store.state.token

  const headers = {
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Если тело — FormData, не добавляем Content-Type (браузер сам установит multipart/form-data)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Читаем тело один раз как текст
    let errorText = await response.text()
    try {
      // Пытаемся распарсить как JSON, чтобы извлечь error или message
      const errorJson = JSON.parse(errorText)
      errorText = errorJson.error || errorJson.message || errorText
    } catch {
      // Если не JSON, оставляем как есть
    }

    if (response.status === 401) {
      store.clearAuth()
    }
    throw new Error(`Ошибка ${response.status}: ${errorText}`)
  }

  if (response.status === 204) {
    return null
  }

  // Успешный ответ – возвращаем как JSON
  return response.json()
}