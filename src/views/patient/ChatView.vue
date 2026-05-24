<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { chatService } from '@/services/chat'
import { multimodalService } from '@/services/multimodal'
import { healthService } from '@/services/health'
import { useWebSocket } from '@/composables/useWebSocket'
import { useVoiceRecorder } from '@/composables/useVoiceRecorder'
import { Plus, ChatDotRound, Picture, Microphone, VideoPause, Edit, Delete, Headset } from '@element-plus/icons-vue'
import { useMediaUrl } from '@/composables/useMediaUrl'

const auth = useAuthStore()
const chatStore = useChatStore()

const inputText = ref('')
const isStreaming = ref(false)
const showSessions = ref(false)
const messagesContainer = ref<HTMLElement>()

// Image upload
const imageInput = ref<HTMLInputElement>()
const uploadingImage = ref(false)

// Voice recording
const voiceRecorder = useVoiceRecorder(async (blob, seconds) => {
  const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
  await handleVoiceResult(file, seconds)
})
const { isRecording, recordingSeconds, toggleRecording, stopRecording, formatTime } = voiceRecorder

interface ChatMsg {
  role: 'user' | 'assistant' | 'system'
  content: string
  agent?: string
  type?: 'text' | 'image' | 'voice'
  imageUrl?: string
}

const messages = ref<ChatMsg[]>([])

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws'
const wsHost = apiBase.replace(/^https?:\/\//, '')
const wsUrl = `${wsProtocol}://${wsHost}/api/v1/chat/agent/ws`
const { isConnected, lastMessage, connect, send, disconnect } = useWebSocket(
  wsUrl,
  auth.token,
)

onMounted(async () => {
  if (auth.user?.username) {
    await chatStore.fetchSessions(auth.user.username)
  }
  connect()
})

onUnmounted(() => {
  voiceRecorder.stopRecording()
  disconnect()
})

watch(lastMessage, (data: any) => {
  if (!data) return
  if (data.type === 'chunk') {
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant') {
      last.content += data.content
    } else {
      messages.value.push({ role: 'assistant', content: data.content })
    }
    isStreaming.value = true
    scrollToBottom()
  } else if (data.type === 'done') {
    isStreaming.value = false
  } else if (data.type === 'error') {
    isStreaming.value = false
    messages.value.push({ role: 'assistant', content: data.message || '发生错误' })
  }
})

let messageAbort: AbortController | null = null

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  // 取消上一个未完成请求
  if (messageAbort) {
    messageAbort.abort()
    messageAbort = null
  }

  messages.value.push({ role: 'user', content: text, type: 'text' })
  inputText.value = ''
  isStreaming.value = true
  scrollToBottom()

  if (isConnected.value) {
    send({
      type: 'chat',
      message: text,
      session_id: chatStore.currentSessionId || undefined,
    })
  } else {
    messageAbort = new AbortController()
    try {
      const res = await chatService.sendMessage({
        message: text,
        session_id: chatStore.currentSessionId || undefined,
        stream: false,
      }, { signal: messageAbort.signal })
      if (res.data.success) {
        messages.value.push({ role: 'assistant', content: res.data.content, agent: res.data.agent })
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        messages.value.push({ role: 'assistant', content: '发送失败，请重试' })
      }
    } finally {
      isStreaming.value = false
      messageAbort = null
    }
  }
}

// ── Image upload ─────────────────────────────────────────────────

function triggerImageUpload() {
  imageInput.value?.click()
}

