import api from '@/api'
import type { Patient, Alert, DoctorMessage, DashboardData, SystemStats, Notification } from '@/types'

export const doctorService = {
  getPatients() {
    return api.get<{ success: boolean; patients: Patient[] }>('/api/v1/doctor/patients')
  },
  getHighRisk() {
    return api.get('/api/v1/doctor/high-risk')
  },
  getAbnormalCheckins() {
    return api.get('/api/v1/doctor/abnormal-checkins')
  },
  getPatientDetail(username: string) {
    return api.get('/api/v1/doctor/patient-detail', { params: { username } })
  },
  getAlerts(status?: 'pending' | 'processed') {
    return api.get<{ success: boolean; alerts: Alert[] }>('/api/v1/doctor/alerts', {
      params: { status },
    })
  },
  processAlert(alertId: number) {
    return api.post('/api/v1/doctor/alerts/process', { alert_id: alertId })
  },
  getMessages(patientUsername: string) {
    return api.get<{ success: boolean; messages: DoctorMessage[] }>(
      '/api/v1/doctor/messages',
      { params: { patient_username: patientUsername } },
    )
  },
  sendMessage(patientUsername: string, content: string) {
    return api.post('/api/v1/doctor/message', { patient_username: patientUsername, content })
  },
  sendMessageFromPatient(patientUsername: string, content: string) {
    return api.post('/api/v1/doctor/message/from-patient', { patient_username: patientUsername, content })
  },
  getUnreadCount() {
    return api.get<{ success: boolean; unread_count: number }>(
      '/api/v1/doctor/notifications/unread',
    )
  },
}

export const notificationService = {
  getUnreadCount() {
    return api.get<{ success: boolean; count: number }>('/api/v1/notifications/unread-count')
  },
  getList(unreadOnly = false) {
    return api.get<{ success: boolean; notifications: Notification[]; count: number }>(
      '/api/v1/notifications',
      { params: { unread_only: unreadOnly } },
    )
  },
  markRead(notificationId: number) {
    return api.put(`/api/v1/notifications/${notificationId}/read`)
  },
  markAllRead() {
    return api.put('/api/v1/notifications/read-all')
  },
}

export const statsService = {
  getUserStats(username: string) {
    return api.get(`/api/v1/stats/user/${username}`)
  },
  getSystemStats() {
    return api.get<{ success: boolean; stats: SystemStats }>('/api/v1/stats/system')
  },
  getDashboard() {
    return api.get<{ success: boolean; data: DashboardData }>(
      '/api/v1/stats/system-dashboard',
    )
  },
}
