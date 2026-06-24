<template>
  <div>
    <AppMenu />
    <div class="container" v-if="work">
      <!-- Хлебные крошки -->
      <nav class="breadcrumb">
        <router-link to="/">Главная</router-link>
        <span class="separator">/</span>
        <router-link :to="`/groups/${work.groupId}`">Группа</router-link>
        <span class="separator">/</span>
        <span class="current">{{ work.title }}</span>
      </nav>

      <div class="work-header">
        <h1>{{ work.title }}</h1>
        <span class="deadline">⏰ Дедлайн: {{ formatDate(work.deadline) }}</span>
      </div>
      <div v-if="isTeacher" class="work-actions">
        <button @click="handleDeleteWork" class="btn-delete">Удалить работу</button>
        <button @click="handleExtendDeadline" class="btn-extend">Продлить дедлайн</button>
      </div>
      <p class="description">{{ work.description }}</p>

      <!-- Файлы задания (если есть) -->
      <div v-if="work" class="attachments">
        <h3>📎 Файлы задания:</h3>
        <button @click="downloadWorkFiles" class="btn-download">
          Скачать все файлы (ZIP)
        </button>
      </div>

      <!-- Преподаватель: список всех сдач -->
      <div v-if="isTeacher">
        <h2>Сдачи студентов</h2>
        <div v-if="submissionsList.length === 0">Нет сдач</div>
        <table v-else class="submissions-table">
          <thead>
            <tr>
              <th>Студент</th>
              <th>Статус</th>
              <th>Файл</th>
              <th>Оценка</th>
              <th>Комментарий</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in submissionsList" :key="sub.id">
              <td>{{ sub.student.email }}</td>
              <td><StatusBadge :status="sub.status" :deadline="work.deadline" /></td>
              <td>
                <button v-if="sub.filePath" @click="downloadFile(sub)" class="btn-download">Скачать</button>
                <span v-else>Нет файла</span>
              </td>
              <td>{{ sub.grade ?? '—' }}</td>
              <td>{{ sub.comment || '—' }}</td>
              <td>
                <button
                  v-if="sub.status === STATUS.SUBMITTED"
                  @click="handleTakeToReview(sub.id)"
                  class="btn-take"
                >
                  Взять на проверку
                </button>
                <button
                  v-if="sub.status === STATUS.CHECKING"
                  @click="openGradeModal(sub)"
                  class="btn-grade"
                >
                  Оценить
                </button>
              </td>
            </tr>
          </tbody>
        </table>


        <!-- Модалка продления дедлайна -->
        <div v-if="extendModal.show" class="modal-overlay" @click.self="extendModal.show = false">
          <div class="modal">
            <h2>Продлить дедлайн</h2>
            <form @submit.prevent="confirmExtendDeadline">
              <div class="form-group">
                <label for="newDeadline">Новая дата</label>
                <input
                  id="newDeadline"
                  type="datetime-local"
                  v-model="extendModal.newDeadline"
                  required
                />
              </div>
              <div class="modal-actions">
                <button type="button" @click="extendModal.show = false">Отмена</button>
                <button type="submit" :disabled="extendModal.loading">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Студент: только его сдача -->
      <div v-else>
        <h2>Моя сдача</h2>
        <div v-if="mySubmissionData">
          <p><strong>Статус:</strong> <StatusBadge :status="mySubmissionData.status" :deadline="work.deadline" /></p>
          <p v-if="mySubmissionData.grade !== null"><strong>Оценка:</strong> {{ mySubmissionData.grade }}</p>
          <p v-if="mySubmissionData.comment"><strong>Комментарий:</strong> {{ mySubmissionData.comment }}</p>
          <div v-if="mySubmissionData.file">
            <button @click="downloadFile(mySubmissionData.file)" class="btn-download">
              Скачать мой файл
            </button>
          </div>
        </div>
        <div v-else>
          <p>Вы ещё не сдавали эту работу.</p>
        </div>

        <!-- Форма сдачи -->
        <div class="submit-section" v-if="canSubmit">
          <input type="file" @change="handleFileUpload" accept=".pdf,.doc,.docx,.zip" />
          <button @click="submitWorkHandler" :disabled="!selectedFile || submitting" class="btn-primary">
            {{ submitting ? 'Отправка...' : 'Отправить на проверку' }}
          </button>
        </div>
        <p v-else-if="isExpired" class="expired-warning">Срок сдачи истёк.</p>
        <p v-else-if="mySubmissionData?.status === STATUS.GRADED" class="graded-info">Работа оценена.</p>
        <p v-else-if="mySubmissionData?.status === STATUS.EXPIRED" class="in-progress-info">Работа просрочена.</p>
      </div>
    </div>
    <div v-else-if="loading">Загрузка...</div>
    <div v-else>Работа не найдена</div>

    <!-- Модалка оценивания -->
    <div v-if="gradeModal.show" class="modal-overlay" @click.self="gradeModal.show = false">
      <div class="modal">
        <h2>Оценить работу</h2>
        <p><strong>Студент:</strong> {{ gradeModal.studentName }}</p>
        <form @submit.prevent="submitGrade">
          <div class="form-group">
            <label for="grade">Оценка (0–5)</label>
            <input id="grade" type="number" v-model="gradeModal.grade" min="0" max="5" required />
          </div>
          <div class="form-group">
            <label for="comment">Комментарий</label>
            <textarea id="comment" v-model="gradeModal.comment" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="gradeModal.show = false">Отмена</button>
            <button type="submit" :disabled="gradeModal.loading">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppMenu from '../components/AppMenu.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useStore } from '../composables/useStore'