async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  // Show preview in chat
  const url = URL.createObjectURL(file)
  messages.value.push({
    role: 'user',
    content: `[图片] ${file.name}`,
    type: 'image',
    imageUrl: url,
  })
  uploadingImage.value = true
  isStreaming.value = true
  scrollToBottom()

  try {
    const res = await healthService.assessImage(file, chatStore.currentSessionId ? String(chatStore.currentSessionId) : undefined)
    if (res.data.success) {
      const advice = res.data.advice || '已识别图片内容，但未生成分析结果。'
      const riskLevel = res.data.risk_level || '低风险'
      const riskReasons = res.data.risk_reasons || []
      let content = advice
      if (riskLevel !== '低风险') {
        content = `【风险等级：${riskLevel}】\n${riskReasons.length ? '风险因素：' + riskReasons.join('、') + '\n' : ''}\n${advice}`
      }
      messages.value.push({ role: 'assistant', content })
      if (res.data.session_id && !chatStore.currentSessionId) {
        chatStore.setCurrentSession(res.data.session_id)
      }
    } else {
      messages.value.push({ role: 'assistant', content: '图片识别失败，请重试。' })
    }
  } catch (err: any) {
    const detail = err?.response?.data?.detail || err?.message || '未知错误'
    messages.value.push({ role: 'assistant', content: `图片处理失败：${detail}` })
  } finally {
    uploadingImage.value = false
    isStreaming.value = false
    scrollToBottom()
  }
}

// ── Voice recording ──────────────────────────────────────────────



async function handleVoiceResult(blob: Blob, seconds = 0) {
  const file = new File([blob], 'recording.webm', { type: 'audio/webm' })

  messages.value.push({
    role: 'user',
    content: `[语音 ${seconds}"] 正在识别...`,
    type: 'voice',
  })
  isStreaming.value = true
  scrollToBottom()

  try {
    const res = await multimodalService.speechSTT(file)
    if (res.data.success && res.data.text) {
      // Update the user message with recognized text
      const lastUser = messages.value[messages.value.length - 1]
      if (lastUser && lastUser.type === 'voice') {
        lastUser.content = `[语音] ${res.data.text}`
      }
      // Show AI answer if available
      if (res.data.answer) {
        messages.value.push({ role: 'assistant', content: res.data.answer })
      }
    } else {
      const lastUser = messages.value[messages.value.length - 1]
      if (lastUser && lastUser.type === 'voice') {
        lastUser.content = `[语音] 识别失败`
      }
      messages.value.push({ role: 'assistant', content: '语音识别失败，请重试或改用文字输入。' })
    }
  } catch (err: any) {
    const detail = err?.response?.data?.detail || err?.message || '未知错误'
    const lastUser = messages.value[messages.value.length - 1]
    if (lastUser && lastUser.type === 'voice') {
      lastUser.content = `[语音] 发送失败`
    }
    messages.value.push({ role: 'assistant', content: `语音处理失败：${detail}` })
  } finally {
    isStreaming.value = false
    scrollToBottom()
  }
}

// ── Utils ────────────────────────────────────────────────────────

async function renameSession(sessionId: number) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新名称', '重命名会话', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{1,50}$/,
      inputErrorMessage: '名称长度为1-50个字符',
    })
    if (value && auth.user?.username) {
      await chatStore.renameSession(sessionId, value, auth.user.username)
      ElMessage.success('重命名成功')
    }
  } catch {}
}

async function deleteSession(sessionId: number) {
  try {
    await ElMessageBox.confirm('确定要删除该会话吗？删除后不可恢复。', '删除会话', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    if (auth.user?.username) {
      await chatStore.deleteSession(sessionId, auth.user.username)
      ElMessage.success('会话已删除')
    }
  } catch {}
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function detectMsgType(content: string): 'text' | 'image' | 'voice' {
  if (content.startsWith('[图片') || content.startsWith('[上传病例')) return 'image'
  if (content.startsWith('[语音')) return 'voice'
  return 'text'
}

async function loadSession(sessionId: number) {
  try {
    chatStore.setCurrentSession(sessionId)
    await chatStore.fetchMessages(sessionId, auth.user?.username)
    messages.value = chatStore.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      type: detectMsgType(m.content),
    }))
    showSessions.value = false
    scrollToBottom()
  } catch (err: any) {
    ElMessage.error('加载会话消息失败: ' + (err?.response?.data?.detail || err?.message || '未知错误'))
  }
}

