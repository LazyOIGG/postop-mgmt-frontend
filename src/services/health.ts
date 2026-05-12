import api from '@/api'
import type { PatientProfile, HealthAssessmentResponse } from '@/types'

export const healthService = {
  getProfile() {
    return api.get('/api/v1/profile/me')
  },
  saveProfile(data: PatientProfile) {
    return api.post('/api/v1/profile/me', data)
  },
  assessText(inputText: string, sessionId?: string) {
    const formData = new FormData()
    formData.append('input_text', inputText)
    if (sessionId) formData.append('session_id', sessionId)
    return api.post<HealthAssessmentResponse>('/api/v1/health/assess/text', formData)
  },
  assessImage(file: File, sessionId?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (sessionId) formData.append('session_id', sessionId)
    return api.post<HealthAssessmentResponse>('/api/v1/health/assess/image', formData)
  },
  getAssessmentHistory() {
    return api.get('/api/v1/health/assess/history')
  },
}
