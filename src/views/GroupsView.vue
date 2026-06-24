<template>
  <div>
    <AppMenu />
    <div class="container">
      <h1>Группы</h1>
      <button @click="showModal = true" class="btn-primary">Добавить группу</button>
      <div v-if="groups.length === 0">Нет групп</div>
      <ul v-else>
        <li v-for="group in groups" :key="group.id">
          <router-link :to="`/api/groups/${group.id}`">{{ group.name }}</router-link>
        </li>
      </ul>

      <!-- Модалка добавления группы -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h2>Добавить группу</h2>
          <form @submit.prevent="handleCreateGroup">
            <div class="form-group">
              <label for="groupName">Название группы</label>
              <input id="groupName" v-model="newGroupName" required placeholder="Введите название" />
            </div>
            <div class="modal-actions">
              <button type="button" @click="showModal = false">Отмена</button>
              <button type="submit" :disabled="loading">Создать</button>
            </div>
          </form>
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

const store = useStore()
const { state, setGroups } = store
const groups = computed(() => state.groups)

const showModal = ref(false)
const newGroupName = ref('')
const loading = ref(false)

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
    showModal.value = false
    await loadGroups() // обновим список
  } catch (e) {
    console.error('Ошибка создания группы', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadGroups)
</script>

<style scoped>
.container { padding: 1rem; }
.btn-primary { background: #4CAF50; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-bottom: 1rem; }
ul { list-style: none; padding: 0; }
li { margin: 0.5rem 0; }
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
}
.modal {
  background: white; padding: 2rem; border-radius: 8px; min-width: 300px;
}
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; }
.form-group input { width: 100%; padding: 0.5rem; }
.modal-actions { display: flex; gap: 1rem; justify-content: flex-end; }
</style>