import {
  getWorkById,
  getSubmissionsByWork,
  getSubmissionByWorkAndStudent,
  submitWork,
  gradeSubmission,
  takeToReview,
  deleteWork,
  downloadSubmission,
  extendDeadline,
} from '../api/works'
import axios from 'axios';


const router = useRouter()

// Константы статусов (числовые)
const STATUS = {
  SUBMITTED: 0,
  CHECKING: 1,
  GRADED: 2,
  EXPIRED: 3
}

const route = useRoute()
const store = useStore()
const { state, setCurrentWorkId, setSubmissions } = store

const workId = ref(route.params.workId)
const work = ref(null)
const submissionsList = ref([])      // для преподавателя
const mySubmissionData = ref(null)   // для студента
const loading = ref(true)
const selectedFile = ref(null)
const submitting = ref(false)

const isTeacher = computed(() => state.role === 'Teacher')
const currentUser = computed(() => state.user)
const userId = computed(() => state.userId)

// Проверка просрочки
const isExpired = computed(() => {
  if (!work.value) return false
  return new Date(work.value.deadline) < new Date()
})

// Может ли студент сдать работу?
const canSubmit = computed(() => {
  if (isTeacher.value || !work.value) return false
  if (isExpired.value) return false
  const sub = mySubmissionData.value
  if (!sub) return true
  if (sub.status === STATUS.GRADED || sub.status === STATUS.CHECKING || sub.status === STATUS.SUBMITTED) return false
  return true
})

