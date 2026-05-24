<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AvatarPatient from '@/components/AvatarPatient.vue'
import AvatarDoctor from '@/components/AvatarDoctor.vue'
import { useRoute } from 'vue-router'
import { Picture, Microphone, VideoPause } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { doctorService } from '@/services/doctor'
import type { Patient, DoctorMessage } from '@/types'

const route = useRoute()
const auth = useAuthStore()
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function mediaSrc(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return apiBase + url
}

const patients = ref<Patient[]>([])
const messages = ref<DoctorMessage[]>([])
const selectedPatient = ref('')
const selectedPatientName = ref('')
const inputText = ref('')
const loadingPatients = ref(false)
const loadingMessages = ref(false)
const patientPage = ref(1)
const patientPageSize = ref(15)
const msgPage = ref(1)
const msgPageSize = ref(20)

const pagedPatients = computed(() => {
  const start = (patientPage.value - 1) * patientPageSize.value
  return patients.value.slice(start, start + patientPageSize.value)
})

const pagedMessages = computed(() => {
  const start = (msgPage.value - 1) * msgPageSize.value
  return messages.value.slice(start, start + msgPageSize.value)
})

onMounted(async () => {
  loadingPatients.value = true
  try {
    const res = await doctorService.getPatients()
    if (res.data.success) patients.value = res.data.patients
  } catch {
    ElMessage.error('加载患者列表失败')
  } finally {
    loadingPatients.value = false
  }

  const preselected = route.query.patient as string
  if (preselected) {
    selectedPatient.value = preselected
    selectedPatientName.value = patients.value.find((p) => p.username === preselected)?.real_name || preselected
    await loadMessages()
  }
})

async function loadMessages() {
  if (!selectedPatient.value) return
  loadingMessages.value = true
  try {
    const res = await doctorService.getMessages(selectedPatient.value)
    if (res.data.success) {
      messages.value = (res.data.messages || []).reverse().map((m: any) => ({
        ...m,
        sender: m.doctor_username === selectedPatient.value ? 'patient' : 'doctor',
      }))
    }
  } catch {
    ElMessage.error('加载消息失败')
  } finally {
    loadingMessages.value = false
  }
}

const sendingMsg = ref(false)
const imageInput = ref<HTMLInputElement>()
const uploadingMedia = ref(false)
const isRecording = ref(false)
const recordingSeconds = ref(0)
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let recordingTimer: ReturnType<typeof setInterval> | null = null

