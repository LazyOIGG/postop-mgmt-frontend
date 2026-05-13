<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: '',
  confirm_password: '',
})
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (!form.value.username || !form.value.password || !form.value.confirm_password) {
    error.value = '请填写所有字段'
    return
  }
  if (form.value.password.length < 8) {
    error.value = '密码长度至少8位'
    return
  }
  if (form.value.password !== form.value.confirm_password) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  try {
    const res = await authStore.register({
      username: form.value.username,
      password: form.value.password,
      confirm_password: form.value.confirm_password,
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
    <div class="register-shell">
      <!-- Decorative Panel -->
      <div class="register-decor">
        <div class="decor-overlay">
          <div class="decor-logo">+</div>
          <h1>术后康复</h1>
          <p>Postoperative Recovery Management System</p>
          <div class="decor-quote">
            <span>"</span>加入我们，开启科学康复之旅<span>"</span>
          </div>
        </div>
      </div>

      <!-- Form Panel -->
      <div class="register-form-panel">
        <div class="form-wrapper stagger-item stagger-1">
          <div class="form-header">
            <h2>创建账号</h2>
            <p>加入术后康复管理平台</p>
          </div>

          <el-form
            :model="form"
            class="register-form"
            @submit.prevent="handleRegister"
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
                placeholder="至少8位字符"
                :prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>

            <el-form-item class="stagger-item stagger-3">
              <el-input
                v-model="form.confirm_password"
                type="password"
                placeholder="再次输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleRegister"
              />
            </el-form-item>

            <p v-if="error" class="form-error">{{ error }}</p>

            <el-form-item class="stagger-item stagger-4">
              <el-button
                type="primary"
                size="large"
                class="register-btn"
                :loading="loading"
                round
                @click="handleRegister"
              >
                注 册
              </el-button>
            </el-form-item>
          </el-form>

          <p class="form-footer stagger-item stagger-5">
            已有账号？<router-link to="/login">立即登录</router-link>
          </p>
        </div>
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
}

.register-shell {
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
.register-decor {
  flex: 1;
  background: linear-gradient(160deg, #5a7a5e 0%, #7a9a7e 30%, #8b7e9e 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-decor::before {
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

.register-decor h1 {
  color: #fff;
  font-size: 28px;
  letter-spacing: 4px;
  margin-bottom: 8px;
  font-family: var(--font-display);
  font-weight: 400;
}

.register-decor p {
  font-size: 13px;
  opacity: 0.75;
  letter-spacing: 1px;
}

.decor-quote {
  margin-top: 36px;
  font-size: 16px;
  opacity: 0.7;
  line-height: 1.8;
  font-style: italic;
}

.decor-quote span {
  font-size: 28px;
  line-height: 0;
  vertical-align: middle;
}

/* ===== Form Panel ===== */
.register-form-panel {
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

.register-form {
  display: flex;
  flex-direction: column;
}

.register-form .el-form-item {
  margin-bottom: 18px;
}

.register-btn {
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
  .register-page {
    align-items: flex-start;
  }

  .register-shell {
    flex-direction: column;
    max-width: 420px;
    min-height: auto;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .register-decor {
    flex: none;
    padding: 40px 24px 28px;
    border-radius: 0 0 32px 32px;
  }

  .decor-quote {
    display: none;
  }

  .register-form-panel {
    padding: 32px 24px;
  }
}
</style>
