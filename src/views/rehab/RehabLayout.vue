<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

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
  <div class="rehab-shell">
    <!-- Sub-navigation bar -->
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

    <!-- Child views -->
    <main class="rehab-main">
      <router-view />
    </main>
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
</style>
