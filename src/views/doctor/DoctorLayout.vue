<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDoctorStore } from '@/stores/doctor'
import { notificationService } from '@/services/doctor'
import AvatarDoctor from '@/components/AvatarDoctor.vue'
import {
  DataBoard, UserFilled, WarningFilled, ChatDotRound, TrendCharts,
  ArrowLeft, ArrowRight,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const doctorStore = useDoctorStore()
let doctorPollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  doctorStore.fetchMessageUnreadCount()
  doctorPollTimer = setInterval(() => doctorStore.fetchMessageUnreadCount(), 5000)
})

onUnmounted(() => {
  if (doctorPollTimer) clearInterval(doctorPollTimer)
})

const collapsed = ref(false)

const navItems = [
  { name: 'DoctorDashboard', label: '工作台', icon: DataBoard, path: '/doctor/dashboard' },
  { name: 'DoctorPatients', label: '患者管理', icon: UserFilled, path: '/doctor/patients' },
  { name: 'DoctorAlerts', label: '异常预警', icon: WarningFilled, path: '/doctor/alerts' },
  { name: 'DoctorMessages', label: '医患消息', icon: ChatDotRound, path: '/doctor/messages' },
  { name: 'DoctorStatistics', label: '系统统计', icon: TrendCharts, path: '/doctor/statistics' },
]

function isActive(name: string) {
  return route.name === name
}

watch(() => route.name, (newName) => {
  if (newName === 'DoctorMessages') {
    notificationService.markAllRead().catch(() => {})
    doctorStore.fetchMessageUnreadCount()
  }
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="doctor-shell">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C10 4 6 10 6 16s4 12 10 12c2 0 4-1 5.5-2.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <span v-if="!collapsed" class="brand-text">全周期管理</span>
      </div>

      <nav class="sidebar-nav">
        <el-tooltip
          v-for="item in navItems"
          :key="item.name"
          :content="item.label"
          placement="right"
          :disabled="!collapsed"
        >
          <div
            class="nav-item"
            :class="{ active: isActive(item.name) }"
            @click="router.push(item.path)"
          >
            <el-badge
              v-if="item.name === 'DoctorAlerts' && doctorStore.unreadCount > 0"
              :value="doctorStore.unreadCount"
              :max="99"
              class="nav-icon-badge"
            >
              <el-icon :size="18"><component :is="item.icon" /></el-icon>
            </el-badge>
            <el-badge
              v-else-if="item.name === 'DoctorMessages' && doctorStore.messageUnreadCount > 0"
              :value="doctorStore.messageUnreadCount"
              :max="99"
              class="nav-icon-badge"
            >
              <el-icon :size="18"><component :is="item.icon" /></el-icon>
            </el-badge>
            <el-icon v-else :size="18"><component :is="item.icon" /></el-icon>
            <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          </div>
        </el-tooltip>
      </nav>

      <div class="sidebar-footer">
        <button class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon :size="14">
            <ArrowLeft v-if="!collapsed" />
            <ArrowRight v-else />
          </el-icon>
        </button>
        <div v-if="!collapsed" class="user-info">
          <AvatarDoctor :size="32" />
          <div class="user-meta">
            <span class="user-name">{{ auth.user?.username }}</span>
            <button class="logout-link" @click="logout">退出登录</button>
          </div>
        </div>
      </div>
    </aside>

    <main class="main-area">
      <header class="top-bar">
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
  border-right: 1px solid var(--color-border-light);
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

.brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #F2EBDF;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  animation: breathe 4s ease-in-out infinite;
}

.brand-text {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  white-space: nowrap;
  color: var(--color-primary-dark);
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
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.nav-item:hover {
  background: var(--color-primary-bg);
  color: var(--color-text);
}

.nav-item.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}

.nav-label {
  white-space: nowrap;
}

.nav-icon-badge {
  display: flex;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--color-border-light);
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.collapse-btn:hover {
  color: var(--color-text);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #F2EBDF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-link {
  font-size: 11px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.logout-link:hover {
  color: var(--color-danger);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-bar {
  padding: 16px 24px;
  background: rgba(242, 235, 223, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 50;
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
