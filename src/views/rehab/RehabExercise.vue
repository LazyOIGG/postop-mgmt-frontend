<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRehabStore } from '@/stores/rehab'

const store = useRehabStore()
const activePhase = ref('')
const activeCategory = ref('')
const searchQuery = ref('')

const categories = ['stretching', 'strength', 'balance', 'mobility', 'breathing']
const catLabels: Record<string, string> = { stretching: '拉伸', strength: '力量', balance: '平衡', mobility: '活动度', breathing: '呼吸' }
const diffLabels: Record<string, string> = { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' }

async function loadExercises() {
  const params: Record<string, string> = {}
  if (activePhase.value) params.phase = activePhase.value
  if (activeCategory.value) params.category = activeCategory.value
  if (searchQuery.value) params.search = searchQuery.value
  if (store.activePlan?.surgery_type) params.surgery_type = store.activePlan.surgery_type
  await store.fetchExercises(params)
}

onMounted(async () => {
  if (store.activePlan?.id) {
    activePhase.value = store.activePlan.current_phase
    await loadExercises()
    await store.fetchRecommendedExercises(store.activePlan.surgery_type, store.activePlan.current_phase)
  }
})
</script>

<template>
  <div class="exercise-view">
    <!-- Search & filters -->
    <el-input v-model="searchQuery" placeholder="搜索运动..." size="large" clearable @input="loadExercises">
      <template #prefix><el-icon><Search /></el-icon></template>
    </el-input>

    <div class="filter-row">
      <el-select v-model="activePhase" placeholder="阶段" size="small" clearable @change="loadExercises" style="width:100px">
        <el-option label="急性期" value="急性期" />
        <el-option label="恢复期" value="恢复期" />
        <el-option label="巩固期" value="巩固期" />
      </el-select>
      <el-select v-model="activeCategory" placeholder="类别" size="small" clearable @change="loadExercises" style="width:100px">
        <el-option v-for="c in categories" :key="c" :label="catLabels[c]" :value="c" />
      </el-select>
    </div>

    <!-- Recommended -->
    <section v-if="store.recommendedExercises.length > 0">
      <h4>📌 AI 推荐</h4>
      <div class="exercise-grid">
        <div v-for="ex in store.recommendedExercises" :key="'rec-'+ex.id" class="ex-card">
          <div class="ex-card-header">
            <span class="ex-diff">{{ diffLabels[ex.difficulty] }}</span>
            <span class="ex-cat-tag">{{ catLabels[ex.category] }}</span>
          </div>
          <h5>{{ ex.title }}</h5>
          <p class="ex-desc">{{ ex.description?.slice(0, 60) }}...</p>
          <div class="ex-meta">
            <span>⏱ {{ ex.duration_minutes }}分钟</span>
            <span>🔁 {{ ex.repetitions }}次</span>
          </div>
        </div>
      </div>
    </section>

    <!-- All exercises -->
    <section>
      <h4>全部运动 ({{ store.exercises.length }})</h4>
      <div class="exercise-grid">
        <div v-for="ex in store.exercises" :key="ex.id" class="ex-card">
          <div class="ex-card-header">
            <span class="ex-diff">{{ diffLabels[ex.difficulty] }}</span>
            <span class="ex-cat-tag">{{ catLabels[ex.category] }}</span>
          </div>
          <h5>{{ ex.title }}</h5>
          <p class="ex-desc">{{ ex.description?.slice(0, 60) }}...</p>
          <div class="ex-meta">
            <span>⏱ {{ ex.duration_minutes }}分钟</span>
            <span>🔁 {{ ex.repetitions }}次</span>
          </div>
          <div v-if="ex.precautions" class="ex-warn">⚠️ {{ ex.precautions }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.exercise-view { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
.filter-row { display: flex; gap: 8px; }
.exercise-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.ex-card { background: var(--color-surface); border-radius: var(--radius-md); padding: 14px; border: 1px solid var(--color-border-light); display: flex; flex-direction: column; gap: 6px; }
.ex-card:hover { border-color: var(--color-primary); }
.ex-card-header { display: flex; justify-content: space-between; align-items: center; }
.ex-diff { font-size: 11px; }
.ex-cat-tag { font-size: 10px; background: var(--color-primary-bg); color: var(--color-primary); padding: 2px 8px; border-radius: 10px; }
.ex-card h5 { font-size: 14px; margin: 0; }
.ex-desc { font-size: 12px; color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
.ex-meta { display: flex; gap: 12px; font-size: 11px; color: var(--color-text-tertiary); }
.ex-warn { font-size: 11px; color: #C66B3D; background: rgba(198,107,61,0.08); padding: 4px 8px; border-radius: 6px; }
h4 { font-size: 15px; margin-bottom: 8px; }
</style>
