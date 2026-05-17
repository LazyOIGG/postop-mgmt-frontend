<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDoctorStore } from '@/stores/doctor'
import { Bell } from '@element-plus/icons-vue'

const doctorStore = useDoctorStore()
const activeTab = ref('pending')
const currentPage = ref(1)
const pageSize = ref(10)

const loading = ref(false)

const pagedAlerts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return doctorStore.alerts.slice(start, start + pageSize.value)
})

onMounted(async () => {
  doctorStore.alertFilter = 'pending'
  loading.value = true
  await doctorStore.fetchAlerts()
  loading.value = false
})

async function switchTab(tab: string) {
  activeTab.value = tab
  doctorStore.alertFilter = tab as 'pending' | 'processed'
  loading.value = true
  await doctorStore.fetchAlerts()
  loading.value = false
}

async function handleProcess(alertId: number) {
  await doctorStore.processAlert(alertId)
}
</script>

<template>
  <div class="alerts" v-loading="loading">
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
        v-for="alert in pagedAlerts"
        :key="alert.id"
        class="alert-card"
        shadow="never"
      >
        <div class="alert-header">
          <div class="alert-type-row">
            <el-icon :size="16" color="#C66B3D"><Bell /></el-icon>
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
    <div v-if="doctorStore.alerts.length > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="doctorStore.alerts.length"
        layout="prev, pager, next"
        small
      />
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
  border-radius: var(--radius-lg);
  padding: 4px 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
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
  border-radius: var(--radius-lg);
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

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.process-btn {
  margin-top: 4px;
  border-radius: var(--radius-sm) !important;
}
</style>
