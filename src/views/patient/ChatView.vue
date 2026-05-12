<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { chatService, sessionService } from '@/services/chat'
import { useWebSocket } from '@/composables/useWebSocket'

const auth = useAuthStore()
const chatStore = useChatStore()

const inputText = ref('')
const isStreaming = ref(false)
const showSessions = ref(false)
const messagesContainer = ref<HTMLElement>()

interface ChatMsg {
  role: 'user' | 'assistant' | 'system'
  content: string
  agent?: string
}

const messages = ref<ChatMsg[]>([])

const wsUrl = `ws://localhost:8000/api/v1/chat/agent/ws`
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

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  messages.value.push({ role: 'user', content: text })
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
    try {
      const res = await chatService.sendMessage({
        message: text,
        session_id: chatStore.currentSessionId || undefined,
        stream: false,
      })
      if (res.data.success) {
        messages.value.push({ role: 'assistant', content: res.data.content, agent: res.data.agent })
      }
    } catch {
      messages.value.push({ role: 'assistant', content: '发送失败，请重试' })
    } finally {
      isStreaming.value = false
    }
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function loadSession(sessionId: number) {
  chatStore.setCurrentSession(sessionId)
  await chatStore.fetchMessages(sessionId, auth.user?.username)
  messages.value = chatStore.messages.map((m) => ({ role: m.role, content: m.content }))
  showSessions.value = false
  scrollToBottom()
}

async function newChat() {
  if (!auth.user?.username) return
  messages.value = []
  chatStore.setCurrentSession(null)
  showSessions.value = false
  await chatStore.createSession(auth.user.username)
}
</script>

<template>
  <div class="chat-view">
    <div class="chat-toolbar">
      <button class="toolbar-btn" @click="showSessions = !showSessions">
        💬 会话
      </button>
      <button class="toolbar-btn" @click="newChat">+ 新对话</button>
      <span class="ws-status" :class="{ connected: isConnected }">
        {{ isConnected ? '在线' : '离线' }}
      </span>
    </div>

    <div v-if="showSessions" class="session-panel glass-card">
      <div
        v-for="s in chatStore.sessions"
        :key="s.id"
        class="session-item"
        :class="{ active: s.id === chatStore.currentSessionId }"
        @click="loadSession(s.id)"
      >
        <span class="session-title">{{ s.title }}</span>
        <span class="session-date">{{ s.updated_at?.slice(0, 10) }}</span>
      </div>
      <div v-if="chatStore.sessions.length === 0" class="empty-state">暂无对话记录</div>
    </div>

    <div ref="messagesContainer" class="messages-container">
      <div v-if="messages.length === 0" class="welcome">
        <div class="welcome-icon">+</div>
        <h3>术后康复助手</h3>
        <p>有任何术后康复问题，随时问我</p>
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="msg.role"
      >
        <div class="message-bubble">
          <div class="message-text">{{ msg.content }}</div>
          <div v-if="msg.agent" class="message-meta">{{ msg.agent }}</div>
        </div>
      </div>
      <div v-if="isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant'" class="typing-dot">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="inputText"
        type="text"
        class="chat-input"
        placeholder="输入您的问题..."
        @keyup.enter="sendMessage"
      />
      <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">
        发送
      </button>
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

.toolbar-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.2s;
}

.toolbar-btn:hover {
  background: var(--color-bg);
}

.ws-status {
  margin-left: auto;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  background: #f5f5f5;
  color: #999;
}

.ws-status.connected {
  background: #e8f5e9;
  color: var(--color-primary-dark);
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
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.session-item:hover, .session-item.active {
  background: var(--color-bg);
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

.welcome-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  font-size: 30px;
  font-weight: 300;
  border-radius: var(--radius-lg);
}

.welcome h3 {
  font-size: 20px;
  margin-bottom: 6px;
}

.welcome p {
  font-size: 14px;
  color: var(--color-text-secondary);
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
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border-bottom-right-radius: 6px;
}

.message.assistant .message-bubble {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 6px;
}

.message-text {
  white-space: pre-wrap;
}

.message-meta {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
}

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
  display: flex;
  gap: 8px;
  padding-top: 10px;
  margin-top: auto;
}

.chat-input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  font-size: 15px;
  font-family: var(--font-body);
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: var(--color-primary);
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: opacity 0.2s;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
