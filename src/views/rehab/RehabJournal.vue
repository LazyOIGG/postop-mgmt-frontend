<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRehabStore } from '@/stores/rehab'
import { ElMessage } from 'element-plus'

const store = useRehabStore()
const mood = ref('okay')
const painLevel = ref(5)
const content = ref('')
const sleepQuality = ref(3)
const appetite = ref(3)
const energyLevel = ref(3)
const questions = ref('')
const saving = ref(false)

const moods = [
  { key: 'great', emoji: '😄', label: '很好' },
  { key: 'good', emoji: '😊', label: '不错' },
  { key: 'okay', emoji: '😐', label: '一般' },
  { key: 'bad', emoji: '😔', label: '较差' },
  { key: 'terrible', emoji: '😢', label: '很差' },
]

async function loadJournals() {
  if (store.activePlan?.id) {
    await store.fetchJournals(store.activePlan.id)
  }
}

async function handleSave() {
  if (!store.activePlan?.id) return
  saving.value = true
  try {
    await store.saveJournal(store.activePlan.id, {
      journal_date: new Date().toISOString().slice(0, 10),
      mood: mood.value,
      pain_level: painLevel.value,
      content: content.value,
      sleep_quality: sleepQuality.value,
      appetite: appetite.value,
      energy_level: energyLevel.value,
      questions_for_doctor: questions.value,
    })
    ElMessage.success('日志已保存')
    content.value = ''
    questions.value = ''
    await loadJournals()
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

function starRating(v: number) { return '★'.repeat(v) + '☆'.repeat(5 - v) }

onMounted(() => loadJournals())
</script>

<template>
  <div class="journal-view">
    <!-- Today's journal form -->
    <section class="glass-card">
      <h3>📝 今日康复日志</h3>

      <!-- Mood -->
      <div class="form-row">
        <label>今日心情</label>
        <div class="mood-picker">
          <button v-for="m in moods" :key="m.key" class="mood-btn" :class="{ active: mood === m.key }" @click="mood = m.key">
            <span class="mood-emoji">{{ m.emoji }}</span>
            <span class="mood-label">{{ m.label }}</span>
          </button>
        </div>
      </div>

      <!-- Pain -->
      <div class="form-row">
        <label>疼痛评分: {{ painLevel }}/10</label>
        <el-slider v-model="painLevel" :min="0" :max="10" show-stops />
      </div>

      <!-- Sleep/Appetite/Energy -->
      <div class="form-row triple">
        <div><label>睡眠</label><span class="stars">{{ starRating(sleepQuality) }}</span><el-slider v-model="sleepQuality" :min="1" :max="5" /></div>
        <div><label>食欲</label><span class="stars">{{ starRating(appetite) }}</span><el-slider v-model="appetite" :min="1" :max="5" /></div>
        <div><label>精力</label><span class="stars">{{ starRating(energyLevel) }}</span><el-slider v-model="energyLevel" :min="1" :max="5" /></div>
      </div>

      <!-- Content -->
      <div class="form-row">
        <label>今天做了什么...</label>
        <el-input v-model="content" type="textarea" :rows="4" placeholder="记录今天的感觉、活动和进展..." maxlength="2000" show-word-limit />
      </div>

      <!-- Questions -->
      <div class="form-row">
        <label>想问医生的问题</label>
        <el-input v-model="questions" placeholder="有什么想咨询医生的？" maxlength="500" />
      </div>

      <el-button type="primary" size="large" :loading="saving" @click="handleSave" style="width:100%">保存日志</el-button>
    </section>

    <!-- History -->
    <section class="glass-card" v-if="store.journals.length > 0">
      <h3>📋 历史日志</h3>
      <div v-for="j in store.journals" :key="j.id" class="journal-entry">
        <div class="entry-header">
          <span class="entry-date">{{ j.journal_date }}</span>
          <span class="entry-mood">{{ moods.find(m => m.key === j.mood)?.emoji || '😐' }}</span>
          <span class="entry-pain">疼痛: {{ j.pain_level }}/10</span>
        </div>
        <p v-if="j.content" class="entry-text">{{ j.content.slice(0, 150) }}{{ j.content.length > 150 ? '...' : '' }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.journal-view { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
.glass-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 18px; border: 1px solid var(--color-border-light); }
.glass-card h3 { font-size: 16px; margin-bottom: 16px; }
.form-row { margin-bottom: 16px; }
.form-row label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--color-text); }
.form-row.triple { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.form-row.triple label { font-size: 12px; }
.stars { color: #C08E3A; font-size: 14px; }
.mood-picker { display: flex; gap: 6px; }
.mood-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 10px; border: 2px solid var(--color-border-light); border-radius: var(--radius-md); background: transparent; cursor: pointer; transition: all 0.2s; }
.mood-btn:hover { border-color: var(--color-primary); }
.mood-btn.active { border-color: var(--color-primary); background: var(--color-primary-bg); }
.mood-emoji { font-size: 24px; }
.mood-label { font-size: 10px; color: var(--color-text-secondary); }
.journal-entry { padding: 12px 0; border-bottom: 1px solid var(--color-border-light); }
.journal-entry:last-child { border-bottom: none; }
.entry-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.entry-date { font-size: 13px; font-weight: 600; }
.entry-pain { font-size: 12px; color: var(--color-text-secondary); }
.entry-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
</style>
