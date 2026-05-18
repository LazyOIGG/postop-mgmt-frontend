import api from '@/api'

export const multimodalService = {
  imageOCR(file: File, sessionId?: number) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('auto_answer', 'true')
    if (sessionId) formData.append('session_id', String(sessionId))
    return api.post('/api/v1/multimodal/image/ocr', formData)
  },
  imageAnalyze(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/v1/multimodal/image/analyze', formData)
  },
  speechSTT(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/v1/multimodal/speech/stt', formData)
  },
}
