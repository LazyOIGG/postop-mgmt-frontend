import api from '@/api'
import type { ChatRequest, ChatResponse, Session, Message } from '@/types'

export const chatService = {
  sendMessage(data: ChatRequest) {
    return api.post<ChatResponse>('/api/v1/chat', data)
  },
}

export const sessionService = {
  create(username: string, sessionTitle?: string) {
    return api.post('/api/v1/sessions/create', { username, session_title: sessionTitle })
  },
  getUserSessions(username: string) {
    return api.get<{ success: boolean; sessions: Session[]; count: number }>(
      `/api/v1/sessions/user/${username}`,
    )
  },
  getMessages(sessionId: number, username?: string) {
    return api.get<{ success: boolean; messages: Message[]; count: number }>(
      `/api/v1/sessions/${sessionId}/messages`,
      { params: { username } },
    )
  },
  rename(sessionId: number, newTitle: string) {
    return api.put('/api/v1/sessions/rename', { session_id: sessionId, new_title: newTitle })
  },
  delete(sessionId: number, username?: string) {
    return api.delete(`/api/v1/sessions/${sessionId}`, { params: { username } })
  },
}
