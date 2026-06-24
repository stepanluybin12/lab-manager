<template>
  <div>
    <!-- Меню – теперь есть! -->
    <AppMenu />

    <div class="dashboard-container">
      <!-- Приветствие -->
      <div class="welcome-block">
        <h1>👋 Добро пожаловать, {{ user?.name || 'пользователь' }}!</h1>
        <div v-if="!isTeacher" class="welcome-block-student-group">
          <h2>Ваша группа: {{ user?.group || 'не привязана' }}</h2>
        </div>
        <p class="role-badge">Роль: {{ user?.role === 'Teacher' ? 'Преподаватель' : 'Студент' }}</p>
      </div>

      <!-- Преподаватель: группы -->
      <div v-if="isTeacher" class="content-section">
        <div class="section-header">
          <h2>📚 Группы</h2>
          <div class="header-actions">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="🔍 Поиск групп..."
              class="search-input"
            />
          </div>
        </div>

        <div v-if="filteredGroups.length === 0" class="empty-state">
          <p>Групп не найдено</p>
        </div>
        <div v-else class="group-grid">
          <router-link
            v-for="group in filteredGroups"
            :key="group.id"
            :to="`/groups/${group.id}`"
            class="group-card"
          >
            <span class="group-icon">👥</span>
            <span class="group-name">{{ group.name }}</span>
            <span class="group-arrow">→</span>
          </router-link>
        </div>
      </div>

      <!-- Студент: его работы -->
      <div v-else class="content-section">
        <div class="section-header">
          <h2>📄 Мои работы</h2>
        </div>
        <div v-if="!userGroupId" class="empty-state">
          <p>⚠️ Вы не привязаны к группе. Обратитесь к преподавателю.</p>
        </div>
        <div v-else-if="works.length === 0" class="empty-state">
          <p>📭 Нет доступных работ</p>
        </div>
        <div v-else class="work-grid">
          <router-link
            v-for="work in works"
            :key="work.id"
            :to="`/works/${work.id}`"
            class="work-card"
          >
            <div class="work-title">{{ work.title }}</div>
            <div class="work-deadline">⏰ {{ formatDate(work.deadline) }}</div>
            <span class="work-arrow">→</span>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppMenu from '../components/AppMenu.vue'
import { useStore } from '../composables/useStore'
import { getGroups } from '../api/groups'
import { getWorksByGroup } from '../api/works' // статический импорт – работает!

const store = useStore()
const { state, setGroups, setWorks } = store

const user = state.user
const isTeacher = computed(() => state.role === 'Teacher')
const groups = computed(() => state.groups)
const works = computed(() => state.works)
const userGroupId = computed(() => state.user?.groupId)

// Поиск
const searchQuery = ref('')
const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return groups.value
  return groups.value.filter(g =>
    g.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})


function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function loadGroups() {
  try {
    const data = await getGroups()
    setGroups(data)
  } catch (e) {
    console.error('Ошибка загрузки групп', e)
  }
}

async function handleCreateGroup() {
  loading.value = true
  try {
    await createGroup(newGroupName.value)
    newGroupName.value = ''
    showCreateModal.value = false
    await loadGroups()
  } catch (e) {
    console.error('Ошибка создания группы', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (isTeacher.value) {
    await loadGroups()
  } else {
    // студент
    if (userGroupId.value) {
      try {
        const data = await getWorksByGroup(userGroupId.value)
        setWorks(data)
      } catch (e) {
        console.error('Ошибка загрузки работ', e)
      }
    } else {
      setWorks([])
    }
  }
})
</script>

<style scoped>
/* Общие стили */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.welcome-block {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #eaeef2;
}
.welcome-block h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}
.role-badge {
  display: inline-block;
  background: #e2e8f0;
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 500;
}

/* Секции */
.content-section {
  margin-top: 1rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.section-header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

/* Поиск и кнопка */
.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.search-input {
  padding: 0.75rem 1.2rem;
  border: 2px solid #e2e8f0;
  border-radius: 40px;
  font-size: 1.1rem;
  min-width: 250px;
  transition: all 0.2s;
  background: white;
}
.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
.btn-primary {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}
.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-2px);
}

/* Сетка групп – крупные карточки, 3 колонки */
.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}
.group-card {
  background: white;
  border-radius: 20px;
  padding: 1.8rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #edf2f7;
  transition: all 0.25s ease;
  text-decoration: none;
  color: #1a202c;
  font-size: 1.2rem;
}
.group-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}
.group-icon {
  font-size: 2.2rem;
  line-height: 1;
}
.group-name {
  font-weight: 600;
  font-size: 1.2rem;
  flex: 1;
}
.group-arrow {
  color: #94a3b8;
  font-size: 1.4rem;
  transition: transform 0.2s;
}
.group-card:hover .group-arrow {
  transform: translateX(6px);
  color: #4f46e5;
}

/* Сетка работ для студента – тоже крупнее */
.work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.work-card {
  background: white;
  border-radius: 20px;
  padding: 1.8rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #edf2f7;
  transition: all 0.25s ease;
  text-decoration: none;
  color: #1a202c;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.work-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}
.work-title {
  font-weight: 600;
  font-size: 1.2rem;
  color: #1a202c;
}
.work-deadline {
  font-size: 0.95rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.work-arrow {
  align-self: flex-end;
  color: #94a3b8;
  font-size: 1.3rem;
  transition: transform 0.2s;
}
.work-card:hover .work-arrow {
  transform: translateX(6px);
  color: #4f46e5;
}

.empty-state {
  background: #f8fafc;
  border: 2px dashed #d1d9e6;
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  color: #64748b;
  font-size: 1.1rem;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  min-width: 320px;
  max-width: 90%;
}
.modal h2 { margin-top: 0; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
.form-group input { width: 100%; padding: 0.6rem; border: 1px solid #ccc; border-radius: 8px; }
.modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
.modal-actions button { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; cursor: pointer; }
.modal-actions button[type="submit"] { background: #4f46e5; color: white; }
.modal-actions button[type="button"] { background: #e2e8f0; color: #1a202c; }
.modal-actions button:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 640px) {
  .group-grid, .work-grid { grid-template-columns: 1fr; }
  .header-actions { width: 100%; flex-direction: column; align-items: stretch; }
  .search-input { min-width: unset; width: 100%; }
}
</style>