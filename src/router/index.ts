import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/login/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/patient',
      component: () => import('@/views/patient/PatientLayout.vue'),
      meta: { requiresAuth: true, role: 'patient' },
      children: [
        {
          path: '',
          redirect: { name: 'PatientHome' },
        },
        {
          path: 'home',
          name: 'PatientHome',
          component: () => import('@/views/patient/HomeView.vue'),
        },
        {
          path: 'chat',
          name: 'PatientChat',
          component: () => import('@/views/patient/ChatView.vue'),
        },
        {
          path: 'checkin',
          name: 'PatientCheckin',
          component: () => import('@/views/patient/CheckinView.vue'),
        },
        {
          path: 'profile',
          name: 'PatientProfile',
          component: () => import('@/views/patient/ProfileView.vue'),
        },
      ],
    },
    {
      path: '/doctor',
      component: () => import('@/views/doctor/DoctorLayout.vue'),
      meta: { requiresAuth: true, role: 'doctor' },
      children: [
        {
          path: '',
          redirect: { name: 'DoctorDashboard' },
        },
        {
          path: 'dashboard',
          name: 'DoctorDashboard',
          component: () => import('@/views/doctor/DashboardView.vue'),
        },
        {
          path: 'patients',
          name: 'DoctorPatients',
          component: () => import('@/views/doctor/PatientListView.vue'),
        },
        {
          path: 'alerts',
          name: 'DoctorAlerts',
          component: () => import('@/views/doctor/AlertsView.vue'),
        },
        {
          path: 'messages',
          name: 'DoctorMessages',
          component: () => import('@/views/doctor/MessagesView.vue'),
        },
        {
          path: 'statistics',
          name: 'DoctorStatistics',
          component: () => import('@/views/doctor/StatisticsView.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.guest && authStore.isLoggedIn) {
    return next(authStore.isAdmin ? '/doctor' : '/patient')
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login')
  }

  if (to.meta.requiresAuth && to.meta.role) {
    const expectedRole = to.meta.role
    const actualRole = authStore.isAdmin ? 'doctor' : 'patient'
    if (expectedRole !== actualRole) {
      return next(actualRole === 'doctor' ? '/doctor' : '/patient')
    }
  }

  next()
})

export default router
