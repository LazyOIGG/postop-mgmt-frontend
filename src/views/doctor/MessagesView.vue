<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { doctorService } from '@/services/doctor'
import type { Patient, DoctorMessage } from '@/types'

const route = useRoute()
const auth = useAuthStore()

const patients = ref<Patient[]>([])
const messages = ref<DoctorMessage[]>([])
const selectedPatient = ref<string>('')
const inputText = ref('')
const loadingPatients = ref(false)

onMounted(async () => {
  loadingPatients.value = true
  try {
    const res = await doctorService.getPatients()
    if (res.data.success) patients.value = res.data.patients
  } catch {
    // silent
  } finally {
    loadingPatients.value = false
  }

  const preselected = route.query.patient as string
  if (preselected) {
    selectedPatient.value = preselected
    await loadMessages()
  }
})

async function loadMessages() {
  if (!selectedPatient.value) return
  try {
    const res = await doctorService.getMessages(selectedPatient.value)
    if (res.data.success) messages.value = res.data.messages
  } catch {
    // silent
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || !selectedPatient.value) return

  try {
    const res = await doctorService.sendMessage(selectedPatient.value, text)
    if (res.data.success) {
      messages.value.push(res.data.message as DoctorMessage)
      inputText.value = ''
    }
  } catch {
    // silent
  }
}

function selectPatient(username: string) {
  selectedPatient.value = username
  loadMessages()
}
</script>

<template>
  <div class="messages">
    <div class="msg-shell stagger-item stagger-1">
      <div class="patient-list-panel glass-card">
        <h4>患者列表</h4>
        <div v-if="loadingPatients" class="loading">加载中...</div>
        <div
          v-for="p in patients"
          :key="p.username"
          class="patient-item"
          :class="{ selected: selectedPatient === p.username }"
          @click="selectPatient(p.username)"
        >
          <div class="patient-avatar">{{ (p.real_name || p.username)[0] }}</div>
          <div class="patient-meta">
            <span class="patient-name">{{ p.real_name || p.username }}</span>
            <span class="patient-risk">{{ p.risk_level || '低风险' }}</span>
          </div>
        </div>
      </div>

      <div class="chat-panel glass-card">
        <template v-if="!selectedPatient">
          <div class="no-chat">请选择一位患者开始对话</div>
        </template>
        <template v-else>
          <div class="chat-messages">
            <div v-if="messages.length === 0" class="empty">暂无消息</div>
            <div
              v-for="m in messages"
              :key="m.id"
              class="msg-bubble"
              :class="m.sender"
            >
              <div class="msg-content">{{ m.content }}</div>
              <div class="msg-time">{{ m.created_at?.slice(0, 16) }}</div>
            </div>
          </div>
          <div class="chat-input-area">
            <input
              v-model="inputText"
              type="text"
              class="msg-input"
              placeholder="输入消息..."
              @keyup.enter="sendMessage"
            />
            <button class="msg-send" @click="sendMessage" :disabled="!inputText.trim()">发送</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages {
  height: calc(100vh - 140px);
}

.msg-shell {
  display: flex;
  height: 100%;
  gap: 16px;
}

.patient-list-panel {
  width: 240px;
  flex-shrink: 0;
  padding: 16px;
  overflow-y: auto;
}

.patient-list-panel h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--color-text-secondary);
}

.loading {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 20px;
  font-size: 13px;
}

.patient-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.patient-item:hover, .patient-item.selected {
  background: var(--color-bg);
}

.patient-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.patient-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.patient-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.patient-risk {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.no-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px;
  font-size: 13px;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.msg-bubble.doctor {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-bubble.patient {
  align-self: flex-start;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 4px;
}

.msg-content {
  white-space: pre-wrap;
}

.msg-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--color-border);
}

.msg-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 14px;
  font-family: var(--font-body);
  background: var(--color-bg);
  outline: none;
}

.msg-input:focus {
  border-color: var(--color-primary);
}

.msg-send {
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.msg-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
