import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth'
import type { LoginRequest, RegisterRequest } from '@/types'

interface UserInfo {
  username: string
  isAdmin: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refresh_token') || '')
  const user = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('user') || 'null'),
  )

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin ?? false)

  function saveAuth(data: { username: string; is_admin: boolean; token: string; refresh_token: string }) {
    token.value = data.token
    refreshToken.value = data.refresh_token
    user.value = {
      username: data.username,
      isAdmin: data.is_admin,
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function login(data: LoginRequest) {
    const res = await authService.login(data)
    const body = res.data
    if (body.success && body.data) {
      saveAuth(body.data)
    }
    return {
      success: body.success,
      is_admin: body.data?.is_admin ?? false,
      message: body.message,
    }
  }

  async function register(data: RegisterRequest) {
    const res = await authService.register(data)
    const body = res.data
    if (body.success && body.data) {
      saveAuth(body.data)
    }
    return {
      success: body.success,
      is_admin: body.data?.is_admin ?? false,
      message: body.message,
    }
  }

  async function logout() {
    const rt = refreshToken.value
    // 清除本地状态（无论后端是否成功）
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    // 通知后端登出
    try {
      await authService.logout(rt ? { refresh_token: rt } : undefined)
    } catch {
      // 忽略后端错误，本地已清除
    }
  }

  async function fetchUser() {
    const res = await authService.me()
    const body = res.data
    if (body.success && body.data) {
      user.value = {
        username: body.data.username,
        isAdmin: body.data.is_admin,
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    return body
  }

  return {
    token,
    refreshToken,
    user,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
  }
})
