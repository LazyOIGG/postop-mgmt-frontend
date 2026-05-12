<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDoctorStore } from '@/stores/doctor'

const doctorStore = useDoctorStore()
const activeTab = ref<'pending' | 'processed'>('pending')

onMounted(async () => {
  doctorStore.alertFilter = 'pending'
  await doctorStore.fetchAlerts()
})

async function switchTab(tab: 'pending' | 'processed') {
  activeTab.value = tab
  doctorStore.alertFilter = tab
  await doctorStore.fetchAlerts()
}

async function handleProcess(alertId: number) {
  await doctorStore.processAlert(alertId)
}
</script>

<template>
  <div class="alerts">
    <div class="alert-tabs stagger-item stagger-1">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'pending' }"
        @click="switchTab('pending')"
      >
        待处理
        <span v-if="doctorStore.pendingAlerts.length" class="count-badge">
          {{ doctorStore.pendingAlerts.length }}
        </span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'processed' }"
        @click="switchTab('processed')"
      >
        已处理
      </button>
    </div>

    <div class="alert-list stagger-item stagger-2">
      <div v-if="doctorStore.alerts.length === 0" class="empty">暂无预警</div>
      <div
        v-for="alert in doctorStore.alerts"
        :key="alert.id"
        class="alert-card glass-card"
      >
        <div class="alert-header">
          <span class="alert-type">{{ alert.type || '预警' }}</span>
          <span class="alert-status" :class="alert.status">{{ alert.status === 'pending' ? '待处理' : '已处理' }}</span>
        </div>
        <p class="alert-message">{{ alert.message }}</p>
        <div class="alert-footer">
          <span class="alert-patient">{{ alert.patient_username }}</span>
          <span class="alert-time">{{ alert.created_at?.slice(0, 16) }}</span>
        </div>
        <button
          v-if="alert.status === 'pending'"
          class="process-btn"
          @click="handleProcess(alert.id)"
        >
          标记已处理
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-tabs {
  display: flex;
  gap: 0;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 4px;
  box-shadow: var(--shadow-sm);
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 14px;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.tab-btn.active {
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 600;
}

.count-badge {
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.alert-card {
  padding: 18px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.alert-type {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-dark);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.alert-status {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.alert-status.pending {
  background: #fff3e0;
  color: var(--color-warning);
}

.alert-status.processed {
  background: #e8f5e9;
  color: var(--color-primary-dark);
}

.alert-message {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.process-btn {
  margin-top: 10px;
  padding: 6px 16px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  background: transparent;
  color: var(--color-primary-dark);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.process-btn:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>
