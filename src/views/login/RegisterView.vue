<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (!username.value || !password.value || !confirmPassword.value) {
    error.value = '请填写所有字段'
    return
  }
  if (password.value.length < 8) {
    error.value = '密码长度至少8位'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  try {
    const res = await authStore.register({
      username: username.value,
      password: password.value,
      confirm_password: confirmPassword.value,
    })
    if (res.success) {
      router.push('/login')
    } else {
      error.value = res.message || '注册失败'
    }
  } catch {
    error.value = '注册失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page organic-bg">
    <div class="register-container">
      <div class="register-card glass-card stagger-item stagger-1">
        <div class="register-brand">
          <h1 class="brand-title">创建账号</h1>
          <p class="brand-subtitle">加入术后康复管理平台</p>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
          <div class="form-item stagger-item stagger-2">
            <label class="form-label">用户名</label>
            <input
              v-model="username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>

          <div class="form-item stagger-item stagger-3">
            <label class="form-label">密码</label>
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="至少8位字符"
              autocomplete="new-password"
            />
          </div>

          <div class="form-item stagger-item stagger-3">
            <label class="form-label">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="再次输入密码"
              autocomplete="new-password"
            />
          </div>

          <p v-if="error" class="form-error">{{ error }}</p>

          <button
            type="submit"
            class="btn-primary stagger-item stagger-4"
            :disabled="loading"
          >
            {{ loading ? '注册中...' : '注 册' }}
          </button>
        </form>

        <p class="register-footer stagger-item stagger-5">
          已有账号？<router-link to="/login">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 420px;
}

.register-card {
  padding: 48px 40px;
  text-align: center;
}

.register-brand {
  margin-bottom: 36px;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--color-text);
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.register-form {
  text-align: left;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(122, 154, 126, 0.15);
}

.form-input::placeholder {
  color: #c4bab2;
}

.form-error {
  color: var(--color-danger);
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-primary {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: 3px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(122, 154, 126, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(122, 154, 126, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-footer {
  margin-top: 28px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.register-footer a {
  color: var(--color-primary-dark);
  font-weight: 600;
}
</style>
