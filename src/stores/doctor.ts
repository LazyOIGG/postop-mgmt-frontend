import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Alert } from '@/types'
import { doctorService } from '@/services/doctor'

export const useDoctorStore = defineStore('doctor', () => {
  const alerts = ref<Alert[]>([])
  const unreadCount = ref(0)
  const alertFilter = ref<'pending' | 'processed' | undefined>('pending')

  const pendingAlerts = computed(() =>
    alerts.value.filter((a) => a.status === 'pending'),
  )

  async function fetchAlerts() {
    const res = await doctorService.getAlerts(alertFilter.value)
    if (res.data.success) alerts.value = res.data.alerts
  }

  async function fetchUnreadCount() {
    const res = await doctorService.getUnreadCount()
    if (res.data.success) unreadCount.value = res.data.unread_count
  }

  async function processAlert(alertId: number) {
    await doctorService.processAlert(alertId)
    await fetchAlerts()
    await fetchUnreadCount()
  }

  return { alerts, unreadCount, alertFilter, pendingAlerts, fetchAlerts, fetchUnreadCount, processAlert }
})
