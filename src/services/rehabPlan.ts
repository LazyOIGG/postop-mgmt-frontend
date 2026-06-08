import api from '@/api'
import type { RehabPlanGenerateRequest, RehabMetricInput, RehabJournalInput } from '@/types'

export const rehabPlanService = {
  generate(data: RehabPlanGenerateRequest) {
    return api.post('/api/v1/rehab-plan/generate', data)
  },
  getList(status?: string) {
    return api.get('/api/v1/rehab-plan/', { params: status ? { status } : {} })
  },
  getDetail(planId: number) {
    return api.get(`/api/v1/rehab-plan/${planId}`)
  },
  getTodayTasks() {
    return api.get('/api/v1/rehab-plan/tasks/today')
  },
  completeTask(taskId: number) {
    return api.post('/api/v1/rehab-plan/tasks/complete', { task_id: taskId })
  },
  advancePhase(planId: number, phase: string) {
    return api.put(`/api/v1/rehab-plan/${planId}/phase`, { plan_id: planId, current_phase: phase })
  },
  cancelPlan(planId: number) {
    return api.delete(`/api/v1/rehab-plan/${planId}`)
  },

  // ── 仪表盘 ──
  getDashboard(planId: number) {
    return api.get(`/api/v1/rehab-plan/${planId}/dashboard`)
  },
  getCalendar(planId: number, year: number, month: number) {
    return api.get(`/api/v1/rehab-plan/${planId}/calendar`, { params: { year, month } })
  },

  // ── 指标 ──
  saveMetric(planId: number, data: RehabMetricInput) {
    return api.post(`/api/v1/rehab-plan/${planId}/metrics`, data)
  },
  getMetrics(planId: number, params?: { metric_type?: string; date_from?: string; date_to?: string }) {
    return api.get(`/api/v1/rehab-plan/${planId}/metrics`, { params })
  },
  getLatestMetrics(planId: number) {
    return api.get(`/api/v1/rehab-plan/${planId}/metrics/latest`)
  },
  getMetricTrend(planId: number, metricType: string, dateFrom?: string, dateTo?: string) {
    return api.get(`/api/v1/rehab-plan/${planId}/metrics/trend`, {
      params: { metric_type: metricType, date_from: dateFrom, date_to: dateTo }
    })
  },

  // ── 运动库 ──
  getExercises(params?: { phase?: string; category?: string; surgery_type?: string; difficulty?: string; search?: string }) {
    return api.get('/api/v1/rehab-exercises', { params })
  },
  getAAOSExercises(surgeryType: string) {
    return api.get(`/api/v1/rehab-exercises/aaos/${encodeURIComponent(surgeryType || '膝关节锻炼')}`)
  },
  getExerciseDetail(id: number) {
    return api.get(`/api/v1/rehab-exercises/${id}`)
  },
  getRecommendedExercises(surgeryType?: string, currentPhase?: string) {
    return api.get('/api/v1/rehab-exercises/recommended', {
      params: { surgery_type: surgeryType, current_phase: currentPhase }
    })
  },

  // ── 日志 ──
  saveJournal(planId: number, data: RehabJournalInput) {
    return api.post(`/api/v1/rehab-plan/${planId}/journals`, data)
  },
  getJournals(planId: number, dateFrom?: string, dateTo?: string) {
    return api.get(`/api/v1/rehab-plan/${planId}/journals`, { params: { date_from: dateFrom, date_to: dateTo } })
  },
  getJournal(planId: number, journalId: number) {
    return api.get(`/api/v1/rehab-plan/${planId}/journals/${journalId}`)
  },

  // ── 成就 ──
  getAchievementDefs() {
    return api.get('/api/v1/rehab-achievements/defs')
  },
  getUserAchievements(planId: number) {
    return api.get(`/api/v1/rehab-plan/${planId}/achievements`)
  },
  checkAchievements(planId: number) {
    return api.post(`/api/v1/rehab-plan/${planId}/achievements/check`)
  },
}
