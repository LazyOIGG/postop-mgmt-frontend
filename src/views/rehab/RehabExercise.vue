<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRehabStore } from '@/stores/rehab'
import { rehabPlanService } from '@/services/rehabPlan'

const store = useRehabStore()

interface AAOSExercise {
  id: number; surgery_type: string; name: string; content: string
  image_urls: string[]; local_images: string[]; source_url: string
}
const aaosExercises = ref<AAOSExercise[]>([])
const selectedAAOS = ref<AAOSExercise | null>(null)
const aaosLoading = ref(false)

const surgeryName = computed(() => store.activePlan?.surgery_type || '')

const groupedAAOS = computed(() => {
  const groups: Record<string, AAOSExercise[]> = {}
  for (const ex of aaosExercises.value) {
    const type = ex.surgery_type || '其他'
    if (!groups[type]) groups[type] = []
    groups[type].push(ex)
  }
  return groups
})

onMounted(async () => {
  aaosLoading.value = true
  try {
    const st = surgeryName.value || '膝关节锻炼'
    const res = await rehabPlanService.getAAOSExercises(st)
    if (res.data?.success) {
      aaosExercises.value = res.data.exercises || []
    }
  } catch { /* */ }
  finally { aaosLoading.value = false }
})
</script>

<template>
  <div class="exercise-view">
    <section class="aaos-section" v-loading="aaosLoading">
      <h4>康复运动指导 · {{ surgeryName || '通用' }} ({{ aaosExercises.length }}个)</h4>

      <div v-for="(exercises, typeName) in groupedAAOS" :key="typeName" class="aaos-group">
        <h5 class="aaos-group-title">{{ typeName }} ({{ exercises.length }})</h5>
        <div class="aaos-grid">
          <div v-for="ex in exercises" :key="'aaos-'+ex.id" class="aaos-card" @click="selectedAAOS = ex">
            <div v-if="ex.local_images?.length > 0 || ex.image_urls?.length > 0" class="aaos-img-wrap">
              <img :src="ex.local_images?.[0] || ex.image_urls?.[0]" :alt="ex.name"
                   class="aaos-img" @error="$event.target.style.display='none'" />
            </div>
            <div class="aaos-body">
              <h5 class="aaos-name">{{ ex.name }}</h5>
              <p class="aaos-preview">{{ ex.content?.split('\n')[0]?.slice(0, 80) }}...</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-if="selectedAAOS" :model-value="true" :title="selectedAAOS.name" width="95%" @close="selectedAAOS = null">
      <div class="aaos-detail">
        <div v-if="selectedAAOS.local_images?.length > 0 || selectedAAOS.image_urls?.length > 0" class="aaos-detail-imgs">
          <img v-for="(img, i) in (selectedAAOS.local_images?.length ? selectedAAOS.local_images : selectedAAOS.image_urls)"
               :key="i" :src="img" class="aaos-detail-img" @error="$event.target.style.display='none'" />
        </div>
        <div class="aaos-detail-text" v-html="selectedAAOS.content?.replace(/\n/g, '<br>')"></div>
        <p v-if="selectedAAOS.source_url" class="aaos-source">
          来源: <a :href="selectedAAOS.source_url" target="_blank">AAOS OrthoInfo</a>
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.exercise-view { padding-bottom: 20px; }

.aaos-section { padding-bottom: 20px; }
.aaos-group { margin-bottom: 20px; }
.aaos-group-title { font-size: 14px; font-weight: 600; color: var(--color-primary-dark); margin: 0 0 10px; padding-left: 4px; border-left: 3px solid var(--color-primary); }
.aaos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.aaos-card { background: var(--color-surface); border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border-light); cursor: pointer; transition: box-shadow 0.2s; }
.aaos-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-color: var(--color-primary); }
.aaos-img-wrap { width: 100%; height: 140px; overflow: hidden; background: #f5f5f5; }
.aaos-img { width: 100%; height: 100%; object-fit: cover; }
.aaos-body { padding: 10px; }
.aaos-name { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
.aaos-preview { font-size: 12px; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
.aaos-detail { display: flex; flex-direction: column; gap: 16px; }
.aaos-detail-imgs { display: flex; flex-wrap: wrap; gap: 8px; }
.aaos-detail-img { max-width: 100%; border-radius: var(--radius-md); max-height: 300px; object-fit: contain; }
.aaos-detail-text { font-size: 14px; line-height: 1.8; color: var(--color-text); }
.aaos-source { font-size: 12px; color: var(--color-text-tertiary); }
.aaos-source a { color: var(--color-primary); }
h4 { font-size: 16px; margin-bottom: 12px; }
</style>
