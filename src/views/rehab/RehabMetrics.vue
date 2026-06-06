<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRehabStore } from '@/stores/rehab'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'

const store = useRehabStore()
const activeType = ref('pain_vas')
const inputValue = ref<number | null>(null)
const inputNote = ref('')
const saving = ref(false)

const metricTypes = [
  { key: 'pain_vas', label: '疼痛VAS', unit: '分(0-10)' },
  { key: 'rom_flexion', label: '屈曲ROM', unit: '度' },
  { key: 'rom_extension', label: '伸直ROM', unit: '度' },
  { key: 'muscle_strength', label: '肌力等级', unit: '级(0-5)' },
  { key: 'walking_distance', label: '步行距离', unit: '米' },
  { key: 'weight', label: '体重', unit: 'kg' },
]

const chartOption = ref({
  xAxis: { type: 'category', data: [] as string[] },
  yAxis: { type: 'value' },
  series: [{ data: [] as number[], type: 'line', smooth: true, areaStyle: { opacity: 0.1 } }],
  grid: { left: 40, right: 20, top: 20, bottom: 30 },
})

async function loadTrend() {
  if (!store.activePlan?.id) return
  await store.fetchMetrics(store.activePlan.id, activeType.value)
  chartOption.value = {
    ...chartOption.value,
    xAxis: { ...chartOption.value.xAxis, data: store.metricTrend.dates },
    series: [{ ...chartOption.value.series[0], data: store.metricTrend.values }],
  }
}

async function handleSave() {
  if (!store.activePlan?.id || inputValue.value == null) return
  saving.value = true
  try {
    await store.saveMetric(store.activePlan.id, {
      metric_date: new Date().toISOString().slice(0, 10),
      metric_type: activeType.value,
      metric_value: inputValue.value,
      note: inputNote.value,
    })
    inputValue.value = null
    inputNote.value = ''
    ElMessage.success('已记录')
    await loadTrend()
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

watch(activeType, () => loadTrend())
onMounted(() => { if (store.activePlan?.id) loadTrend() })
</script>

<template>
  <div class="metrics-view">
    <!-- Type selector -->
    <div class="type-tabs">
      <el-button
        v-for="mt in metricTypes" :key="mt.key"
        :type="activeType === mt.key ? 'primary' : 'default'"
        size="small" round
        @click="activeType = mt.key"
      >{{ mt.label }}</el-button>
    </div>

    <!-- Chart -->
    <div class="chart-box glass-card">
      <v-chart :option="chartOption" autoresize style="height: 250px" />
    </div>

    <!-- Input -->
    <div class="input-row glass-card">
      <el-input-number v-model="inputValue" :precision="1" :min="0" size="large" style="width: 140px" />
      <span class="unit">{{ metricTypes.find(m => m.key === activeType)?.unit }}</span>
      <el-input v-model="inputNote" placeholder="备注(可选)" size="large" style="flex:1" />
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">记录</el-button>
    </div>
  </div>
</template>

<style scoped>
.metrics-view { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
.type-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.chart-box { padding: 16px; }
.input-row { display: flex; align-items: center; gap: 10px; padding: 16px; }
.unit { font-size: 13px; color: var(--color-text-secondary); flex-shrink: 0; }
.glass-card { background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); }
</style>
