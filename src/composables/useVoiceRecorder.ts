import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useVoiceRecorder(onResult: (blob: Blob, seconds: number) => Promise<void>) {
  const isRecording = ref(false)
  const recordingSeconds = ref(0)
  let mediaRecorder: MediaRecorder | null = null
  let recordedChunks: Blob[] = []
  let recordingTimer: ReturnType<typeof setInterval> | null = null

  async function toggleRecording() {
    if (isRecording.value) stopRecording()
    else await startRecording()
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recordedChunks = []

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) recordedChunks.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(recordedChunks, { type: 'audio/webm' })
        await onResult(blob, recordingSeconds.value)
      }

      mediaRecorder.start()
      isRecording.value = true
      recordingSeconds.value = 0
      recordingTimer = setInterval(() => {
        recordingSeconds.value++
        if (recordingSeconds.value >= 60) stopRecording()
      }, 1000)
    } catch {
      ElMessage.error('无法访问麦克风，请检查权限设置')
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    isRecording.value = false
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return { isRecording, recordingSeconds, toggleRecording, startRecording, stopRecording, formatTime }
}
