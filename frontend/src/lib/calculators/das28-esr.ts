import type { CalculationResult } from '@/types/calculator'

export interface DAS28ESRInput {
  tenderJointCount: number
  swollenJointCount: number
  esr: number
  globalHealth: number
}

export const DAS28_ESR_FORMULA =
  'DAS28-ESR= (0.56*sqrt(Tender Joint Count)+0.28*sqrt(Swollen Joint Count)+0.7*ln(ESR)+0.014*(global health))'

export function calculateDAS28ESR(input: DAS28ESRInput): CalculationResult {
  const tenderJointCount = Math.max(0, Number(input.tenderJointCount || 0))
  const swollenJointCount = Math.max(0, Number(input.swollenJointCount || 0))
  const esr = Math.max(1, Number(input.esr || 1))
  const globalHealth = Math.max(0, Number(input.globalHealth || 0))
  const score =
    0.56 * Math.sqrt(tenderJointCount) +
    0.28 * Math.sqrt(swollenJointCount) +
    0.7 * Math.log(esr) +
    0.014 * globalHealth
  const roundedScore = Number(score.toFixed(2))

  let label = 'Remission'
  let severity: 'success' | 'warning' | 'danger' = 'success'

  if (score > 5.1) {
    label = 'High disease activity'
    severity = 'danger'
  } else if (score > 3.2) {
    label = 'Moderate disease activity'
    severity = 'warning'
  } else if (score >= 2.6) {
    label = 'Low disease activity'
    severity = 'warning'
  }

  return {
    calculatorId: 'das28-esr',
    score: roundedScore,
    unit: 'points',
    severity,
    label,
    interpretation: `${roundedScore} points`,
    formula: DAS28_ESR_FORMULA,
    timestamp: new Date().toISOString(),
  }
}
