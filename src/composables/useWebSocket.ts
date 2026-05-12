import { ref, onUnmounted } from 'vue'

export function useWebSocket(url: string, token: string) {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const lastMessage = ref<unknown>(null)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect() {
    if (ws.value?.readyState === WebSocket.OPEN) return

    const fullUrl = `${url}?token=${token}`
    ws.value = new WebSocket(fullUrl)

    ws.value.onopen = () => {
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      try {
        lastMessage.value = JSON.parse(event.data)
      } catch {
        lastMessage.value = event.data
      }
    }

    ws.value.onclose = () => {
      isConnected.value = false
      reconnectTimer = setTimeout(connect, 3000)
    }

    ws.value.onerror = () => {
      ws.value?.close()
    }
  }

  function send(data: unknown) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(typeof data === 'string' ? data : JSON.stringify(data))
    }
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    ws.value?.close()
  }

  onUnmounted(() => disconnect())

  return { isConnected, lastMessage, connect, send, disconnect }
}
