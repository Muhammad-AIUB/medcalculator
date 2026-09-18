// CNS International Prognostic Index (CNS-IPI) — predicts CNS relapse in DLBCL.
// Schmitz N, et al. J Clin Oncol. 2016;34(26):3150-3156.
//
// The five IPI factors plus kidney and/or adrenal gland involvement, each worth
// 1 point. Banding and 2-year CNS relapse rates verified against
// mdcalc.com/calc/10488 at every score from 0 to 6.

export interface CnsIpiInput {
  ageOver60:       boolean;  // age >60 years
  ldhElevated:     boolean;  // LDH > normal
  ecogOver1:       boolean;  // ECOG performance status >1
  stageIIIorIV:    boolean;  // Ann Arbor stage III or IV
  extranodalOver1: boolean;  // >1 extranodal site (marrow, CNS, liver/GI, lung)
  kidneyOrAdrenal: boolean;  // kidney and/or adrenal gland involvement
}

export function calculateCnsIpi(input: CnsIpiInput): {
  score:          number;
  riskGroup:      string;
  relapseRisk:    string;
  prophylaxis:    string;
  severity:       'success' | 'warning' | 'danger';
  interpretation: string;
  references:     string[];
} {
  const score = [
    input.ageOver60,
    input.ldhElevated,
    input.ecogOver1,
    input.stageIIIorIV,
    input.extranodalOver1,
    input.kidneyOrAdrenal,
  ].filter(Boolean).length;

  let riskGroup: string;
  let relapseRisk: string;
  let severity: 'success' | 'warning' | 'danger';

  if (score <= 1) {
    riskGroup = 'Low';
    relapseRisk = '0.6%';
    severity = 'success';
  } else if (score <= 3) {
    riskGroup = 'Intermediate';
    relapseRisk = '3.4%';
    severity = 'warning';
  } else {
    riskGroup = 'High';
    relapseRisk = '10.2%';
    severity = 'danger';
  }

  // MDCalc splits management at score 4, matching the low/intermediate vs high bands.
  const prophylaxis = score >= 4
    ? 'Consider CNS-directed prophylaxis (e.g. intrathecal chemotherapy or high-dose methotrexate) during remission induction, per institutional protocol. CNS imaging or lumbar puncture may be considered to evaluate for subclinical disease.'
    : 'Routine CNS prophylaxis and diagnostics are not typically indicated; proceed with standard treatment protocols.';

  return {
    score,
    riskGroup,
    relapseRisk,
    prophylaxis,
    severity,
    interpretation: `CNS-IPI ${score} — ${riskGroup} (${relapseRisk}) risk of CNS relapse. ${prophylaxis}`,
    references: [
      'Schmitz N, Zeynalova S, Nickelsen M, et al. CNS International Prognostic Index: a risk model for CNS relapse in patients with diffuse large B-cell lymphoma treated with R-CHOP. J Clin Oncol. 2016;34(26):3150-3156.',
    ],
  };
}
