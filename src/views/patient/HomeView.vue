<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { overviewService } from '@/services/checkin'
import { reminderService } from '@/services/reminder'
import type { OverviewData, Reminder } from '@/types'
import { ChatDotRound, Document, User } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import 'echarts'

const router = useRouter()
const overview = ref<OverviewData | null>(null)
const reminders = ref<Reminder[]>([])
const todayPending = ref(0)

const quickActions = [
  { label: 'AI 问诊', icon: ChatDotRound, gradient: 'linear-gradient(135deg, #7a9a7e, #5a7a5e)', path: '/patient/chat' },
  { label: '健康评估', icon: Document, gradient: 'linear-gradient(135deg, #d4956a, #c57e4e)', path: '/patient/chat' },
  { label: '每日打卡', icon: Document, gradient: 'linear-gradient(135deg, #8b7e9e, #6d5f7e)', path: '/patient/checkin' },
  { label: '查看档案', icon: User, gradient: 'linear-gradient(135deg, #7e9e9b, #5e7e7b)', path: '/patient/profile' },
]

const trendOption = computed(() => {
  const checkins = (overview.value?.trend as any)?.checkins || []
  const dates = checkins.map((c: any) => c.checkin_date?.slice(5) || '')
  const temps = checkins.map((c: any) => c.temperature)
  const hrs = checkins.map((c: any) => c.heart_rate)

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['体温 °C', '心率 bpm'],
      bottom: 0,
      textStyle: { color: '#8a7e74', fontSize: 11 },
    },
    grid: { left: 8, right: 24, top: 8, bottom: 32 },
    xAxis: {
      type: 'category',
      data: dates.length > 0 ? dates : ['无数据'],
      axisLine: { lineStyle: { color: '#e8e0d8' } },
      axisTick: { show: false },
      axisLabel: { color: '#8a7e74', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0ece8' } },
      axisLabel: { color: '#8a7e74', fontSize: 10 },
    },
    series: [
      {
        name: '体温 °C',
        type: 'line',
        data: temps.length > 0 ? temps : [],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#d4956a', width: 2 },
        itemStyle: { color: '#d4956a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212,149,106,0.2)' },
              { offset: 1, color: 'rgba(212,149,106,0)' },
            ],
          },
        },
      },
      {
        name: '心率 bpm',
        type: 'line',
        data: hrs.length > 0 ? hrs : [],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#7a9a7e', width: 2 },
        itemStyle: { color: '#7a9a7e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(122,154,126,0.2)' },
              { offset: 1, color: 'rgba(122,154,126,0)' },
            ],
          },
        },
      },
    ],
  }
})

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
    // silent
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
        @click="router.push(action.path)"
      >
        <div class="action-icon-box" :style="{ background: action.gradient }">
          <el-icon :size="22" color="#fff"><component :is="action.icon" /></el-icon>
        </div>
        <span class="action-label">{{ action.label }}</span>
      </div>
    </section>

    <section class="reminder-section glass-card stagger-item stagger-3">
      <div class="section-head">
        <h3>今日提醒</h3>
        <el-tag v-if="todayPending > 0" type="warning" round size="small">{{ todayPending }} 项待办</el-tag>
        <span v-else class="all-done">全部完成</span>
      </div>
      <div v-if="reminders.length === 0" class="empty-state">
        <el-icon :size="32" color="#d4cbc4"><Document /></el-icon>
        <p>暂无提醒，一切顺利</p>
      </div>
      <div v-for="r in reminders.slice(0, 3)" :key="r.id" class="reminder-item">
        <span class="reminder-dot" :class="r.reminder_type"></span>
        <div class="reminder-info">
          <span class="reminder-title">{{ r.title }}</span>
          <span class="reminder-time">{{ r.reminder_date }} {{ r.reminder_time || '' }}</span>
        </div>
        <el-tag
          :type="r.reminder_type === 'medication' ? 'danger' : 'info'"
          size="small"
          round
        >
          {{ r.reminder_type === 'medication' ? '用药' : '康复' }}
        </el-tag>
      </div>
    </section>

    <section class="trend-section glass-card stagger-item stagger-4">
      <h3>健康趋势（近7天）</h3>
      <v-chart class="trend-chart" :option="trendOption" autoresize />
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
  gap: 8px;
  padding: 18px 8px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-card:active {
  transform: scale(0.97);
}

.action-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
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
  margin-bottom: 14px;
}

.section-head h3 {
  font-size: 18px;
}

.all-done {
  font-size: 12px;
  color: var(--color-success);
  font-weight: 500;
}

.glass-card {
  padding: 18px;
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 24px 0;
  font-size: 14px;
}

.empty-state p {
  margin-top: 8px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
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
  flex-shrink: 0;
}

.reminder-dot.medication {
  background: var(--color-danger);
}

.reminder-info {
  flex: 1;
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

.trend-chart {
  height: 240px;
}
</style>
