import { ref, computed } from 'vue'
import { useRehabStore } from '@/stores/rehab'

export function useAchievements(planId: number) {
  const store = useRehabStore()

  const catLabels: Record<string, string> = {
    streak: '连续打卡', milestone: '康复里程碑',
    compliance: '遵医达人', recovery: '恢复成就', special: '特别成就'
  }
  const catIcons: Record<string, string> = {
    streak: '🔥', milestone: '🎯', compliance: '💊',
    recovery: '💪', special: '⭐'
  }

  const earnedCodes = computed(() => new Set(store.userAchievements.map(a => a.code)))
  const totalPoints = computed(() => store.userAchievements.reduce((s, a) => s + a.points, 0))
  const earnedCount = computed(() => store.userAchievements.length)
  const totalCount = computed(() => store.allAchievementDefs.length)

  function isEarned(code: string) {
    return earnedCodes.value.has(code)
  }

  async function load() {
    await store.fetchAchievements(planId)
  }

  async function check() {
    await store.checkAchievements(planId)
  }

  return {
    catLabels, catIcons,
    earnedCodes, totalPoints, earnedCount, totalCount,
    isEarned, load, check,
  }
}
