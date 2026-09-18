import type { CalculationResult } from '@/types/calculator'

export interface DAS28ESRInput {
  tenderJointCount: number
  swollenJointCount: number
  esr: number
  globalHealth: number
}

export const DAS28_ESR_FORMULA =
  'DAS28-ESR = 0.56*sqrt(Tender Joint Count) + 0.28*sqrt(Swollen Joint Count) + 0.70*ln(ESR) + 0.014*(Global Health on 0-100 scale)'

export function calculateDAS28ESR(input: DAS28ESRInput): CalculationResult {
  const tenderJointCount = Math.max(0, Number(input.tenderJointCount || 0))
  const swollenJointCount = Math.max(0, Number(input.swollenJointCount || 0))
  const esr = Math.max(1, Number(input.esr || 1))
  // Global Health is entered on a 0-10 VAS but the DAS28 formula uses a 0-100 scale (×10)
  const globalHealth100 = Math.max(0, Number(input.globalHealth || 0)) * 10
  const score =
    0.56 * Math.sqrt(tenderJointCount) +
    0.28 * Math.sqrt(swollenJointCount) +
    0.7 * Math.log(esr) +
    0.014 * globalHealth100
  // Do NOT return a pre-rounded score: the result panel rounds to 1 dp for display,
  // so rounding to 2 dp here double-rounds (ESR 5, GH 8 -> 2.2466 -> 2.25 -> 2.3,
  // where MDCalc shows 2.2). The 2 dp value is for the interpretation text only.
  const displayScore = Number(score.toFixed(2))

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
    score,
    unit: 'points',
    severity,
    label,
    interpretation: `DAS28-ESR ${displayScore} — ${label}`,
    formula: DAS28_ESR_FORMULA,
    timestamp: new Date().toISOString(),
  }
}
