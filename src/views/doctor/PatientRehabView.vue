<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { rehabPlanService } from '@/services/rehabPlan'
import { ElMessage } from 'element-plus'

const route = useRoute()
const username = route.params.username as string
const loading = ref(true)
const plan = ref<any>(null)
const journals = ref<any[]>([])
const achievements = ref<any[]>([])

onMounted(async () => {
  try {
    const plansRes = await rehabPlanService.getList('active')
    // For doctor view: fetch patient's active plan
    // Since the API is patient-scoped, this is a placeholder
    // Full doctor API endpoints will be added later
    ElMessage.info('医生端康复面板 - 可通过扩展API获取患者数据')
  } catch { /* */ }
  finally { loading.value = false }
})
</script>

<template>
  <div class="doctor-rehab-view" v-loading="loading">
    <header class="rehab-header">
      <h2>📋 患者康复计划</h2>
      <p>患者: {{ username }}</p>
    </header>

    <el-empty v-if="!plan" description="暂无康复计划数据">
      <template #extra>
        <p style="color: var(--color-text-secondary); font-size: 13px;">
          医生端康复API待扩展（查看计划、调整任务、发送反馈）
        </p>
      </template>
    </el-empty>

    <template v-else>
      <!-- Plan overview, metrics, journals placeholder -->
      <p>康复概览内容...</p>
    </template>
  </div>
</template>

<style scoped>
.doctor-rehab-view { padding-bottom: 20px; }
.rehab-header { margin-bottom: 20px; }
.rehab-header h2 { font-size: 20px; margin-bottom: 4px; }
.rehab-header p { color: var(--color-text-secondary); font-size: 14px; }
</style>
