import axios from 'axios'
import type { AxiosError } from 'axios'
import router from '@/router'

const pendingRequests = new Map<string, AbortController>()

function getRequestKey(config: any): string {
  return `${config.method || 'GET'}:${config.url || ''}:${JSON.stringify(config.params || {})}`
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 请求去重：取消相同请求
  if (config.method === 'get') {
    const key = getRequestKey(config)
    const existing = pendingRequests.get(key)
    if (existing) {
      existing.abort()
    }
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(key, controller)
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const key = getRequestKey(response.config)
    pendingRequests.delete(key)
    return response
  },
  (error) => {
    if (error.config) {
      const key = getRequestKey(error.config)
      pendingRequests.delete(key)
    }
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