async function sendMessage(messageType = 'text', mediaUrl?: string) {
  const text = inputText.value.trim()
  if (!text && messageType === 'text') return
  if (!selectedPatient.value || sendingMsg.value) return

  sendingMsg.value = true
  try {
    await doctorService.sendMessage(selectedPatient.value, text || '[图片]', messageType, mediaUrl)
    inputText.value = ''
    await loadMessages()
  } catch {
    ElMessage.error('发送消息失败')
  } finally {
    sendingMsg.value = false
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

function selectPatient(username: string) {
  selectedPatient.value = username
  const p = patients.value.find((p) => p.username === username)
  selectedPatientName.value = p?.real_name || username
  loadMessages()
}
</script>

<template>
  <div class="messages">
    <div class="msg-shell stagger-item stagger-1">
      <div class="patient-list-panel glass-card">
        <h4>患者列表</h4>
        <div v-if="loadingPatients" class="loading">
          <el-skeleton :rows="6" animated />
        </div>
        <div
          v-for="p in pagedPatients"
          :key="p.username"
          class="patient-item"
          :class="{ selected: selectedPatient === p.username }"
          @click="selectPatient(p.username)"
        >
          <div class="patient-avatar">{{ (p.real_name || p.username)[0] }}</div>
          <div class="patient-meta">
            <span class="patient-name">{{ p.real_name || p.username }}</span>
            <el-tag
              :type="p.risk_level === '高风险' || p.risk_level === 'high' ? 'danger' : 'success'"
              size="small"
              round
            >
              {{ p.risk_level || '低风险' }}
            </el-tag>
          </div>
        </div>
        <div v-if="patients.length > patientPageSize" class="patient-pagination">
          <el-pagination
            v-model:current-page="patientPage"
            :page-size="patientPageSize"
            :total="patients.length"
            layout="prev, pager, next"
            small
          />
        </div>
      </div>

      <div class="chat-panel glass-card">
        <template v-if="!selectedPatient">
          <div class="no-chat">
            <el-empty description="请选择一位患者开始对话" :image-size="100" />
          </div>
        </template>
        <template v-else>
          <div class="chat-header">
            <div class="chat-patient-info">
              <AvatarPatient :size="32" />
              <span class="chat-patient-name">{{ selectedPatientName }}</span>
            </div>
          </div>
          <div class="chat-messages" v-loading="loadingMessages">
            <div v-if="messages.length === 0" class="empty">暂无消息，发送第一条吧</div>
            <div
              v-for="m in pagedMessages"
              :key="m.id"
              class="msg-row"
              :class="m.sender"
            >
              <AvatarPatient v-if="m.sender === 'patient'" :size="30" class="msg-avatar" />
              <div class="msg-bubble" :class="m.sender">
                <el-image v-if="(m as any).message_type === 'image' && (m as any).media_url" :src="mediaSrc((m as any).media_url)" :preview-src-list="[mediaSrc((m as any).media_url)]" class="msg-image" style="max-width:200px;max-height:160px;border-radius:12px;cursor:pointer" />
              <div v-if="(m as any).message_type === 'voice' && (m as any).media_url" class="msg-voice">
                <audio :src="mediaSrc((m as any).media_url)" controls style="height:32px;max-width:200px" />
              </div>
              <div class="msg-content" v-if="(m as any).message_type !== 'image' && (m as any).message_type !== 'voice'">{{ m.content }}</div>
              <div class="msg-time">{{ m.created_at?.slice(0, 16) }}</div>
              </div>
              <AvatarDoctor v-if="m.sender === 'doctor'" :size="30" class="msg-avatar" />
            </div>
          </div>
          <div v-if="messages.length > msgPageSize" class="msg-pagination">
            <el-pagination
              v-model:current-page="msgPage"
              :page-size="msgPageSize"
              :total="messages.length"
              layout="prev, pager, next"
              small
            />
          </div>
          <div class="chat-input-area">
            <input ref="imageInput" type="file" accept="image/*" style="display:none" @change="onImageSelected" />
            <div class="input-row">
              <el-button circle :disabled="sendingMsg || uploadingMedia" @click="sendImage" class="input-action-btn">
                <el-icon :size="18"><Picture /></el-icon>
              </el-button>
              <el-button circle :type="isRecording ? 'danger' : 'default'" :disabled="sendingMsg && !isRecording" @click="toggleRecording" class="input-action-btn" :class="{ recording: isRecording }">
                <el-icon v-if="!isRecording" :size="18"><Microphone /></el-icon>
                <el-icon v-else :size="18"><VideoPause /></el-icon>
              </el-button>
            <el-input
              v-model="inputText"
              :placeholder="isRecording ? '录音中 '+formatTime(recordingSeconds)+'...' : '输入消息...'"
              size="large"
              :disabled="isRecording"
              @keyup.enter="sendMessage('text')"
            >
              <template #suffix>
                <el-button
                  type="primary"
                  :disabled="!inputText.trim()"
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
  padding: 10px 0;
}

.patient-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.patient-item:hover, .patient-item.selected {
  background: var(--color-primary-bg);
}

.patient-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #F2EBDF;
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
  gap: 4px;
  min-width: 0;
}

.patient-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}

.chat-header {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

.chat-patient-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #F2EBDF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.chat-patient-name {
  font-size: 14px;
  font-weight: 500;
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
  border-radius: var(--radius-lg);
  font-size: 14px;
  line-height: 1.5;
}

.msg-bubble.doctor {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #F2EBDF;
  border-bottom-right-radius: 8px;
  box-shadow: 0 2px 8px rgba(96,108,56,0.2);
}

.msg-bubble.patient {
  align-self: flex-start;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-light);
  border-bottom-left-radius: 8px;
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
  justify-content: flex-end;
}

.msg-row.patient {
  justify-content: flex-start;
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

.patient-pagination {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.msg-pagination {
  display: flex;
  justify-content: center;
  padding: 8px 0 0;
}

.chat-input-area {
  padding: 14px 18px;
  border-top: 1px solid var(--color-border-light);
}

.chat-input-area .el-input {
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
