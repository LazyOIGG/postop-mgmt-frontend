<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { statsService } from '@/services/doctor'
import type { SystemStats } from '@/types'

const stats = ref<SystemStats | null>(null)

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
        <span class="big-number">{{ stats?.total_users || 0 }}</span>
        <span class="big-label">总用户数</span>
      </div>
      <div class="big-stat glass-card">
        <span class="big-number">{{ stats?.total_sessions || 0 }}</span>
        <span class="big-label">总会话数</span>
      </div>
      <div class="big-stat glass-card">
        <span class="big-number">{{ stats?.total_messages || 0 }}</span>
        <span class="big-label">总消息数</span>
      </div>
      <div class="big-stat glass-card accent">
        <span class="big-number">{{ stats?.active_today || 0 }}</span>
        <span class="big-label">今日活跃用户</span>
      </div>
    </div>

    <section class="ratio-section glass-card stagger-item stagger-2">
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
    </section>
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
  padding: 32px 24px;
  text-align: center;
}

.big-number {
  display: block;
  font-size: 40px;
  font-family: var(--font-display);
  color: var(--color-primary-dark);
  line-height: 1.2;
}

.big-stat.accent .big-number {
  color: var(--color-accent);
}

.big-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 6px;
}

.ratio-section {
  padding: 24px;
}

.ratio-section h3 {
  font-size: 16px;
  margin-bottom: 20px;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  text-align: center;
}

.ratio-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.ratio-value {
  font-size: 24px;
  font-family: var(--font-display);
  color: var(--color-primary-dark);
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
