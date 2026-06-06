import { ref } from 'vue'
import { useRehabStore } from '@/stores/rehab'
import { rehabPlanService } from '@/services/rehabPlan'
import { ElMessage } from 'element-plus'

export function useRehabPlan() {
  const store = useRehabStore()
  const generating = ref(false)
  const showGenerate = ref(false)

  async function loadActivePlan() {
    if (store.activePlan?.id) return
    try {
      const res = await rehabPlanService.getList('active')
      if (res.data.success && res.data.plans?.length > 0) {
        store.activePlan = res.data.plans[0]
      }
    } catch { /* */ }
  }

  async function loadDashboard() {
    if (!store.activePlan?.id) return
    await store.fetchDashboard(store.activePlan.id)
  }

  async function generatePlan(surgeryType: string, planTitle: string) {
    generating.value = true
    try {
      const res = await rehabPlanService.generate({
        surgery_type: surgeryType.trim() || undefined,
        plan_title: planTitle.trim() || undefined,
      })
      if (res.data.success) {
        showGenerate.value = false
        ElMessage.success('康复计划已生成！')
        await loadActivePlan()
        await loadDashboard()
        return true
      }
      ElMessage.error(res.data.error || '生成失败')
    } catch {
      ElMessage.error('生成康复计划失败')
    } finally {
      generating.value = false
    }
    return false
  }

  async function completeTask(taskId: number) {
    const res = await rehabPlanService.completeTask(taskId)
    if (res.data.success) {
      // Check achievements
      if (store.activePlan?.id) {
        await store.checkAchievements(store.activePlan.id)
      }
      // Reload dashboard
      if (store.activePlan?.id) {
        await store.fetchDashboard(store.activePlan.id)
      }
      if (res.data.phase_complete && res.data.next_phase) {
        ElMessage.success(`当前阶段已完成！可推进到「${res.data.next_phase}」`)
      }
    }
    return res.data
  }

  async function advancePhase(phase: string) {
    if (!store.activePlan?.id) return false
    try {
      const res = await rehabPlanService.advancePhase(store.activePlan.id, phase)
      if (res.data.success) {
        store.activePlan.current_phase = phase as any
        ElMessage.success(`已推进到「${phase}」`)
        await loadDashboard()
        return true
      }
    } catch { ElMessage.error('阶段推进失败') }
    return false
  }

  return {
    generating, showGenerate,
    loadActivePlan, loadDashboard,
    generatePlan, completeTask, advancePhase,
  }
}
