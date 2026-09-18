// Corrected Calcium for Hypoalbuminaemia
// Formula: Corrected Ca (mg/dL) = (0.8 × (Normal Albumin − Patient Albumin)) + Serum Ca
// Note: formula uses albumin in g/dL and calcium in mg/dL

interface CalciumCorrectionInput {
  calciumMgDl:      number;  // mg/dL
  albuminGdl:       number;  // g/dL  (patient)
  normalAlbuminGdl: number;  // g/dL  (reference — typically 4 g/dL)
}

export function calculateCalciumCorrection(input: CalciumCorrectionInput): {
  correctedCaMgDl:  number;
  correctedCaMmolL: number;
  interpretation:   string;
  severity:         'success' | 'warning' | 'danger';
  references:       string[];
} {
  const { calciumMgDl, albuminGdl, normalAlbuminGdl } = input;

  // Raw value: the result panel rounds once for display. Pre-rounding here would
  // double-round (MDCalc rounds the exact value once).
  const correctedCaMgDl  = 0.8 * (normalAlbuminGdl - albuminGdl) + calciumMgDl;
  // mmol/L comes off the RAW mg/dL, not the rounded one (chaining shifted 1.945 -> 1.95 -> 2.0;
  // MDCalc shows 1.9).
  const correctedCaMmolL = correctedCaMgDl / 4.0;
  const shownMgDl  = Math.round(correctedCaMgDl  * 10) / 10;
  const shownMmolL = Math.round(correctedCaMmolL * 10) / 10;

  let interpretation: string;
  let severity: 'success' | 'warning' | 'danger';

  if (correctedCaMgDl < 8.5) {
    severity       = 'danger';
    interpretation = `Hypocalcaemia — Corrected Ca ${shownMgDl} mg/dL (${shownMmolL} mmol/L) < 8.5 mg/dL`;
  } else if (correctedCaMgDl <= 10.5) {
    severity       = 'success';
    interpretation = `Normal — Corrected Ca ${shownMgDl} mg/dL (${shownMmolL} mmol/L) within 8.5–10.5 mg/dL`;
  } else {
    severity       = 'danger';
    interpretation = `Hypercalcaemia — Corrected Ca ${shownMgDl} mg/dL (${shownMmolL} mmol/L) > 10.5 mg/dL`;
  }

  return {
    correctedCaMgDl,
    correctedCaMmolL,
    interpretation,
    severity,
    references: [
      'Payne RB et al. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ. 1973;4(5893):643-644',
    ],
  };
}
