<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isHighRisk } from '@/utils/riskLevel'
import AvatarPatient from '@/components/AvatarPatient.vue'
import { useRoute, useRouter } from 'vue-router'
import { doctorService } from '@/services/doctor'
import { User, ChatDotRound, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const username = route.params.username as string

const detail = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const res = await doctorService.getPatientDetail(username)
    if (res.data.success) detail.value = res.data.data
  } catch {
    ElMessage.error('加载患者详情失败')
  } finally {
    loading.value = false
  }
})

function goToMessages() {
  router.push({ name: 'DoctorMessages', query: { patient: username } })
}
</script>

<template>
  <div class="patient-detail" v-loading="loading">
    <div class="detail-header stagger-item stagger-1">
      <el-button text @click="router.push({ name: 'DoctorPatients' })">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
    </div>

    <template v-if="detail">
      <div class="profile-card glass-card stagger-item stagger-1">
        <AvatarPatient :size="56" />
        <div class="profile-info">
          <h3>{{ detail.profile?.real_name || username }}</h3>
          <div class="profile-meta">
            <span v-if="detail.profile?.gender">{{ detail.profile.gender }}</span>
            <span v-if="detail.profile?.age">{{ detail.profile.age }} 岁</span>
            <span v-if="detail.profile?.blood_type">{{ detail.profile.blood_type }}</span>
          </div>
          <el-tag
            :type="isHighRisk(detail.latest_assessment?.risk_level) ? 'danger' : 'success'"
            size="small"
            round
          >
            {{ isHighRisk(detail.latest_assessment?.risk_level) ? '高风险' : '低风险' }}
          </el-tag>
        </div>
        <el-button type="primary" @click="goToMessages">
          <el-icon><ChatDotRound /></el-icon>
          发送消息
        </el-button>
      </div>

      <div class="detail-grid stagger-item stagger-2">
        <div class="detail-card glass-card">
          <h4>基本信息</h4>
          <div class="info-row">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ username }}</span>
          </div>
          <div class="info-row" v-if="detail.profile?.phone">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ detail.profile.phone }}</span>
          </div>
          <div class="info-row" v-if="detail.profile?.height">
            <span class="info-label">身高</span>
            <span class="info-value">{{ detail.profile.height }} cm</span>
          </div>
          <div class="info-row" v-if="detail.profile?.weight">
            <span class="info-label">体重</span>
            <span class="info-value">{{ detail.profile.weight }} kg</span>
          </div>
          <div class="info-row" v-if="detail.profile?.medical_history">
            <span class="info-label">病史</span>
            <span class="info-value">{{ detail.profile.medical_history }}</span>
          </div>
          <div class="info-row" v-if="detail.profile?.allergy_history">
            <span class="info-label">过敏史</span>
            <span class="info-value">{{ detail.profile.allergy_history }}</span>
          </div>
          <div class="info-row" v-if="detail.profile?.current_medications">
            <span class="info-label">当前用药</span>
            <span class="info-value">{{ detail.profile.current_medications }}</span>
          </div>
        </div>

        <div class="detail-card glass-card">
          <h4>最近健康评估</h4>
          <template v-if="detail.latest_assessment">
            <div class="info-row">
              <span class="info-label">风险等级</span>
              <el-tag
                :type="isHighRisk(detail.latest_assessment.risk_level) ? 'danger' : 'success'"
                size="small"
                round
              >
                {{ isHighRisk(detail.latest_assessment.risk_level) ? '高风险' : '低风险' }}
              </el-tag>
            </div>
            <div class="info-row" v-if="detail.latest_assessment.advice">
              <span class="info-label">健康建议</span>
              <span class="info-value">{{ detail.latest_assessment.advice }}</span>
            </div>
            <div class="info-row" v-if="detail.latest_assessment.created_at">
              <span class="info-label">评估时间</span>
              <span class="info-value">{{ detail.latest_assessment.created_at?.slice(0, 16) }}</span>
            </div>
          </template>
          <div v-else class="empty">暂无评估记录</div>
        </div>
      </div>

      <div class="detail-card glass-card stagger-item stagger-3">
        <h4>近期打卡记录</h4>
        <el-table
          v-if="detail.recent_checkins?.length"
          :data="detail.recent_checkins"
          size="small"
          style="width: 100%"
        >
          <el-table-column prop="checkin_date" label="日期" width="120">
            <template #default="{ row }">
              {{ row.checkin_date?.slice(0, 10) }}
            </template>
          </el-table-column>
          <el-table-column prop="temperature" label="体温" width="80">
            <template #default="{ row }">
              {{ row.temperature ? row.temperature + ' °C' : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="heart_rate" label="心率" width="80">
            <template #default="{ row }">
              {{ row.heart_rate ? row.heart_rate + ' bpm' : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="blood_sugar" label="血糖" width="100">
            <template #default="{ row }">
              {{ row.blood_sugar ? row.blood_sugar + ' mmol/L' : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="symptoms" label="症状" min-width="120">
            <template #default="{ row }">
              {{ row.symptoms || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag
                :type="row.abnormal_flag ? 'warning' : 'success'"
                size="small"
                round
              >
                {{ row.abnormal_flag ? '异常' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="empty">暂无打卡记录</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.patient-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #F2EBDF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-info h3 {
  font-size: 18px;
}

.profile-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-card {
  padding: 18px;
}

.detail-card h4 {
  font-size: 15px;
  margin-bottom: 14px;
  color: var(--color-text-secondary);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 24px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .profile-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
