import { ref } from 'vue'

export function useSSE() {
  const content = ref('')
  const isStreaming = ref(false)
  let eventSource: EventSource | null = null

  function connect(url: string, onChunk?: (text: string) => void) {
    content.value = ''
    isStreaming.value = true

    eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chunk') {
          content.value += data.content
          onChunk?.(data.content)
        } else if (data.type === 'done') {
          disconnect()
        } else if (data.type === 'error') {
          disconnect()
        }
      } catch {
        content.value += event.data
        onChunk?.(event.data)
      }
    }

    eventSource.onerror = () => {
      disconnect()
    }
  }

  function disconnect() {
    isStreaming.value = false
    eventSource?.close()
    eventSource = null
  }

  return { content, isStreaming, connect, disconnect }
}
