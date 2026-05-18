<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { checkinService } from '@/services/checkin'
import type { DailyCheckinRequest, CheckinRecord } from '@/types'
import { Check } from '@element-plus/icons-vue'

const today = new Date().toISOString().slice(0, 10)
const submitted = ref(false)
const history = ref<CheckinRecord[]>([])
const loading = ref(false)
const historyPage = ref(1)
const historyPageSize = ref(7)

const pagedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize.value
  return history.value.slice(start, start + historyPageSize.value)
})

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
    ElMessage.error('打卡提交失败，请稍后重试')
  }
}

async function fetchHistory() {
  loading.value = true
  try {
    const res = await checkinService.getRecords()
    if (res.data.success) history.value = res.data.records || []
  } catch {
    ElMessage.error('加载打卡记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchHistory())
</script>

<template>
  <div class="checkin">
    <div v-if="!submitted" class="checkin-form-section">
      <h2 class="stagger-item stagger-1">每日健康打卡</h2>
      <p class="date-label stagger-item stagger-1">{{ today }}</p>

      <el-card class="form-card stagger-item stagger-2" shadow="never">
        <div class="form-group">
          <label>体温 (°C)</label>
          <el-input-number
            v-model="form.temperature"
            :precision="1"
            :step="0.1"
            :min="35"
            :max="42"
            placeholder="36.5"
            controls-position="right"
            style="width: 100%"
          />
        </div>

        <div class="form-group">
          <label>血压</label>
          <el-input v-model="form.blood_pressure" placeholder="120/80" size="large" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>血糖 (mmol/L)</label>
            <el-input-number
              v-model="form.blood_sugar"
              :precision="1"
              :step="0.1"
              :min="0"
              placeholder="5.6"
              controls-position="right"
              style="width: 100%"
            />
          </div>
          <div class="form-group">
            <label>心率 (bpm)</label>
            <el-input-number
              v-model="form.heart_rate"
              :precision="0"
              :step="1"
              :min="30"
              :max="200"
              placeholder="72"
              controls-position="right"
              style="width: 100%"
            />
          </div>
        </div>

        <div class="form-group">
          <label>睡眠质量</label>
          <el-radio-group v-model="form.sleep_status">
            <el-radio-button v-for="s in sleepOptions" :key="s" :value="s">{{ s }}</el-radio-button>
          </el-radio-group>
        </div>

        <div class="form-group">
          <label>饮食状况</label>
          <el-radio-group v-model="form.diet_status">
            <el-radio-button v-for="s in statusOptions" :key="s" :value="s">{{ s }}</el-radio-button>
          </el-radio-group>
        </div>

        <div class="form-group">
          <label>运动状况</label>
          <el-radio-group v-model="form.exercise_status">
            <el-radio-button v-for="s in statusOptions" :key="s" :value="s">{{ s }}</el-radio-button>
          </el-radio-group>
        </div>

        <div class="form-group">
          <label>症状描述</label>
          <el-input
            v-model="form.symptoms"
            type="textarea"
            :rows="2"
            placeholder="描述您今天的感觉..."
          />
        </div>

        <div class="form-group checkbox-row">
          <el-checkbox v-model="form.medication_taken" size="large">
            今日已按时服药
          </el-checkbox>
        </div>

        <div class="form-group">
          <label>备注</label>
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="其他想记录的内容..."
          />
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          @click="submitCheckin"
        >
          提交打卡
        </el-button>
      </el-card>
    </div>

    <div v-else class="success-section stagger-item stagger-1">
      <div class="success-card glass-card">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="var(--color-primary)" stroke-width="3"/>
            <path d="M15 24l6 6 12-12" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>打卡成功</h3>
        <p>今天的健康数据已记录</p>
        <el-button type="primary" @click="submitted = false" round>继续打卡</el-button>
      </div>
    </div>

    <section v-if="history.length > 0" class="history-section stagger-item stagger-3" v-loading="loading">
      <h3>打卡记录</h3>
      <el-timeline>
        <el-timeline-item
          v-for="r in pagedHistory"
          :key="r.id"
          :timestamp="r.checkin_date"
          placement="top"
          :icon="Check"
          color="#606C38"
        >
          <div class="timeline-content">
            <span v-if="r.temperature">{{ r.temperature }}°C</span>
            <span v-if="r.blood_pressure">{{ r.blood_pressure }}</span>
            <span v-if="r.heart_rate">{{ r.heart_rate }} bpm</span>
            <span v-if="r.sleep_status">睡眠: {{ r.sleep_status }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-if="history.length > historyPageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="historyPage"
          :page-size="historyPageSize"
          :total="history.length"
          layout="prev, pager, next"
          small
        />
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
  border-radius: var(--radius-lg);
  --el-card-padding: 20px;
}

.form-card .el-card__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.checkbox-row {
  flex-direction: row;
}

.submit-btn {
  letter-spacing: 3px;
  font-size: 16px;
  height: 46px;
  border-radius: var(--radius-md) !important;
}

.success-section {
  padding: 20px 0;
}

.success-card {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon {
  animation: breathe 3s ease-in-out infinite;
}

.success-card h3 {
  font-size: 20px;
}

.success-card p {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.history-section h3 {
  font-size: 18px;
  margin-bottom: 12px;
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 12px;
}

.timeline-content span {
  background: var(--color-surface);
  padding: 3px 10px;
  border-radius: 16px;
  border: 1px solid var(--color-border-light);
}
</style>
