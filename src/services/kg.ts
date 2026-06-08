import api from '@/api'
import type { KGSearchResponse } from '@/types'

export const kgService = {
  /** 知识图谱搜索 —— 实体模糊搜索（自动补全）+ 自然语言查询 */
  search(q: string, options?: { page?: number; page_size?: number }) {
    return api.get<KGSearchResponse>('/api/v1/kg/search', {
      params: { q, page: options?.page ?? 1, page_size: options?.page_size ?? 20 },
    })
  },

  /** 获取疾病列表 */
  getDiseases(page = 1, pageSize = 20) {
    return api.get('/api/v1/kg/diseases', { params: { page, page_size: pageSize } })
  },

  /** 获取关系子图用于可视化 */
  visualize(entityName: string, maxHops = 2) {
    return api.post('/api/v1/kg/visualize', { entity_name: entityName, max_hops: maxHops })
  },
}
