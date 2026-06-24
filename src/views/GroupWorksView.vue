<template>
  <div>
    <AppMenu />
    <div class="container">
      <!-- Хлебные крошки -->
      <nav class="breadcrumb">
        <router-link to="/">Главная</router-link>
        <span class="separator">/</span>
        <span class="current">{{ groupName || 'Группа' }}</span>
      </nav>

      <div class="group-header">
        <h1>📁 {{ groupName || 'Группа' }}</h1>
        <button @click="goToCreateWork" class="btn-primary">+ Создать работу</button>
      </div>

      <div v-if="works.length === 0" class="empty-state">
        Нет работ для этой группы
      </div>
      <ul v-else class="work-list">
        <li v-for="work in works" :key="work.id">
          <router-link :to="`/works/${work.id}`" class="work-link">
            <span class="work-title">{{ work.title }}</span>
            <span class="work-deadline">⏰ {{ formatDate(work.deadline) }}</span>
            <span class="work-arrow">→</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppMenu from '../components/AppMenu.vue'
import { useStore } from '../composables/useStore'
import { getWorksByGroup } from '../api/works'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { state, setWorks, setCurrentGroupId } = store

const groupId = ref(route.params.groupId) // строка (GUID)
const works = ref([])
const loading = ref(false)

// Получаем название группы из store (если там есть список групп)
const groupName = computed(() => {
  const group = state.groups.find(g => g.id === groupId.value)
  return group ? group.name : 'Группа'
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ru-RU')
}

function goToCreateWork() {
  router.push(`/works/create?groupId=${groupId.value}`)
}

async function loadWorks() {
  loading.value = true
  try {
    const data = await getWorksByGroup(groupId.value)
    works.value = data
    setWorks(data)
    setCurrentGroupId(groupId.value)
  } catch (e) {
    console.error('Ошибка загрузки работ', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWorks()
})
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
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

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.group-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.work-list {
  list-style: none;
  padding: 0;
}
.work-list li {
  margin: 0.5rem 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.2s;
}
.work-list li:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
.work-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  text-decoration: none;
  color: #1a202c;
}
.work-title {
  font-weight: 500;
}
.work-deadline {
  color: #64748b;
  font-size: 0.9rem;
}
.work-arrow {
  color: #94a3b8;
  font-size: 1.2rem;
}
.work-link:hover .work-arrow {
  transform: translateX(4px);
  color: #4f46e5;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: 16px;
  border: 2px dashed #d1d9e6;
}
</style>