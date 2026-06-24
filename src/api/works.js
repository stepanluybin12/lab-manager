import { mockGetWorksByGroup, mockCreateWork, mockGetWorkById, mockGetSubmissionsByWork, mockSubmitWork, mockGradeSubmission } from './mocks'
import { fetchWithAuth } from './fetchWithAuth'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export async function getWorksByGroup(groupId) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockGetWorksByGroup(groupId)
  }
  return fetchWithAuth(`${API_BASE}/api/groups/${groupId}/works`)
}

export async function createWork(workData) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Если workData – FormData, извлекаем поля
    let data = workData
    if (workData instanceof FormData) {
      data = {
        title: workData.get('title'),
        description: workData.get('description'),
        deadline: workData.get('deadline'),
        groupId: workData.get('groupId'),
        files: workData.getAll('files') // массив файлов
      }
    }
    return mockCreateWork(data)
  }

  // Реальный запрос – если FormData, отправляем как есть, иначе JSON
  const options = {
    method: 'POST',
  }
  if (workData instanceof FormData) {
    options.body = workData
    // Не ставим Content-Type, браузер сам установит multipart/form-data
  } else {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(workData)
  }
  return fetchWithAuth(`${API_BASE}/api/works/create-work`, options)
}

export async function getWorkById(workId) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockGetWorkById(workId)
  }
  return fetchWithAuth(`${API_BASE}/api/works/${workId}`)
}

export async function getSubmissionByWorkAndStudent(workId, studentId) {
  if (USE_MOCK) {
    // Мок: ищем в массиве submissions (из mocks.js)
    await new Promise(resolve => setTimeout(resolve, 300))
    const found = submissions.find(s => s.workId === workId && s.studentId === studentId)
    return found || null
  }
  // Реальный запрос
  return fetchWithAuth(`${API_BASE}/api/submissions/work/${workId}/student/${studentId}`)
}

export async function getSubmissionsByWork(workId) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockGetSubmissionsByWork(workId)
  }
  return fetchWithAuth(`${API_BASE}/api/works/${workId}/submissions`)
}

export async function getSubmissionsById(submissionId){
    return fetchWithAuth(`${API_BASE}/submissions/${submissionId}`)
}

export async function submitWork(workId, studentId, file) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockSubmitWork(workId, studentId, file)
  }
  const formData = new FormData()
  formData.append('file', file)
  // Если нужны ещё поля, добавляем
  return fetchWithAuth(`${API_BASE}/api/works/${workId}/submit`, {
    method: 'POST',
    body: formData,
  })
}

export async function gradeSubmission(submissionId, grade, comment) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockGradeSubmission(submissionId, grade, comment)
  }
  return fetchWithAuth(`${API_BASE}/api/submissions/${submissionId}/grade`, {
    method: 'PUT',
    body: JSON.stringify({ grade, comment }),
  })
}


// Добавить после других экспортов
export async function takeToReview(submissionId) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockTakeToReview(submissionId)
  }
  return fetchWithAuth(`${API_BASE}/api/submissions/${submissionId}/take-in-work`, {
    method: 'PUT',
  })
}


export async function deleteWork(workId) {
  return fetchWithAuth(`${API_BASE}/api/works/${workId}`, {
    method: 'DELETE',
  })
}


export async function downloadSubmission(submissionId) {
  // Получаем токен из localStorage (можно также из store, но проще так)
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}/api/submissions/${submissionId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    let errorText = await response.text()
    throw new Error(`Ошибка загрузки: ${response.status} ${errorText}`)
  }

  // Возвращаем blob и заголовок Content-Disposition для имени файла
  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition')
  let fileName = null
  if (contentDisposition) {
    // Парсим имя файла из заголовка (пример: attachment; filename="myfile.pdf")
    console.log(contentDisposition)
    const match = contentDisposition.match(/filename="?([^";]+)"?/)
    if (match) fileName = match[1]
  }
  return { blob, fileName }
}

export async function extendDeadline(workId, newDeadline) {
  return fetchWithAuth(`${API_BASE}/api/works/${workId}`, {
    method: 'PUT',
    body: JSON.stringify({ deadline: newDeadline }),
  })
}