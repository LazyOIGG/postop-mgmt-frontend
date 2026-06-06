<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRehabStore } from '@/stores/rehab'
import { rehabPlanService } from '@/services/rehabPlan'
import { ElMessage } from 'element-plus'
import { FirstAidKit } from '@element-plus/icons-vue'
import AchievementPopup from '@/components/rehab/AchievementPopup.vue'

const store = useRehabStore()
const showGenerate = ref(false)
const generating = ref(false)
const surgeryType = ref('')
const planTitle = ref('')
const popupAchievements = ref<any[]>([])

watch(() => store.newAchievements, (val) => {
  if (val && val.length > 0) {
    popupAchievements.value = [...val]
  }
}, { deep: true })

function onAchievementDismissed() {
  popupAchievements.value = []
  store.clearNewAchievements()
}

const surgeryOptions = [
  '阑尾切除术', '膝关节置换术', '髋关节置换术', '心脏搭桥术',
  '胆囊切除术', '甲状腺切除术', '骨折内固定术', '腰椎间盘手术',
  '白内障手术', '痔疮手术',
]

async function loadPlan() {
  if (!store.activePlan?.id) {
    try {
      const res = await rehabPlanService.getList('active')
      if (res.data.success && res.data.plans?.length > 0) {
        store.activePlan = res.data.plans[0]
      }
    } catch { /* */ }
  }
  if (store.activePlan?.id) {
    await store.fetchDashboard(store.activePlan.id)
  }
}

async function handleGenerate() {
  if (!surgeryType.value.trim() && !planTitle.value.trim()) {
    ElMessage.warning('请至少填写手术类型或计划标题')
    return
  }
  generating.value = true
  try {
    const res = await rehabPlanService.generate({
      surgery_type: surgeryType.value.trim() || undefined,
      plan_title: planTitle.value.trim() || undefined,
    })
    if (res.data.success) {
      showGenerate.value = false
      surgeryType.value = ''
      planTitle.value = ''
      ElMessage.success('康复计划已生成！')
      await loadPlan()
    } else {
      ElMessage.error(res.data.error || '生成失败')
    }
  } catch {
    ElMessage.error('生成康复计划失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

onMounted(() => loadPlan())
</script>

<template>
  <div class="dashboard">
    <!-- Empty state: show generate form or CTA -->
    <template v-if="!store.activePlan && !showGenerate">
      <section class="empty-plan">
        <div class="empty-icon">
          <el-icon :size="48" color="#606C38"><FirstAidKit /></el-icon>
        </div>
        <h2>个性化康复计划</h2>
        <p>AI 将根据您的健康档案，为您生成分阶段的个性化康复计划</p>
        <el-button type="primary" size="large" round @click="showGenerate = true">
          开始生成康复计划
        </el-button>
      </section>
    </template>

    <!-- Generate form -->
    <template v-if="!store.activePlan && showGenerate">
      <section class="generate-section glass-card">
        <h2>生成康复计划</h2>
        <p class="section-desc">填写以下信息，AI 将为您制定个性化方案</p>
        <div class="form-group">
          <label>手术类型</label>
          <el-select v-model="surgeryType" placeholder="请选择手术类型（可选）" size="large" filterable allow-create clearable style="width:100%">
            <el-option v-for="s in surgeryOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="form-group">
          <label>计划标题（可选）</label>
          <el-input v-model="planTitle" placeholder="如：我的膝关节康复方案" size="large" />
        </div>
        <div class="form-actions">
          <el-button size="large" @click="showGenerate = false">取消</el-button>
          <el-button type="primary" size="large" :loading="generating" @click="handleGenerate">
            {{ generating ? 'AI 正在生成中...' : '生成康复计划' }}
          </el-button>
        </div>
      </section>
    </template>

    <!-- Dashboard content -->
    <template v-else>
      <!-- Stats bar -->
      <section class="stats-bar">
        <div class="stat-card">
          <span class="stat-value">{{ store.activePlan.current_streak || 0 }}</span>
          <span class="stat-label">连续打卡(天)</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ store.completionRate }}%</span>
          <span class="stat-label">总完成率</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ store.activePlan.current_phase }}</span>
          <span class="stat-label">当前阶段</span>
        </div>
      </section>

      <!-- Phase progress -->
      <section class="glass-card phase-section">
        <h3>康复阶段进度</h3>
        <div class="phase-bars">
          <div v-for="(progress, phase) in store.phaseProgress" :key="phase" class="phase-bar-row">
            <span class="phase-tag">{{ phase }}</span>
            <el-progress
              :percentage="progress"
              :stroke-width="8"
              :color="phase === '急性期' ? '#C66B3D' : phase === '恢复期' ? '#C08E3A' : '#606C38'"
            />
            <span class="phase-pct">{{ progress }}%</span>
          </div>
        </div>
      </section>

      <!-- Today tasks -->
      <section class="glass-card">
        <h3>今日任务 ({{ store.todayTasks.length }}项)</h3>
        <div v-if="store.todayTasks.length === 0" class="empty-hint">
          <p>今天暂无康复任务 🎉</p>
        </div>
        <div v-for="task in store.todayTasks" :key="task.id" class="task-row" :class="{ done: task.status === 'completed' }">
          <span class="task-type-dot" :class="task.task_type"></span>
          <span class="task-text">{{ task.task_content }}</span>
          <span class="task-phase">{{ task.phase }} · D{{ task.task_day }}</span>
        </div>
      </section>

      <!-- Quick links -->
      <section class="quick-links">
        <el-button type="primary" plain round @click="$router.push('/patient/rehab/calendar')">查看日历</el-button>
        <el-button type="success" plain round @click="$router.push('/patient/rehab/metrics')">记录指标</el-button>
        <el-button type="warning" plain round @click="$router.push('/patient/rehab/exercises')">运动指导</el-button>
        <el-button plain round @click="$router.push('/patient/rehab/journal')">写日志</el-button>
      </section>
    </template>

    <!-- Achievement popup -->
    <AchievementPopup
      v-if="popupAchievements.length > 0"
      :achievements="popupAchievements"
      @dismissed="onAchievementDismissed"
    />
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }

