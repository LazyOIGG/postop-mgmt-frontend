import api from '@/api'
import type { DailyCheckinRequest, CheckinRecord, OverviewData } from '@/types'

export const checkinService = {
  submit(data: DailyCheckinRequest) {
    return api.post('/api/v1/checkin/daily', data)
  },
  getRecords() {
    return api.get<{ success: boolean; records: CheckinRecord[] }>('/api/v1/checkin/daily')
  },
}

export const overviewService = {
  getDashboard(days?: number) {
    return api.get<{ success: boolean; days: number; data: OverviewData }>(
      '/api/v1/overview/dashboard',
      { params: { days } },
    )
  },
}
