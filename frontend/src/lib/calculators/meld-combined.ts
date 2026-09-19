// Model for End-Stage Liver Disease — combined calculator offering the three
// versions MDCalc hosts on one page (mdcalc.com/calc/10437):
//
//   original  MELD Score (pre-2016)
//   meld-na   MELD Na, the prior UNOS/OPTN standard
//   meld-3    MELD 3.0, currently recommended by OPTN
//
// Every bound below was probed directly on that page rather than assumed:
//   - MELD 3.0 caps creatinine at 3.0 mg/dL (Cr 4.52 scored 31, matching a cap at
//     3.0; uncapped would have given 35) and dialysis forces creatinine to 3.0
//   - MELD 3.0 bounds albumin to 1.5–3.5 g/dL and sodium to 125–137 mmol/L
//   - the original MELD caps creatinine at 4.0 mg/dL, and dialysis forces 4.0
//   - MDCalc does NOT clamp the result to the OPTN 6–40 range: a very sick set
//     returned 49. The floor is structural anyway (the constant term is 6).

export type MeldVersion = 'original' | 'meld-na' | 'meld-3';

export interface MeldCombinedInput {
  version:        MeldVersion;
  bilirubinMgDl:  number;
  inr:            number;
  creatinineMgDl: number;
  sodium?:        number;   // mmol/L — meld-na and meld-3
  albuminGdl?:    number;   // g/dL   — meld-3 only
  female?:        boolean;  // meld-3 only
  onDialysis:     boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const VERSION_LABEL: Record<MeldVersion, string> = {
  original: 'MELD Score (Original, Pre-2016)',
  'meld-na': 'MELD Na (prior UNOS/OPTN version)',
  'meld-3':  'MELD 3.0 (currently recommended by OPTN)',
};

// Original MELD, also the base for MELD Na. Reported as a whole number.
function originalMeld(bilirubin: number, inr: number, creatinine: number, onDialysis: boolean): number {
  const bili = Math.max(1, bilirubin);
  const i    = Math.max(1, inr);
  const cr   = onDialysis ? 4.0 : clamp(creatinine, 1, 4);
  return Math.round(3.78 * Math.log(bili) + 11.2 * Math.log(i) + 9.57 * Math.log(cr) + 6.43);
}

export function calculateMeldCombined(input: MeldCombinedInput): {
  score:          number;
  version:        MeldVersion;
  versionLabel:   string;
  severity:       'success' | 'warning' | 'danger';
  interpretation: string;
  formula:        string;
  references:     string[];
} {
  const { version, onDialysis } = input;
  let score: number;
  let formula: string;

  if (version === 'meld-3') {
    const bili = Math.max(1, input.bilirubinMgDl);
    const inr  = Math.max(1, input.inr);
    const cr   = onDialysis ? 3.0 : clamp(input.creatinineMgDl, 1, 3);
    const alb  = clamp(input.albuminGdl ?? 3.5, 1.5, 3.5);
    const na   = clamp(input.sodium ?? 137, 125, 137);
    const female = input.female ? 1 : 0;

    const raw =
      1.33 * female +
      4.56 * Math.log(bili) +
      0.82 * (137 - na) -
      0.24 * (137 - na) * Math.log(bili) +
      9.09 * Math.log(inr) +
      11.14 * Math.log(cr) +
      1.85 * (3.5 - alb) -
      1.83 * (3.5 - alb) * Math.log(cr) +
      6;

    score = Math.round(raw);
    formula =
      'MELD 3.0 = 1.33 (if female) + 4.56 ln(bilirubin) + 0.82 (137 − Na) − 0.24 (137 − Na) ln(bilirubin)\n' +
      '         + 9.09 ln(INR) + 11.14 ln(creatinine) + 1.85 (3.5 − albumin) − 1.83 (3.5 − albumin) ln(creatinine) + 6\n\n' +
      'Bilirubin and INR floored at 1. Creatinine 1–3 mg/dL (3.0 if on dialysis).\n' +
      'Albumin 1.5–3.5 g/dL. Sodium 125–137 mmol/L.';
  } else {
    const meld = originalMeld(input.bilirubinMgDl, input.inr, input.creatinineMgDl, onDialysis);
    if (version === 'original') {
      score = meld;
      formula =
        'MELD = 3.78 ln(bilirubin) + 11.2 ln(INR) + 9.57 ln(creatinine) + 6.43\n\n' +
        'Bilirubin, INR and creatinine floored at 1. Creatinine capped at 4.0 mg/dL\n' +
        '(4.0 if on dialysis).';
    } else {
      const na = clamp(input.sodium ?? 137, 125, 137);
      // The sodium adjustment only applies above 11, and runs on the rounded MELD.
      score = meld > 11
        ? Math.round(meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na))
        : meld;
      formula =
        'MELD = 3.78 ln(bilirubin) + 11.2 ln(INR) + 9.57 ln(creatinine) + 6.43\n' +
        'If MELD > 11:  MELD Na = MELD + 1.32 (137 − Na) − 0.033 × MELD × (137 − Na)\n\n' +
        'Sodium bounded 125–137 mmol/L. Creatinine capped at 4.0 mg/dL (4.0 if on dialysis).';
    }
  }

  // 90-day mortality bands as published for MELD; OPTN treats 40 as the ceiling for
  // transplant prioritisation, though the score itself is reported unclamped.
  let severity: 'success' | 'warning' | 'danger';
  let mortality: string;
  if (score >= 40)      { severity = 'danger';  mortality = '~71% 3-month mortality'; }
  else if (score >= 30) { severity = 'danger';  mortality = '~53% 3-month mortality'; }
  else if (score >= 20) { severity = 'danger';  mortality = '~20% 3-month mortality'; }
  else if (score >= 10) { severity = 'warning'; mortality = '~6% 3-month mortality'; }
  else                  { severity = 'success'; mortality = '~2% 3-month mortality'; }

  return {
    score,
    version,
    versionLabel: VERSION_LABEL[version],
    severity,
    interpretation: `${VERSION_LABEL[version]}: ${score} points — ${mortality}.`,
    formula,
    references: [
      'Kamath PS, Wiesner RH, Malinchoc M, et al. A model to predict survival in patients with end-stage liver disease. Hepatology. 2001;33(2):464-470.',
      'Kim WR, Biggins SW, Kremers WK, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-1026.',
      'Kim WR, Mannalithara A, Heimbach JK, et al. MELD 3.0: the model for end-stage liver disease updated for the modern era. Gastroenterology. 2021;161(6):1887-1895.',
    ],
  };
}
