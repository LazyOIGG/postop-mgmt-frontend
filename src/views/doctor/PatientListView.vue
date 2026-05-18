<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor'
import type { Patient } from '@/types'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const patients = ref<Patient[]>([])
const searchQuery = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

import { onMounted } from 'vue'
onMounted(() => fetchPatients())

async function fetchPatients() {
  loading.value = true
  try {
    const res = await doctorService.getPatients()
    if (res.data.success) patients.value = res.data.patients
  } catch {
    ElMessage.error('加载患者列表失败，请稍后重试')
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

const pagedPatients = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPatients.value.slice(start, start + pageSize.value)
})

function viewDetail(username: string) {
  router.push({ name: 'DoctorPatientDetail', params: { username } })
}
</script>

<template>
  <div class="patients">
    <div class="toolbar glass-card stagger-item stagger-1">
      <el-input
        v-model="searchQuery"
        placeholder="搜索患者姓名或用户名..."
        :prefix-icon="Search"
        size="large"
        clearable
        style="width: 280px"
      />
      <span class="count">共 {{ patients.length }} 位患者</span>
    </div>

    <div class="patient-table-card glass-card stagger-item stagger-2">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="filteredPatients.length === 0" class="empty">
        <el-empty description="暂无患者数据" />
      </div>
      <div v-else class="table-wrap">
        <el-table
          :data="pagedPatients"
          stripe
          style="width: 100%"
          :header-cell-style="{ background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }"
        >
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="real_name" label="姓名" min-width="100">
            <template #default="{ row }">
              {{ row.real_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="110">
            <template #default="{ row }">
              <el-tag
                :type="row.risk_level === '高风险' || row.risk_level === 'high' ? 'danger' : 'success'"
                size="small"
                round
              >
                {{ row.risk_level || '低风险' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_checkin" label="最近打卡" width="120">
            <template #default="{ row }">
              {{ row.last_checkin || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="viewDetail(row.username)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-if="filteredPatients.length > pageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredPatients.length"
          layout="prev, pager, next"
          small
        />
      </div>
    </div>
  </div>
</template>

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

.count {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.patient-table-card {
  padding: 0;
  overflow: hidden;
}

.table-wrap {
  width: 100%;
}

.loading {
  padding: 24px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0 4px;
}

.empty {
  padding: 20px 0;
}
</style>
