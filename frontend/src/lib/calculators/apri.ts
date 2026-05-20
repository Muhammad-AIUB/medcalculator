import type { CalculationResult } from '@/types/calculator'

export interface APRIInput {
  ast: number
  astUpperLimit: number
  platelets: number
  plateletUnit: '10^9/L' | '10^3/uL'
}

export const APRI_FORMULA =
  'APRI = (AST in IU/L) / (AST Upper Limit of Normal in IU/L) / (Platelets in 10^9/L)'

export function calculateAPRI(input: APRIInput): CalculationResult {
  const ast = Number(input.ast || 0)
  const astUpperLimit = Math.max(1, Number(input.astUpperLimit || 1))
  const platelets = Math.max(1, Number(input.platelets || 1))
  const platelets109L = input.plateletUnit === '10^3/uL' ? platelets : platelets
  const score = ast / astUpperLimit / platelets109L
  const roundedScore = Number(score.toFixed(4))

  let label = 'Lower likelihood of significant fibrosis'
  let severity: 'success' | 'warning' | 'danger' = 'success'

  if (score > 1.5) {
    label = 'Higher likelihood of significant fibrosis'
    severity = 'danger'
  } else if (score >= 0.5) {
    label = 'Indeterminate'
    severity = 'warning'
  }

  return {
    calculatorId: 'apri',
    score: roundedScore,
    unit: '',
    severity,
    label,
    interpretation: `${roundedScore}`,
    formula: APRI_FORMULA,
    timestamp: new Date().toISOString(),
  }
}
