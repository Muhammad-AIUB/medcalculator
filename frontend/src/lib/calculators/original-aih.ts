import type { CalculationResult } from '@/types/calculator'

export interface OriginalAIHInput {
  sex: number
  alpAstAltRatio: number
  serumGlobulinsIgg: number
  antibodies: number
  optionalAutoantibodies: number
  ama: number
  hepatitisViralMarkers: number
  hepatotoxicDrugs: number
  alcoholIntake: number
  interfaceHepatitis: number
  lymphoplasmacytic: number
  rosetting: number
  biliaryChanges: number
  otherChanges: number
  autoimmuneDisease: number
  responseTherapy: number
}

export const ORIGINAL_AIH_FORMULA = 'Addition of assigned points.'

export function calculateOriginalAIH(input: OriginalAIHInput): CalculationResult {
  const score = Object.values(input).reduce((total, value) => total + Number(value || 0), 0)

  let label = 'AIH unlikely'
  let severity: 'success' | 'warning' | 'danger' = 'success'

  if (score > 15) {
    label = 'Definite AIH'
    severity = 'danger'
  } else if (score >= 10) {
    label = 'Probable AIH'
    severity = 'warning'
  }

  return {
    calculatorId: 'original-aih',
    score,
    unit: 'points',
    severity,
    label,
    interpretation: `${score} points`,
    formula: ORIGINAL_AIH_FORMULA,
    timestamp: new Date().toISOString(),
  }
}
