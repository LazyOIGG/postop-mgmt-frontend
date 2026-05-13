<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref()
const form = ref({
  username: '',
  password: '',
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await authStore.login({ username: form.value.username, password: form.value.password })
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
    <div class="login-shell">
      <!-- Decorative Panel -->
      <div class="login-decor">
        <div class="decor-overlay">
          <div class="decor-brand">
            <div class="decor-logo">+</div>
            <h1>术后康复</h1>
            <p>Postoperative Recovery Management System</p>
          </div>
          <div class="decor-features">
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>术后智能康复管理</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>AI 辅助健康评估</span>
            </div>
            <div class="feature-item">
              <span class="feature-dot"></span>
              <span>医患实时沟通</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Panel -->
      <div class="login-form-panel">
        <div class="form-wrapper stagger-item stagger-1">
          <div class="form-header">
            <h2>欢迎回来</h2>
            <p>登录你的账号继续康复之旅</p>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item class="stagger-item stagger-2">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>

            <el-form-item class="stagger-item stagger-3">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <p v-if="error" class="form-error stagger-item stagger-3">{{ error }}</p>

            <el-form-item class="stagger-item stagger-4">
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="loading"
                round
                @click="handleLogin"
              >
                登 录
              </el-button>
            </el-form-item>
          </el-form>

          <p class="form-footer stagger-item stagger-5">
            还没有账号？<router-link to="/register">立即注册</router-link>
          </p>
        </div>
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
}

.login-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 960px;
  min-height: 560px;
  display: flex;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  margin: 20px;
}

/* ===== Decorative Panel ===== */
.login-decor {
  flex: 1;
  background: linear-gradient(160deg, #5a7a5e 0%, #7a9a7e 30%, #8b7e9e 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-decor::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%);
}

.decor-overlay {
  position: relative;
  z-index: 1;
  padding: 48px 40px;
  text-align: center;
  color: #fff;
}

.decor-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  font-size: 32px;
  font-weight: 300;
  border-radius: var(--radius-lg);
  backdrop-filter: blur(8px);
}

.decor-brand h1 {
  color: #fff;
  font-size: 28px;
  letter-spacing: 4px;
  margin-bottom: 8px;
}

.decor-brand p {
  font-size: 13px;
  opacity: 0.75;
  letter-spacing: 1px;
}

.decor-features {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  opacity: 0.85;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
  flex-shrink: 0;
}

/* ===== Form Panel ===== */
.login-form-panel {
  flex: 1;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 340px;
}

.form-header {
  margin-bottom: 32px;
  text-align: center;
}

.form-header h2 {
  font-size: 26px;
  margin-bottom: 6px;
}

.form-header p {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
}

.login-form .el-form-item {
  margin-bottom: 18px;
}

.login-btn {
  width: 100%;
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: var(--color-primary);
  --el-button-hover-bg-color: var(--color-primary-dark);
  --el-button-hover-border-color: var(--color-primary-dark);
  --el-button-active-bg-color: var(--color-primary-dark);
  letter-spacing: 4px;
  font-size: 16px;
}

.form-error {
  color: var(--color-danger);
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}

.form-footer {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.form-footer a {
  color: var(--color-primary-dark);
  font-weight: 600;
}

/* ===== Mobile ===== */
@media (max-width: 768px) {
  .login-page {
    align-items: flex-start;
  }

  .login-shell {
    flex-direction: column;
    max-width: 420px;
    min-height: auto;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .login-decor {
    flex: none;
    padding: 48px 24px 32px;
    border-radius: 0 0 32px 32px;
  }

  .decor-features {
    display: none;
  }

  .login-form-panel {
    padding: 32px 24px;
  }
}
</style>
