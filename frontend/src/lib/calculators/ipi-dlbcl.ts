// International Prognostic Index (IPI) and Revised IPI (R-IPI) for Diffuse Large
// B-cell Lymphoma.
//
// Five risk factors, each worth 1 point. The same total is banded two ways: the
// original IPI (Shipp 1993, pre-rituximab) and the R-IPI (Sehn 2007, R-CHOP era).
// IPI results are kept for historical comparison; R-IPI is the rituximab-era index.
//
// Risk groups and survival figures verified against mdcalc.com/calc/3936 at every
// score from 0 to 5.

export interface IPIDlbclInput {
  ageOver60:      boolean;  // age >60 years
  stageIIIorIV:   boolean;  // Ann Arbor stage III-IV
  ecogOver1:      boolean;  // ECOG performance status >=2
  ldhElevated:    boolean;  // serum LDH >1x upper limit of normal
  extranodalOver1: boolean; // >1 extranodal site
}

interface Band {
  group: string;
  os: string;   // 4-year overall survival
  pfs: string;  // 4-year progression-free survival
}

// R-IPI: 0 very good, 1-2 good, 3-5 poor
function rIpiBand(score: number): Band {
  if (score === 0) return { group: 'Very good prognosis', os: '94%', pfs: '94%' };
  if (score <= 2)  return { group: 'Good prognosis',      os: '79%', pfs: '80%' };
  return { group: 'Poor prognosis', os: '55%', pfs: '53%' };
}

// IPI: 0-1 low, 2 low-intermediate, 3 high-intermediate, 4-5 high
function ipiBand(score: number): Band {
  if (score <= 1) return { group: 'Low risk group',               os: '82%', pfs: '85%' };
  if (score === 2) return { group: 'Low-intermediate risk group', os: '81%', pfs: '80%' };
  if (score === 3) return { group: 'High-intermediate risk group', os: '49%', pfs: '57%' };
  return { group: 'High risk group', os: '59%', pfs: '51%' };
}

export function calculateIPIDlbcl(input: IPIDlbclInput): {
  score:          number;
  rIpiGroup:      string;
  ipiGroup:       string;
  rIpiOs:         string;
  rIpiPfs:        string;
  ipiOs:          string;
  ipiPfs:         string;
  severity:       'success' | 'warning' | 'danger';
  interpretation: string;
  references:     string[];
} {
  const score = [
    input.ageOver60,
    input.stageIIIorIV,
    input.ecogOver1,
    input.ldhElevated,
    input.extranodalOver1,
  ].filter(Boolean).length;

  const r = rIpiBand(score);
  const i = ipiBand(score);

  // Severity tracks the R-IPI band, which is the one used in the rituximab era.
  const severity: 'success' | 'warning' | 'danger' =
    score === 0 ? 'success' : score <= 2 ? 'warning' : 'danger';

  return {
    score,
    rIpiGroup: r.group,
    ipiGroup:  i.group,
    rIpiOs:    r.os,
    rIpiPfs:   r.pfs,
    ipiOs:     i.os,
    ipiPfs:    i.pfs,
    severity,
    interpretation: `IPI ${score} — ${r.group} (R-IPI), ${i.group} (IPI). 4-year overall survival ${r.os} (R-IPI) / ${i.os} (IPI).`,
    references: [
      'The International Non-Hodgkin’s Lymphoma Prognostic Factors Project. A predictive model for aggressive non-Hodgkin’s lymphoma. N Engl J Med. 1993;329(14):987-994.',
      'Sehn LH, Berry B, Chhanabhai M, et al. The revised International Prognostic Index (R-IPI) is a better predictor of outcome than the standard IPI for patients with diffuse large B-cell lymphoma treated with R-CHOP. Blood. 2007;109(5):1857-1861.',
    ],
  };
}
