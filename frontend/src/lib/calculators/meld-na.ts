import type { CalculationResult } from '@/types/calculator'
import { bilirubinConvert, creatinineConvert } from '@/lib/conversion/converter'
import { MedicalUnitConverter } from '@/lib/conversion/converter'

interface MELDNaInput {
  bilirubin: number
  bilirubinUnit: string
  inr: number
  creatinine: number
  creatinineUnit: string
  sodium: number
  onDialysis: boolean
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function getMELDMortality(meld: number): string {
  if (meld < 9) return '< 2%'
  if (meld < 12) return '< 5%'
  if (meld < 20) return '6-12%'
  if (meld < 30) return '19-26%'
  if (meld < 40) return '53-65%'
  return '> 71%'
}

export function calculateMELDNa(input: MELDNaInput): CalculationResult {
  let bilirubinMgDL = input.bilirubin
  if (input.bilirubinUnit === 'umol/L' || input.bilirubinUnit === 'µmol/L') {
    bilirubinMgDL = bilirubinConvert(input.bilirubin, 'µmol/L')
  }

  let creatMgDL = input.creatinine
  if (input.creatinineUnit === 'umol/L' || input.creatinineUnit === 'µmol/L') {
    creatMgDL = creatinineConvert(input.creatinine, 'µmol/L')
  }

  if (input.onDialysis) {
    creatMgDL = 4.0
  }

  const bili = Math.max(1.0, bilirubinMgDL)
  const creat = clamp(creatMgDL, 1.0, 4.0)
  const inr = Math.max(1.0, input.inr)
  const sodium = input.sodium

  const meld = MedicalUnitConverter.round(
    3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(creat) + 6.43,
    1
  )

  const meldNa = MedicalUnitConverter.round(
    meld - sodium - 0.025 * meld * (140 - sodium) + 140,
    1
  )

  const meldClamped = clamp(meld, 6, 40)
  const mortality90day = getMELDMortality(meldNa)

  let severity: 'success' | 'warning' | 'danger'
  if (meldNa < 15) severity = 'success'
  else if (meldNa < 25) severity = 'warning'
  else severity = 'danger'

  return {
    calculatorId: 'meld-na',
    score: meldNa,
    severity,
    label: `MELD-Na: ${meldNa}`,
    interpretation: `90-day transplant waitlist mortality: ${mortality90day}`,
    details: [
      { label: 'MELD Score', value: meldClamped },
      { label: 'MELD-Na Score', value: meldNa },
      { label: 'Bilirubin (mg/dL)', value: MedicalUnitConverter.round(bilirubinMgDL, 2), unit: 'mg/dL' },
      { label: 'Creatinine (mg/dL)', value: MedicalUnitConverter.round(creatMgDL, 2), unit: 'mg/dL' },
      { label: 'INR', value: MedicalUnitConverter.round(input.inr, 2) },
      { label: 'Sodium', value: input.sodium, unit: 'mEq/L' },
      { label: 'On Dialysis', value: input.onDialysis ? 'Yes' : 'No' },
    ],
    subResults: [
      { label: '90-Day Mortality', value: mortality90day, severity },
      {
        label: 'UNOS Priority',
        value: meldNa >= 25 ? 'High - consider transplant listing' : meldNa >= 15 ? 'Moderate' : 'Low',
        severity,
      },
    ],
    formula: 'MELD = 3.78 x ln(bilirubin) + 11.2 x ln(INR) + 9.57 x ln(creatinine) + 6.43\nMELD-Na = MELD Score - Na - 0.025 x MELD x (140-Na) + 140',
    references: ['Kamath PS et al. Hepatology. 2001', 'Kim WR et al. Hepatology. 2008'],
    timestamp: new Date().toISOString(),
  }
}
