<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { doctorService, notificationService } from '@/services/doctor'
import type { DoctorMessage } from '@/types'
import { ElMessage } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import AvatarPatient from '@/components/AvatarPatient.vue'
import AvatarDoctor from '@/components/AvatarDoctor.vue'

const auth = useAuthStore()
const messages = ref<DoctorMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const sending = ref(false)
const messagesContainer = ref<HTMLElement>()

const username = auth.user?.username || ''

async function fetchMessages() {
  if (!username) return
  loading.value = true
  try {
    const res = await doctorService.getMessages(username)
    if (res.data.success) {
      messages.value = (res.data.messages || []).reverse().map((m: any) => ({
        ...m,
        sender: m.doctor_username === username ? 'patient' : 'doctor',
      })) as DoctorMessage[]
    }
  } catch {
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || !username || sending.value) return

  sending.value = true
  try {
    await doctorService.sendMessageFromPatient(username, text)
    inputText.value = ''
    await fetchMessages()
    scrollToBottom()
  } catch {
    ElMessage.error('发送消息失败')
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(async () => {
  await fetchMessages()
  scrollToBottom()
  notificationService.markAllRead().catch(() => {})
})
</script>

<template>
  <div class="doctor-messages">
    <div class="msg-header">
      <div class="msg-header-left">
        <el-icon :size="18"><ChatDotRound /></el-icon>
        <span>医生消息</span>
      </div>
      <span class="msg-count" v-if="messages.length">{{ messages.length }} 条消息</span>
    </div>

    <div ref="messagesContainer" class="msg-container" v-loading="loading">
      <div v-if="messages.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无消息，发送消息联系医生" :image-size="80" />
      </div>
      <div
        v-for="m in messages"
        :key="m.id"
        class="msg-row"
        :class="m.sender"
      >
        <AvatarDoctor v-if="m.sender === 'doctor'" :size="30" class="msg-avatar" />
        <div class="msg-bubble" :class="m.sender">
          <div class="msg-content">{{ m.content }}</div>
          <div class="msg-time">{{ m.created_at?.slice(0, 16) }}</div>
        </div>
        <AvatarPatient v-if="m.sender === 'patient'" :size="30" class="msg-avatar" />
      </div>
    </div>

    <div class="msg-input-area">
      <el-input
        v-model="inputText"
        placeholder="输入消息联系医生..."
        size="large"
        :disabled="sending"
        @keyup.enter="sendMessage"
      >
        <template #suffix>
          <el-button
            type="primary"
            :disabled="!inputText.trim() || sending"
            :loading="sending"
            size="small"
            round
            @click="sendMessage"
          >
            发送
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<style scoped>
.doctor-messages {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.msg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.msg-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.msg-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.msg-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  line-height: 1.5;
}

.msg-bubble.doctor {
  align-self: flex-start;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-bottom-left-radius: 8px;
}

.msg-bubble.patient {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #F2EBDF;
  border-bottom-right-radius: 8px;
  border: 1px solid var(--color-primary-dark);
  box-shadow: 0 2px 10px rgba(96,108,56,0.2);
}

.msg-content {
  white-space: pre-wrap;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-row.doctor {
  justify-content: flex-start;
}

.msg-row.patient {
  justify-content: flex-end;
}

.msg-avatar {
  flex-shrink: 0;
  margin-bottom: 2px;
}

.msg-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
}

.msg-input-area {
  padding-top: 10px;
  margin-top: auto;
}

.msg-input-area .el-input {
  --el-input-border-radius: 20px;
}
</style>
