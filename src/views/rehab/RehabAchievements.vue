<script setup lang="ts">
import { onMounted } from 'vue'
import { useRehabStore } from '@/stores/rehab'

const store = useRehabStore()

const catLabels: Record<string, string> = { streak: '连续打卡', milestone: '康复里程碑', compliance: '遵医达人', recovery: '恢复成就', special: '特别成就' }
const catIcons: Record<string, string> = { streak: '🔥', milestone: '🎯', compliance: '💊', recovery: '💪', special: '⭐' }

const earnedCodes = new Set(store.userAchievements.map(a => a.code))

onMounted(async () => {
  if (store.activePlan?.id) await store.fetchAchievements(store.activePlan.id)
})
</script>

<template>
  <div class="achievements-view">
    <!-- Score header -->
    <div class="score-header glass-card">
      <div class="score-big">{{ store.userAchievements.reduce((s, a) => s + a.points, 0) }}</div>
      <div class="score-label">总积分</div>
      <div class="achieved-count">已获 {{ store.userAchievements.length }}/{{ store.allAchievementDefs.length }} 枚徽章</div>
    </div>

    <!-- By category -->
    <section v-for="(label, cat) in catLabels" :key="cat" class="cat-section">
      <h4>{{ catIcons[cat] }} {{ label }}</h4>
      <div class="badge-grid">
        <div
          v-for="ach in store.allAchievementDefs.filter(a => a.category === cat)"
          :key="ach.code"
          class="badge-card"
          :class="{ earned: earnedCodes.has(ach.code) }"
        >
          <div class="badge-icon">{{ earnedCodes.has(ach.code) ? '🏆' : '🔒' }}</div>
          <div class="badge-name">{{ ach.name }}</div>
          <div class="badge-desc">{{ ach.description }}</div>
          <div class="badge-points">{{ ach.points }}分</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.achievements-view { display: flex; flex-direction: column; gap: 20px; padding-bottom: 20px; }
.score-header { text-align: center; padding: 24px; }
.score-big { font-size: 42px; font-weight: 800; color: var(--color-primary-dark); }
.score-label { font-size: 14px; color: var(--color-text-secondary); margin-top: 4px; }
.achieved-count { font-size: 12px; color: var(--color-text-tertiary); margin-top: 8px; }
.cat-section h4 { font-size: 15px; margin-bottom: 10px; }
.badge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.badge-card { background: var(--color-surface); border-radius: var(--radius-md); padding: 14px; text-align: center; border: 1px solid var(--color-border-light); opacity: 0.4; transition: all 0.3s; }
.badge-card.earned { opacity: 1; border-color: #C08E3A; background: linear-gradient(135deg, rgba(192,142,58,0.08), var(--color-surface)); }
.badge-icon { font-size: 32px; margin-bottom: 6px; }
.badge-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.badge-desc { font-size: 11px; color: var(--color-text-secondary); line-height: 1.4; }
.badge-points { font-size: 11px; color: #C08E3A; font-weight: 600; margin-top: 6px; }
.glass-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 18px; border: 1px solid var(--color-border-light); }
</style>
