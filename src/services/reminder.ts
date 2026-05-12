import api from '@/api'
import type { Reminder, ReminderCreateRequest } from '@/types'

export const reminderService = {
  getList() {
    return api.get('/api/v1/reminder/')
  },
  create(data: ReminderCreateRequest) {
    return api.post('/api/v1/reminder/', data)
  },
  updateStatus(reminderId: number, status: string) {
    return api.post('/api/v1/reminder/status', { reminder_id: reminderId, status })
  },
  delete(reminderId: number) {
    return api.delete(`/api/v1/reminder/${reminderId}`)
  },
}
