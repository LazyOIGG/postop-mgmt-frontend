<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { overviewService } from '@/services/checkin'
import { reminderService } from '@/services/reminder'
import type { OverviewData, Reminder } from '@/types'

const router = useRouter()
const overview = ref<OverviewData | null>(null)
const reminders = ref<Reminder[]>([])
const todayPending = ref(0)

const quickActions = [
  { label: 'AI 问诊', icon: '💬', color: '#7a9a7e', path: '/patient/chat' },
  { label: '健康评估', icon: '🩺', color: '#d4956a', path: '/patient/chat' },
  { label: '每日打卡', icon: '📋', color: '#8b7e9e', path: '/patient/checkin' },
  { label: '查看档案', icon: '📁', color: '#7e9e9b', path: '/patient/profile' },
]

onMounted(async () => {
  try {
    const [oRes, rRes] = await Promise.all([
      overviewService.getDashboard(7),
      reminderService.getList(),
    ])
    if (oRes.data.success) overview.value = oRes.data.data
    if (rRes.data.success) {
      reminders.value = rRes.data.reminders || []
      todayPending.value = rRes.data.today_stats?.pending_count || 0
    }
  } catch {
    // silent fail
  }
})
</script>

<template>
  <div class="home">
    <section class="greeting stagger-item stagger-1">
      <h2>今日康复情况</h2>
      <p class="subtitle">术后第 {{ overview?.profile?.postop_day || '...' }} 天</p>
    </section>

    <section class="quick-actions stagger-item stagger-2">
      <div
        v-for="action in quickActions"
        :key="action.label"
        class="action-card"
        :style="{ '--accent': action.color }"
        @click="router.push(action.path)"
      >
        <span class="action-icon">{{ action.icon }}</span>
        <span class="action-label">{{ action.label }}</span>
      </div>
    </section>

    <section class="reminder-section glass-card stagger-item stagger-3">
      <div class="section-head">
        <h3>今日提醒</h3>
        <span class="badge">{{ todayPending }} 项待办</span>
      </div>
      <div v-if="reminders.length === 0" class="empty-state">暂无提醒，一切顺利</div>
      <div v-for="r in reminders.slice(0, 3)" :key="r.id" class="reminder-item">
        <span class="reminder-dot" :class="r.reminder_type"></span>
        <div class="reminder-info">
          <span class="reminder-title">{{ r.title }}</span>
          <span class="reminder-time">{{ r.reminder_date }} {{ r.reminder_time || '' }}</span>
        </div>
      </div>
    </section>

    <section v-if="overview?.trend" class="trend-section glass-card stagger-item stagger-4">
      <h3>健康趋势</h3>
      <div class="trend-placeholder">
        <p>趋势数据加载中...</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.greeting {
  padding-top: 4px;
}

.greeting h2 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.action-card:active {
  transform: scale(0.96);
}

.action-icon {
  font-size: 28px;
}

.action-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-head h3 {
  font-size: 18px;
}

.badge {
  font-size: 12px;
  background: var(--color-accent-light);
  color: #fff;
  padding: 3px 10px;
  border-radius: 12px;
}

.glass-card {
  padding: 18px;
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 20px 0;
  font-size: 14px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.reminder-item:last-child {
  border-bottom: none;
}

.reminder-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.reminder-dot.medication {
  background: var(--color-accent);
}

.reminder-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reminder-title {
  font-size: 14px;
  font-weight: 500;
}

.reminder-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.trend-section h3 {
  font-size: 18px;
  margin-bottom: 12px;
}

.trend-placeholder {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
