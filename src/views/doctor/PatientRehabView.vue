<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import api from '@/api'

const route = useRoute()
const username = route.params.username as string
const loading = ref(true)
const overview = ref<any>(null)
const feedbackText = ref('')
const sending = ref(false)
const activeTab = ref('overview')

const phaseColors: Record<string, string> = {
  '急性期': '#C66B3D', '恢复期': '#C08E3A', '巩固期': '#606C38'
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get(`/api/v1/doctor/patients/${username}/rehab`)
    if (res.data.success) overview.value = res.data
  } catch {
    ElMessage.error('加载患者康复数据失败')
  } finally { loading.value = false }
}

async function sendFeedback() {
  if (!feedbackText.value.trim() || !overview.value?.plan?.id) return
  sending.value = true
  try {
    await api.post(`/api/v1/doctor/patients/${username}/rehab/feedback`, {
      plan_id: overview.value.plan.id,
      feedback_content: feedbackText.value.trim(),
    })
    ElMessage.success('反馈已发送')
    feedbackText.value = ''
  } catch { ElMessage.error('发送失败') }
  finally { sending.value = false }
}

const phaseChartOption = ref({
  tooltip: { trigger: 'axis' as const },
  legend: { data: ['总任务', '已完成'], bottom: 0 },
  grid: { left: 40, right: 20, top: 10, bottom: 30 },
  xAxis: { type: 'category' as const, data: [] as string[] },
  yAxis: { type: 'value' as const },
  series: [
    { name: '总任务', type: 'bar', data: [] as number[], itemStyle: { color: '#D4C9B8' } },
    { name: '已完成', type: 'bar', data: [] as number[], itemStyle: { color: '#606C38' } },
  ],
})

function updateChart() {
  if (!overview.value?.phase_stats) return
  const phases = ['急性期', '恢复期', '巩固期']
  phaseChartOption.value = {
    ...phaseChartOption.value,
    xAxis: { ...phaseChartOption.value.xAxis, data: phases },
    series: [
      { ...phaseChartOption.value.series[0], data: phases.map((p: string) => overview.value.phase_stats[p]?.total || 0) },
      { ...phaseChartOption.value.series[1], data: phases.map((p: string) => overview.value.phase_stats[p]?.completed || 0) },
    ],
  }
}

onMounted(async () => { await loadData(); updateChart() })
</script>

