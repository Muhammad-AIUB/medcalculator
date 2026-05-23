// Expanded Disability Status Scale (EDSS) for Multiple Sclerosis
// Combines Ambulation score (4.0–10.0) with Functional Systems Scale (FSS, 0–3.5)

export interface FSSScores {
  pyramidal:    number;  // 0–6
  cerebellar:   number;  // 0–5
  brainstem:    number;  // 0–5
  sensory:      number;  // 0–6
  bowelBladder: number;  // 0–6
  visual:       number;  // 0–6
  cerebral:     number;  // 0–5
  other:        number;  // 0–1
}

/** Derive EDSS 0–3.5 from FSS when patient is fully ambulatory */
function fssToEdss(fss: FSSScores): number {
  const scores = [
    fss.pyramidal, fss.cerebellar, fss.brainstem,
    fss.sensory, fss.bowelBladder, fss.visual,
    fss.cerebral, fss.other,
  ];
  const maxScore  = Math.max(...scores);
  const count1    = scores.filter(s => s === 1).length;
  const countGe2  = scores.filter(s => s >= 2).length;
  const countGe3  = scores.filter(s => s >= 3).length;

  if (maxScore === 0)                                return 0;
  if (maxScore === 1 && count1 === 1)                return 1.0;
  if (maxScore === 1 && count1 > 1)                  return 1.5;
  if (maxScore === 2 && countGe2 === 1)              return 2.0;
  if (maxScore === 2 && countGe2 === 2)              return 2.5;
  if (maxScore === 3 && countGe3 === 1 && countGe2 < 3) return 3.0;
  return 3.5;
}

export function calculateEDSS(input: { ambulation: number; fss: FSSScores }): {
  score:          number;
  fssTotal:       number;
  interpretation: string;
  severity:       'success' | 'warning' | 'danger';
  references:     string[];
} {
  const { ambulation, fss } = input;
  const fssValues = Object.values(fss) as number[];
  const fssTotal  = fssValues.reduce((a, b) => a + b, 0);

  // EDSS: if ambulation > 0 (impaired), that IS the EDSS score
  // otherwise derive from FSS subscores
  const score = ambulation > 0 ? ambulation : fssToEdss(fss);

  let interpretation: string;
  let severity: 'success' | 'warning' | 'danger';

  if (score === 0) {
    severity = 'success';
    interpretation = 'EDSS 0 — Normal neurological exam';
  } else if (score <= 1.5) {
    severity = 'success';
    interpretation = `EDSS ${score} — No disability, minimal signs`;
  } else if (score <= 3.5) {
    severity = 'warning';
    interpretation = `EDSS ${score} — Mild-moderate disability; fully ambulatory`;
  } else if (score <= 5.5) {
    severity = 'warning';
    interpretation = `EDSS ${score} — Moderate disability; ambulatory without aid`;
  } else if (score <= 7.5) {
    severity = 'danger';
    interpretation = `EDSS ${score} — Severe disability; requires assistance to walk or wheelchair`;
  } else {
    severity = 'danger';
    interpretation = `EDSS ${score} — Very severe disability; restricted to bed/chair`;
  }

  return {
    score,
    fssTotal,
    interpretation,
    severity,
    references: [
      'Kurtzke JF. Rating neurologic impairment in multiple sclerosis: an expanded disability status scale (EDSS). Neurology. 1983;33(11):1444-1452.',
    ],
  };
}
