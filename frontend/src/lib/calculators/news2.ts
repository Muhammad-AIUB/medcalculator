// National Early Warning Score 2 (NEWS2) — Royal College of Physicians, 2017.
// Recommended by NHS England over the original NEWS.
//
// Differences from NEWS (see ./news.ts):
//   - a second SpO₂ scale for patients with hypercapnic respiratory failure
//     (target range 88–92%), where scoring also depends on air vs supplemental O₂
//   - consciousness uses ACVPU: new-onset Confusion scores 3, like V/P/U
//   - a single parameter scoring 3 gives its own "low-medium" band rather than
//     being folded into medium risk
//
// Banding verified against mdcalc.com/calc/10083: 0–4 low, 0–4 with any single
// parameter at 3 low-medium, 5–6 medium, ≥7 high.

export interface NEWS2Input {
  respiratory:    number;   // points 0–3
  spo2:           number;   // points 0–3 (Scale 1, or Scale 2 when hypercapnic)
  supplementalO2: number;   // points 0 or 2
  temperature:    number;   // points 0–3
  systolicBP:     number;   // points 0–3
  heartRate:      number;   // points 0–3
  consciousness:  number;   // points 0 or 3
  hypercapnic:    boolean;  // true = SpO₂ Scale 2 was used
}

export function calculateNEWS2(input: NEWS2Input): {
  score:          number;
  redFlag:        boolean;
  riskBand:       string;
  severity:       'success' | 'warning' | 'danger';
  label:          string;
  interpretation: string;
  monitoring:     string;
  references:     string[];
} {
  const points = [
    input.respiratory,
    input.spo2,
    input.supplementalO2,
    input.temperature,
    input.systolicBP,
    input.heartRate,
    input.consciousness,
  ];
  const score = points.reduce((a, b) => a + b, 0);

  // "RED score": any single parameter scoring 3. Supplemental O₂ can only score 2,
  // so it never triggers this on its own.
  const redFlag = points.some((p) => p >= 3);

  let riskBand: string;
  let severity: 'success' | 'warning' | 'danger';
  let response: string;
  let monitoring: string;

  if (score >= 7) {
    riskBand   = 'High risk';
    severity   = 'danger';
    response   = 'Emergency assessment by a team with critical-care competencies, including a clinician with advanced airway management skills. Usually requires transfer to a level 2 or 3 care facility.';
    monitoring = 'Continuous monitoring of vital signs';
  } else if (score >= 5) {
    riskBand   = 'Medium risk';
    severity   = 'warning';
    response   = 'Urgent review by a clinician with competencies in the assessment of acute illness, usually a ward-based doctor, who decides whether escalation to a critical-care team is needed.';
    monitoring = 'Minimum once hourly';
  } else if (redFlag) {
    riskBand   = 'Low-medium risk';
    severity   = 'warning';
    response   = 'Urgent review by a clinician, usually a ward-based doctor, to decide whether escalation of care is needed. Triggered by a single parameter scoring 3 even though the total is below 5.';
    monitoring = 'Minimum once hourly';
  } else {
    riskBand   = 'Low risk';
    severity   = 'success';
    response   = score === 0
      ? 'Continue routine monitoring.'
      : 'Assessment by a competent registered nurse, who decides whether to increase the frequency of monitoring or escalate care.';
    monitoring = score === 0 ? 'Minimum 12 hourly' : 'Minimum 4–6 hourly';
  }

  const scaleNote = input.hypercapnic ? ' (SpO₂ Scale 2)' : '';

  return {
    score,
    redFlag,
    riskBand,
    severity,
    label: `${score} points`,
    interpretation: `NEWS2 ${score}${scaleNote} — ${riskBand}. ${response}`,
    monitoring,
    references: [
      'Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. Updated report of a working party. London: RCP, 2017.',
    ],
  };
}
