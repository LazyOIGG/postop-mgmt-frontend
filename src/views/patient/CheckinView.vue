<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { checkinService } from '@/services/checkin'
import type { DailyCheckinRequest, CheckinRecord } from '@/types'

const today = new Date().toISOString().slice(0, 10)
const submitted = ref(false)
const history = ref<CheckinRecord[]>([])

const form = ref<DailyCheckinRequest>({
  checkin_date: today,
  symptoms: '',
  temperature: undefined,
  blood_pressure: '',
  blood_sugar: undefined,
  heart_rate: undefined,
  sleep_status: '',
  diet_status: '',
  exercise_status: '',
  medication_taken: false,
  note: '',
})

const sleepOptions = ['良好', '一般', '较差']
const statusOptions = ['良好', '一般', '较差']

async function submitCheckin() {
  try {
    await checkinService.submit(form.value)
    submitted.value = true
    await fetchHistory()
  } catch {
    // silent
  }
}

async function fetchHistory() {
  try {
    const res = await checkinService.getRecords()
    if (res.data.success) history.value = res.data.records || []
  } catch {
    // silent
  }
}

onMounted(() => fetchHistory())
</script>

<template>
  <div class="checkin">
    <div v-if="!submitted" class="checkin-form-section">
      <h2 class="stagger-item stagger-1">每日健康打卡</h2>
      <p class="date-label stagger-item stagger-1">{{ today }}</p>

      <div class="form-card glass-card stagger-item stagger-2">
        <div class="form-group">
          <label>体温 (°C)</label>
          <input v-model.number="form.temperature" type="number" step="0.1" class="field-input" placeholder="36.5" />
        </div>

        <div class="form-group">
          <label>血压</label>
          <input v-model="form.blood_pressure" type="text" class="field-input" placeholder="120/80" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>血糖 (mmol/L)</label>
            <input v-model.number="form.blood_sugar" type="number" step="0.1" class="field-input" placeholder="5.6" />
          </div>
          <div class="form-group">
            <label>心率 (bpm)</label>
            <input v-model.number="form.heart_rate" type="number" class="field-input" placeholder="72" />
          </div>
        </div>

        <div class="form-group">
          <label>睡眠质量</label>
          <div class="chip-row">
            <button
              v-for="s in sleepOptions"
              :key="s"
              class="chip"
              :class="{ selected: form.sleep_status === s }"
              @click="form.sleep_status = s"
            >{{ s }}</button>
          </div>
        </div>

        <div class="form-group">
          <label>饮食状况</label>
          <div class="chip-row">
            <button
              v-for="s in statusOptions"
              :key="s"
              class="chip"
              :class="{ selected: form.diet_status === s }"
              @click="form.diet_status = s"
            >{{ s }}</button>
          </div>
        </div>

        <div class="form-group">
          <label>运动状况</label>
          <div class="chip-row">
            <button
              v-for="s in statusOptions"
              :key="s"
              class="chip"
              :class="{ selected: form.exercise_status === s }"
              @click="form.exercise_status = s"
            >{{ s }}</button>
          </div>
        </div>

        <div class="form-group">
          <label>症状描述</label>
          <textarea v-model="form.symptoms" class="field-input textarea" placeholder="描述您今天的感觉..." rows="2"></textarea>
        </div>

        <div class="form-group checkbox-row">
          <label class="checkbox-label">
            <input v-model="form.medication_taken" type="checkbox" />
            <span>今日已按时服药</span>
          </label>
        </div>

        <div class="form-group">
          <label>备注</label>
          <textarea v-model="form.note" class="field-input textarea" placeholder="其他想记录的内容..." rows="2"></textarea>
        </div>

        <button class="submit-btn" @click="submitCheckin">提交打卡</button>
      </div>
    </div>

    <div v-else class="success-section">
      <div class="success-card glass-card stagger-item stagger-1">
        <div class="success-icon">✓</div>
        <h2>打卡成功</h2>
        <p>今天的健康数据已记录</p>
        <button class="submit-btn outline" @click="submitted = false">继续打卡</button>
      </div>
    </div>

    <section v-if="history.length > 0" class="history-section stagger-item stagger-3">
      <h3>打卡记录</h3>
      <div class="history-list">
        <div v-for="r in history.slice(0, 7)" :key="r.id" class="history-item glass-card">
          <div class="history-date">{{ r.checkin_date }}</div>
          <div class="history-data">
            <span v-if="r.temperature">🌡 {{ r.temperature }}°C</span>
            <span v-if="r.blood_pressure">💓 {{ r.blood_pressure }}</span>
            <span v-if="r.heart_rate">❤️ {{ r.heart_rate }} bpm</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.checkin {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.date-label {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.form-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.field-input {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-family: var(--font-body);
  background: var(--color-bg);
  outline: none;
  transition: border-color 0.2s;
}

.field-input:focus {
  border-color: var(--color-primary);
}

.textarea {
  resize: vertical;
}

.chip-row {
  display: flex;
  gap: 8px;
}

.chip {
  padding: 7px 18px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s;
}

.chip.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.checkbox-row {
  flex-direction: row;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-body);
  letter-spacing: 2px;
  cursor: pointer;
  transition: transform 0.15s;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn.outline {
  background: transparent;
  color: var(--color-primary-dark);
  border: 1.5px solid var(--color-primary);
}

.success-section {
  padding: 40px 0;
  text-align: center;
}

.success-card {
  padding: 48px 24px;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  font-size: 30px;
  border-radius: 50%;
}

.success-card h2 {
  margin-bottom: 6px;
}

.success-card p {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.history-section h3 {
  font-size: 18px;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary-dark);
}

.history-data {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
