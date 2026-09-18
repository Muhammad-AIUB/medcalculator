// Mentzer Index — Mentzer WC, Blood 1973
// Differentiates iron deficiency anaemia from thalassaemia trait

interface MentzerInput {
  mcv:      number;  // fL
  rbcCount: number;  // × 10⁶ cells/µL  (= × 10¹² cells/L — numerically identical)
}

export function calculateMentzerIndex(input: MentzerInput): {
  index:          number;
  interpretation: string;
  severity:       'success' | 'warning' | 'danger';
  references:     string[];
} {
  const { mcv, rbcCount } = input;

  // Raw value: the result panel rounds once for display. Pre-rounding here would
  // double-round (MDCalc rounds the exact value once).
  const index = mcv / rbcCount;
  const shown = Math.round(index * 10) / 10;   // 1 dp, as MDCalc and the panel show it

  let interpretation: string;
  let severity: 'success' | 'warning' | 'danger';

  if (index < 13) {
    severity       = 'warning';
    interpretation = `Mentzer Index ${shown} < 13 — Thalassaemia trait likely`;
  } else if (index > 13) {
    severity       = 'danger';
    interpretation = `Mentzer Index ${shown} > 13 — Iron deficiency anaemia likely`;
  } else {
    severity       = 'warning';
    interpretation = `Mentzer Index ${shown} = 13 — Indeterminate (overlap between thalassaemia and iron deficiency)`;
  }

  return {
    index,
    interpretation,
    severity,
    references: [
      'Mentzer WC Jr. Differentiation of iron deficiency from thalassaemia trait. Lancet. 1973;1(7808):882',
    ],
  };
}
