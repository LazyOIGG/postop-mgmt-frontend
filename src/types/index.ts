// ===== 认证 =====
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  confirm_password: string
  is_admin?: boolean
}

export interface AuthResponse {
  success: boolean
  username?: string
  is_admin?: boolean
  token?: string
  message?: string
}

// ===== 聊天 =====
export interface ChatRequest {
  message: string
  model_choice?: string
  session_id?: number
  stream?: boolean
}

export interface ChatResponse {
  success: boolean
  content: string
  agent: string
  routed_by?: Record<string, unknown>
  metadata?: Record<string, unknown>
  session_id: number
}

// ===== 会话 =====
export interface Session {
  id: number
  username: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  session_id: number
  username: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

// ===== 健康档案 =====
export interface PatientProfile {
  real_name?: string
  gender?: string
  age?: number
  phone?: string
  height?: number
  weight?: number
  blood_type?: string
  medical_history?: string
  allergy_history?: string
  current_medications?: string
  emergency_contact?: string
  emergency_phone?: string
  health_stage?: string
}

// ===== 每日打卡 =====
export interface DailyCheckinRequest {
  checkin_date: string
  symptoms?: string
  temperature?: number
  blood_pressure?: string
  blood_sugar?: number
  heart_rate?: number
  sleep_status?: string
  diet_status?: string
  exercise_status?: string
  medication_taken?: boolean
  note?: string
}

export interface CheckinRecord {
  id: number
  checkin_date: string
  symptoms: string | null
  temperature: number | null
  blood_pressure: string | null
  blood_sugar: number | null
  heart_rate: number | null
  sleep_status: string | null
  diet_status: string | null
  exercise_status: string | null
  medication_taken: boolean
  note: string | null
}

// ===== 健康评估 =====
export interface HealthAssessmentResponse {
  success: boolean
  source_type?: string
  input_text?: string
  risk_level?: string
  risk_reasons?: string[]
  need_hospital?: boolean
  advice?: string
  session_id?: string
}

// ===== 提醒 =====
export interface Reminder {
  id: number
  reminder_type: string
  title: string
  description?: string
  reminder_date: string
  reminder_time?: string
  status: string
}

export interface ReminderCreateRequest {
  reminder_type: string
  title: string
  description?: string
  reminder_date: string
  reminder_time?: string
}

// ===== 医生端 =====
export interface Patient {
  username: string
  real_name?: string
  risk_level?: string
  last_checkin?: string
  [key: string]: unknown
}

export interface Alert {
  id: number
  patient_username: string
  type: string
  message: string
  status: 'pending' | 'processed'
  created_at: string
  [key: string]: unknown
}

export interface DoctorMessage {
  id: number
  patient_username: string
  sender: 'doctor' | 'patient'
  content: string
  created_at: string
}

// ===== 通用 =====
export interface ApiError {
  success: false
  message: string
}

// ===== 系统统计 =====
export interface SystemStats {
  total_users: number
  total_sessions: number
  total_messages: number
  active_today: number
}

export interface DashboardData {
  basic_stats: Record<string, unknown>
  ratio_stats: Record<string, unknown>
  recent_high_risk: unknown[]
  recent_abnormal_checkins: unknown[]
}

// ===== 趋势 =====
export interface OverviewData {
  overview: Record<string, unknown>
  trend: Record<string, unknown>
  abnormal_records: unknown[]
  latest_assessment: Record<string, unknown> | null
  profile: Record<string, unknown> | null
}

// ===== 康复计划 =====
export interface RehabPlan {
  id: number
  username: string
  surgery_type: string
  plan_title: string
  current_phase: '急性期' | '恢复期' | '巩固期'
  status: 'active' | 'completed' | 'cancelled'
  generated_plan: string | null
  created_at: string
  updated_at: string
  phases?: Record<string, RehabTask[]>
}

export interface RehabTask {
  id: number
  plan_id: number
  username: string
  phase: string
  task_day: number
  task_date: string
  task_type: 'medication' | 'exercise' | 'diet' | 'review' | 'other'
  task_content: string
  reminder_id: number | null
  status: 'pending' | 'completed' | 'skipped'
  plan_title?: string
  surgery_type?: string
}

export interface RehabPlanGenerateRequest {
  surgery_type: string
  plan_title?: string
}

export interface GeneratePlanResponse {
  success: boolean
  plan_id?: number
  plan_title?: string
  surgery_type?: string
  current_phase?: string
  phases?: string[]
  total_tasks?: number
  notes?: string
  generated_plan?: Record<string, unknown>
  error?: string
}
