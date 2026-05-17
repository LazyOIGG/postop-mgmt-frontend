<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { healthService } from '@/services/health'
import type { PatientProfile, HealthAssessmentResponse } from '@/types'
import { User, Edit } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()

const profile = ref<PatientProfile>({})
const assessments = ref<HealthAssessmentResponse[]>([])
const editMode = ref(false)
const editForm = ref<PatientProfile>({})
const loading = ref(true)
const assessmentPage = ref(1)
const assessmentPageSize = ref(5)

const pagedAssessments = computed(() => {
  const start = (assessmentPage.value - 1) * assessmentPageSize.value
  return assessments.value.slice(start, start + assessmentPageSize.value)
})

onMounted(async () => {
  try {
    const [pRes, aRes] = await Promise.all([
      healthService.getProfile(),
      healthService.getAssessmentHistory(),
    ])
    if (pRes.data.success && pRes.data.profile) {
      profile.value = pRes.data.profile
    }
    if (aRes.data.success) {
      assessments.value = aRes.data.records || []
    }
  } catch {
    // silent
  }
})

function startEdit() {
  editForm.value = { ...profile.value }
  editMode.value = true
}

async function saveProfile() {
  loading.value = true
  try {
    const res = await healthService.saveProfile(editForm.value)
    if (res.data.success && res.data.profile) {
      profile.value = res.data.profile
    }
    editMode.value = false
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="profile" v-loading="loading">
    <div class="profile-header glass-card stagger-item stagger-1">
      <div class="avatar-group">
        <div class="avatar">{{ (profile.real_name || auth.user?.username || '?')[0] }}</div>
        <h3>{{ profile.real_name || auth.user?.username || '用户' }}</h3>
        <p>{{ profile.health_stage || '术后康复中' }}</p>
      </div>
      <el-button
        :icon="Edit"
        round
        @click="startEdit"
      >
        编辑档案
      </el-button>
    </div>

    <div v-if="!editMode" class="profile-detail glass-card stagger-item stagger-2">
      <h4>基本信息</h4>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="性别">{{ profile.gender || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ profile.age || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="身高">{{ profile.height ? profile.height + ' cm' : '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="体重">{{ profile.weight ? profile.weight + ' kg' : '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="血型">{{ profile.blood_type || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ profile.phone || '未设置' }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-else class="profile-detail glass-card stagger-item stagger-2">
      <h4>编辑档案</h4>
      <el-form :model="editForm" label-position="top" size="large">
        <div class="edit-grid">
          <el-form-item label="真实姓名">
            <el-input v-model="editForm.real_name" />
          </el-form-item>
          <el-form-item label="性别">
            <el-select v-model="editForm.gender" style="width: 100%">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          <el-form-item label="年龄">
            <el-input-number v-model="editForm.age" :min="0" :max="150" style="width: 100%" />
          </el-form-item>
          <el-form-item label="身高 (cm)">
            <el-input-number v-model="editForm.height" :min="0" :max="250" style="width: 100%" />
          </el-form-item>
          <el-form-item label="体重 (kg)">
            <el-input-number v-model="editForm.weight" :min="0" :max="300" :precision="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="血型">
            <el-select v-model="editForm.blood_type" style="width: 100%">
              <el-option label="A" value="A" />
              <el-option label="B" value="B" />
              <el-option label="AB" value="AB" />
              <el-option label="O" value="O" />
            </el-select>
          </el-form-item>
          <el-form-item label="电话">
            <el-input v-model="editForm.phone" />
          </el-form-item>
        </div>
        <div class="edit-actions">
          <el-button type="primary" size="large" @click="saveProfile">保存</el-button>
          <el-button size="large" @click="editMode = false">取消</el-button>
        </div>
      </el-form>
    </div>

    <div class="section glass-card stagger-item stagger-3">
      <h4>评估历史</h4>
      <div v-if="assessments.length === 0" class="empty">
        <el-empty description="暂无评估记录" :image-size="60" />
      </div>
      <el-collapse v-else accordion>
        <el-collapse-item
          v-for="a in pagedAssessments"
          :key="a.session_id"
        >
          <template #title>
            <div class="collapse-title">
              <el-tag
                :type="a.risk_level === '高风险' || a.risk_level === 'high' ? 'danger' : a.risk_level === '中风险' || a.risk_level === 'medium' ? 'warning' : 'success'"
                size="small"
                round
                effect="dark"
              >
                {{ a.risk_level || '低风险' }}
              </el-tag>
              <span class="collapse-source">{{ a.source_type || '系统评估' }}</span>
            </div>
          </template>
          <p class="assessment-advice">{{ a.advice || a.input_text || '暂无详情' }}</p>
          <div v-if="a.risk_reasons?.length" class="risk-reasons">
            <el-tag
              v-for="(reason, i) in a.risk_reasons"
              :key="i"
              size="small"
              class="reason-tag"
            >
              {{ reason }}
            </el-tag>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div v-if="assessments.length > assessmentPageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="assessmentPage"
          :page-size="assessmentPageSize"
          :total="assessments.length"
          layout="prev, pager, next"
          small
        />
      </div>
    </div>

    <el-button
      type="danger"
      plain
      size="large"
      class="logout-btn stagger-item stagger-4"
      @click="logout"
    >
      退出登录
    </el-button>
  </div>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 24px;
}

.avatar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #F2EBDF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-family: var(--font-display);
  box-shadow: 0 4px 16px rgba(96,108,56,0.25);
  animation: breathe 4s ease-in-out infinite;
}

.avatar-group h3 {
  font-size: 18px;
  margin-top: 4px;
}

.avatar-group p {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.profile-detail {
  padding: 18px;
}

.profile-detail h4 {
  font-size: 16px;
  margin-bottom: 14px;
}

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.edit-actions .el-button {
  flex: 1;
}

.section {
  padding: 18px;
}

.section h4 {
  font-size: 16px;
  margin-bottom: 12px;
}

.empty {
  padding: 10px 0;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-source {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.assessment-advice {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  padding: 4px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 12px;
}

.risk-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.reason-tag {
  margin: 0;
}

.logout-btn {
  width: 100%;
  border-radius: var(--radius-md);
  height: 44px;
}
</style>
