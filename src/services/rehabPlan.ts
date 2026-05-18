import api from '@/api'
import type { RehabPlanGenerateRequest } from '@/types'

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
}
