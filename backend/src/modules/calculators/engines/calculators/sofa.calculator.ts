import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry
} from '../calculator.registry';

interface SofaComponentScore {
  parameter: string;
  value: string | number;
  score: number;
  interpretation: string;
}

interface SofaMortality {
  totalScore: number;
  mortalityRange: string;
  color: string;
  severity: string;
  description: string;
}

function getSofaMortality(score: number): SofaMortality {
  if (score <= 6) {
    return { totalScore: score, mortalityRange: '<10%', color: '#16a34a', severity: 'low', description: 'Low mortality risk' };
  } else if (score <= 9) {
    return { totalScore: score, mortalityRange: '15-20%', color: '#ca8a04', severity: 'moderate', description: 'Moderate mortality risk' };
  } else if (score <= 12) {
    return { totalScore: score, mortalityRange: '40-50%', color: '#ea580c', severity: 'high', description: 'High mortality risk' };
  } else if (score <= 14) {
    return { totalScore: score, mortalityRange: '50%', color: '#dc2626', severity: 'very-high', description: 'Very high mortality risk' };
  } else {
    return { totalScore: score, mortalityRange: '>90%', color: '#7c3aed', severity: 'critical', description: 'Extremely high mortality risk' };
  }
}

export class SofaCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'sofa',
    title: 'SOFA Score (Sequential Organ Failure Assessment)',
    description:
      'Quantifies organ dysfunction in ICU patients. Predicts ICU mortality. Used to diagnose sepsis per Sepsis-3 definitions.',
    category: 'critical-care',
    tags: ['SOFA', 'sepsis', 'organ failure', 'ICU', 'critical care', 'Sepsis-3'],
    version: '1.0.0',
    references: [
      {
        title: 'Use of the SOFA score to assess the incidence of organ dysfunction/failure in intensive care units',
        authors: 'Vincent JL, Moreno R, Takala J, et al.',
        journal: 'Intensive Care Medicine',
        year: 1996,
        doi: '10.1007/BF01709751',
      },
      {
        title: 'The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)',
        authors: 'Singer M, Deutschman CS, Seymour CW, et al.',
        journal: 'JAMA',
        year: 2016,
        doi: '10.1001/jama.2016.0287',
      },
    ],
    inputs: [
      {
        id: 'pao2_fio2',
        label: 'PaO₂/FiO₂ Ratio',
        type: 'number',
        required: false,
        min: 0,
        max: 600,
        validationRules: [],
        helpText: 'PaO2 (mmHg) / FiO2 (fraction, e.g. 0.21-1.0). Enter the ratio directly.',
        placeholder: '300',
      },
      {
        id: 'on_ventilator',
        label: 'On Mechanical Ventilation',
        type: 'boolean',
        required: false,
        validationRules: [],
        helpText: 'Required to distinguish SOFA score 3 vs 4 for respiratory component',
      },
      {
        id: 'platelets',
        label: 'Platelet Count',
        type: 'number',
        required: false,
        units: ['10³/µL', '10⁹/L'],
        defaultUnit: '10³/µL',
        min: 0,
        max: 2000,
        validationRules: [],
        helpText: 'Platelet count in ×10³/µL (or ×10⁹/L — same numeric value)',
        placeholder: '150',
      },
      {
        id: 'bilirubin',
        label: 'Total Bilirubin',
        type: 'number',
        required: false,
        units: ['mg/dL', 'umol/L'],
        defaultUnit: 'mg/dL',
        min: 0,
        max: 100,
        validationRules: [],
        helpText: 'Total serum bilirubin',
        placeholder: '1.0',
      },
      {
        id: 'bilirubinUnit',
        label: 'Bilirubin Unit',
        type: 'select',
        required: false,
        options: [{ value: 'mg/dL', label: 'mg/dL' }, { value: 'umol/L', label: 'umol/L' }],
        validationRules: [],
      },
      {
        id: 'map',
        label: 'Mean Arterial Pressure (MAP)',
        type: 'number',
        required: false,
        units: ['mmHg'],
        defaultUnit: 'mmHg',
        min: 0,
        max: 200,
        validationRules: [],
        helpText: 'MAP in mmHg. If vasopressors required, select vasopressor option instead.',
        placeholder: '70',
      },
      {
        id: 'vasopressor',
        label: 'Vasopressor Agent & Dose',
        type: 'select',
        required: false,
        options: [
          { value: 'none', label: 'None / MAP ≥ 70' },
          { value: 'map_low', label: 'MAP < 70 (no vasopressors)' },
          { value: 'dopa_le5_or_dobu', label: 'Dopamine ≤5 µg/kg/min OR Dobutamine (any dose)' },
          { value: 'dopa_gt5_or_norepi_epi_le01', label: 'Dopamine >5, Epinephrine ≤0.1, or Norepinephrine ≤0.1 µg/kg/min' },
          { value: 'dopa_gt15_or_norepi_epi_gt01', label: 'Dopamine >15, Epinephrine >0.1, or Norepinephrine >0.1 µg/kg/min' },
        ],
        validationRules: [],
        helpText: 'Cardiovascular component — select based on vasopressor requirement',
      },
      {
        id: 'gcs',
        label: 'Glasgow Coma Scale (GCS)',
        type: 'number',
        required: false,
        min: 3,
        max: 15,
        validationRules: [],
        helpText: 'Total GCS score (3-15)',
        placeholder: '15',
      },
      {
        id: 'creatinine',
        label: 'Serum Creatinine',
        type: 'number',
        required: false,
        units: ['mg/dL', 'umol/L'],
        defaultUnit: 'mg/dL',
        min: 0.1,
        max: 30,
        validationRules: [],
        helpText: 'Serum creatinine or urine output used for renal scoring',
        placeholder: '1.0',
      },
      {
        id: 'creatinineUnit',
        label: 'Creatinine Unit',
        type: 'select',
        required: false,
        options: [{ value: 'mg/dL', label: 'mg/dL' }, { value: 'umol/L', label: 'umol/L' }],
        validationRules: [],
      },
      {
        id: 'urine_output_24h',
        label: 'Urine Output (24h)',
        type: 'number',
        required: false,
        units: ['mL/24hr'],
        defaultUnit: 'mL/24hr',
        min: 0,
        max: 10000,
        validationRules: [],
        helpText: 'Total urine output over 24 hours (mL). Used alongside creatinine for renal scoring.',
        placeholder: '1000',
      },
    ],
    outputs: [
      {
        id: 'total_sofa',
        label: 'Total SOFA Score',
        type: 'score',
        description: 'Sum of all organ scores (0-24)',
        interpretations: [
          { range: { min: 0, max: 6 }, label: '<10% mortality', color: '#16a34a' },
          { range: { min: 7, max: 9 }, label: '15-20% mortality', color: '#ca8a04' },
          { range: { min: 10, max: 12 }, label: '40-50% mortality', color: '#ea580c' },
          { range: { min: 13, max: 14 }, label: '~50% mortality', color: '#dc2626' },
          { range: { min: 15 }, label: '>90% mortality', color: '#7c3aed' },
        ],
      },
    ],
    clinicalNotes: [
      'SOFA score ≥2 with suspected infection meets Sepsis-3 criteria for sepsis.',
      'A SOFA increase of ≥2 from baseline indicates sepsis in patients with known infection.',
      'Maximum SOFA >11 is associated with >90% mortality in original validation cohort.',
      'Score 0 for any component if data unavailable (conservative approach).',
    ],
    warnings: [
      'Scoring is based on worst values in the previous 24 hours.',
      'SOFA does not replace clinical judgment.',
      'qSOFA (≥2 of: RR≥22, altered mentation, SBP≤100) is a bedside screening tool — not a replacement for SOFA.',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    return []; // All inputs optional — score 0 if not provided
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];
    const components: SofaComponentScore[] = [];

    // ── 1. Respiration: PaO2/FiO2 ─────────────────────────────────
    const pao2Fio2 = inputs['pao2_fio2'] !== undefined && inputs['pao2_fio2'] !== null
      ? Number(inputs['pao2_fio2'])
      : null;
    const onVentilator = Boolean(inputs['on_ventilator']);
    let respScore = 0;
    let respInterpretation = 'PaO2/FiO2 not provided (scored 0)';

    if (pao2Fio2 !== null && !isNaN(pao2Fio2)) {
      if (pao2Fio2 >= 400) {
        respScore = 0;
        respInterpretation = `PaO2/FiO2 ≥ 400: No impairment`;
      } else if (pao2Fio2 >= 300) {
        respScore = 1;
        respInterpretation = `PaO2/FiO2 300-399: Mild impairment`;
      } else if (pao2Fio2 >= 200) {
        respScore = 2;
        respInterpretation = `PaO2/FiO2 200-299: Moderate impairment`;
      } else if (pao2Fio2 >= 100 && onVentilator) {
        respScore = 3;
        respInterpretation = `PaO2/FiO2 100-199 + ventilated: Severe impairment`;
      } else if (pao2Fio2 < 100 && onVentilator) {
        respScore = 4;
        respInterpretation = `PaO2/FiO2 < 100 + ventilated: Critical impairment`;
      } else if (pao2Fio2 < 200) {
        respScore = 2;
        respInterpretation = `PaO2/FiO2 < 200, not ventilated (scored as 2)`;
        notes.push('Respiratory score 3/4 requires mechanical ventilation; scored 2 without ventilation data.');
      }
    }
    components.push({ parameter: 'Respiration (PaO2/FiO2)', value: pao2Fio2 ?? 'N/A', score: respScore, interpretation: respInterpretation });

    // ── 2. Coagulation: Platelets ──────────────────────────────────
    const platelets = inputs['platelets'] !== undefined && inputs['platelets'] !== null
      ? Number(inputs['platelets'])
      : null;
    let coagScore = 0;
    let coagInterpretation = 'Platelets not provided (scored 0)';

    if (platelets !== null && !isNaN(platelets)) {
      if (platelets >= 150) {
        coagScore = 0; coagInterpretation = `Platelets ≥150: Normal`;
      } else if (platelets >= 100) {
        coagScore = 1; coagInterpretation = `Platelets 100-149: Mild thrombocytopenia`;
      } else if (platelets >= 50) {
        coagScore = 2; coagInterpretation = `Platelets 50-99: Moderate thrombocytopenia`;
      } else if (platelets >= 20) {
        coagScore = 3; coagInterpretation = `Platelets 20-49: Severe thrombocytopenia`;
      } else {
        coagScore = 4; coagInterpretation = `Platelets < 20: Critical thrombocytopenia`;
      }
    }
    components.push({ parameter: 'Coagulation (Platelets ×10³)', value: platelets ?? 'N/A', score: coagScore, interpretation: coagInterpretation });

    // ── 3. Liver: Bilirubin ────────────────────────────────────────
    let bilirubinMgdl: number | null = null;
    if (inputs['bilirubin'] !== undefined && inputs['bilirubin'] !== null) {
      bilirubinMgdl = Number(inputs['bilirubin']);
      if (String(inputs['bilirubinUnit']) === 'umol/L') {
        bilirubinMgdl = bilirubinMgdl / 17.1;
        notes.push(`Bilirubin converted: ${inputs['bilirubin']} umol/L to ${bilirubinMgdl.toFixed(2)} mg/dL`);
      }
    }
    let liverScore = 0;
    let liverInterpretation = 'Bilirubin not provided (scored 0)';

    if (bilirubinMgdl !== null && !isNaN(bilirubinMgdl)) {
      if (bilirubinMgdl < 1.2) {
        liverScore = 0; liverInterpretation = `Bilirubin < 1.2 mg/dL: Normal`;
      } else if (bilirubinMgdl < 2.0) {
        liverScore = 1; liverInterpretation = `Bilirubin 1.2-1.9 mg/dL: Mild elevation`;
      } else if (bilirubinMgdl < 6.0) {
        liverScore = 2; liverInterpretation = `Bilirubin 2.0-5.9 mg/dL: Moderate elevation`;
      } else if (bilirubinMgdl < 12.0) {
        liverScore = 3; liverInterpretation = `Bilirubin 6.0-11.9 mg/dL: Severe elevation`;
      } else {
        liverScore = 4; liverInterpretation = `Bilirubin ≥ 12.0 mg/dL: Critical elevation`;
      }
    }
    components.push({ parameter: 'Liver (Bilirubin)', value: bilirubinMgdl !== null ? `${bilirubinMgdl.toFixed(2)} mg/dL` : 'N/A', score: liverScore, interpretation: liverInterpretation });

    // ── 4. Cardiovascular: MAP / Vasopressors ─────────────────────
    const vasopressor = String(inputs['vasopressor'] || 'none');
    const map = inputs['map'] !== undefined ? Number(inputs['map']) : null;
    let cardioScore = 0;
    let cardioInterpretation = 'No hemodynamic compromise';

    if (vasopressor === 'none' || vasopressor === '') {
      if (map !== null && map < 70) {
        cardioScore = 1; cardioInterpretation = `MAP < 70 mmHg without vasopressors`;
      } else {
        cardioScore = 0; cardioInterpretation = `MAP ≥ 70 mmHg or not assessed`;
      }
    } else if (vasopressor === 'map_low') {
      cardioScore = 1; cardioInterpretation = 'MAP < 70 mmHg, no vasopressors';
    } else if (vasopressor === 'dopa_le5_or_dobu') {
      cardioScore = 2; cardioInterpretation = 'Dopamine ≤5 µg/kg/min or Dobutamine';
    } else if (vasopressor === 'dopa_gt5_or_norepi_epi_le01') {
      cardioScore = 3; cardioInterpretation = 'Dopamine >5, Epi ≤0.1, or NE ≤0.1 µg/kg/min';
    } else if (vasopressor === 'dopa_gt15_or_norepi_epi_gt01') {
      cardioScore = 4; cardioInterpretation = 'Dopamine >15, Epi >0.1, or NE >0.1 µg/kg/min';
    }
    components.push({ parameter: 'Cardiovascular (MAP/Vasopressors)', value: vasopressor, score: cardioScore, interpretation: cardioInterpretation });

    // ── 5. CNS: GCS ────────────────────────────────────────────────
    const gcs = inputs['gcs'] !== undefined && inputs['gcs'] !== null ? Number(inputs['gcs']) : null;
    let cnsScore = 0;
    let cnsInterpretation = 'GCS not provided (scored 0)';

    if (gcs !== null && !isNaN(gcs)) {
      if (gcs === 15) {
        cnsScore = 0; cnsInterpretation = `GCS 15: Alert`;
      } else if (gcs >= 13) {
        cnsScore = 1; cnsInterpretation = `GCS 13-14: Confused`;
      } else if (gcs >= 10) {
        cnsScore = 2; cnsInterpretation = `GCS 10-12: Drowsy`;
      } else if (gcs >= 6) {
        cnsScore = 3; cnsInterpretation = `GCS 6-9: Somnolent`;
      } else {
        cnsScore = 4; cnsInterpretation = `GCS < 6: Coma`;
      }
    }
    components.push({ parameter: 'CNS (GCS)', value: gcs ?? 'N/A', score: cnsScore, interpretation: cnsInterpretation });

    // ── 6. Renal: Creatinine / Urine Output ───────────────────────
    let creatinineMgdl: number | null = null;
    if (inputs['creatinine'] !== undefined && inputs['creatinine'] !== null) {
      creatinineMgdl = Number(inputs['creatinine']);
      if (String(inputs['creatinineUnit']) === 'umol/L') {
        creatinineMgdl = creatinineMgdl / 88.42;
        notes.push(`Creatinine converted: ${inputs['creatinine']} umol/L to ${creatinineMgdl.toFixed(2)} mg/dL`);
      }
    }
    const urineOutput = inputs['urine_output_24h'] !== undefined ? Number(inputs['urine_output_24h']) : null;

    let renalScore = 0;
    let renalInterpretation = 'Creatinine/UO not provided (scored 0)';

    // Score by creatinine first, then override with UO if worse
    if (creatinineMgdl !== null && !isNaN(creatinineMgdl)) {
      if (creatinineMgdl < 1.2) {
        renalScore = 0; renalInterpretation = `Creatinine < 1.2 mg/dL: Normal`;
      } else if (creatinineMgdl < 2.0) {
        renalScore = 1; renalInterpretation = `Creatinine 1.2-1.9 mg/dL: Mild elevation`;
      } else if (creatinineMgdl < 3.5) {
        renalScore = 2; renalInterpretation = `Creatinine 2.0-3.4 mg/dL: Moderate elevation`;
      } else if (creatinineMgdl < 5.0) {
        renalScore = 3; renalInterpretation = `Creatinine 3.5-4.9 mg/dL: Severe elevation`;
      } else {
        renalScore = 4; renalInterpretation = `Creatinine ≥ 5.0 mg/dL: Critical elevation`;
      }
    }

    // Override with UO if worse
    if (urineOutput !== null && !isNaN(urineOutput)) {
      let uoScore = 0;
      if (urineOutput < 200) {
        uoScore = 4;
      } else if (urineOutput < 500) {
        uoScore = 3;
      }
      if (uoScore > renalScore) {
        renalScore = uoScore;
        renalInterpretation = `Urine output ${urineOutput} mL/24h: ${uoScore === 4 ? 'Anuria (<200 mL)' : 'Oliguria (<500 mL)'}`;
        notes.push('Renal score based on urine output (worse than creatinine-based score).');
      }
    }
    components.push({ parameter: 'Renal (Creatinine / UO)', value: creatinineMgdl !== null ? `${creatinineMgdl.toFixed(2)} mg/dL` : 'N/A', score: renalScore, interpretation: renalInterpretation });

    // ── Total Score ────────────────────────────────────────────────
    const totalSofa = respScore + coagScore + liverScore + cardioScore + cnsScore + renalScore;
    const mortalityData = getSofaMortality(totalSofa);

    if (totalSofa >= 2) {
      notes.push('SOFA ≥ 2: Meets Sepsis-3 criteria for organ dysfunction in the context of suspected infection.');
    }
    if (totalSofa > 11) {
      warnings.push('SOFA > 11 is associated with >90% ICU mortality in validation studies.');
    }

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        total_sofa: totalSofa,
        mortality_estimate: mortalityData.mortalityRange,
        mortality_data: mortalityData,
        component_scores: components,
        score_breakdown: {
          respiration: respScore,
          coagulation: coagScore,
          liver: liverScore,
          cardiovascular: cardioScore,
          cns: cnsScore,
          renal: renalScore,
        },
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new SofaCalculator());