.empty-plan { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 20px; }
.empty-icon { width: 88px; height: 88px; border-radius: 50%; background: var(--color-primary-bg); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.empty-plan h2 { font-size: 22px; margin-bottom: 8px; }
.empty-plan p { color: var(--color-text-secondary); font-size: 14px; max-width: 280px; margin-bottom: 24px; line-height: 1.6; }

.generate-section h2 { font-size: 20px; margin-bottom: 4px; }
.section-desc { color: var(--color-text-secondary); font-size: 14px; margin-bottom: 20px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; }

.stats-bar { display: flex; gap: 12px; }
.stat-card { flex: 1; background: var(--color-surface); border-radius: var(--radius-lg); padding: 16px; text-align: center; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--color-border-light); }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-primary-dark); }
.stat-label { font-size: 12px; color: var(--color-text-tertiary); }

.phase-section h3 { font-size: 16px; margin-bottom: 14px; }
.phase-bars { display: flex; flex-direction: column; gap: 12px; }
.phase-bar-row { display: flex; align-items: center; gap: 10px; }
.phase-tag { font-size: 12px; font-weight: 600; min-width: 48px; }
.phase-pct { font-size: 12px; color: var(--color-text-secondary); min-width: 36px; }

.empty-hint { text-align: center; padding: 20px; color: var(--color-text-secondary); }

.task-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--color-border-light); }
.task-row:last-child { border-bottom: none; }
.task-row.done { opacity: 0.5; }
.task-row.done .task-text { text-decoration: line-through; }
.task-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.task-type-dot.medication { background: #C66B3D; }
.task-type-dot.exercise { background: #606C38; }
.task-type-dot.diet { background: #C08E3A; }
.task-type-dot.review { background: #8B9D83; }
.task-type-dot.other { background: #7A6F5F; }
.task-text { flex: 1; font-size: 14px; min-width: 0; }
.task-phase { font-size: 11px; color: var(--color-text-tertiary); flex-shrink: 0; }

.quick-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }

.glass-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 18px;
  border: 1px solid var(--color-border-light);
}
</style>
