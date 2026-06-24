import { mockGetGroups, mockCreateGroup } from './mocks'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
import { fetchWithAuth } from './fetchWithAuth'

export async function getGroups() {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockGetGroups()
  }
  // Реальный запрос
  return fetchWithAuth(`${API_BASE}/api/groups`)
}

