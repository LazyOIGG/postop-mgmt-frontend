<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDoctorStore } from '@/stores/doctor'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const doctorStore = useDoctorStore()

const collapsed = ref(false)

const navItems = [
  { name: 'DoctorDashboard', label: '工作台', icon: '📊', path: '/doctor/dashboard' },
  { name: 'DoctorPatients', label: '患者管理', icon: '👥', path: '/doctor/patients' },
  { name: 'DoctorAlerts', label: '异常预警', icon: '⚠️', path: '/doctor/alerts' },
  { name: 'DoctorMessages', label: '医患消息', icon: '💬', path: '/doctor/messages' },
  { name: 'DoctorStatistics', label: '系统统计', icon: '📈', path: '/doctor/statistics' },
]

function isActive(name: string) {
  return route.name === name
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="doctor-shell">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-brand">
        <span class="brand-icon">+</span>
        <span v-if="!collapsed" class="brand-text">术后康复</span>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: isActive(item.name) }"
          @click="router.push(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          <span
            v-if="item.name === 'DoctorAlerts' && doctorStore.unreadCount > 0 && collapsed"
            class="nav-badge-dot"
          ></span>
          <span
            v-if="item.name === 'DoctorAlerts' && doctorStore.unreadCount > 0 && !collapsed"
            class="nav-badge"
          >{{ doctorStore.unreadCount }}</span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="collapse-btn" @click="collapsed = !collapsed">
          {{ collapsed ? '▶' : '◀' }}
        </button>
        <div v-if="!collapsed" class="user-info">
          <span class="user-name">Dr. {{ auth.user?.username }}</span>
          <button class="logout-link" @click="logout">退出</button>
        </div>
      </div>
    </aside>

    <main class="main-area">
      <header class="top-bar glass-card">
        <h2>{{ navItems.find((n) => n.name === route.name)?.label || '医生工作台' }}</h2>
      </header>
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.doctor-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width 0.25s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  font-size: 20px;
  font-weight: 300;
  border-radius: 10px;
  flex-shrink: 0;
}

.brand-text {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 1px;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
  color: var(--color-text-secondary);
  position: relative;
}

.nav-item:hover {
  background: var(--color-bg);
}

.nav-item.active {
  background: var(--color-bg);
  color: var(--color-primary-dark);
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

.nav-badge {
  margin-left: auto;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
}

.nav-badge-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: var(--color-danger);
  border-radius: 50%;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collapse-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  align-self: flex-end;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
}

.logout-link {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar {
  padding: 16px 24px;
  border-radius: 0;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.top-bar h2 {
  font-size: 18px;
  letter-spacing: 0.5px;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
