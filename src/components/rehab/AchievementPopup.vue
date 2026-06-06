<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { AchievementDef } from '@/types'

const props = defineProps<{ achievements: AchievementDef[] }>()
const emit = defineEmits<{ dismissed: [] }>()

const visible = ref(false)
const current = ref<AchievementDef | null>(null)
const index = ref(0)
const showAnim = ref(false)

function showNext() {
  if (index.value >= props.achievements.length) {
    visible.value = false
    emit('dismissed')
    return
  }
  current.value = props.achievements[index.value]
  showAnim.value = false
  requestAnimationFrame(() => { showAnim.value = true })
  index.value++
}

watch(() => props.achievements, (val) => {
  if (val && val.length > 0) {
    index.value = 0
    visible.value = true
    showNext()
  }
}, { immediate: true })

function onClose() {
  showNext()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div v-if="visible && current" class="popup-overlay" @click="onClose">
        <div class="popup-card" :class="{ 'pop-enter': showAnim }" @click.stop>
          <div class="popup-icon">🏆</div>
          <div class="popup-badge-name">{{ current.name }}</div>
          <div class="popup-desc">{{ current.description }}</div>
          <div class="popup-points">+{{ current.points }} 积分</div>
          <el-button round type="primary" size="large" @click="onClose" style="margin-top:16px">
            太棒了！
          </el-button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popup-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.popup-card {
  background: linear-gradient(135deg, #fff9e6, #fff3cc);
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(192,142,58,0.3);
  transform: scale(0.5);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.popup-card.pop-enter { transform: scale(1); }
.popup-icon { font-size: 64px; margin-bottom: 12px; animation: bounce 0.6s ease infinite alternate; }
@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
.popup-badge-name { font-size: 22px; font-weight: 800; color: #5C4033; margin-bottom: 6px; }
.popup-desc { font-size: 14px; color: #8B7355; margin-bottom: 8px; }
.popup-points { font-size: 18px; font-weight: 700; color: #C08E3A; }

.popup-fade-enter-active { transition: opacity 0.3s ease; }
.popup-fade-leave-active { transition: opacity 0.2s ease; }
.popup-fade-enter-from, .popup-fade-leave-to { opacity: 0; }
</style>
