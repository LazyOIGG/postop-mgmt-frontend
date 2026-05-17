<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { HomeFilled, ChatDotRound, Document, User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const tabs = [
  { name: 'PatientHome', label: '首页', icon: HomeFilled, path: '/patient/home' },
  { name: 'PatientChat', label: 'AI助手', icon: ChatDotRound, path: '/patient/chat' },
  { name: 'PatientCheckin', label: '打卡', icon: Document, path: '/patient/checkin' },
  { name: 'PatientProfile', label: '我的', icon: User, path: '/patient/profile' },
]

function goTab(path: string) {
  router.push(path)
}

function isActive(tabName: string) {
  return route.name === tabName
}
</script>

<template>
  <div class="patient-shell">
    <header class="patient-header">
      <div class="header-content">
        <div class="header-brand">
          <svg class="header-logo" width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C10 4 6 10 6 16s4 12 10 12c2 0 4-1 5.5-2.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
          </svg>
          <h2 class="app-name">患者全周期</h2>
        </div>
        <span class="user-tag">{{ auth.user?.username }}</span>
      </div>
    </header>

    <main class="patient-main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <nav class="patient-tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="tab-item"
        :class="{ active: isActive(tab.name) }"
        @click="goTab(tab.path)"
      >
        <div class="tab-icon-wrap">
          <el-icon :size="20"><component :is="tab.icon" /></el-icon>
        </div>
        <span class="tab-label">{{ tab.label }}</span>
        <div v-if="isActive(tab.name)" class="tab-indicator"></div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.patient-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  padding-bottom: 72px;
}

.patient-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(242, 235, 223, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border-light);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  color: var(--color-primary);
}

.app-name {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  color: var(--color-primary-dark);
}

.user-tag {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--color-border-light);
}

.patient-main {
  flex: 1;
  padding: 16px 16px 0;
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
}

.patient-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: rgba(242, 235, 223, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-border-light);
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 16px;
  cursor: pointer;
  transition: color 0.3s ease;
  color: var(--color-text-tertiary);
  position: relative;
}

.tab-item.active {
  color: var(--color-primary);
}

.tab-icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: background 0.3s ease;
}

.tab-item.active .tab-icon-wrap {
  background: var(--color-primary-bg);
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}

.tab-indicator {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--color-primary);
  border-radius: 0 0 4px 4px;
  animation: breathe 3s ease-in-out infinite;
}
</style>
