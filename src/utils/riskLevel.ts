export type RiskLevel = 'high' | 'low'

export const RISK_HIGH: RiskLevel = 'high'
export const RISK_LOW: RiskLevel = 'low'

const HIGH_PATTERNS = ['高风险', 'high', 'high_risk']

export function isHighRisk(level: string | undefined | null): boolean {
  if (!level) return false
  return HIGH_PATTERNS.includes(level.toLowerCase())
}

export function riskLevelLabel(level: string | undefined | null): string {
  return isHighRisk(level) ? '高风险' : '低风险'
}

export function riskLevelTagType(level: string | undefined | null): 'danger' | 'success' {
  return isHighRisk(level) ? 'danger' : 'success'
}
