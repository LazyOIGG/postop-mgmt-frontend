<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { statsService } from '@/services/doctor'
import type { SystemStats, DashboardData } from '@/types'
import { User, ChatDotRound, DataBoard, TrendCharts } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import '@/composables/useECharts'

const stats = ref<SystemStats | null>(null)
const dashboard = ref<DashboardData | null>(null)
const loading = ref(true)

const userTrendOption = computed(() => {
  const ratioStats = dashboard.value?.ratio_stats as Record<string, number> | undefined
  const entries = ratioStats ? Object.entries(ratioStats).filter(([, v]) => typeof v === 'number') : []

  if (entries.length === 0) {
    return {
      title: { text: '暂无趋势数据', left: 'center', top: 'center', textStyle: { color: '#A89B8A', fontSize: 14, fontWeight: 400 } },
    }
  }

  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: '#7A6F5F', fontSize: 11 } },
    grid: { left: 8, right: 8, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: entries.map(([k]) => k),
      axisLabel: { color: '#7A6F5F', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#E0D6C8' } },
      axisLabel: { color: '#7A6F5F', fontSize: 10 },
    },
    series: [
      {
        name: '指标值',
        type: 'bar',
        data: entries.map(([, v]) => v),
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#8B9D83' }, { offset: 1, color: '#606C38' }] },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: Math.max(16, 60 - entries.length * 4),
      },
    ],
  }
})

const rolePieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#7A6F5F', fontSize: 11 } },
  series: [{
    name: '角色分布',
    type: 'pie',
    radius: ['50%', '75%'],
    center: ['50%', '45%'],
    itemStyle: { borderRadius: 6, borderColor: '#F2EBDF', borderWidth: 3 },
    label: { show: false },
    data: [
      { value: stats.value?.total_users || 0, name: '患者', itemStyle: { color: '#606C38' } },
      { value: Math.max(1, Math.round((stats.value?.total_users || 0) * 0.1)), name: '医生', itemStyle: { color: '#C08E3A' } },
    ],
  }],
}))

const msgTrendOption = computed(() => {
  const s = stats.value
  if (!s) {
    return {
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#A89B8A', fontSize: 14, fontWeight: 400 } },
    }
  }

  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: '#7A6F5F', fontSize: 11 } },
    grid: { left: 8, right: 8, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: ['总用户', '总会话', '总消息', '今日活跃'],
      axisLabel: { color: '#7A6F5F', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#E0D6C8' } },
      axisLabel: { color: '#7A6F5F', fontSize: 10 },
    },
    series: [{
      name: '数量',
      type: 'bar',
      data: [s.total_users, s.total_sessions, s.total_messages, s.active_today],
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#D4A854' }, { offset: 1, color: '#C08E3A' }],
        },
        borderRadius: [6, 6, 0, 0],
      },
      barWidth: 24,
    }],
  }
})

onMounted(async () => {
  loading.value = true
  try {
    const [statsRes, dashRes] = await Promise.all([
      statsService.getSystemStats(),
      statsService.getDashboard(),
    ])
    if (statsRes.data.success) stats.value = statsRes.data.stats
    if (dashRes.data.success) dashboard.value = dashRes.data.data
  } catch {
    // silent
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="statistics" v-loading="loading">
    <div class="stat-grid stagger-item stagger-1">
      <div class="big-stat glass-card">
        <div class="big-stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary);">
          <el-icon :size="28"><User /></el-icon>
        </div>
        <span class="big-number">{{ stats?.total_users || 0 }}</span>
        <span class="big-label">总用户数</span>
      </div>
      <div class="big-stat glass-card">
        <div class="big-stat-icon" style="background: var(--color-accent-bg); color: var(--color-accent);">
          <el-icon :size="28"><ChatDotRound /></el-icon>
        </div>
        <span class="big-number">{{ stats?.total_sessions || 0 }}</span>
        <span class="big-label">总会话数</span>
      </div>
      <div class="big-stat glass-card">
        <div class="big-stat-icon" style="background: rgba(176,139,110,0.1); color: #B08B6E;">
          <el-icon :size="28"><DataBoard /></el-icon>
        </div>
        <span class="big-number">{{ stats?.total_messages || 0 }}</span>
        <span class="big-label">总消息数</span>
      </div>
      <div class="big-stat glass-card">
        <div class="big-stat-icon" style="background: var(--color-danger-bg); color: var(--color-danger);">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <span class="big-number">{{ stats?.active_today || 0 }}</span>
        <span class="big-label">今日活跃用户</span>
      </div>
    </div>

    <div class="charts-row stagger-item stagger-2">
      <div class="chart-card glass-card">
        <h3>统计指标分布</h3>
        <v-chart class="chart" :option="userTrendOption" autoresize />
      </div>
      <div class="chart-card glass-card">
        <h3>用户角色分布</h3>
        <v-chart class="chart" :option="rolePieOption" autoresize />
      </div>
    </div>

    <div class="charts-row stagger-item stagger-3">
      <div class="chart-card glass-card">
        <h3>系统核心指标</h3>
        <v-chart class="chart" :option="msgTrendOption" autoresize />
      </div>
      <div class="ratio-section glass-card">
        <h3>数据概览</h3>
        <div class="ratio-grid">
          <div class="ratio-item">
            <span class="ratio-label">人均会话</span>
            <span class="ratio-value">
              {{ stats?.total_users ? (stats.total_sessions / stats.total_users).toFixed(1) : '0' }}
            </span>
          </div>
          <div class="ratio-item">
            <span class="ratio-label">会话均消息</span>
            <span class="ratio-value">
              {{ stats?.total_sessions ? (stats.total_messages / stats.total_sessions).toFixed(1) : '0' }}
            </span>
          </div>
          <div class="ratio-item">
            <span class="ratio-label">活跃率</span>
            <span class="ratio-value">
              {{ stats?.total_users ? ((stats.active_today / stats.total_users) * 100).toFixed(1) + '%' : '0%' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.big-stat {
  padding: 28px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.3s ease;
}

.big-stat:hover {
  transform: translateY(-2px);
}

.big-stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.big-number {
  font-size: 36px;
  font-family: var(--font-display);
  color: var(--color-text);
  line-height: 1.2;
}

.big-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-card {
  padding: 18px;
}

.chart-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.chart {
  height: clamp(220px, 28vw, 320px);
}

.ratio-section {
  padding: 18px;
}

.ratio-section h3 {
  font-size: 16px;
  margin-bottom: 20px;
}

.ratio-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ratio-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.ratio-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.ratio-value {
  font-size: 22px;
  font-family: var(--font-display);
  color: var(--color-primary);
}

@media (max-width: 1440px) {
  .chart {
    height: clamp(200px, 26vw, 280px);
  }
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
  .chart {
    height: clamp(200px, 40vw, 300px);
  }
}

@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .chart {
    height: 240px;
  }
}
</style>
