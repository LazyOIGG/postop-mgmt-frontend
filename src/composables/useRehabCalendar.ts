import { ref, computed } from 'vue'
import { useRehabStore } from '@/stores/rehab'

export function useRehabCalendar(planId: number) {
  const store = useRehabStore()
  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1)

  const weekdays = ['一', '二', '三', '四', '五', '六', '日']

  function daysInMonth(y: number, m: number) {
    return new Date(y, m, 0).getDate()
  }

  function firstDayOffset(y: number, m: number) {
    const d = new Date(y, m - 1, 1).getDay()
    return d === 0 ? 6 : d - 1
  }

  function makeDateStr(day: number) {
    const m = String(currentMonth.value).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear.value}-${m}-${d}`
  }

  function cellStatus(day: number): 'full' | 'partial' | 'missed' | 'empty' {
    const key = makeDateStr(day)
    const data = store.calendarData[key]
    if (!data) return 'empty'
    if (data.completed === data.total) return 'full'
    if (data.completed > 0) return 'partial'
    return 'missed'
  }

  async function loadMonth() {
    await store.fetchCalendar(planId, currentYear.value, currentMonth.value)
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

  return {
    currentYear, currentMonth, weekdays,
    daysInMonth, firstDayOffset, makeDateStr, cellStatus,
    loadMonth, prevMonth, nextMonth,
  }
}
