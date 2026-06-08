<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRehabStore } from '@/stores/rehab'
import { rehabPlanService } from '@/services/rehabPlan'
import { ElMessage } from 'element-plus'
import { FirstAidKit } from '@element-plus/icons-vue'
import AchievementPopup from '@/components/rehab/AchievementPopup.vue'
import type { RehabTask } from '@/types'

const store = useRehabStore()
const showGenerate = ref(false)
const generating = ref(false)
const surgeryType = ref('')
const planTitle = ref('')
const popupAchievements = ref<any[]>([])

// AAOS 运动详情弹窗
const showExerciseDetail = ref(false)
const aaosDetailExercises = ref<any[]>([])
const aaosDetailLoading = ref(false)

const taskTypeConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  medication: { label: '用药', icon: '💊', color: '#C66B3D', bg: 'rgba(198,107,61,0.06)' },
  exercise: { label: '康复锻炼', icon: '🏃', color: '#606C38', bg: 'rgba(96,108,56,0.06)' },
  diet: { label: '饮食', icon: '🍽️', color: '#C08E3A', bg: 'rgba(192,142,58,0.06)' },
  review: { label: '复查', icon: '🏥', color: '#8B9D83', bg: 'rgba(139,157,131,0.06)' },
  other: { label: '其他', icon: '📋', color: '#7A6F5F', bg: 'rgba(122,111,95,0.06)' },
}

// 按类型分组今日任务
const tasksByType = computed(() => {
  const groups: Record<string, RehabTask[]> = {}
  for (const t of store.todayTasks) {
    const type = t.task_type || 'other'
    if (!groups[type]) groups[type] = []
    groups[type].push(t)
  }
  return groups
})

const typeOrder = ['medication', 'exercise', 'diet', 'review', 'other']

watch(() => store.newAchievements, (val) => {
  if (val && val.length > 0) {
    popupAchievements.value = [...val]
  }
}, { deep: true })

function onAchievementDismissed() {
  popupAchievements.value = []
  store.clearNewAchievements()
}

async function handleCancelPlan() {
  if (!store.activePlan?.id) return
  try {
    await rehabPlanService.cancelPlan(store.activePlan.id)
    store.activePlan = null
    store.dashboardData = null
    store.todayTasks = []
    ElMessage.success('康复计划已取消')
  } catch {
    ElMessage.error('取消失败，请稍后重试')
  }
}

const surgeryOptions = [
  '膝关节置换术', '髋关节置换术', 'ACL重建术', '肩袖修复术',
  '腰椎间盘手术', '踝关节骨折', '半月板修复术', '腕管松解术',
  '全肩关节置换术', '颈椎管狭窄', '跟腱修复术', '骨折内固定术',
  '阑尾切除术', '胆囊切除术', '心脏搭桥术', '甲状腺切除术',
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

async function openExerciseGuide() {
  showExerciseDetail.value = true
  aaosDetailLoading.value = true
  try {
    const surgery = store.activePlan?.surgery_type || '膝关节锻炼'
    const res = await rehabPlanService.getAAOSExercises(surgery)
    if (res.data?.success) {
      aaosDetailExercises.value = res.data.exercises || []
    }
  } catch { /* */ }
  finally { aaosDetailLoading.value = false }
}

function formatContent(content: string) {
  if (!content) return []
  const sections: any[] = []
  const lines = content.split('\n')

  let currentSteps: string[] = []
  let inStepsBlock = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('图片') || trimmed.startsWith('http')) continue

    // 标签行：关键词：值
    const labelMatch = trimmed.match(/^(.+?)：(.+)/)
    if (labelMatch && !trimmed.startsWith('-')) {
      if (currentSteps.length > 0) {
        sections.push({ steps: [...currentSteps] })
        currentSteps = []
        inStepsBlock = false
      }
      const val = labelMatch[2].trim()
      if (val) {
        sections.push({ label: labelMatch[1], text: val })
      } else {
        // "步骤：" → 进入步骤模式
        inStepsBlock = true
      }
      continue
    }

    // 步骤行（以 - 开头）
    if (trimmed.startsWith('-') || inStepsBlock) {
      currentSteps.push(trimmed.replace(/^[-]\s*/, ''))
      continue
    }

    // 其他文本，追加到上一个步骤
    if (currentSteps.length > 0) {
      currentSteps[currentSteps.length - 1] += ' ' + trimmed
    }
  }

  if (currentSteps.length > 0) {
    sections.push({ steps: [...currentSteps] })
  }

  return sections
}

