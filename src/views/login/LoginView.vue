<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await authStore.login({ username: username.value, password: password.value })
    if (res.success) {
      router.push(res.is_admin ? '/doctor' : '/patient')
    } else {
      error.value = res.message || '登录失败'
    }
  } catch {
    error.value = '登录失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page organic-bg">
    <div class="login-container">
      <div class="login-card glass-card stagger-item stagger-1">
        <div class="login-brand">
          <div class="brand-icon">+</div>
          <h1 class="brand-title">术后康复</h1>
          <p class="brand-subtitle">Postoperative Recovery Management</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
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
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>

          <p v-if="error" class="form-error stagger-item stagger-3">{{ error }}</p>

          <button
            type="submit"
            class="btn-primary stagger-item stagger-4"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>

        <p class="login-footer stagger-item stagger-5">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  padding: 48px 40px;
  text-align: center;
}

.login-brand {
  margin-bottom: 36px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(122, 154, 126, 0.35);
}

.brand-title {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--color-text);
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.login-form {
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

.login-footer {
  margin-top: 28px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.login-footer a {
  color: var(--color-primary-dark);
  font-weight: 600;
}
</style>
