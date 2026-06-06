<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRehabStore } from '@/stores/rehab'
import { rehabPlanService } from '@/services/rehabPlan'
import { FirstAidKit } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useRehabStore()
const ready = ref(false)

onMounted(async () => {
  if (!store.activePlan?.id) {
    try {
      const res = await rehabPlanService.getList('active')
      if (res.data.success && res.data.plans?.length > 0) {
        store.activePlan = res.data.plans[0]
        await store.fetchDashboard(store.activePlan.id)
      }
    } catch { /* */ }
  }
  ready.value = true
})

const tabs = [
  { name: 'RehabDashboard', label: '总览', icon: 'DataAnalysis', path: '/patient/rehab' },
  { name: 'RehabCalendar', label: '日历', icon: 'Calendar', path: '/patient/rehab/calendar' },
  { name: 'RehabMetrics', label: '指标', icon: 'TrendCharts', path: '/patient/rehab/metrics' },
  { name: 'RehabExercise', label: '运动', icon: 'Football', path: '/patient/rehab/exercises' },
  { name: 'RehabJournal', label: '日志', icon: 'EditPen', path: '/patient/rehab/journal' },
  { name: 'RehabAchievements', label: '成就', icon: 'Trophy', path: '/patient/rehab/achievements' },
]

function goTab(path: string) {
  router.push(path)
}

function isActive(tabName: string) {
  if (tabName === 'RehabDashboard') return route.name === 'RehabDashboard'
  return route.name === tabName
}
</script>

<template>
  <div class="rehab-shell" v-loading="!ready">
    <!-- No plan: show CTA -->
    <template v-if="ready && !store.activePlan">
      <section class="empty-plan">
        <div class="empty-icon">
          <el-icon :size="48" color="#606C38"><FirstAidKit /></el-icon>
        </div>
        <h2>暂无康复计划</h2>
        <p>前往总览页生成个性化康复计划</p>
        <el-button type="primary" size="large" round @click="router.push('/patient/rehab')">
          前往总览
        </el-button>
      </section>
    </template>

    <!-- Has plan: full layout -->
    <template v-if="ready && store.activePlan">
      <nav class="rehab-subnav">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          class="subnav-item"
          :class="{ active: isActive(tab.name) }"
          @click="goTab(tab.path)"
        >
          <el-icon :size="16"><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </nav>

      <main class="rehab-main">
        <router-view />
      </main>
    </template>
  </div>
</template>

<style scoped>
.rehab-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.rehab-subnav {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
  -webkit-overflow-scrolling: touch;
}

.rehab-subnav::-webkit-scrollbar {
  display: none;
}

.subnav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.subnav-item:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.subnav-item.active {
  background: var(--color-primary);
  color: #fff;
}

.rehab-main {
  flex: 1;
  overflow-y: auto;
}

.empty-plan {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 48px 20px;
}
.empty-icon {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--color-primary-bg);
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
}
.empty-plan h2 { font-size: 22px; margin-bottom: 8px; }
.empty-plan p { color: var(--color-text-secondary); font-size: 14px; max-width: 280px; margin-bottom: 24px; line-height: 1.6; }
</style>
