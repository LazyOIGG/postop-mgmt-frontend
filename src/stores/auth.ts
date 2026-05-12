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
  const user = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('user') || 'null'),
  )

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin ?? false)

  async function login(data: LoginRequest) {
    const res = await authService.login(data)
    if (res.data.success && res.data.token) {
      token.value = res.data.token
      user.value = {
        username: res.data.username || data.username,
        isAdmin: res.data.is_admin || false,
      }
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    return res.data
  }

  async function register(data: RegisterRequest) {
    return (await authService.register(data)).data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, isAdmin, login, register, logout }
})