onMounted(() => loadPlan())
</script>

<template>
  <div class="dashboard">
    <!-- Empty state -->
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

      <!-- Today tasks grouped by type -->
      <section class="glass-card">
        <div class="task-header">
          <h3>今日任务 ({{ store.todayTasks.length }}项)</h3>
          <el-button text type="primary" size="small" @click="openExerciseGuide">
            查看康复运动指导
          </el-button>
        </div>

        <div v-if="store.todayTasks.length === 0" class="empty-hint">
          <p>今天暂无康复任务</p>
        </div>

        <div v-for="type in typeOrder" :key="type">
          <template v-if="tasksByType[type]?.length">
            <div class="type-header" :style="{ color: taskTypeConfig[type].color, background: taskTypeConfig[type].bg }">
              {{ taskTypeConfig[type].icon }} {{ taskTypeConfig[type].label }}
              <span class="type-count">{{ tasksByType[type].length }}项</span>
            </div>
            <div v-for="task in tasksByType[type]" :key="task.id" class="task-row" :class="{ done: task.status === 'completed' }">
              <span class="task-text">{{ task.task_content }}</span>
              <span class="task-phase">{{ task.phase }} · D{{ task.task_day }}</span>
            </div>
          </template>
        </div>
      </section>

      <!-- Quick links -->
      <section class="quick-links">
        <el-button type="primary" plain round @click="$router.push('/patient/rehab/calendar')">查看日历</el-button>
        <el-button type="success" plain round @click="$router.push('/patient/rehab/metrics')">记录指标</el-button>
        <el-button type="warning" plain round @click="$router.push('/patient/rehab/exercises')">运动指导</el-button>
        <el-button plain round @click="$router.push('/patient/rehab/journal')">写日志</el-button>
      </section>

      <!-- Cancel plan -->
      <section class="danger-zone">
        <el-popconfirm
          title="确定要取消当前康复计划吗？所有数据将被保留但计划将标记为已取消。"
          confirm-button-text="确定取消"
          cancel-button-text="再想想"
          @confirm="handleCancelPlan"
        >
          <template #reference>
            <el-button type="danger" plain round size="small">取消康复计划</el-button>
          </template>
        </el-popconfirm>
      </section>
    </template>

    <!-- AAOS 运动指导弹窗 -->
    <el-dialog
      v-model="showExerciseDetail"
      width="94%"
      top="2vh"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="aaos-dialog-header">
          <h3>康复运动指导</h3>
          <span class="aaos-badge">AAOS OrthoInfo</span>
        </div>
      </template>

      <div v-loading="aaosDetailLoading" class="aaos-dialog-body">
        <div v-if="aaosDetailExercises.length === 0 && !aaosDetailLoading" class="aaos-empty">
          <el-icon :size="40" color="#ccc"><Picture /></el-icon>
          <p>暂无匹配的康复运动指导</p>
        </div>

        <div class="aaos-card-grid">
          <div v-for="(ex, idx) in aaosDetailExercises" :key="ex.id" class="aaos-ex-card"
               :style="{ animationDelay: idx * 0.05 + 's' }">
            <!-- 图片区域 -->
            <div v-if="ex.local_images?.length || ex.image_urls?.length" class="aaos-card-img-wrap">
              <img
                :src="(ex.local_images?.length ? ex.local_images : ex.image_urls)[0]"
                class="aaos-card-img"
                @error="$event.target.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 150%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22150%22/><text fill=%22%23ccc%22 x=%22100%22 y=%2280%22 text-anchor=%22middle%22 font-size=%2214%22>暂无图片</text></svg>'"
              />
              <div class="aaos-card-img-badge">{{ ex.surgery_type }}</div>
            </div>

            <!-- 文字区域 -->
            <div class="aaos-card-body">
              <h4 class="aaos-card-title">{{ ex.name }}</h4>
              <div class="aaos-card-content">
                <div class="aaos-card-section" v-for="(section, si) in formatContent(ex.content)" :key="si">
                  <template v-if="section.label">
                    <span class="aaos-section-label">{{ section.label }}</span>
                    <span class="aaos-section-text">{{ section.text }}</span>
                  </template>
                  <template v-else>
                    <p class="aaos-step" v-for="(step, sti) in section.steps" :key="sti">
                      <span class="aaos-step-num">{{ sti + 1 }}</span>
                      {{ step }}
                    </p>
                  </template>
                </div>
              </div>
              <p v-if="ex.source_url" class="aaos-card-src">
                <a :href="ex.source_url" target="_blank">查看原文</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

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

