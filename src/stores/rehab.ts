import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rehabPlanService } from '@/services/rehabPlan'
import type {
  RehabPlan, RehabTask, DashboardData, CalendarData,
  RehabMetric, LatestMetrics, RehabExercise,
  RehabJournal, UserAchievement, AchievementDef
} from '@/types'

export const useRehabStore = defineStore('rehab', () => {
  // ── 核心状态 ──
  const activePlan = ref<RehabPlan | null>(null)
  const plans = ref<RehabPlan[]>([])
  const todayTasks = ref<RehabTask[]>([])
  const loading = ref(false)

  // ── 仪表盘 ──
  const dashboardData = ref<DashboardData | null>(null)
  const calendarData = ref<CalendarData>({})

  // ── 指标 ──
  const metricsHistory = ref<Record<string, RehabMetric[]>>({})
  const latestMetrics = ref<LatestMetrics>({})
  const metricTrend = ref<{ dates: string[]; values: number[] }>({ dates: [], values: [] })

  // ── 运动库 ──
  const exercises = ref<RehabExercise[]>([])
  const recommendedExercises = ref<RehabExercise[]>([])

  // ── 日志 ──
  const journals = ref<RehabJournal[]>([])

  // ── 成就 ──
  const userAchievements = ref<UserAchievement[]>([])
  const allAchievementDefs = ref<AchievementDef[]>([])
  const newAchievements = ref<AchievementDef[]>([])

  // ── 计算属性 ──
  const completionRate = computed(() => {
    const s = dashboardData.value?.stats
    if (!s || s.total_tasks === 0) return 0
    return Math.round((s.completed_tasks / s.total_tasks) * 100)
  })

  const phaseProgress = computed(() => {
    const ps = dashboardData.value?.phase_stats || {}
    return Object.fromEntries(
      Object.entries(ps).map(([k, v]) => [
        k, v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0
      ])
    )
  })

  // ── 操作 ──
  async function fetchDashboard(planId: number) {
    try {
      const res = await rehabPlanService.getDashboard(planId)
      if (res.data.success) {
        dashboardData.value = res.data
        activePlan.value = res.data.plan
        todayTasks.value = res.data.today_tasks || []
        calendarData.value = res.data.calendar || {}
        latestMetrics.value = res.data.latest_metrics || {}
      }
    } catch { /* handled in component */ }
  }

  async function fetchCalendar(planId: number, year: number, month: number) {
    try {
      const res = await rehabPlanService.getCalendar(planId, year, month)
      if (res.data.success) calendarData.value = res.data.calendar || {}
    } catch { /* handled in component */ }
  }

  async function fetchMetrics(planId: number, metricType: string) {
    try {
      const res = await rehabPlanService.getMetricTrend(planId, metricType)
      if (res.data.success) {
        metricTrend.value = { dates: res.data.dates, values: res.data.values }
      }
    } catch { /* handled in component */ }
  }

  async function saveMetric(planId: number, data: Parameters<typeof rehabPlanService.saveMetric>[1]) {
    const res = await rehabPlanService.saveMetric(planId, data)
    if (res.data.success) {
      const latestRes = await rehabPlanService.getLatestMetrics(planId)
      if (latestRes.data.success) latestMetrics.value = latestRes.data.metrics
    }
    return res.data
  }

  async function fetchExercises(params?: Record<string, string>) {
    try {
      const res = await rehabPlanService.getExercises(params)
      if (res.data.success) exercises.value = res.data.exercises || []
    } catch { /* handled in component */ }
  }

  async function fetchRecommendedExercises(surgeryType?: string, currentPhase?: string) {
    try {
      const res = await rehabPlanService.getRecommendedExercises(surgeryType, currentPhase)
      if (res.data.success) recommendedExercises.value = res.data.exercises || []
    } catch { /* handled in component */ }
  }

  async function fetchJournals(planId: number, dateFrom?: string, dateTo?: string) {
    try {
      const res = await rehabPlanService.getJournals(planId, dateFrom, dateTo)
      if (res.data.success) journals.value = res.data.journals || []
    } catch { /* handled in component */ }
  }

  async function saveJournal(planId: number, data: Parameters<typeof rehabPlanService.saveJournal>[1]) {
    const res = await rehabPlanService.saveJournal(planId, data)
    return res.data
  }

  async function fetchAchievements(planId: number) {
    try {
      const [userRes, defsRes] = await Promise.all([
        rehabPlanService.getUserAchievements(planId),
        rehabPlanService.getAchievementDefs(),
      ])
      if (userRes.data.success) userAchievements.value = userRes.data.achievements || []
      if (defsRes.data.success) allAchievementDefs.value = defsRes.data.achievements || []
    } catch { /* handled in component */ }
  }

  async function checkAchievements(planId: number) {
    try {
      const res = await rehabPlanService.checkAchievements(planId)
      if (res.data.success && res.data.new_achievements?.length > 0) {
        newAchievements.value = res.data.new_achievements
      }
      return res.data
    } catch { /* handled in component */ }
  }

  function clearNewAchievements() {
    newAchievements.value = []
  }

  return {
    activePlan, plans, todayTasks, loading,
    dashboardData, calendarData,
    metricsHistory, latestMetrics, metricTrend,
    exercises, recommendedExercises,
    journals,
    userAchievements, allAchievementDefs, newAchievements,
    completionRate, phaseProgress,
    fetchDashboard, fetchCalendar,
    fetchMetrics, saveMetric,
    fetchExercises, fetchRecommendedExercises,
    fetchJournals, saveJournal,
    fetchAchievements, checkAchievements, clearNewAchievements,
  }
})
