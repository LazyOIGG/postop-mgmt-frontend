<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { rehabPlanService } from '@/services/rehabPlan'
import type { RehabPlan, RehabTask } from '@/types'
import {
  Right, Check, List, Calendar, Clock,
  FirstAidKit, Food, Promotion, EditPen
} from '@element-plus/icons-vue'

const plans = ref<RehabPlan[]>([])
const activePlan = ref<RehabPlan | null>(null)
const todayTasks = ref<RehabTask[]>([])
const allTasks = ref<RehabTask[]>([])
const loading = ref(true)
const generating = ref(false)
const showGenerate = ref(false)
const showPlanDetail = ref(false)

// Generate form
const surgeryType = ref('')
const planTitle = ref('')

// Phase config
const phases = ['急性期', '恢复期', '巩固期'] as const
const phaseColors: Record<string, string> = {
  '急性期': '#C66B3D',
  '恢复期': '#C08E3A',
  '巩固期': '#606C38',
}
const phaseIcons: Record<string, typeof Check> = {
  '急性期': FirstAidKit,
  '恢复期': Promotion,
  '巩固期': Check,
}

const taskTypeConfig: Record<string, { label: string; icon: typeof Check; color: string; bg: string }> = {
  medication: { label: '用药', icon: EditPen, color: '#C66B3D', bg: 'rgba(198,107,61,0.1)' },
  exercise: { label: '锻炼', icon: Promotion, color: '#606C38', bg: 'rgba(96,108,56,0.1)' },
  diet: { label: '饮食', icon: Food, color: '#C08E3A', bg: 'rgba(192,142,58,0.1)' },
  review: { label: '复查', icon: Calendar, color: '#8B9D83', bg: 'rgba(139,157,131,0.1)' },
  other: { label: '其他', icon: List, color: '#7A6F5F', bg: 'rgba(122,111,95,0.1)' },
}

const currentPhaseIndex = computed(() => {
  if (!activePlan.value) return 0
  return phases.indexOf(activePlan.value.current_phase)
})

const todayStats = computed(() => {
  const total = todayTasks.value.length
  const done = todayTasks.value.filter(t => t.status === 'completed').length
  return { total, done, remaining: total - done }
})

const tasksByPhase = computed(() => {
  const grouped: Record<string, RehabTask[]> = {}
  for (const p of phases) grouped[p] = []
  for (const t of allTasks.value) {
    if (grouped[t.phase]) grouped[t.phase].push(t)
  }
  return grouped
})

const phaseStats = computed(() => {
  const stats: Record<string, { total: number; completed: number }> = {}
  for (const p of phases) {
    const tasks = tasksByPhase.value[p] || []
    stats[p] = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
    }
  }
  return stats
})

function phaseProgress(phase: string) {
  const s = phaseStats.value[phase]
  if (!s || s.total === 0) return 0
  return Math.round((s.completed / s.total) * 100)
}

