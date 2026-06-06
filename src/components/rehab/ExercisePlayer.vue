<script setup lang="ts">
import { computed } from 'vue'
import type { RehabExercise } from '@/types'

const props = defineProps<{ exercise: RehabExercise }>()
const emit = defineEmits<{ close: [] }>()

const diffLabel: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
const catLabel: Record<string, string> = {
  stretching: '拉伸', strength: '力量', balance: '平衡',
  mobility: '活动度', breathing: '呼吸', other: '其他'
}
const phaseColor: Record<string, string> = {
  '急性期': '#C66B3D', '恢复期': '#C08E3A', '巩固期': '#606C38'
}

const hasVideo = computed(() => !!props.exercise.video_url)
const hasImages = computed(() => props.exercise.image_urls?.length > 0)
</script>

<template>
  <el-dialog
    :model-value="true"
    :title="exercise.title"
    width="95%"
    :close-on-click-modal="false"
    @close="emit('close')"
    destroy-on-close
  >
    <div class="player-content">
      <!-- Video -->
      <div v-if="hasVideo" class="video-wrap">
        <video :src="exercise.video_url" controls style="width:100%;border-radius:12px" />
      </div>

      <!-- Info tags -->
      <div class="info-tags">
        <el-tag :color="phaseColor[exercise.phase_suitable]" effect="dark" size="small">
          {{ exercise.phase_suitable }}
        </el-tag>
        <el-tag type="info" size="small">{{ catLabel[exercise.category] }}</el-tag>
        <el-tag type="warning" size="small">{{ diffLabel[exercise.difficulty] }}</el-tag>
        <el-tag size="small">⏱ {{ exercise.duration_minutes }}分钟</el-tag>
        <el-tag size="small">🔁 {{ exercise.repetitions }}次</el-tag>
      </div>

      <!-- Description -->
      <div class="desc-block">
        <h4>📖 说明</h4>
        <p>{{ exercise.description }}</p>
      </div>

      <!-- Steps -->
      <div v-if="exercise.steps?.length" class="steps-block">
        <h4>📋 分步指导</h4>
        <div v-for="(step, i) in exercise.steps" :key="i" class="step-item">
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-text">{{ step }}</span>
        </div>
      </div>

      <!-- Precautions -->
      <div v-if="exercise.precautions" class="warn-block">
        <h4>⚠️ 注意事项</h4>
        <p>{{ exercise.precautions }}</p>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.player-content { display: flex; flex-direction: column; gap: 16px; }
.info-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.desc-block h4, .steps-block h4, .warn-block h4 { font-size: 14px; margin-bottom: 8px; }
.desc-block p { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary); margin: 0; }
.step-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--color-border-light); }
.step-num { width: 24px; height: 24px; background: var(--color-primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.step-text { font-size: 14px; line-height: 1.6; }
.warn-block { background: rgba(198,107,61,0.08); border-radius: var(--radius-md); padding: 14px; }
.warn-block p { font-size: 13px; color: #C66B3D; margin: 0; line-height: 1.6; }
</style>
