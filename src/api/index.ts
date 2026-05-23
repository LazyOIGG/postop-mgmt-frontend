import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

const pendingRequests = new Map<string, AbortController>()

function getRequestKey(config: any): string {
  return `${config.method || 'GET'}:${config.url || ''}:${JSON.stringify(config.params || {})}`
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

// ===== 请求拦截：自动附加 token =====
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

// ===== 响应拦截：清理去重记录 =====
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

// ===== 响应拦截：401 自动刷新 token =====
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 非 401 或缺少配置，直接拒绝
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    // 不拦截刷新/登录/注册端点自身，避免无限循环
    const url = originalRequest.url || ''
    if (
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register')
    ) {
      return Promise.reject(error)
    }

    // 已重试过的请求不再重试
    if (originalRequest._retry) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    // 如果正在刷新中，将请求加入队列等待
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      })
    }

    // 开始刷新
    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      isRefreshing = false
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || ''
      const { data } = await axios.post(`${baseURL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      })

      if (data.success && data.data) {
        const newToken = data.data.token
        const newRefreshToken = data.data.refresh_token

        localStorage.setItem('token', newToken)
        localStorage.setItem('refresh_token', newRefreshToken)

        processQueue(null, newToken)

        // 重放原始请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } else {
        processQueue(new Error('刷新失败'), null)
        clearAuthAndRedirect()
        return Promise.reject(error)
      }
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAuthAndRedirect()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

function clearAuthAndRedirect() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
}

export default api
