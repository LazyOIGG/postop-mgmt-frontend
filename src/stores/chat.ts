import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sessionService } from '@/services/chat'
import type { Session, Message } from '@/types'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<number | null>(null)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)

  async function fetchSessions(username: string) {
    const res = await sessionService.getUserSessions(username)
    if (res.data.success) sessions.value = res.data.sessions
  }

  async function fetchMessages(sessionId: number, username?: string) {
    const res = await sessionService.getMessages(sessionId, username)
    if (res.data.success) messages.value = res.data.messages
  }

  async function createSession(username: string, title?: string) {
    const res = await sessionService.create(username, title || '新对话')
    if (res.data.success) {
      currentSessionId.value = res.data.session_id
      await fetchSessions(username)
    }
    return res.data
  }

  function addMessage(msg: Message) {
    messages.value.push(msg)
  }

  function setCurrentSession(id: number | null) {
    currentSessionId.value = id
  }

  async function renameSession(sessionId: number, newTitle: string, username: string) {
    await sessionService.rename(sessionId, newTitle)
    await fetchSessions(username)
  }

  async function deleteSession(sessionId: number, username: string) {
    await sessionService.delete(sessionId, username)
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      messages.value = []
    }
    await fetchSessions(username)
  }

  return {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    fetchSessions,
    fetchMessages,
    createSession,
    addMessage,
    setCurrentSession,
    renameSession,
    deleteSession,
  }
})