async function fetchData() {
  loading.value = true
  try {
    const [planRes, todayRes] = await Promise.all([
      rehabPlanService.getList('active'),
      rehabPlanService.getTodayTasks(),
    ])
    if (planRes.data.success) {
      plans.value = planRes.data.plans || []
      activePlan.value = plans.value[0] || null
    }
    if (todayRes.data.success) {
      todayTasks.value = todayRes.data.tasks || []
    }
    if (activePlan.value) {
      const detailRes = await rehabPlanService.getDetail(activePlan.value.id)
      if (detailRes.data.success) {
        allTasks.value = []
        const phasesData = detailRes.data.plan?.phases || {}
        for (const phaseTasks of Object.values(phasesData) as RehabTask[][]) {
          allTasks.value.push(...phaseTasks)
        }
      }
    }
  } catch {
    ElMessage.error('加载康复计划失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
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
      await fetchData()
    }
  } catch {
    ElMessage.error('生成康复计划失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

async function handleCompleteTask(taskId: number) {
  try {
    const res = await rehabPlanService.completeTask(taskId)
    if (res.data.success) {
      // Update local state
      const task = todayTasks.value.find(t => t.id === taskId)
      if (task) task.status = 'completed'
      const allTask = allTasks.value.find(t => t.id === taskId)
      if (allTask) allTask.status = 'completed'

      // Check phase completion
      if (res.data.phase_complete && res.data.next_phase) {
        ElMessage.success(`当前阶段已完成！可推进到「${res.data.next_phase}」`)
      }
    }
  } catch {
    ElMessage.error('标记任务完成失败')
  }
}

async function handleAdvancePhase() {
  if (!activePlan.value) return
  const nextIdx = currentPhaseIndex.value + 1
  if (nextIdx >= phases.length) return
  const nextPhase = phases[nextIdx]
  try {
    const res = await rehabPlanService.advancePhase(activePlan.value.id, nextPhase)
    if (res.data.success) {
      activePlan.value.current_phase = nextPhase
      ElMessage.success(`已推进到「${nextPhase}」阶段`)
    }
  } catch {
    ElMessage.error('阶段推进失败，请稍后重试')
  }
}

async function handleCancelPlan() {
  if (!activePlan.value) return
  try {
    await ElMessageBox.confirm('确定要取消当前康复计划吗？所有关联提醒也将被取消。', '取消计划', {
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
      type: 'warning',
    })
    const res = await rehabPlanService.cancelPlan(activePlan.value.id)
    if (res.data.success) {
      activePlan.value = null
      todayTasks.value = []
      allTasks.value = []
      plans.value = []
      ElMessage.success('康复计划已取消')
    }
  } catch {
    // user cancelled
  }
}

function taskTypeLabel(type: string) {
  return taskTypeConfig[type]?.label || '其他'
}
function taskTypeColor(type: string) {
  return taskTypeConfig[type]?.color || '#7A6F5F'
}
function taskTypeBg(type: string) {
  return taskTypeConfig[type]?.bg || 'rgba(122,111,95,0.1)'
}

onMounted(() => fetchData())
</script>

<template>
  <div class="rehab-plan" v-loading="loading">
    <!-- No active plan: show generate CTA -->
    <template v-if="!activePlan && !showGenerate">
      <section class="empty-plan stagger-item stagger-1">
        <div class="empty-icon">
          <el-icon :size="48" color="#606C38"><FirstAidKit /></el-icon>
        </div>
        <h2>个性化康复计划</h2>
        <p class="empty-desc">
          AI 将根据您的健康档案，为您生成分阶段的个性化健康管理或康复计划
        </p>
        <el-button type="primary" size="large" round @click="showGenerate = true">
          开始生成康复计划
        </el-button>
      </section>
    </template>

    <!-- Generate form -->
    <template v-if="showGenerate && !activePlan">
      <section class="generate-section stagger-item stagger-1">
        <h2>生成康复计划</h2>
        <p class="section-desc">填写以下信息（手术类型可选），AI 将为您制定个性化方案</p>

        <el-card class="form-card" shadow="never">
          <div class="form-group">
            <label>手术类型（可选）</label>
            <el-select
              v-model="surgeryType"
              placeholder="如有手术请选择，无则留空"
              size="large"
              filterable
              allow-create
              clearable
              style="width: 100%"
            >
              <el-option label="阑尾切除术" value="阑尾切除术" />
              <el-option label="膝关节置换术" value="膝关节置换术" />
              <el-option label="髋关节置换术" value="髋关节置换术" />
              <el-option label="心脏搭桥术" value="心脏搭桥术" />
              <el-option label="胆囊切除术" value="胆囊切除术" />
              <el-option label="甲状腺切除术" value="甲状腺切除术" />
              <el-option label="骨折内固定术" value="骨折内固定术" />
              <el-option label="腰椎间盘手术" value="腰椎间盘手术" />
              <el-option label="白内障手术" value="白内障手术" />
              <el-option label="痔疮手术" value="痔疮手术" />
            </el-select>
          </div>

          <div class="form-group">
            <label>计划标题（可选）</label>
            <el-input v-model="planTitle" placeholder="如：我的膝关节康复方案" size="large" />
          </div>

          <div class="form-actions">
            <el-button @click="showGenerate = false" size="large">取消</el-button>
            <el-button
              type="primary"
              size="large"
              :loading="generating"
              @click="handleGenerate"
            >
              {{ generating ? 'AI 正在生成中...' : '生成康复计划' }}
            </el-button>
          </div>
        </el-card>
      </section>
    </template>

    <!-- Active plan view -->
    <template v-if="activePlan">
      <!-- Plan header -->
      <section class="plan-header stagger-item stagger-1">
        <div class="plan-title-row">
          <h2>{{ activePlan.plan_title }}</h2>
          <el-tag :color="phaseColors[activePlan.current_phase]" effect="dark" round size="small">
            {{ activePlan.current_phase }}
          </el-tag>
        </div>
        <p class="plan-meta">
          <template v-if="activePlan.surgery_type">手术类型：{{ activePlan.surgery_type }} &nbsp;|&nbsp;</template>
          创建于 {{ activePlan.created_at?.slice(0, 10) }}
        </p>
      </section>

      <!-- Phase progress -->
      <section class="phase-progress glass-card stagger-item stagger-2">
        <h3>康复阶段</h3>
        <div class="phase-steps">
          <div
            v-for="(phase, idx) in phases"
            :key="phase"
            class="phase-step"
            :class="{
              active: idx === currentPhaseIndex,
              completed: idx < currentPhaseIndex,
              upcoming: idx > currentPhaseIndex,
            }"
          >
            <div class="phase-dot" :style="{ background: idx <= currentPhaseIndex ? phaseColors[phase] : '#D4C9B8' }">
              <el-icon v-if="idx < currentPhaseIndex" :size="14"><Check /></el-icon>
              <el-icon v-else-if="idx === currentPhaseIndex" :size="14"><component :is="phaseIcons[phase]" /></el-icon>
            </div>
            <div class="phase-info">
              <span class="phase-name">{{ phase }}</span>
              <el-progress
                :percentage="phaseProgress(phase)"
                :stroke-width="4"
                :color="phaseColors[phase]"
                :show-text="false"
              />
              <span class="phase-count">{{ phaseStats[phase]?.completed || 0 }}/{{ phaseStats[phase]?.total || 0 }}</span>
            </div>
            <div v-if="idx < phases.length - 1" class="phase-connector" :style="{ background: idx < currentPhaseIndex ? phaseColors[phase] : '#E0D6C8' }"></div>
          </div>
        </div>
        <div class="phase-actions" v-if="currentPhaseIndex < phases.length - 1">
          <el-button type="primary" plain round size="small" @click="handleAdvancePhase">
            推进到「{{ phases[currentPhaseIndex + 1] }}」<el-icon><Right /></el-icon>
          </el-button>
        </div>
      </section>

      <!-- Today's tasks -->
      <section class="today-tasks glass-card stagger-item stagger-3">
        <div class="section-head">
          <h3>今日任务</h3>
          <el-tag v-if="todayStats.total > 0" :type="todayStats.remaining > 0 ? 'warning' : 'success'" round size="small">
            {{ todayStats.remaining > 0 ? `${todayStats.remaining} 项待完成` : '全部完成' }}
          </el-tag>
        </div>

        <div v-if="todayTasks.length === 0" class="empty-tasks">
          <el-icon :size="28" color="#A89B8A"><Calendar /></el-icon>
          <p>今天暂无康复任务</p>
        </div>

        <div
          v-for="task in todayTasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.status === 'completed' }"
        >
          <div class="task-type-badge" :style="{ background: taskTypeBg(task.task_type), color: taskTypeColor(task.task_type) }">
            {{ taskTypeLabel(task.task_type) }}
          </div>
          <div class="task-content">
            <span class="task-text">{{ task.task_content }}</span>
            <span class="task-phase-tag">{{ task.phase }} · 第{{ task.task_day }}天</span>
          </div>
          <el-button
            v-if="task.status !== 'completed'"
            type="primary"
            circle
            size="small"
            @click="handleCompleteTask(task.id)"
          >
            <el-icon><Check /></el-icon>
          </el-button>
          <el-icon v-else color="#606C38" :size="20"><Check /></el-icon>
        </div>
      </section>

      <!-- Full plan details -->
      <section class="plan-detail glass-card stagger-item stagger-4">
        <div class="section-head">
          <h3>完整计划</h3>
          <el-button text type="primary" @click="showPlanDetail = !showPlanDetail">
            {{ showPlanDetail ? '收起' : '展开' }}
          </el-button>
        </div>

        <div v-if="showPlanDetail">
          <el-collapse>
            <el-collapse-item v-for="phase in phases" :key="phase" :name="phase">
              <template #title>
                <div class="collapse-title">
                  <span class="collapse-phase-dot" :style="{ background: phaseColors[phase] }"></span>
                  {{ phase }}
                  <el-tag size="small" round type="info" style="margin-left: 8px">
                    {{ phaseStats[phase]?.completed || 0 }}/{{ phaseStats[phase]?.total || 0 }}
                  </el-tag>
                </div>
              </template>
              <div class="phase-task-list">
                <div
                  v-for="task in tasksByPhase[phase]"
                  :key="task.id"
                  class="detail-task-item"
                  :class="{ completed: task.status === 'completed' }"
                >
                  <div class="detail-task-left">
                    <el-tag size="small" round :color="taskTypeBg(task.task_type)" :style="{ color: taskTypeColor(task.task_type), border: 'none' }">
                      {{ taskTypeLabel(task.task_type) }}
                    </el-tag>
                    <span class="detail-task-day">D{{ task.task_day }}</span>
                  </div>
                  <span class="detail-task-content">{{ task.task_content }}</span>
                  <span class="detail-task-date">{{ task.task_date?.slice(5) }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </section>

      <!-- Cancel plan -->
      <section class="danger-zone stagger-item stagger-5">
        <el-button type="danger" plain round size="small" @click="handleCancelPlan">
          取消康复计划
        </el-button>
      </section>
    </template>
  </div>
</template>

<style scoped>
.rehab-plan {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
}

/* Empty state */
.empty-plan {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
}

.empty-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--color-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-plan h2 {
  font-size: 22px;
  margin-bottom: 8px;
}

.empty-desc {
  color: var(--color-text-secondary);
  font-size: 14px;
  max-width: 300px;
  margin-bottom: 24px;
  line-height: 1.6;
}

/* Generate section */
.generate-section h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.section-desc {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.form-card {
  border-radius: var(--radius-lg) !important;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text);
}

.required {
  color: var(--color-danger);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

/* Plan header */
.plan-header {
  padding-top: 4px;
}

.plan-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.plan-title-row h2 {
  font-size: 22px;
}

.plan-meta {
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* Phase progress */
.phase-progress {
  padding: 18px;
}

.phase-progress h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.phase-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
  position: relative;
}

.phase-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.phase-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1;
  transition: all 0.3s ease;
}

.phase-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  width: 80%;
}

.phase-name {
  font-size: 13px;
  font-weight: 600;
}

.phase-count {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.phase-connector {
  position: absolute;
  top: 16px;
  left: 50%;
  width: 100%;
  height: 2px;
  z-index: 0;
}

.phase-step:last-child .phase-connector {
  display: none;
}

.phase-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* Today tasks */
.today-tasks {
  padding: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-head h3 {
  font-size: 16px;
}

.empty-tasks {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 20px 0;
  font-size: 14px;
}

.empty-tasks p {
  margin-top: 6px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
  transition: opacity 0.3s ease;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed {
  opacity: 0.5;
}

.task-item.completed .task-text {
  text-decoration: line-through;
}

.task-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-text {
  font-size: 14px;
  font-weight: 500;
}

.task-phase-tag {
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* Plan detail */
.plan-detail {
  padding: 18px;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.collapse-phase-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.phase-task-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 13px;
}

.detail-task-item:last-child {
  border-bottom: none;
}

.detail-task-item.completed {
  opacity: 0.45;
}

.detail-task-item.completed .detail-task-content {
  text-decoration: line-through;
}

.detail-task-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 72px;
}

.detail-task-day {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.detail-task-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-task-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* Danger zone */
.danger-zone {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .phase-info {
    width: 90%;
  }
  .phase-name {
    font-size: 12px;
  }
  .detail-task-item {
    flex-wrap: wrap;
  }
}
</style>