/* Task header */
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.task-header h3 { font-size: 16px; margin: 0; }

/* Type grouping */
.type-header { padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; margin: 12px 0 6px; display: flex; align-items: center; gap: 4px; }
.type-count { font-weight: 400; font-size: 11px; margin-left: auto; opacity: 0.7; }

.task-row { display: flex; align-items: center; gap: 10px; padding: 8px 4px 8px 12px; border-bottom: 1px solid var(--color-border-light); }
.task-row:last-child { border-bottom: none; }
.task-row.done { opacity: 0.5; }
.task-row.done .task-text { text-decoration: line-through; }
.task-text { flex: 1; font-size: 14px; min-width: 0; }
.task-phase { font-size: 11px; color: var(--color-text-tertiary); flex-shrink: 0; }

.quick-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.danger-zone { display: flex; justify-content: center; padding: 8px 0 20px; }

/* AAOS exercise dialog */
.aaos-dialog-header { display: flex; align-items: center; gap: 12px; }
.aaos-dialog-header h3 { font-size: 18px; margin: 0; }
.aaos-badge { font-size: 11px; background: linear-gradient(135deg, #2a4b7c, #3d6db5); color: #fff; padding: 3px 10px; border-radius: 12px; letter-spacing: 0.5px; }
.aaos-dialog-body { padding: 0 4px; }
.aaos-empty { text-align: center; padding: 40px; color: #999; }

.aaos-card-grid { display: flex; flex-direction: column; gap: 16px; }
.aaos-ex-card {
  background: #fff; border-radius: 16px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid var(--color-border-light);
  transition: transform 0.2s, box-shadow 0.2s;
  animation: aaosFadeIn 0.4s ease both;
}
@keyframes aaosFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.aaos-ex-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }

.aaos-card-img-wrap { position: relative; width: 100%; height: 220px; overflow: hidden; background: #f8f5f0; }
.aaos-card-img { width: 100%; height: 100%; object-fit: contain; padding: 8px; box-sizing: border-box; }
.aaos-card-img-badge { position: absolute; top: 10px; right: 10px; font-size: 10px; background: rgba(0,0,0,0.55); color: #fff; padding: 2px 8px; border-radius: 10px; }

.aaos-card-body { padding: 16px; }
.aaos-card-title {
  font-size: 16px; font-weight: 700; color: #2c3e50;
  margin: 0 0 12px; padding-bottom: 10px;
  border-bottom: 2px solid var(--color-primary-bg);
}
.aaos-card-content { display: flex; flex-direction: column; gap: 8px; }
.aaos-card-section { display: flex; gap: 8px; align-items: flex-start; }
.aaos-section-label {
  font-size: 12px; font-weight: 600; color: var(--color-primary);
  background: var(--color-primary-bg); padding: 2px 8px;
  border-radius: 6px; white-space: nowrap; flex-shrink: 0;
  min-width: 60px; text-align: center;
}
.aaos-section-text { font-size: 13px; color: var(--color-text); line-height: 1.6; }
.aaos-step {
  margin: 0; padding: 6px 0; font-size: 13px; line-height: 1.7;
  color: var(--color-text-secondary); display: flex; gap: 10px; align-items: flex-start;
}
.aaos-step-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.aaos-card-src { font-size: 11px; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--color-border-light); text-align: right; }
.aaos-card-src a { color: var(--color-primary); text-decoration: none; }

@media (max-width: 768px) {
  .aaos-card-img-wrap { height: 180px; }
  .aaos-card-title { font-size: 15px; }
}

.glass-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 18px;
  border: 1px solid var(--color-border-light);
}
</style>
