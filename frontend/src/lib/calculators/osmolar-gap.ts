import type { CalculationResult } from '@/types/calculator';

interface OsmolarGapInput {
  measuredOsm: number;  // mOsm/kg
  sodium: number;       // mEq/L
  bun: number;          // mg/dL
  glucose: number;      // mg/dL
}

export function calculateOsmolarGap(input: OsmolarGapInput): CalculationResult {
  const { measuredOsm, sodium, bun, glucose } = input;
  const calculated = 2 * sodium + bun / 2.8 + glucose / 18;
  const gap = measuredOsm - calculated;
  const score = Math.round(gap * 10) / 10;

  let severity: CalculationResult['severity'];
  let interpretation: string;

  if (gap <= 10) {
    severity = 'success';
    interpretation = 'Normal osmolar gap (<=10 mOsm/kg)';
  } else if (gap <= 20) {
    severity = 'warning';
    interpretation = 'Borderline elevated osmolar gap (10–20 mOsm/kg) — clinical correlation required';
  } else {
    severity = 'danger';
    interpretation = 'Elevated osmolar gap (>20 mOsm/kg) — consider toxic alcohol (methanol, ethylene glycol, ethanol, isopropanol)';
  }

  return {
    calculatorId: 'osmolar-gap',
    score,
    unit: 'mOsm/kg',
    severity,
    label: interpretation,
    interpretation,
    references: ['Kraut JA, Xing SX. CJASN. 2011', 'MDCalc – Osmolal Gap'],
  };
}
