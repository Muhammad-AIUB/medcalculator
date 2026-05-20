import type { CalculationResult } from '@/types/calculator'

export interface FRAXInput {
  age: number
  fractureHistory: number
  motherHipFracture: number
  weight: number
  smoker: number
  chairRise: number
  bmd: number
}

export const FRAX_FORMULA = 'Addition of assigned points.'

export function calculateFRAX(input: FRAXInput): CalculationResult {
  const score = Object.values(input).reduce((total, value) => total + Number(value || 0), 0)

  let label = 'Low risk'
  let severity: 'success' | 'warning' | 'danger' = 'success'

  if (score >= 7) {
    label = 'High risk'
    severity = 'danger'
  } else if (score >= 4) {
    label = 'Moderate risk'
    severity = 'warning'
  }

  return {
    calculatorId: 'frax',
    score,
    unit: 'points',
    severity,
    label,
    interpretation: `${score} points`,
    formula: FRAX_FORMULA,
    timestamp: new Date().toISOString(),
  }
}
