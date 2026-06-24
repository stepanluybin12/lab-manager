<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Вход в систему</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login">Логин</label>
          <input
            id="login"
            v-model="form.login"
            type="text"
            required
            placeholder="Введите логин"
          />
        </div>
        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Введите пароль"
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>

      <button type="button" @click="handleLogin" :disabled="loading">Войти</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../composables/useStore'
import { login } from '../api/auth'

const router = useRouter()
const store = useStore()

const form = reactive({
  login: '',
  password: '',
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const data = await login(form.login, form.password)
    console.log('Ответ сервера:', data)
    // data должно содержать { token, user: { id, name, role } }
    store.setAuth(data.token, data.user, data.userId)
    // Перенаправляем на дашборд
    router.push({ name: 'Dashboard' })
  } catch (err) {
    error.value = err.message || 'Неверный логин или пароль'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}
h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  width: 418px;
  height: 40px;
  padding: 0.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}
button:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}
.error-message {
  margin-top: 1rem;
  color: #d32f2f;
  text-align: center;
}
</style>