<template>
  <div class="dr-rehab" v-loading="loading">
    <!-- Header -->
    <header class="dr-header" v-if="overview">
      <h2>📋 {{ overview.plan.plan_title }}</h2>
      <div class="dr-meta">
        <el-tag :color="phaseColors[overview.plan.current_phase]" effect="dark" round size="small">
          {{ overview.plan.current_phase }}
        </el-tag>
        <span v-if="overview.plan.surgery_type">手术：{{ overview.plan.surgery_type }}</span>
        <span>成就：{{ overview.achievement_count }}枚</span>
      </div>
    </header>

    <!-- Stats bar -->
    <section class="dr-stats" v-if="overview">
      <div class="dr-stat-card">
        <span class="dr-stat-val">{{ overview.stats?.total_tasks || 0 }}</span>
        <span class="dr-stat-lbl">总任务</span>
      </div>
      <div class="dr-stat-card">
        <span class="dr-stat-val">{{ overview.stats?.completed_tasks || 0 }}</span>
        <span class="dr-stat-lbl">已完成</span>
      </div>
      <div class="dr-stat-card">
        <span class="dr-stat-val">
          {{ overview.stats?.total_tasks ? Math.round(overview.stats.completed_tasks / overview.stats.total_tasks * 100) : 0 }}%
        </span>
        <span class="dr-stat-lbl">完成率</span>
      </div>
    </section>

    <!-- Phase chart -->
    <section class="glass-card" v-if="overview">
      <h3>阶段完成情况</h3>
      <v-chart :option="phaseChartOption" autoresize style="height:200px" />
    </section>

    <!-- Latest metrics -->
    <section class="glass-card" v-if="overview?.latest_metrics && Object.keys(overview.latest_metrics).length">
      <h3>最新指标</h3>
      <div class="metrics-grid">
        <div v-for="(val, key) in overview.latest_metrics" :key="key" class="metric-item">
          <span class="metric-key">{{ key }}</span>
          <span class="metric-val">{{ val.value }} {{ val.unit }}</span>
        </div>
      </div>
    </section>

    <!-- Recent journals -->
    <section class="glass-card" v-if="overview?.journals?.length">
      <h3>近期日志</h3>
      <div v-for="j in overview.journals.slice(0, 5)" :key="j.id" class="journal-mini">
        <span class="j-date">{{ j.journal_date }}</span>
        <span class="j-mood">{{ ({ great:'😄',good:'😊',okay:'😐',bad:'😔',terrible:'😢' } as any)[j.mood] || '😐' }}</span>
        <span class="j-pain">疼痛:{{ j.pain_level }}/10</span>
        <span v-if="j.content" class="j-text">{{ j.content.slice(0, 80) }}{{ j.content.length > 80 ? '...' : '' }}</span>
        <span v-if="j.questions_for_doctor" class="j-question">❓ {{ j.questions_for_doctor }}</span>
      </div>
    </section>

    <!-- Feedback -->
    <section class="glass-card" v-if="overview">
      <h3>发送反馈</h3>
      <el-input
        v-model="feedbackText"
        type="textarea"
        :rows="3"
        placeholder="输入康复建议或反馈..."
        maxlength="500"
        show-word-limit
      />
      <el-button type="primary" :loading="sending" @click="sendFeedback" style="margin-top:12px;width:100%">
        发送反馈
      </el-button>

      <!-- Feedback history -->
      <div v-if="overview.plan.doctor_feedback?.length" style="margin-top:16px">
        <h4 style="font-size:13px;margin-bottom:8px">历史反馈</h4>
        <div v-for="(fb, i) in overview.plan.doctor_feedback" :key="i" class="fb-item">
          <span class="fb-time">{{ fb.time }}</span>
          <span class="fb-doctor">{{ fb.doctor }}</span>
          <p class="fb-content">{{ fb.content }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dr-rehab { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
.dr-header h2 { font-size: 20px; margin-bottom: 6px; }
.dr-meta { display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--color-text-secondary); }

.dr-stats { display: flex; gap: 12px; }
.dr-stat-card { flex: 1; background: var(--color-surface); border-radius: var(--radius-md); padding: 14px; text-align: center; border: 1px solid var(--color-border-light); }
.dr-stat-val { font-size: 22px; font-weight: 700; color: var(--color-primary-dark); display: block; }
.dr-stat-lbl { font-size: 12px; color: var(--color-text-tertiary); }

.glass-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 18px; border: 1px solid var(--color-border-light); }
.glass-card h3 { font-size: 15px; margin-bottom: 12px; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.metric-item { text-align: center; padding: 10px; background: rgba(0,0,0,0.03); border-radius: var(--radius-sm); }
.metric-key { display: block; font-size: 11px; color: var(--color-text-tertiary); margin-bottom: 4px; }
.metric-val { font-size: 16px; font-weight: 600; color: var(--color-primary-dark); }

.journal-mini { padding: 10px 0; border-bottom: 1px solid var(--color-border-light); display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.journal-mini:last-child { border-bottom: none; }
.j-date { font-size: 13px; font-weight: 600; }
.j-pain { font-size: 12px; color: var(--color-text-secondary); }
.j-text { font-size: 13px; color: var(--color-text-secondary); width: 100%; line-height: 1.5; }
.j-question { font-size: 12px; color: #C66B3D; background: rgba(198,107,61,0.08); padding: 4px 8px; border-radius: 6px; width: 100%; }

.fb-item { padding: 10px 0; border-bottom: 1px solid var(--color-border-light); }
.fb-item:last-child { border-bottom: none; }
.fb-time { font-size: 11px; color: var(--color-text-tertiary); }
.fb-doctor { font-size: 12px; color: var(--color-primary); margin-left: 8px; font-weight: 600; }
.fb-content { font-size: 13px; color: var(--color-text-secondary); margin: 4px 0 0; line-height: 1.6; }
</style>
