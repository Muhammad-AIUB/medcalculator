interface AcrInput {
  albuminMgDl:    number;  // mg/dL
  creatinineGDl:  number;  // g/dL
}

export function calculateACR(input: AcrInput): {
  acr: number;
  interpretation: string;
  severity: 'success' | 'warning' | 'danger';
  category: string;
  references: string[];
} {
  const { albuminMgDl, creatinineGDl } = input;

  // ACR (mg/g) = Albumin (mg/dL) / Creatinine (g/dL)
  const acr = Math.round((albuminMgDl / creatinineGDl) * 10) / 10;

  let severity: 'success' | 'warning' | 'danger';
  let interpretation: string;
  let category: string;

  if (acr < 30) {
    severity = 'success';
    category = 'A1 – Normal to mildly increased';
    interpretation = 'Normal to mildly increased albuminuria (ACR < 30 mg/g)';
  } else if (acr <= 300) {
    severity = 'warning';
    category = 'A2 – Moderately increased';
    interpretation = 'Moderately increased albuminuria / microalbuminuria (ACR 30–300 mg/g)';
  } else {
    severity = 'danger';
    category = 'A3 – Severely increased';
    interpretation = 'Severely increased albuminuria / macroalbuminuria (ACR > 300 mg/g)';
  }

  return {
    acr,
    interpretation,
    severity,
    category,
    references: [
      'KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of CKD',
      'Levey AS et al. AJKD. 2011',
    ],
  };
}
