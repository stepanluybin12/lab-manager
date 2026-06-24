<template>
  <header v-if="isAuthenticated">
    <nav>
      <router-link to="/">Дашборд</router-link>
      <button @click="logout" class="logout-btn">Выйти</button>
    </nav>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../composables/useStore'

const router = useRouter()
const store = useStore()
const { state, clearAuth } = store

const isAuthenticated = computed(() => state.isAuthenticated)
const isTeacher = computed(() => state.role === 'teacher')

function logout() {
  clearAuth()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
header {
  background: #333;
  color: white;
  padding: 1rem;
}
nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}
nav a {
  color: white;
  text-decoration: none;
}
nav a.router-link-active {
  text-decoration: underline;
}
.logout-btn {
  margin-left: auto;
  background: #d32f2f;
  color: white;
  border: none;
  padding: 0.25rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>