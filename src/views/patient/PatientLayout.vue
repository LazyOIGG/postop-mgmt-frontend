<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const tabs = [
  { name: 'PatientHome', label: '首页', icon: '🏠', path: '/patient/home' },
  { name: 'PatientChat', label: 'AI助手', icon: '💬', path: '/patient/chat' },
  { name: 'PatientCheckin', label: '打卡', icon: '📋', path: '/patient/checkin' },
  { name: 'PatientProfile', label: '我的', icon: '👤', path: '/patient/profile' },
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
    <header class="patient-header glass-card">
      <div class="header-content">
        <h2 class="app-name">术后康复</h2>
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
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
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
  padding-bottom: 64px;
}

.patient-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-radius: 0;
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
}

.app-name {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 1px;
}

.user-tag {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 4px 12px;
  border-radius: 20px;
}

.patient-main {
  flex: 1;
  padding: 16px;
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
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--color-border);
  padding: 6px 0 env(safe-area-inset-bottom, 6px);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 16px;
  cursor: pointer;
  transition: color 0.2s;
  color: var(--color-text-secondary);
}

.tab-item.active {
  color: var(--color-primary-dark);
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
