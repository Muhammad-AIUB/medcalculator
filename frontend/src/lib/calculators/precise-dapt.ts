// PRECISE-DAPT Score — out-of-hospital bleeding risk on dual antiplatelet therapy
// after PCI. Costa F, et al. Lancet 2017;389(10073):1025-1034.
//
// PRECISE-DAPT is published as a NOMOGRAM, not a closed-form equation, so the
// coefficients below were recovered empirically from mdcalc.com/calc/10641 rather
// than transcribed from a formula. Method, for anyone revisiting this:
//
//   The score is additive and rounded once at the end, and the white blood cell
//   field accepts 2 decimal places. That makes WBC a vernier: hold everything else
//   fixed, binary-search the WBC value at which the displayed integer ticks up, and
//   that pins the continuous sum to ~0.01 of a point. Sweeping one axis at a time
//   that way recovers each axis's exact slope.
//
//   Two traps. The page needs ~1.7s to settle; at 1.25s the readings are stale and
//   the recovered slopes are wrong by enough to look like spline curvature that
//   isn't there. And the WBC slope is 1.031, not 1.0 — assuming 1.0 silently
//   rescales every other measurement.
//
// Every axis turned out linear. Validated against 102 MDCalc observations
// (94 used to fit, 8 fresh holdout cases): exact on all of them.

export interface PreciseDaptInput {
  age:          number;   // years
  hemoglobinGL: number;   // g/L
  wbc:          number;   // × 10⁹ cells/L
  crclMlMin:    number;   // mL/min
  priorBleed:   boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Per-axis point contributions. Each is linear between a zero point and a ceiling.
const agePoints  = (a: number) => clamp((a - 50) * 0.4696, 0, 18.783);
const hbPoints   = (h: number) => clamp((120 - h) * 0.7338, 0, 14.676);
const wbcPoints  = (w: number) => clamp((w - 5) * 1.03134, 0, 15.47);
const crclPoints = (c: number) => clamp((100 - c) * 0.2541, 0, 25.41);
const BLEED_POINTS = 25.686;

export function calculatePreciseDapt(input: PreciseDaptInput): {
  score:          number;
  riskGroup:      string;
  severity:       'success' | 'warning' | 'danger';
  interpretation: string;
  guidance:       string;
  references:     string[];
} {
  const score = Math.round(
    agePoints(input.age) +
    hbPoints(input.hemoglobinGL) +
    wbcPoints(input.wbc) +
    crclPoints(input.crclMlMin) +
    (input.priorBleed ? BLEED_POINTS : 0),
  );

  // Quartile bands, boundaries confirmed against MDCalc at 10/11, 17/18 and 24/25.
  let riskGroup: string;
  let severity: 'success' | 'warning' | 'danger';
  if (score >= 25)      { riskGroup = 'High';     severity = 'danger'; }
  else if (score >= 18) { riskGroup = 'Moderate'; severity = 'warning'; }
  else if (score >= 11) { riskGroup = 'Low';      severity = 'success'; }
  else                  { riskGroup = 'Very low'; severity = 'success'; }

  const guidance = score >= 25
    ? 'Consider short DAPT (3–6 months) if ischaemic risk is low or bleeding risk is a concern, then single antiplatelet therapy.'
    : 'Standard or extended DAPT may be reasonable, particularly if ischaemic risk is high.';

  return {
    score,
    riskGroup,
    severity,
    interpretation: `PRECISE-DAPT ${score} — ${riskGroup} bleeding risk. ${guidance}`,
    guidance,
    references: [
      'Costa F, van Klaveren D, James S, et al. Derivation and validation of the predicting bleeding complications in patients undergoing stent implantation and subsequent dual antiplatelet therapy (PRECISE-DAPT) score. Lancet. 2017;389(10073):1025-1034.',
    ],
  };
}
