<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor'
import type { Patient } from '@/types'

const router = useRouter()
const patients = ref<Patient[]>([])
const searchQuery = ref('')
const loading = ref(false)

onMounted(() => fetchPatients())

async function fetchPatients() {
  loading.value = true
  try {
    const res = await doctorService.getPatients()
    if (res.data.success) patients.value = res.data.patients
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value
  const q = searchQuery.value.toLowerCase()
  return patients.value.filter(
    (p) =>
      p.username?.toLowerCase().includes(q) ||
      p.real_name?.toLowerCase().includes(q),
  )
})

function viewDetail(username: string) {
  router.push({ name: 'DoctorMessages', query: { patient: username } })
}
</script>

<template>
  <div class="patients">
    <div class="toolbar glass-card stagger-item stagger-1">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索患者姓名或用户名..."
        />
      </div>
      <span class="count">共 {{ patients.length }} 位患者</span>
    </div>

    <div class="patient-table-card glass-card stagger-item stagger-2">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredPatients.length === 0" class="empty">暂无患者数据</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>风险等级</th>
              <th>最近打卡</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredPatients" :key="p.username">
              <td>{{ p.username }}</td>
              <td>{{ p.real_name || '-' }}</td>
              <td>
                <span class="risk-tag" :class="p.risk_level || 'low'">
                  {{ p.risk_level || '低风险' }}
                </span>
              </td>
              <td>{{ p.last_checkin || '-' }}</td>
              <td>
                <button class="action-btn" @click="viewDetail(p.username)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
export default {
  name: 'PatientListView',
}
</script>

<style scoped>
.patients {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 13px;
  font-family: var(--font-body);
  background: var(--color-bg);
  outline: none;
  width: 240px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-primary);
}

.count {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.patient-table-card {
  padding: 0;
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 18px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(250, 247, 244, 0.5);
}

.data-table td {
  padding: 14px 18px;
  font-size: 14px;
  border-bottom: 1px solid var(--color-border);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: rgba(122, 154, 126, 0.03);
}

.risk-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.risk-tag.low, .risk-tag.低风险 {
  background: #e8f5e9;
  color: var(--color-primary-dark);
}

.risk-tag.high, .risk-tag.高风险, .risk-tag.medium, .risk-tag.中风险 {
  background: #ffebee;
  color: var(--color-danger);
}

.action-btn {
  padding: 4px 14px;
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  background: transparent;
  color: var(--color-primary-dark);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