async function newChat() {
  if (!auth.user?.username) return
  messages.value = []
  chatStore.setCurrentSession(null)
  showSessions.value = false
  await chatStore.createSession(auth.user.username)
}

const speakingIndex = ref(-1)
const { mediaSrc } = useMediaUrl()

async function playTTS(text: string, index: number) {
  if (speakingIndex.value === index) {
    speakingIndex.value = -1
    return
  }
  try {
    speakingIndex.value = index
    const res = await multimodalService.speechTTS(text)
    const url = URL.createObjectURL(res.data as Blob)
    const audio = new Audio(url)
    audio.onended = () => { speakingIndex.value = -1 }
    audio.play()
    setTimeout(() => speakingIndex.value === index && (speakingIndex.value = -1), 60000)
  } catch {
    speakingIndex.value = -1
  }
}

</script>

<template>
  <div class="chat-view">
    <div class="chat-toolbar">
      <el-button text size="small" @click="showSessions = !showSessions">
        <el-icon :size="16"><ChatDotRound /></el-icon>
        会话
      </el-button>
      <el-button text size="small" @click="newChat">
        <el-icon :size="16"><Plus /></el-icon>
        新对话
      </el-button>
      <el-tag
        :type="isConnected ? 'success' : 'info'"
        size="small"
        round
        class="ws-status"
      >
        {{ isConnected ? '在线' : '离线' }}
      </el-tag>
    </div>

    <div v-if="showSessions" class="session-panel glass-card">
      <div
        v-for="s in chatStore.sessions"
        :key="s.id"
        class="session-item"
        :class="{ active: s.session_id === chatStore.currentSessionId }"
        @click="loadSession(s.session_id)"
      >
        <div class="session-info">
          <span class="session-title">{{ s.session_title }}</span>
          <span class="session-date">{{ s.last_updated?.slice(0, 10) }}</span>
        </div>
        <div class="session-actions">
          <el-button text size="small" @click.stop="renameSession(s.session_id)">
            <el-icon :size="14"><Edit /></el-icon>
          </el-button>
          <el-button text size="small" type="danger" @click.stop="deleteSession(s.session_id)">
            <el-icon :size="14"><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      <div v-if="chatStore.sessions.length === 0" class="empty-state">暂无对话记录</div>
    </div>

    <div ref="messagesContainer" class="messages-container">
      <div v-if="messages.length === 0" class="welcome">
        <div class="welcome-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C10 4 6 10 6 16s4 12 10 12c2 0 4-1 5.5-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M16 8c-3 0-6 3-6 8s3 8 6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <h3>康复助手</h3>
        <p>有任何健康问题，随时问我</p>
        <div class="welcome-hints">
          <span @click="inputText = '伤口恢复注意事项'">伤口恢复注意事项</span>
          <span @click="inputText = '今日饮食建议'">今日饮食建议</span>
          <span @click="inputText = '康复运动指导'">康复运动指导</span>
          <span @click="triggerImageUpload">上传检查报告</span>
        </div>
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="msg.role"
      >
        <div class="message-bubble">
          <!-- Image preview -->
          <div v-if="msg.type === 'image' && msg.imageUrl" class="message-image">
            <el-image :src="msg.imageUrl" fit="cover" style="max-width: 200px; max-height: 160px; border-radius: 12px;" />
          </div>
          <!-- Voice indicator -->
          <div v-if="msg.type === 'voice'" class="message-voice">
            <el-icon :size="16"><Microphone /></el-icon>
          </div>
          <div class="message-text">{{ msg.content }}</div>
          <el-button
            v-if="msg.role === 'assistant' && msg.type !== 'image'"
            text
            size="small"
            class="tts-btn"
            :class="{ playing: speakingIndex === i }"
            @click="playTTS(msg.content, i)"
          >
            <el-icon :size="14"><Headset /></el-icon>
          </el-button>
          <div v-if="msg.agent" class="message-meta">{{ msg.agent }}</div>
        </div>
      </div>
      <div v-if="isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant'" class="typing-dot">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div class="input-area">
      <!-- Hidden file input for image -->
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onImageSelected"
      />

      <div class="input-row">
        <!-- Image upload button -->
        <el-button
          circle
          :disabled="isStreaming || uploadingImage"
          @click="triggerImageUpload"
          class="input-action-btn"
        >
          <el-icon :size="18"><Picture /></el-icon>
        </el-button>

        <!-- Voice record button -->
        <el-button
          circle
          :type="isRecording ? 'danger' : 'default'"
          :disabled="isStreaming && !isRecording"
          @click="toggleRecording"
          class="input-action-btn"
          :class="{ recording: isRecording }"
        >
          <el-icon v-if="!isRecording" :size="18"><Microphone /></el-icon>
          <el-icon v-else :size="18"><VideoPause /></el-icon>
        </el-button>

        <!-- Text input -->
        <el-input
          v-model="inputText"
          :placeholder="isRecording ? `录音中 ${formatTime(recordingSeconds)}...` : '输入您的问题...'"
          size="large"
          class="chat-input"
          :disabled="isRecording"
          @keyup.enter="sendMessage"
        >
          <template #suffix>
            <el-button
              type="primary"
              :disabled="(!inputText.trim() && !isRecording) || isStreaming"
              size="small"
              round
              @click="sendMessage"
            >
              发送
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- Recording indicator -->
      <div v-if="isRecording" class="recording-bar">
        <div class="recording-pulse"></div>
        <span>正在录音 {{ formatTime(recordingSeconds) }}，点击停止按钮结束</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
}

