<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRehabStore } from '@/stores/rehab'

const store = useRehabStore()
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

function dayOfWeek(y: number, m: number) {
  const d = new Date(y, m - 1, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function makeDateStr(day: number) {
  const m = String(currentMonth.value).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${currentYear.value}-${m}-${d}`
}

function cellClass(day: number) {
  const key = makeDateStr(day)
  const data = store.calendarData[key]
  if (!data) return 'empty'
  if (data.completed === data.total) return 'full'
  if (data.completed > 0) return 'partial'
  return 'missed'
}

async function loadMonth() {
  if (store.activePlan?.id) {
    await store.fetchCalendar(store.activePlan.id, currentYear.value, currentMonth.value)
  }
}

function prevMonth() {
  if (currentMonth.value === 1) { currentYear.value--; currentMonth.value = 12 }
  else currentMonth.value--
  loadMonth()
}

function nextMonth() {
  if (currentMonth.value === 12) { currentYear.value++; currentMonth.value = 1 }
  else currentMonth.value++
  loadMonth()
}

onMounted(() => loadMonth())
</script>

<template>
  <div class="calendar-view">
    <header class="cal-header">
      <el-button circle size="small" @click="prevMonth"><el-icon><ArrowLeft /></el-icon></el-button>
      <h3>{{ currentYear }}年 {{ currentMonth }}月</h3>
      <el-button circle size="small" @click="nextMonth"><el-icon><ArrowRight /></el-icon></el-button>
    </header>

    <div class="cal-grid">
      <div v-for="w in weekdays" :key="w" class="cal-weekday">{{ w }}</div>
      <div v-for="i in dayOfWeek(currentYear, currentMonth)" :key="'pad-'+i" class="cal-cell pad"></div>
      <div
        v-for="day in daysInMonth(currentYear, currentMonth)"
        :key="day"
        class="cal-cell"
        :class="cellClass(day)"
      >
        <span class="cal-day-num">{{ day }}</span>
      </div>
    </div>

    <div class="cal-legend">
      <span><i class="dot full"></i> 全部完成</span>
      <span><i class="dot partial"></i> 部分完成</span>
      <span><i class="dot missed"></i> 未完成</span>
      <span><i class="dot empty"></i> 无任务</span>
    </div>
  </div>
</template>

<style scoped>
.calendar-view { padding-bottom: 20px; }
.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cal-header h3 { font-size: 18px; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-weekday { text-align: center; font-size: 12px; font-weight: 600; color: var(--color-text-tertiary); padding: 8px 0; }
.cal-cell { aspect-ratio: 1; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
.cal-cell.pad { background: transparent; }
.cal-cell.empty { background: rgba(0,0,0,0.03); color: var(--color-text-tertiary); }
.cal-cell.full { background: rgba(96,108,56,0.2); color: #606C38; }
.cal-cell.partial { background: rgba(192,142,58,0.2); color: #C08E3A; }
.cal-cell.missed { background: rgba(198,107,61,0.15); color: #C66B3D; }
.cal-legend { display: flex; gap: 16px; justify-content: center; margin-top: 16px; font-size: 12px; color: var(--color-text-secondary); }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; }
.dot.full { background: rgba(96,108,56,0.5); }
.dot.partial { background: rgba(192,142,58,0.5); }
.dot.missed { background: rgba(198,107,61,0.5); }
.dot.empty { background: rgba(0,0,0,0.1); }
</style>
