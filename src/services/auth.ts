import api from '@/api'
import type {
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  LogoutRequest,
  AuthResponse,
} from '@/types'

export const authService = {
  login(data: LoginRequest) {
    return api.post<AuthResponse>('/api/v1/auth/login', data)
  },
  register(data: RegisterRequest) {
    return api.post<AuthResponse>('/api/v1/auth/register', data)
  },
  refresh(data: RefreshRequest) {
    return api.post<AuthResponse>('/api/v1/auth/refresh', data)
  },
  logout(data?: LogoutRequest) {
    return api.post<AuthResponse>('/api/v1/auth/logout', data ?? {})
  },
  me() {
    return api.get<AuthResponse>('/api/v1/auth/me')
  },
}
