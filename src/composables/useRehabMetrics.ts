import { ref, watch } from 'vue'
import { useRehabStore } from '@/stores/rehab'

export function useRehabMetrics(metricType: ReturnType<typeof ref<string>>) {
  const store = useRehabStore()

  const chartOption = ref({
    xAxis: { type: 'category' as const, data: [] as string[] },
    yAxis: { type: 'value' as const },
    series: [{ data: [] as number[], type: 'line' as const, smooth: true, areaStyle: { opacity: 0.1 } }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
  })

  async function loadTrend(type: string) {
    if (!store.activePlan?.id) return
    await store.fetchMetrics(store.activePlan.id, type)
    chartOption.value = {
      ...chartOption.value,
      xAxis: { ...chartOption.value.xAxis, data: store.metricTrend.dates },
      series: [{ ...chartOption.value.series[0], data: store.metricTrend.values }],
    }
  }

  async function saveMetric(planId: number, data: { metric_date: string; metric_type: string; metric_value: number; note?: string }) {
    return await store.saveMetric(planId, data)
  }

  watch(metricType, (val) => loadTrend(val))

  return { chartOption, loadTrend, saveMetric }
}
