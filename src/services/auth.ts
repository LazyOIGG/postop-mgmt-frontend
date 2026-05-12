import api from '@/api'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/types'

export const authService = {
  login(data: LoginRequest) {
    return api.post<AuthResponse>('/api/v1/auth/login', data)
  },
  register(data: RegisterRequest) {
    return api.post<AuthResponse>('/api/v1/auth/register', data)
  },
}
