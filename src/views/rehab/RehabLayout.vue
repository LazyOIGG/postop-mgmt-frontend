<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRehabStore } from '@/stores/rehab'
import { rehabPlanService } from '@/services/rehabPlan'
import { ElMessage } from 'element-plus'
import { FirstAidKit } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useRehabStore()
const ready = ref(false)
const showGenerate = ref(false)
const generating = ref(false)
const surgeryType = ref('')
const planTitle = ref('')

const surgeryOptions = [
  '膝关节置换术', '髋关节置换术', 'ACL重建术', '肩袖修复术',
  '腰椎间盘手术', '踝关节骨折', '半月板修复术', '腕管松解术',
  '全肩关节置换术', '颈椎管狭窄', '跟腱修复术', '骨折内固定术',
  '阑尾切除术', '胆囊切除术', '心脏搭桥术', '甲状腺切除术',
]

onMounted(async () => {
  if (!store.activePlan?.id) {
    try {
      const res = await rehabPlanService.getList('active')
      if (res.data.success && res.data.plans?.length > 0) {
        store.activePlan = res.data.plans[0]
        await store.fetchDashboard(store.activePlan.id)
      }
    } catch { /* */ }
  }
  ready.value = true
})

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
      ElMessage.success('康复计划已生成！')
      // 重新加载计划 → reactive 会自动切换视图
      const listRes = await rehabPlanService.getList('active')
      if (listRes.data.success && listRes.data.plans?.length > 0) {
        store.activePlan = listRes.data.plans[0]
        await store.fetchDashboard(store.activePlan.id)
      }
    } else {
      ElMessage.error(res.data.error || '生成失败')
    }
  } catch {
    ElMessage.error('生成康复计划失败')
  } finally {
    generating.value = false
  }
}

const tabs = [
  { name: 'RehabDashboard', label: '总览', icon: 'DataAnalysis', path: '/patient/rehab' },
  { name: 'RehabCalendar', label: '日历', icon: 'Calendar', path: '/patient/rehab/calendar' },
  { name: 'RehabMetrics', label: '指标', icon: 'TrendCharts', path: '/patient/rehab/metrics' },
  { name: 'RehabExercise', label: '运动', icon: 'Football', path: '/patient/rehab/exercises' },
  { name: 'RehabJournal', label: '日志', icon: 'EditPen', path: '/patient/rehab/journal' },
  { name: 'RehabAchievements', label: '成就', icon: 'Trophy', path: '/patient/rehab/achievements' },
]

function goTab(path: string) {
  router.push(path)
}

function isActive(tabName: string) {
  if (tabName === 'RehabDashboard') return route.name === 'RehabDashboard'
  return route.name === tabName
}
</script>

<template>
  <div class="rehab-shell" v-loading="!ready">
    <!-- No plan: show generate form directly -->
    <template v-if="ready && !store.activePlan">
      <section class="empty-plan" v-if="!showGenerate">
        <div class="empty-icon">
          <el-icon :size="48" color="#606C38"><FirstAidKit /></el-icon>
        </div>
        <h2>暂无康复计划</h2>
        <p>AI 将根据您的健康档案和手术类型，生成个性化分阶段康复方案</p>
        <el-button type="primary" size="large" round @click="showGenerate = true">
          开始生成康复计划
        </el-button>
      </section>

      <section class="generate-section glass-card" v-if="showGenerate">
        <h2>制定康复计划</h2>
        <p class="section-desc">选择手术类型后，AI 将为您制定个性化分阶段方案</p>
        <div class="form-group">
          <label>手术类型</label>
          <el-select v-model="surgeryType" placeholder="请选择手术类型" size="large" filterable allow-create clearable style="width:100%">
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

    <!-- Has plan: full layout -->
    <template v-if="ready && store.activePlan">
      <nav class="rehab-subnav">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          class="subnav-item"
          :class="{ active: isActive(tab.name) }"
          @click="goTab(tab.path)"
        >
          <el-icon :size="16"><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </nav>

      <main class="rehab-main">
        <router-view />
      </main>
    </template>
  </div>
</template>

<style scoped>
.rehab-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.rehab-subnav {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
  -webkit-overflow-scrolling: touch;
}

.rehab-subnav::-webkit-scrollbar {
  display: none;
}

.subnav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.subnav-item:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.subnav-item.active {
  background: var(--color-primary);
  color: #fff;
}

.rehab-main {
  flex: 1;
  overflow-y: auto;
}

.empty-plan {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 48px 20px;
}
.empty-icon {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--color-primary-bg);
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
}
.empty-plan h2 { font-size: 22px; margin-bottom: 8px; }
.empty-plan p { color: var(--color-text-secondary); font-size: 14px; max-width: 280px; margin-bottom: 24px; line-height: 1.6; }

.generate-section h2 { font-size: 20px; margin-bottom: 4px; }
.section-desc { color: var(--color-text-secondary); font-size: 14px; margin-bottom: 20px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; }
.glass-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--color-border-light); }
</style>