.chat-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-bottom: 10px;
}

.ws-status {
  margin-left: auto;
}

.session-panel {
  padding: 10px;
  margin-bottom: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.session-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.session-item:hover .session-actions {
  opacity: 1;
}

.session-item:hover, .session-item.active {
  background: var(--color-primary-bg);
}

.session-title {
  font-size: 14px;
  font-weight: 500;
}

.session-date {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 16px 0;
  font-size: 13px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.welcome {
  text-align: center;
  padding: 60px 20px 0;
}

.welcome-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #F2EBDF;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(96,108,56,0.25);
  animation: breathe 4s ease-in-out infinite;
}

.welcome h3 {
  font-size: 22px;
  margin-bottom: 6px;
}

.welcome p {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}

.welcome-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.welcome-hints span {
  padding: 7px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

.welcome-hints span:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.message {
  display: flex;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-bubble {
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  line-height: 1.6;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #F2EBDF;
  border-bottom-right-radius: 8px;
  box-shadow: 0 2px 10px rgba(96,108,56,0.2);
}

.message.assistant .message-bubble {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-bottom-left-radius: 8px;
}

.message-image {
  margin-bottom: 6px;
}

.message-image :deep(.el-image) {
  display: block;
}

.message-voice {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  opacity: 0.7;
}

.message-text {
  white-space: pre-wrap;
}

.message-meta {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
}

.tts-btn {
  margin-top: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.tts-btn:hover { opacity: 1; }
.tts-btn.playing { opacity: 1; color: var(--color-primary); animation: ttsPulse 1s ease-in-out infinite; }
@keyframes ttsPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

.typing-dot {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  align-self: flex-start;
}

.typing-dot span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  animation: blink 1.4s infinite;
}

.typing-dot span:nth-child(2) { animation-delay: 0.2s; }
.typing-dot span:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.8; }
}

.input-area {
  padding-top: 10px;
  margin-top: auto;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-action-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-color: var(--color-border);
  transition: all 0.3s ease;
}

.input-action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.input-action-btn.recording {
  animation: recPulse 1s ease-in-out infinite;
}

@keyframes recPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(198, 107, 61, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(198, 107, 61, 0); }
}

.chat-input {
  flex: 1;
  --el-input-border-radius: 24px;
}

.recording-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: 6px;
  background: var(--color-danger-bg);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-danger);
}

.recording-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  animation: blink 1s infinite;
}
</style>
