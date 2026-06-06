<script setup lang="ts">
import { computed } from 'vue'
import { FirstAidKit, Promotion, Check } from '@element-plus/icons-vue'

const props = defineProps<{
  currentPhase: string
  phaseStats: Record<string, { total: number; completed: number }>
}>()

const phases = ['急性期', '恢复期', '巩固期'] as const
const phaseColors: Record<string, string> = {
  '急性期': '#C66B3D', '恢复期': '#C08E3A', '巩固期': '#606C38'
}
const phaseIcons: Record<string, any> = {
  '急性期': FirstAidKit, '恢复期': Promotion, '巩固期': Check
}

const currentIdx = computed(() => phases.indexOf(props.currentPhase as any))

function phaseProgress(phase: string) {
  const s = props.phaseStats[phase]
  if (!s || s.total === 0) return 0
  return Math.round((s.completed / s.total) * 100)
}

function isComplete(phase: string) {
  const s = props.phaseStats[phase]
  return s && s.total > 0 && s.total === s.completed
}
</script>

<template>
  <div class="timeline">
    <div
      v-for="(phase, idx) in phases"
      :key="phase"
      class="tl-phase"
      :class="{ active: idx === currentIdx, done: idx < currentIdx || isComplete(phase) }"
    >
      <!-- Connector line -->
      <div v-if="idx < phases.length - 1" class="tl-line" :style="{
        background: idx < currentIdx || isComplete(phase) ? phaseColors[phase] : 'var(--color-border-light)'
      }" />

      <!-- Dot -->
      <div class="tl-dot" :style="{
        background: idx <= currentIdx || isComplete(phase) ? phaseColors[phase] : 'var(--color-border-light)'
      }">
        <el-icon v-if="idx < currentIdx || isComplete(phase)" :size="12"><Check /></el-icon>
        <el-icon v-else-if="idx === currentIdx" :size="12"><component :is="phaseIcons[phase]" /></el-icon>
      </div>

      <!-- Info -->
      <div class="tl-info">
        <span class="tl-name">{{ phase }}</span>
        <span class="tl-progress">{{ phaseProgress(phase) }}%</span>
        <span class="tl-count">
          {{ phaseStats[phase]?.completed || 0 }}/{{ phaseStats[phase]?.total || 0 }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  align-items: flex-start;
  padding: 8px 0 16px;
  position: relative;
}
.tl-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.tl-line {
  position: absolute;
  top: 13px;
  left: 50%;
  width: 100%;
  height: 3px;
  border-radius: 2px;
  z-index: 0;
  transition: background 0.4s ease;
}
.tl-phase:last-child .tl-line { display: none; }
.tl-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1;
  transition: all 0.4s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.tl-phase.active .tl-dot {
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
  50% { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
}
.tl-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
}
.tl-name { font-size: 13px; font-weight: 600; }
.tl-progress { font-size: 11px; color: var(--color-primary); font-weight: 700; }
.tl-count { font-size: 10px; color: var(--color-text-tertiary); }
</style>
