<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { statsService } from '@/services/doctor'
import type { SystemStats } from '@/types'
import { User, ChatDotRound, DataBoard, TrendCharts } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import 'echarts'

const stats = ref<SystemStats | null>(null)

const userTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['新增用户', '累计用户'],
    bottom: 0,
    textStyle: { color: '#8a7e74', fontSize: 11 },
  },
  grid: { left: 8, right: 8, top: 16, bottom: 32 },
  xAxis: {
    type: 'category',
    data: ['3月', '4月', '5月', '6月', '7月', '8月'],
    axisLabel: { color: '#8a7e74', fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f0ece8' } },
    axisLabel: { color: '#8a7e74', fontSize: 10 },
  },
  series: [
    {
      name: '新增用户',
      type: 'bar',
      stack: 'total',
      data: [12, 19, 15, 23, 18, 21],
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a8c4aa' }, { offset: 1, color: '#7a9a7e' }] },
        borderRadius: [0, 0, 0, 0],
      },
      barWidth: 20,
    },
    {
      name: '累计用户',
      type: 'line',
      data: [12, 31, 46, 69, 87, 108],
      smooth: true,
      lineStyle: { color: '#d4956a', width: 3 },
      itemStyle: { color: '#d4956a' },
      symbol: 'circle',
      symbolSize: 8,
    },
  ],
}))

const rolePieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#8a7e74', fontSize: 11 } },
  series: [{
    name: '角色分布',
    type: 'pie',
    radius: ['50%', '75%'],
    center: ['50%', '45%'],
    itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    data: [
      { value: stats.value?.total_users || 60, name: '患者', itemStyle: { color: '#7a9a7e' } },
      { value: Math.round((stats.value?.total_users || 60) * 0.1), name: '医生', itemStyle: { color: '#d4956a' } },
    ],
  }],
}))

const msgTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['消息数'],
    bottom: 0,
    textStyle: { color: '#8a7e74', fontSize: 11 },
  },
  grid: { left: 8, right: 8, top: 16, bottom: 32 },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLabel: { color: '#8a7e74', fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f0ece8' } },
    axisLabel: { color: '#8a7e74', fontSize: 10 },
  },
  series: [{
    name: '消息数',
    type: 'line',
    data: [42, 58, 47, 63, 55, 38, 29],
    smooth: true,
    areaStyle: {
      color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139,126,158,0.2)' }, { offset: 1, color: 'rgba(139,126,158,0)' }] },
    },
    lineStyle: { color: '#8b7e9e', width: 2 },
    itemStyle: { color: '#8b7e9e' },
    symbol: 'circle',
    symbolSize: 6,
  }],
}))

onMounted(async () => {
  try {
    const res = await statsService.getSystemStats()
    if (res.data.success) stats.value = res.data.stats
  } catch {
    // silent
  }
})
</script>

<template>
  <div class="statistics">
    <div class="stat-grid stagger-item stagger-1">
      <div class="big-stat glass-card">
        <div class="big-stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary-dark);">
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
        <div class="big-stat-icon" style="background: rgba(139,126,158,0.12); color: #8b7e9e;">
          <el-icon :size="28"><DataBoard /></el-icon>
        </div>
        <span class="big-number">{{ stats?.total_messages || 0 }}</span>
        <span class="big-label">总消息数</span>
      </div>
      <div class="big-stat glass-card accent">
        <div class="big-stat-icon" style="background: var(--color-danger-bg); color: var(--color-danger);">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <span class="big-number">{{ stats?.active_today || 0 }}</span>
        <span class="big-label">今日活跃用户</span>
      </div>
    </div>

    <div class="charts-row stagger-item stagger-2">
      <div class="chart-card glass-card">
        <h3>用户增长趋势</h3>
        <v-chart class="chart" :option="userTrendOption" autoresize />
      </div>
      <div class="chart-card glass-card">
        <h3>用户角色分布</h3>
        <v-chart class="chart" :option="rolePieOption" autoresize />
      </div>
    </div>

    <div class="charts-row stagger-item stagger-3">
      <div class="chart-card glass-card">
        <h3>本周消息量趋势</h3>
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

.big-stat.accent .big-number {
  color: var(--color-danger);
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
  height: 260px;
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
}

.ratio-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.ratio-value {
  font-size: 22px;
  font-family: var(--font-display);
  color: var(--color-primary-dark);
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
