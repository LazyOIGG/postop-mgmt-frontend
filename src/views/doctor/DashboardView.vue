<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { statsService } from '@/services/doctor'
import type { DashboardData } from '@/types'

const dashboard = ref<DashboardData | null>(null)

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
        <span class="stat-value">{{ dashboard?.basic_stats?.total_users || 0 }}</span>
        <span class="stat-label">总用户数</span>
      </div>
      <div class="stat-card glass-card">
        <span class="stat-value">{{ dashboard?.basic_stats?.total_sessions || 0 }}</span>
        <span class="stat-label">总会话</span>
      </div>
      <div class="stat-card glass-card">
        <span class="stat-value">{{ dashboard?.basic_stats?.active_today || 0 }}</span>
        <span class="stat-label">今日活跃</span>
      </div>
      <div class="stat-card glass-card alert">
        <span class="stat-value">{{ dashboard?.recent_high_risk?.length || 0 }}</span>
        <span class="stat-label">高风险患者</span>
      </div>
    </div>

    <section class="section glass-card stagger-item stagger-2">
      <h3>最近高风险患者</h3>
      <div v-if="!dashboard?.recent_high_risk?.length" class="empty">无高风险记录</div>
      <div v-for="p in dashboard?.recent_high_risk?.slice(0, 5)" :key="(p as any).id" class="risk-item">
        <span class="risk-name">{{ (p as any).patient_username || (p as any).username }}</span>
        <span class="risk-level high">高风险</span>
      </div>
    </section>

    <section class="section glass-card stagger-item stagger-3">
      <h3>最近异常打卡</h3>
      <div v-if="!dashboard?.recent_abnormal_checkins?.length" class="empty">无异常打卡</div>
      <div v-for="c in dashboard?.recent_abnormal_checkins?.slice(0, 5)" :key="(c as any).id" class="abnormal-item">
        <div class="abnormal-info">
          <span class="abnormal-user">{{ (c as any).username }}</span>
          <span class="abnormal-date">{{ (c as any).checkin_date }}</span>
        </div>
        <span class="abnormal-flag">异常</span>
      </div>
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
  padding: 24px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-family: var(--font-display);
  color: var(--color-primary-dark);
}

.stat-card.alert .stat-value {
  color: var(--color-danger);
}

.stat-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
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
  padding: 20px;
  font-size: 13px;
}

.risk-item, .abnormal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.risk-item:last-child, .abnormal-item:last-child {
  border-bottom: none;
}

.risk-name {
  font-size: 14px;
  font-weight: 500;
}

.risk-level.high {
  padding: 4px 10px;
  background: #ffebee;
  color: var(--color-danger);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.abnormal-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.abnormal-user {
  font-size: 14px;
  font-weight: 500;
}

.abnormal-date {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.abnormal-flag {
  padding: 4px 10px;
  background: #fff3e0;
  color: var(--color-warning);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
