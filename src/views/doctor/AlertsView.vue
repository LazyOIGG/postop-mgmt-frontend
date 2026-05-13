<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDoctorStore } from '@/stores/doctor'
import { Bell } from '@element-plus/icons-vue'

const doctorStore = useDoctorStore()
const activeTab = ref('pending')

onMounted(async () => {
  doctorStore.alertFilter = 'pending'
  await doctorStore.fetchAlerts()
})

async function switchTab(tab: string) {
  activeTab.value = tab
  doctorStore.alertFilter = tab as 'pending' | 'processed'
  await doctorStore.fetchAlerts()
}

async function handleProcess(alertId: number) {
  await doctorStore.processAlert(alertId)
}
</script>

<template>
  <div class="alerts">
    <el-tabs v-model="activeTab" class="alert-tabs stagger-item stagger-1" @tab-change="switchTab">
      <el-tab-pane label="待处理" name="pending">
        <template #label>
          <span class="tab-label-inner">
            待处理
            <el-badge
              v-if="doctorStore.pendingAlerts.length"
              :value="doctorStore.pendingAlerts.length"
              class="tab-badge"
            />
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane label="已处理" name="processed" />
    </el-tabs>

    <div class="alert-list stagger-item stagger-2">
      <div v-if="doctorStore.alerts.length === 0" class="empty">
        <el-empty description="暂无预警" :image-size="80" />
      </div>
      <el-card
        v-for="alert in doctorStore.alerts"
        :key="alert.id"
        class="alert-card"
        shadow="hover"
      >
        <div class="alert-header">
          <div class="alert-type-row">
            <el-icon :size="16" color="#c0392b"><Bell /></el-icon>
            <span class="alert-type">{{ alert.type || '预警' }}</span>
          </div>
          <el-tag
            :type="alert.status === 'pending' ? 'warning' : 'success'"
            size="small"
            round
          >
            {{ alert.status === 'pending' ? '待处理' : '已处理' }}
          </el-tag>
        </div>
        <p class="alert-message">{{ alert.message }}</p>
        <div class="alert-footer">
          <span class="alert-patient">患者：{{ alert.patient_username }}</span>
          <span class="alert-time">{{ alert.created_at?.slice(0, 16) }}</span>
        </div>
        <el-button
          v-if="alert.status === 'pending'"
          type="primary"
          plain
          size="small"
          class="process-btn"
          @click="handleProcess(alert.id)"
        >
          标记已处理
        </el-button>
      </el-card>
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
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 4px 16px;
  box-shadow: var(--shadow-sm);
}

.tab-label-inner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty {
  padding: 20px 0;
}

.alert-card {
  border-radius: var(--radius-md);
}

.alert-card .el-card__body {
  padding: 18px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.alert-type-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-type {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-danger);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.alert-message {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
  color: var(--color-text);
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.process-btn {
  margin-top: 4px;
}
</style>
