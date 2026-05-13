import type { CalculationResult } from '@/types/calculator'
import { MedicalUnitConverter } from '@/lib/conversion/converter'

interface BMIInput {
  heightCm: number
  weightKg: number
  sex?: 'male' | 'female'
}

function getBMICategory(bmi: number): {
  label: string
  severity: 'success' | 'warning' | 'danger'
  description: string
} {
  if (bmi < 16) return { label: 'Severe Underweight', severity: 'danger', description: 'Severe malnutrition risk — immediate nutritional support needed' }
  if (bmi < 17) return { label: 'Moderate Underweight', severity: 'danger', description: 'Moderate malnutrition risk' }
  if (bmi < 18.5) return { label: 'Mild Underweight', severity: 'warning', description: 'Below normal weight range' }
  if (bmi < 25) return { label: 'Normal Weight', severity: 'success', description: 'Healthy BMI range (WHO 18.5–24.9)' }
  if (bmi < 30) return { label: 'Overweight', severity: 'warning', description: 'Above normal weight range — lifestyle modification recommended' }
  if (bmi < 35) return { label: 'Obesity Class I', severity: 'warning', description: 'Obesity — medical assessment recommended' }
  if (bmi < 40) return { label: 'Obesity Class II', severity: 'danger', description: 'Severe obesity — comprehensive management required' }
  return { label: 'Obesity Class III', severity: 'danger', description: 'Morbid obesity — bariatric evaluation recommended' }
}

export function calculateBMI(input: BMIInput): CalculationResult {
  const heightM = input.heightCm / 100
  if (heightM <= 0 || input.weightKg <= 0) {
    return {
      calculatorId: 'bmi',
      score: 0,
      severity: 'neutral',
      label: 'Incomplete',
      interpretation: 'Please enter valid height and weight',
      timestamp: new Date().toISOString(),
    }
  }

  const bmi = MedicalUnitConverter.round(input.weightKg / (heightM * heightM), 1)
  const category = getBMICategory(bmi)

  // Ideal Body Weight (Devine formula)
  let ibw: number
  if (input.sex === 'female') {
    ibw = 45.5 + 2.3 * ((input.heightCm / 2.54) - 60)
  } else {
    // Default to male formula
    ibw = 50 + 2.3 * ((input.heightCm / 2.54) - 60)
  }
  ibw = Math.max(ibw, 30) // safety floor

  // Adjusted Body Weight (for obesity, when actual > 1.2 × IBW)
  const abw = ibw + 0.4 * (input.weightKg - ibw)
  const useABW = input.weightKg > 1.2 * ibw

  const weightLb = MedicalUnitConverter.round(input.weightKg * 2.20462, 1)
  const heightIn = MedicalUnitConverter.round(input.heightCm / 2.54, 1)
  const heightFt = Math.floor(heightIn / 12)
  const heightInRemainder = MedicalUnitConverter.round(heightIn % 12, 1)

  return {
    calculatorId: 'bmi',
    score: bmi,
    unit: 'kg/m²',
    severity: category.severity,
    label: category.label,
    interpretation: category.description,
    details: [
      { label: 'BMI', value: bmi, unit: 'kg/m²' },
      { label: 'Height', value: `${heightFt}'${heightInRemainder}"` },
      { label: 'Height (cm)', value: input.heightCm, unit: 'cm' },
      { label: 'Weight (kg)', value: input.weightKg, unit: 'kg' },
      { label: 'Weight (lb)', value: weightLb, unit: 'lb' },
      { label: 'IBW (Devine)', value: MedicalUnitConverter.round(ibw, 1), unit: 'kg' },
      ...(useABW ? [{ label: 'ABW (40% rule)', value: MedicalUnitConverter.round(abw, 1), unit: 'kg' }] : []),
    ],
    subResults: [
      { label: 'WHO Category', value: category.label, severity: category.severity },
      {
        label: 'Dosing Weight',
        value: useABW
          ? `ABW ${MedicalUnitConverter.round(abw, 1)} kg (obesity adjustment)`
          : `IBW ${MedicalUnitConverter.round(ibw, 1)} kg`,
        severity: useABW ? 'warning' : 'success',
        interpretation: 'Use for drug dose calculations in obesity',
      },
    ],
    formula: 'BMI = weight(kg) / height(m)²\nIBW (Devine): Male = 50 + 2.3×(height_in − 60); Female = 45.5 + 2.3×(height_in − 60)\nABW = IBW + 0.4×(TBW − IBW)',
    references: ['WHO Expert Committee. Physical status. 1995', 'Devine BJ. Drug Intell Clin Pharm. 1974'],
    timestamp: new Date().toISOString(),
  }
}
