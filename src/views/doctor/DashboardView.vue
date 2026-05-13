<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { statsService } from '@/services/doctor'
import type { DashboardData } from '@/types'
import { User, ChatDotRound, DataBoard, WarningFilled } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import 'echarts'

const dashboard = ref<DashboardData | null>(null)

const riskPieOption = computed(() => {
  const highRisk = dashboard.value?.recent_high_risk?.length || 0
  const total = (dashboard.value?.basic_stats?.total_users as number) || 1
  const normal = Math.max(0, total - highRisk)
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#8a7e74', fontSize: 11 } },
    series: [
      {
        name: '患者风险',
        type: 'pie',
        radius: ['55%', '78%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: normal, name: '正常/低风险', itemStyle: { color: '#7a9a7e' } },
          { value: highRisk, name: '高风险', itemStyle: { color: '#c0392b' } },
        ],
      },
    ],
  }
})

const barOption = computed(() => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['打卡数', '活跃用户'],
      bottom: 0,
      textStyle: { color: '#8a7e74', fontSize: 11 },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 32 },
    xAxis: {
      type: 'category',
      data: days,
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
        name: '打卡数',
        type: 'bar',
        data: [12, 18, 15, 22, 19, 14, 10],
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#a8c4aa' },
              { offset: 1, color: '#7a9a7e' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: 14,
      },
      {
        name: '活跃用户',
        type: 'bar',
        data: [8, 12, 10, 16, 14, 10, 7],
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#e8b894' },
              { offset: 1, color: '#d4956a' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: 14,
      },
    ],
  }
})

onMounted(async () => {
  try {
    const res = await statsService.getDashboard()
    if (res.data.success) dashboard.value = res.data.data
  } catch {
    // silent
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="stat-cards stagger-item stagger-1">
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: var(--color-primary-bg); color: var(--color-primary-dark);">
          <el-icon :size="22"><User /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ dashboard?.basic_stats?.total_users || 0 }}</span>
          <span class="stat-label">总用户数</span>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: var(--color-accent-bg); color: var(--color-accent);">
          <el-icon :size="22"><ChatDotRound /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ dashboard?.basic_stats?.total_sessions || 0 }}</span>
          <span class="stat-label">总会话</span>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon" style="background: var(--color-success-bg); color: var(--color-success);">
          <el-icon :size="22"><DataBoard /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ dashboard?.basic_stats?.active_today || 0 }}</span>
          <span class="stat-label">今日活跃</span>
        </div>
      </div>
      <div class="stat-card glass-card alert">
        <div class="stat-icon" style="background: var(--color-danger-bg); color: var(--color-danger);">
          <el-icon :size="22"><WarningFilled /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-value">{{ dashboard?.recent_high_risk?.length || 0 }}</span>
          <span class="stat-label">高风险患者</span>
        </div>
      </div>
    </div>

    <div class="charts-row stagger-item stagger-2">
      <div class="chart-card glass-card">
        <h3>患者风险分布</h3>
        <v-chart class="chart" :option="riskPieOption" autoresize />
      </div>
      <div class="chart-card glass-card">
        <h3>本周活动趋势</h3>
        <v-chart class="chart" :option="barOption" autoresize />
      </div>
    </div>

    <section class="section glass-card stagger-item stagger-3">
      <h3>最近高风险患者</h3>
      <el-table
        v-if="dashboard?.recent_high_risk?.length"
        :data="dashboard.recent_high_risk.slice(0, 5)"
        size="small"
        style="width: 100%"
      >
        <el-table-column prop="patient_username" label="患者" />
        <el-table-column label="风险等级" width="100">
          <template #default>
            <el-tag type="danger" size="small">高风险</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="risk_reasons" label="风险原因">
          <template #default="{ row }">
            {{ (row as any).risk_reasons?.join('、') || '评估异常' }}
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty">无高风险记录</div>
    </section>

    <section class="section glass-card stagger-item stagger-4">
      <h3>最近异常打卡</h3>
      <el-table
        v-if="dashboard?.recent_abnormal_checkins?.length"
        :data="dashboard.recent_abnormal_checkins.slice(0, 5)"
        size="small"
        style="width: 100%"
      >
        <el-table-column prop="username" label="患者" />
        <el-table-column prop="checkin_date" label="打卡日期" width="120" />
        <el-table-column label="状态" width="80">
          <template #default>
            <el-tag type="warning" size="small">异常</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty">无异常打卡</div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-family: var(--font-display);
  color: var(--color-text);
  line-height: 1.2;
}

.stat-label {
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

.section {
  padding: 20px;
}

.section h3 {
  font-size: 16px;
  margin-bottom: 14px;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 24px;
  font-size: 13px;
}

@media (max-width: 1024px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
