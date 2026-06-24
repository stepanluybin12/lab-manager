<template>
  <div>
    <AppMenu />
    <div class="container">
      <h1>Создание работы</h1>
      <form @submit.prevent="handleCreate">
        <div class="form-group">
          <label for="title">Название</label>
          <input id="title" v-model="form.title" required />
        </div>
        <div class="form-group">
          <label for="description">Описание</label>
          <textarea id="description" v-model="form.description" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label for="deadline">Дедлайн</label>
          <input id="deadline" type="datetime-local" v-model="form.deadline" required />
        </div>
        <div class="form-group">
          <label for="groupId">Группа</label>
          <select id="groupId" v-model="form.groupId" required>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label for="files">Прикрепить файлы (задание)</label>
          <input
            id="files"
            type="file"
            multiple
            @change="handleFileUpload"
            accept=".pdf,.doc,.docx,.zip,.rar,.txt"
          />
          <div v-if="form.files.length > 0" class="file-list">
            <span v-for="(file, index) in form.files" :key="index" class="file-item">
              📎 {{ file.name }}
              <button type="button" @click="removeFile(index)" class="remove-file">✕</button>
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cancel">Отмена</button>
          <button type="submit" :disabled="loading">Создать</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppMenu from '../components/AppMenu.vue'
import { useStore } from '../composables/useStore'
import { getGroups } from '../api/groups'
import { createWork } from '../api/works'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { state } = store

const loading = ref(false)
const form = reactive({
  title: '',
  description: '',
  deadline: '',
  groupId: route.query.groupId || null,
  files: [] // массив файлов
})

const groups = computed(() => state.groups)

function handleFileUpload(event) {
  const files = event.target.files
  if (files) {
    form.files = Array.from(files)
  }
}

function removeFile(index) {
  form.files.splice(index, 1)
  if (form.files.length === 0) {
    const input = document.getElementById('files')
    if (input) input.value = ''
  }
}

async function loadGroups() {
  try {
    const data = await getGroups()
    store.setGroups(data)
  } catch (e) {
    console.error('Ошибка загрузки групп', e)
  }
}

async function handleCreate() {
  loading.value = true
  try {
    let workData
    if (form.files.length > 0) {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('deadline', form.deadline)
      fd.append('groupId', form.groupId)
      form.files.forEach(f => fd.append('files', f))
      workData = fd
    } else {
      workData = {
        title: form.title,
        description: form.description,
        deadline: form.deadline,
        groupId: form.groupId
      }
    }
    await createWork(workData)
    router.push(`/groups/${form.groupId}`)
  } catch (e) {
    console.error(e)
    alert('Ошибка создания')
  } finally {
    loading.value = false
  }
}

function cancel() {
  if (form.groupId) router.push(`/groups/${form.groupId}`)
  else router.push('/')
}

onMounted(loadGroups)
</script>

<style scoped>
/* Оставляем твои стили, добавляем только для файлов */
.container { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; margin-right: 0.5rem;}
.form-group input, .form-group textarea, .form-group select { margin: 0.5rem; width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
.form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
.form-actions button { padding: 0.5rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
.form-actions button[type="submit"] { background: #4CAF50; color: white; }
.form-actions button[type="button"] { background: #ccc; }

.file-list { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;}
.file-item { background: #f0f0f0; padding: 0.2rem 0.8rem; border-radius: 16px; display: inline-flex; align-items: center; gap: 0.4rem; }
.remove-file { background: none; border: none; color: red; cursor: pointer; font-weight: bold; }
</style>