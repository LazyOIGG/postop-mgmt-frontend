<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { healthService } from '@/services/health'
import type { PatientProfile, HealthAssessmentResponse } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const profile = ref<PatientProfile>({})
const assessments = ref<HealthAssessmentResponse[]>([])
const editMode = ref(false)
const editForm = ref<PatientProfile>({})

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
  try {
    const res = await healthService.saveProfile(editForm.value)
    if (res.data.success && res.data.profile) {
      profile.value = res.data.profile
    }
    editMode.value = false
  } catch {
    // silent
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="profile">
    <div class="profile-header glass-card stagger-item stagger-1">
      <div class="avatar">{{ (profile.real_name || auth.user?.username || '?')[0] }}</div>
      <div class="header-info">
        <h3>{{ profile.real_name || auth.user?.username || '用户' }}</h3>
        <p>{{ profile.health_stage || '术后康复中' }}</p>
      </div>
      <button class="edit-btn" @click="startEdit">编辑</button>
    </div>

    <div v-if="!editMode" class="profile-detail glass-card stagger-item stagger-2">
      <h4>基本信息</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">性别</span>
          <span class="detail-value">{{ profile.gender || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">年龄</span>
          <span class="detail-value">{{ profile.age || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">身高</span>
          <span class="detail-value">{{ profile.height ? profile.height + ' cm' : '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">体重</span>
          <span class="detail-value">{{ profile.weight ? profile.weight + ' kg' : '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">血型</span>
          <span class="detail-value">{{ profile.blood_type || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">电话</span>
          <span class="detail-value">{{ profile.phone || '未设置' }}</span>
        </div>
      </div>
    </div>

    <div v-else class="profile-detail glass-card stagger-item stagger-2">
      <h4>编辑档案</h4>
      <div class="edit-grid">
        <div class="form-group">
          <label>真实姓名</label>
          <input v-model="editForm.real_name" class="field-input" />
        </div>
        <div class="form-group">
          <label>性别</label>
          <input v-model="editForm.gender" class="field-input" placeholder="男/女" />
        </div>
        <div class="form-group">
          <label>年龄</label>
          <input v-model.number="editForm.age" type="number" class="field-input" />
        </div>
        <div class="form-group">
          <label>身高 (cm)</label>
          <input v-model.number="editForm.height" type="number" class="field-input" />
        </div>
        <div class="form-group">
          <label>体重 (kg)</label>
          <input v-model.number="editForm.weight" type="number" class="field-input" />
        </div>
        <div class="form-group">
          <label>血型</label>
          <input v-model="editForm.blood_type" class="field-input" />
        </div>
        <div class="form-group">
          <label>电话</label>
          <input v-model="editForm.phone" class="field-input" />
        </div>
      </div>
      <div class="edit-actions">
        <button class="save-btn" @click="saveProfile">保存</button>
        <button class="cancel-btn" @click="editMode = false">取消</button>
      </div>
    </div>

    <div class="section glass-card stagger-item stagger-3">
      <h4>评估历史</h4>
      <div v-if="assessments.length === 0" class="empty">暂无评估记录</div>
      <div v-for="a in assessments.slice(0, 5)" :key="a.session_id" class="assessment-item">
        <div class="assessment-head">
          <span class="risk-badge" :class="a.risk_level">{{ a.risk_level || '低风险' }}</span>
          <span class="assessment-source">{{ a.source_type }}</span>
        </div>
        <p class="assessment-advice">{{ a.advice || a.input_text }}</p>
      </div>
    </div>

    <button class="logout-btn stagger-item stagger-4" @click="logout">退出登录</button>
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
  gap: 14px;
  padding: 20px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-family: var(--font-display);
  flex-shrink: 0;
}

.header-info {
  flex: 1;
}

.header-info h3 {
  font-size: 18px;
  margin-bottom: 2px;
}

.header-info p {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.edit-btn {
  padding: 6px 16px;
  border: 1px solid var(--color-primary);
  border-radius: 20px;
  background: transparent;
  color: var(--color-primary-dark);
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
}

.profile-detail {
  padding: 18px;
}

.profile-detail h4 {
  font-size: 16px;
  margin-bottom: 14px;
}

.detail-grid, .edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.field-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: var(--font-body);
  background: var(--color-bg);
  outline: none;
}

.field-input:focus {
  border-color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.save-btn {
  flex: 1;
  padding: 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 14px;
  font-family: var(--font-body);
  cursor: pointer;
}

.section {
  padding: 18px;
}

.section h4 {
  font-size: 16px;
  margin-bottom: 12px;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 16px 0;
  font-size: 13px;
}

.assessment-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.assessment-item:last-child {
  border-bottom: none;
}

.assessment-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.risk-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #e8f5e9;
  color: var(--color-primary-dark);
}

.risk-badge.高风险, .risk-badge.high {
  background: #ffebee;
  color: var(--color-danger);
}

.risk-badge.中风险, .risk-badge.medium {
  background: #fff3e0;
  color: var(--color-warning);
}

.assessment-source {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.assessment-advice {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.logout-btn {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-family: var(--font-body);
  cursor: pointer;
}
</style>
