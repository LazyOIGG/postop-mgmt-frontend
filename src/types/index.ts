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

export interface RefreshRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token?: string
}

export interface AuthData {
  username: string
  is_admin: boolean
  token: string
  refresh_token: string
}

export interface AuthResponse {
  success: boolean
  code?: number
  message?: string
  data?: AuthData
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
  session_id: number
  username: string
  session_title: string
  start_time: string
  last_updated: string
  message_count?: number
  first_message?: string
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
}

export interface Alert {
  id: number
  patient_username: string
  type: string
  message: string
  status: 'pending' | 'processed'
  created_at: string
}

export interface DoctorMessage {
  id: number
  patient_username: string
  doctor_username?: string
  sender: 'doctor' | 'patient'
  content: string
  message_type?: 'text' | 'image' | 'voice'
  media_url?: string
  created_at: string
}

// ===== 通知 =====
export interface Notification {
  id: number
  username: string
  type: string
  title: string
  content: string
  related_id: number | null
  is_read: boolean
  created_at: string
}

// ===== 通用 =====
export interface ApiError {
  success: false
  message: string
}

// ===== 知识图谱搜索 =====
export interface KGSuggestItem {
  name: string
  label: string
  match_type: 'exact' | 'fuzzy'
}

export interface KGSearchResponse {
  success: boolean
  query: string
  source: 'fast_path' | 'text2cypher' | 'none'
  entities: KGSuggestItem[]
  results: Array<Record<string, unknown>>
  graph: { nodes: Array<{ id: string; name: string; labels: string[] }>; edges: Array<{ source: string; target: string; type: string }> } | null
  count: number
  intent?: string
  entity?: string
}

// ===== 系统统计 =====
export interface SystemStats {
  total_users: number
  total_doctors: number
  total_sessions: number
  total_messages: number
  active_today: number
}

export interface DashboardData {
  basic_stats: { total_users?: number; total_sessions?: number; active_today?: number }
  ratio_stats: Record<string, number>
  recent_high_risk: Array<{ patient_username?: string; risk_reasons?: string[] }>
  recent_abnormal_checkins: Array<{ username?: string; checkin_date?: string }>
}

// ===== 趋势 =====
export interface TrendData {
  dates: string[]
  temperature: number[]
  blood_sugar: number[]
  heart_rate: number[]
  abnormal_flags: number[]
}

export interface OverviewData {
  overview: Record<string, unknown>
  trend: TrendData
  abnormal_records: Array<{ date: string; reason: string; symptoms: string }>
  latest_assessment: { risk_level?: string; advice?: string; created_at?: string } | null
  profile: PatientProfile | null
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
  surgery_type?: string
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

// ===== 康复指标 =====
export interface RehabMetricInput {
  metric_date: string
  metric_type: string
  metric_value: number
  metric_unit?: string
  note?: string
}

export interface RehabMetric {
  id: number
  plan_id: number
  metric_date: string
  metric_type: string
  metric_value: number
  metric_unit: string
  note: string
  created_at: string
}

export interface MetricTrend {
  dates: string[]
  values: number[]
  metric_type: string
}

export interface LatestMetrics {
  [key: string]: { value: number; unit: string; date: string }
}

// ===== 运动指导 =====
export interface RehabExercise {
  id: number
  title: string
  category: 'stretching' | 'strength' | 'balance' | 'mobility' | 'breathing' | 'other'
  difficulty: 'easy' | 'medium' | 'hard'
  target_body_part: string
  surgery_type_tag: string
  video_url: string
  thumbnail_url: string
  image_urls: string[]
  description: string
  steps: string[]
  duration_minutes: number
  repetitions: number
  precautions: string
  phase_suitable: string
}

// ===== 康复日志 =====
export interface RehabJournalInput {
  journal_date: string
  mood?: string
  pain_level?: number
  content?: string
  photo_urls?: string[]
  voice_url?: string
  sleep_quality?: number
  appetite?: number
  energy_level?: number
  questions_for_doctor?: string
}

export interface RehabJournal {
  id: number
  plan_id: number
  username: string
  journal_date: string
  mood: string
  pain_level: number
  content: string
  photo_urls: string[]
  voice_url: string
  sleep_quality: number
  appetite: number
  energy_level: number
  questions_for_doctor: string
  created_at: string
}

// ===== 成就 =====
export interface AchievementDef {
  id: number
  code: string
  name: string
  description: string
  icon_url: string
  category: 'streak' | 'milestone' | 'compliance' | 'recovery' | 'special'
  condition_json: Record<string, unknown>
  points: number
}

export interface UserAchievement extends AchievementDef {
  user_achievement_id: number
  earned_at: string
}

// ===== 仪表盘 =====
export interface DashboardData {
  plan: RehabPlan
  stats: { total_tasks: number; completed_tasks: number; pending_tasks: number }
  calendar: Record<string, { total: number; completed: number; skipped: number }>
  today_tasks: RehabTask[]
  latest_metrics: LatestMetrics
  phase_stats: Record<string, { total: number; completed: number }>
}

export interface CalendarData {
  [date: string]: { total: number; completed: number; skipped: number }
}

// ===== 医生端 =====
export interface DoctorRehabOverview {
  plan: RehabPlan
  phase_stats: Record<string, { total: number; completed: number }>
  metrics: RehabMetric[]
  journals: RehabJournal[]
  achievement_count: number
}
