import type { CalculationResult } from '@/types/calculator';

interface OsmolalityInput {
  sodium: number;    // mEq/L
  bun: number;       // mg/dL
  glucose: number;   // mg/dL
}

export function calculateOsmolality(input: OsmolalityInput): CalculationResult {
  const { sodium, bun, glucose } = input;
  const osm = 2 * sodium + bun / 2.8 + glucose / 18;
  const score = Math.round(osm * 10) / 10;

  let severity: CalculationResult['severity'];
  let interpretation: string;

  if (osm < 275) {
    severity = 'warning';
    interpretation = 'Hypo-osmolality — evaluate for hyponatremia, overhydration';
  } else if (osm <= 295) {
    severity = 'success';
    interpretation = 'Normal serum osmolality (275–295 mOsm/kg)';
  } else if (osm <= 320) {
    severity = 'warning';
    interpretation = 'Mild hyperosmolality (296–320 mOsm/kg)';
  } else {
    severity = 'danger';
    interpretation = 'Severe hyperosmolality (>320 mOsm/kg) — risk of seizures, coma';
  }

  return {
    calculatorId: 'osmolality',
    score,
    unit: 'mOsm/kg',
    severity,
    label: interpretation,
    interpretation,
    references: ['Worthley LI. Crit Care Resusc. 1999', 'MDCalc – Serum Osmolality/Osmolarity'],
  };
}