// Загрузка данных
async function loadData() {
  loading.value = true
  try {
    // 1. Загружаем данные работы
    const workData = await getWorkById(workId.value)
    work.value = workData
    setCurrentWorkId(workId.value)

    if (isTeacher.value) {
      // Для преподавателя – все сдачи
      const subs = await getSubmissionsByWork(workId.value)
      submissionsList.value = subs
      setSubmissions(subs)
    } else {
      // Для студента – его сдача
      const sub = await getSubmissionByWorkAndStudent(workId.value, currentUser.value.userId)
      mySubmissionData.value = sub
    }
  } catch (e) {
    console.error('Ошибка загрузки данных', e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// function downloadFile(fileName) {
//   alert(`Скачивание файла: ${fileName}`)
// }

async function downloadFile(sub) {
  try {
    // Проверяем, что есть ID сдачи
    if (!sub || !sub.id) {
      alert('Не удалось определить ID сдачи')
      return
    }

    // Запрашиваем файл с сервера
    const { blob, fileName: serverFileName } = await downloadSubmission(sub.id)

    // Определяем имя файла для сохранения
    // Приоритет: 1) из заголовка сервера, 2) из sub.fileName или sub.filePath, 3) генерируем из имени студента и названия работы
    let finalFileName = null // serverFileName || sub.fileName || sub.filePath || sub.file

    if (!finalFileName) {
      // Если нет имени, создаём на основе студента и работы
      const studentName = sub.student?.lastName || sub.studentName || 'student'
      const workTitle = work.value?.title || 'work'
      const ext = sub.file?.split('.').pop() || 'pdf'
      finalFileName = `${studentName}_${workTitle}.${ext}`
    }

    // Создаём ссылку на скачивание
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', finalFileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

  } catch (error) {
    console.error('Ошибка при скачивании файла:', error)
    alert('Не удалось скачать файл. Возможно, он был удалён с сервера.')
  }
}


// Студент: выбор файла
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

// Студент: отправка работы
async function submitWorkHandler() {
  if (!selectedFile.value) {
    alert('Выберите файл')
    return
  }

  submitting.value = true
  try {
    // Отправляем файл
    const response = await submitWork(workId.value, currentUser.value.id, selectedFile.value)
    console.log('📤 Ответ сервера:', response)

    // Сразу запрашиваем обновлённую сдачу студента
    const updatedSub = await getSubmissionByWorkAndStudent(workId.value, currentUser.value.userId)
    mySubmissionData.value = updatedSub
    console.log('🔄 Обновлённая сдача:', updatedSub)

    // Очищаем input
    selectedFile.value = null
    const input = document.querySelector('input[type="file"]')
    if (input) input.value = ''

  } catch (e) {
    console.error('Ошибка отправки', e)
    alert('Не удалось отправить работу')
  } finally {
    submitting.value = false
  }
}

// Преподаватель: взять на проверку
async function handleTakeToReview(submissionId) {
  if (!confirm('Взять эту работу на проверку?')) return
  try {
    await takeToReview(submissionId)
    await loadData() // обновим списки
  } catch (e) {
    console.error('Ошибка взятия на проверку', e)
    alert('Не удалось взять работу')
  }
}

// Преподаватель: модалка оценивания
const gradeModal = ref({
  show: false,
  submissionId: null,
  studentName: '',
  grade: null,
  comment: '',
  loading: false,
})

function openGradeModal(sub) {
  gradeModal.value = {
    show: true,
    submissionId: sub.id,
    studentName: sub.studentName,
    grade: sub.grade ?? '',
    comment: sub.comment ?? '',
    loading: false,
  }
}

async function submitGrade() {
  gradeModal.value.loading = true
  try {
    await gradeSubmission(
      gradeModal.value.submissionId,
      parseInt(gradeModal.value.grade),
      gradeModal.value.comment
    )
    gradeModal.value.show = false
    await loadData()
  } catch (e) {
    console.error('Ошибка оценивания', e)
    alert('Не удалось сохранить оценку')
  } finally {
    gradeModal.value.loading = false
  }
}


async function handleDeleteWork() {
  if (!confirm('Вы уверены, что хотите удалить эту работу? Это действие необратимо.')) return
  try {
    await deleteWork(workId.value)
    // Перенаправляем на страницу группы
    if (work.value && work.value.groupId) {
      router.push(`/groups/${work.value.groupId}`)
    } else {
      router.push('/')
    }
  } catch (e) {
    console.error('Ошибка удаления работы', e)
    alert('Не удалось удалить работу')
  }
}

// ---- Преподаватель: продлить дедлайн ----
const extendModal = ref({
  show: false,
  newDeadline: '',
  loading: false,
})

function handleExtendDeadline() {
  // Подставляем текущий дедлайн (обрезаем секунды и смещение)
  const current = work.value?.deadline || ''
  extendModal.value.newDeadline = current ? current.slice(0, 16) : ''
  extendModal.value.show = true
}

async function confirmExtendDeadline() {
  const newDeadline = extendModal.value.newDeadline
  if (!newDeadline) {
    alert('Пожалуйста, выберите дату')
    return
  }
  extendModal.value.loading = true
  try {
    await extendDeadline(workId.value, newDeadline)
    extendModal.value.show = false
    await loadData()
    alert('Дедлайн успешно обновлён!')
  } catch (e) {
    console.error('Ошибка продления дедлайна', e)
    alert('Не удалось обновить дедлайн')
  } finally {
    extendModal.value.loading = false
  }
}

// Скачивание ZIP-архива с файлами задания (прикреплёнными преподавателем)
async function downloadWorkFiles() {
  try {
    const token = localStorage.getItem('token')
    const url = `${import.meta.env.VITE_API_URL}/api/works/${workId.value}/download`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      let errorText = await response.text()
      throw new Error(`Ошибка ${response.status}: ${errorText}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl

    // Пробуем получить имя файла из заголовка Content-Disposition
    const contentDisposition = response.headers.get('content-disposition')
    let fileName = 'files.zip'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/)
      if (match) fileName = match[1]
    }
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (e) {
    console.error('Ошибка скачивания файлов задания', e)
    alert('Не удалось скачать файлы. Возможно, они были удалены с сервера.')
  }
}

onMounted(loadData)
</script>

<style scoped>
/* все стили без изменений */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  color: #64748b;
}
.breadcrumb a {
  color: #4f46e5;
  text-decoration: none;
}
.breadcrumb a:hover {
  text-decoration: underline;
}
.separator {
  color: #94a3b8;
}
.current {
  font-weight: 500;
  color: #1a202c;
}
.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.work-header h1 {
  font-size: 2rem;
  margin: 0;
}
.deadline {
  font-size: 1rem;
  color: #64748b;
}
.description {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  white-space: pre-wrap;
}
.attachments {
  margin: 1.5rem 0;
}
.attachments ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.attachments li {
  margin: 0;
}
.submissions-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.submissions-table th,
.submissions-table td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}
.submissions-table th {
  background: #f0f0f0;
}
.btn-download {
  background: #2196F3;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-take {
  background: #FF9800;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
}
.btn-take:hover {
  background: #e68900;
}
.btn-grade {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}
.submit-section {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.expired-warning {
  color: #d32f2f;
  font-weight: bold;
  margin-top: 1rem;
}
.graded-info {
  color: #2e7d32;
  font-weight: bold;
  margin-top: 1rem;
}
.in-progress-info {
  color: #e65100;
  font-weight: bold;
  margin-top: 1rem;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 300px;
}
.modal h2 {
  margin-top: 0;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
.modal-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.modal-actions button[type="submit"] {
  background: #4CAF50;
  color: white;
}
.modal-actions button[type="button"] {
  background: #ccc;
}

.btn-delete {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  margin-right: 1rem;
}
.btn-delete:hover {
  background: #b71c1c;
}
.btn-extend {
  background: #f57c00;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  margin-right: 0.5rem;
}
.btn-extend:hover {
  background: #e65100;
}
</style>
