// PRECISE-DAPT Score — Costa F et al., Lancet 2017
// Linear predictor: β·Age + β_q·CrCl² + β_l·CrCl + β·WBC + β·Hgb + β·PriorBleeding
// Score (0-100) derived from LP via published calibration

interface PreciseDaptInput {
  age:           number;  // years
  hemoglobin:    number;  // g/dL
  wbc:           number;  // × 10⁹ cells/L
  crCl:          number;  // mL/min
  priorBleeding: boolean;
}

export function calculatePreciseDapt(input: PreciseDaptInput): {
  score: number;
  interpretation: string;
  recommendation: string;
  severity: 'success' | 'warning' | 'danger';
  references: string[];
} {
  const { age, hemoglobin, wbc, crCl, priorBleeding } = input;

  // Regression coefficients (Costa et al., Lancet 2017, supplementary)
  const lp =
    0.04376  * age +
    0.000087 * crCl * crCl +
   -0.0462   * crCl +
    0.2274   * wbc  +
   -0.77044  * hemoglobin +
    0.84637  * (priorBleeding ? 1 : 0);

  // Scale LP to 0-100 (calibrated from published reference examples)
  const rawScore = 3.603 * lp + 47.77;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let severity: 'success' | 'warning' | 'danger';
  let interpretation: string;
  let recommendation: string;

  if (score < 25) {
    severity       = 'success';
    interpretation = `Low bleeding risk (PRECISE-DAPT ${score} < 25)`;
    recommendation = 'Standard or long DAPT duration (12–24 months) may be considered';
  } else {
    severity       = 'danger';
    interpretation = `High bleeding risk (PRECISE-DAPT ${score} >= 25)`;
    recommendation = 'Short DAPT duration (3–6 months) recommended to minimise bleeding risk';
  }

  return {
    score,
    interpretation,
    recommendation,
    severity,
    references: [
      'Costa F et al. Derivation and validation of the predicting bleeding complications in patients undergoing stent implantation and subsequent dual antiplatelet therapy (PRECISE-DAPT) score. Lancet. 2017;389(10073):1025-1034',
    ],
  };
}
