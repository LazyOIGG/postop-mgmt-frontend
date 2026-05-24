<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { doctorService, notificationService } from '@/services/doctor'
import type { DoctorMessage } from '@/types'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Picture, Microphone, VideoPause } from '@element-plus/icons-vue'
import AvatarPatient from '@/components/AvatarPatient.vue'
import AvatarDoctor from '@/components/AvatarDoctor.vue'

const auth = useAuthStore()
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function mediaSrc(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBase + url
}

const messages = ref<DoctorMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const sending = ref(false)
const imageInput = ref<HTMLInputElement>()
const uploadingMedia = ref(false)
const isRecording = ref(false)
const recordingSeconds = ref(0)
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let recordingTimer: ReturnType<typeof setInterval> | null = null
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

async function sendMessage(messageType = 'text', mediaUrl?: string) {
  const text = inputText.value.trim()
  if (!text && messageType === 'text') return
  if (!username || sending.value) return

  sending.value = true
  try {
    await doctorService.sendMessageFromPatient(username, text || '[图片]', messageType, mediaUrl)
    inputText.value = ''
    await fetchMessages()
    scrollToBottom()
  } catch {
    ElMessage.error('发送消息失败')
  } finally {
    sending.value = false
  }
}

async function sendImage() { imageInput.value?.click() }
async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  uploadingMedia.value = true
  try {
    const res = await doctorService.uploadImage(file)
    if (res.data.success) await sendMessage('image', res.data.url)
  } catch { ElMessage.error('图片上传失败') }
  finally { uploadingMedia.value = false }
}

async function toggleRecording() {
  if (isRecording.value) stopRecording()
  else await startRecording()
}
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    recordedChunks = []
    mediaRecorder.ondataavailable = (e: any) => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(recordedChunks, { type: 'audio/webm' })
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      uploadingMedia.value = true
      try {
        const res = await doctorService.uploadVoice(file)
        if (res.data.success) await sendMessage('voice', res.data.url)
      } catch { ElMessage.error('语音上传失败') }
      finally { uploadingMedia.value = false }
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingSeconds.value = 0
    recordingTimer = setInterval(() => { recordingSeconds.value++; if (recordingSeconds.value >= 60) stopRecording() }, 1000)
  } catch { ElMessage.error('无法访问麦克风') }
}
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  isRecording.value = false
  if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null }
}
function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return m + ':' + s
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
          <el-image v-if="(m as any).message_type === 'image' && (m as any).media_url" :src="mediaSrc((m as any).media_url)" :preview-src-list="[mediaSrc((m as any).media_url)]" class="msg-image" style="max-width:200px;max-height:160px;border-radius:12px;cursor:pointer" />
          <div v-if="(m as any).message_type === 'voice' && (m as any).media_url" class="msg-voice">
            <audio :src="mediaSrc((m as any).media_url)" controls style="height:32px;max-width:200px" />
          </div>
          <div class="msg-content" v-if="(m as any).message_type !== 'image' && (m as any).message_type !== 'voice'">{{ m.content }}</div>
          <div class="msg-time">{{ m.created_at?.slice(0, 16) }}</div>
        </div>
        <AvatarPatient v-if="m.sender === 'patient'" :size="30" class="msg-avatar" />
      </div>
    </div>

    <div class="msg-input-area">
      <input ref="imageInput" type="file" accept="image/*" style="display:none" @change="onImageSelected" />
      <div class="input-row">
        <el-button circle :disabled="sending || uploadingMedia" @click="sendImage" class="input-action-btn">
          <el-icon :size="18"><Picture /></el-icon>
        </el-button>
        <el-button circle :type="isRecording ? 'danger' : 'default'" :disabled="sending && !isRecording" @click="toggleRecording" class="input-action-btn" :class="{ recording: isRecording }">
          <el-icon v-if="!isRecording" :size="18"><Microphone /></el-icon>
          <el-icon v-else :size="18"><VideoPause /></el-icon>
        </el-button>
      <el-input
        v-model="inputText"
        :placeholder="isRecording ? '录音中 '+formatTime(recordingSeconds)+'...' : '输入消息联系医生...'"
        size="large"
        :disabled="sending || isRecording"
        @keyup.enter="sendMessage('text')"
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
      <div v-if="isRecording" class="recording-bar">
        <div class="recording-pulse"></div>
        <span>录音中 {{ formatTime(recordingSeconds) }}</span>
      </div>
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

.msg-image { max-width: 200px; max-height: 160px; border-radius: 12px; display: block; margin-bottom: 4px; }
.msg-voice { margin-bottom: 4px; }
.input-row { display: flex; align-items: center; gap: 8px; }
.input-action-btn { flex-shrink: 0; width: 40px; height: 40px; border-color: var(--color-border); transition: all 0.3s ease; }
.input-action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.input-action-btn.recording { animation: recPulse 1s ease-in-out infinite; }
.recording-bar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; margin-top: 6px; background: var(--color-danger-bg); border-radius: var(--radius-sm); font-size: 12px; color: var(--color-danger); }
.recording-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); animation: blink 1s infinite; }
@keyframes recPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(198,107,61,0.4); } 50% { box-shadow: 0 0 0 8px rgba(198,107,61,0); } }
@keyframes blink { 0%,100% { opacity: 0.2; } 50% { opacity: 0.8; } }
</style>
