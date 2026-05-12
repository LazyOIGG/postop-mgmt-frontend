# 术后管理系统前端 — 设计规格

## 1. 项目概述

为 Postop-Mgmt-System Python 后端生成独立的 Vue 3 前端，分为患者端和医生端，通过角色路由在单应用中实现。

## 2. 技术选型

| 类别 | 选型 | 说明 |
|------|------|------|
| 构建工具 | Vite 5 | Vue 3 官方推荐 |
| UI 框架 | Element Plus | 国内生态完善，适合后台管理 |
| 状态管理 | Pinia | Vue 3 官方推荐 |
| 路由 | Vue Router 4 | 导航守卫实现角色分流 |
| HTTP | Axios | 拦截器统一注入 token |
| WebSocket | 原生 WebSocket API | 聊天流式通信 |
| SSE | EventSource | 流式 AI 响应 |
| 图表 | ECharts | 趋势图/仪表盘 |
| CSS | Element Plus + 媒体查询 | 响应式适配 |
| 语言 | TypeScript | 类型安全 |

## 3. 路由结构

```
/login              → 登录/注册页
/patient            → 患者端 Layout（底部 Tab 导航）
  /patient/home     → 首页概览
  /patient/chat     → AI 智能问诊
  /patient/checkin  → 每日健康打卡
  /patient/profile  → 我的（健康档案）
/doctor             → 医生端 Layout（侧栏导航）
  /doctor/dashboard → 工作台概览
  /doctor/patients  → 患者管理
  /doctor/alerts    → 异常预警
  /doctor/messages  → 医患消息
  /doctor/statistics → 系统统计
```

**路由策略**: 登录后根据 API 返回的 `is_admin` 字段路由到 `/patient` 或 `/doctor`。未认证用户通过导航守卫跳回 `/login`。

## 4. 架构分层

```
View (Vue 组件 + Element Plus)
  → Store (Pinia 状态管理)
    → Service (按模块封装的 API 调用)
      → API (axios 实例 + 拦截器)
```

- **API 层**: 配置 baseURL、Bearer Token 注入、统一错误处理（401 跳登录）
- **Service 层**: 按后端 tag 模块封装（auth, chat, session, checkin, health, reminder, doctor, stats）
- **Store 层**: Pinia stores（auth, chat, checkin, doctor, reminder），管理全局状态
- **View 层**: Vue 3 组合式 API 组件，遵循患者/医生目录分离

## 5. 布局策略

- **患者端**: 移动优先，底部 4 Tab 导航（首页/AI助手/打卡/我的），使用 `keep-alive` 缓存聊天状态
- **医生端**: 桌面优先，左侧侧栏导航，固定宽度 220px，右侧内容区自适应
- **登录/注册**: 居中卡片式布局，全端通用

## 6. 核心页面与组件

### 6.1 患者端

**首页概览**: 健康趋势卡片 + 今日提醒列表 + 快速入口（AI问诊/健康评估/每日打卡）

**AI 智能问诊**:
- MessageList → ChatBubble（用户/AI 消息）+ StreamingText（流式渲染）
- InputPanel → 文本输入 + VoiceInput + ImageUpload
- SessionDrawer → 历史会话列表
- WebSocket 实时通信，SSE 流式响应

**每日健康打卡**:
- CheckinForm: 体温/血压/血糖/心率/睡眠/饮食/运动/用药
- CheckinHistory: 打卡记录列表
- HealthTrendChart: ECharts 趋势图

**我的（健康档案）**:
- ProfileCard: 个人信息编辑
- AssessmentHistory: 评估历史列表
- ReminderList: 提醒管理

### 6.2 医生端

**工作台概览**: 统计卡片（管理患者数/高风险/待处理预警）+ 最近异常记录 + 快速入口

**患者管理**: PatientTable（搜索/筛选） + PatientDetailDrawer（患者详情 + 健康档案 + 聊天入口）

**异常预警**: AlertTabs（待处理/已处理） + AlertCard 列表 + AlertProcessDialog

**医患消息**: 患者列表 → 聊天窗口（复用聊天组件）

**系统统计**: 仪表盘数据图表 + 基础/比率统计

## 7. 目录结构

```
postop-mgmt-frontend/
├── src/
│   ├── api/
│   │   └── index.ts           # axios 实例 + 拦截器
│   ├── services/
│   │   ├── auth.ts            # 登录/注册
│   │   ├── chat.ts            # 聊天 + WebSocket
│   │   ├── session.ts         # 会话管理
│   │   ├── checkin.ts         # 每日打卡
│   │   ├── health.ts          # 健康评估 + 档案
│   │   ├── reminder.ts        # 提醒中心
│   │   ├── doctor.ts          # 医生端接口
│   │   └── stats.ts           # 统计数据
│   ├── stores/
│   │   ├── auth.ts            # 认证 & 用户角色
│   │   ├── chat.ts            # 聊天消息 & 会话
│   │   ├── checkin.ts         # 打卡数据
│   │   └── doctor.ts          # 医生端状态
│   ├── router/
│   │   └── index.ts           # 路由配置 + 导航守卫
│   ├── views/
│   │   ├── login/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── patient/
│   │   │   ├── PatientLayout.vue
│   │   │   ├── HomeView.vue
│   │   │   ├── ChatView.vue
│   │   │   ├── CheckinView.vue
│   │   │   └── ProfileView.vue
│   │   └── doctor/
│   │       ├── DoctorLayout.vue
│   │       ├── DashboardView.vue
│   │       ├── PatientListView.vue
│   │       ├── AlertsView.vue
│   │       ├── MessagesView.vue
│   │       └── StatisticsView.vue
│   ├── components/
│   │   ├── common/            # 通用 UI 组件
│   │   ├── chat/              # ChatBubble, InputPanel, SessionDrawer...
│   │   └── doctor/            # PatientTable, AlertCard...
│   ├── composables/
│   │   ├── useWebSocket.ts    # WebSocket 连接管理
│   │   ├── useSSE.ts          # SSE 流式接收
│   │   └── useAuth.ts         # 认证逻辑封装
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义（来自 OpenAPI schemas）
│   └── styles/
│       └── index.css          # 全局样式 + 响应式断点
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 8. 关键实现要点

- **Token 管理**: 登录成功存入 localStorage + Pinia，axios 拦截器自动附加 Authorization header
- **WebSocket**: 聊天页挂载时建立连接，离开时断开；支持断线重连
- **SSE 流式**: 流式模式下使用 EventSource 解析 chunk 事件，逐字渲染回复
- **文件上传**: 图片分析/OCR/语音使用 FormData + multipart/form-data
- **响应式**: 患者端 375px-768px 移动布局，768px+ 平板适配；医生端 1024px+ 桌面布局
- **keep-alive**: 患者端 4 个 Tab 页缓存，保持聊天消息和页面状态不丢失

## 9. 不在范围内

- 国际化（仅中文）
- 暗色模式
- 端到端测试
- PWA / 离线支持
