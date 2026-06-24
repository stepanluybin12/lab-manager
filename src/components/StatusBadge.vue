<template>
  <span class="badge" :class="badgeClass">{{ displayStatus }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: [Number, String],
    required: true,
    validator: (val) => [0, 1, 2, 3, 'submited', 'checking', 'graded', 'expired'].includes(val)
  },
  deadline: {
    type: String,
    default: null
  }
})

// Маппинг числовых статусов в строковые идентификаторы
const statusMap = {
  0: 'submited',
  1: 'checking',
  2: 'graded',
  3: 'expired'
}

// Преобразуем входной статус в строковый идентификатор
const statusKey = computed(() => {
  if (typeof props.status === 'number') {
    return statusMap[props.status] || 'unknown'
  }
  return props.status // если уже строка
})

const isExpired = computed(() => {
  if (!props.deadline) return false
  return new Date(props.deadline) < new Date()
})

const displayStatus = computed(() => {
  if (isExpired.value && statusKey.value !== 'graded') {
    return 'Просрочена'
  }
  const map = {
    submited: 'Прикреплена',
    checking: 'На проверке',
    graded: 'Оценена',
    expired: 'Просрочена'
  }
  return map[statusKey.value] || 'Неизвестно'
})

const badgeClass = computed(() => {
  if (isExpired.value && statusKey.value !== 'graded') {
    return 'badge-expired'
  }
  const map = {
    submited: 'badge-submited',
    checking: 'badge-checking',
    graded: 'badge-graded',
    expired: 'badge-expired'
  }
  return map[statusKey.value] || ''
})
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}
.badge-submited { background: #ffeb3b; color: #333; }
.badge-checking { background: #2196F3; color: white; }
.badge-graded { background: #4CAF50; color: white; }
.badge-expired { background: #f44336; color: white; }
</style>