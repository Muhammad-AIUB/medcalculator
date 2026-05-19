import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry
} from '../calculator.registry';
import { roundTo, safeLn } from '../../../../common/utils/calculation.utils';

interface MeldMortality {
  score: number;
  ninetyDayMortality: string;
  color: string;
  severity: string;
  description: string;
}

function getMeldMortality(meldNa: number): MeldMortality {
  if (meldNa < 10) {
    return { score: meldNa, ninetyDayMortality: '1.9%', color: '#16a34a', severity: 'low', description: 'Low urgency. Stable hepatic function.' };
  } else if (meldNa < 20) {
    return { score: meldNa, ninetyDayMortality: '6.0%', color: '#65a30d', severity: 'moderate-low', description: 'Moderate risk. Monitor closely.' };
  } else if (meldNa < 30) {
    return { score: meldNa, ninetyDayMortality: '19.6%', color: '#ca8a04', severity: 'moderate', description: 'Significant mortality risk. Transplant evaluation warranted.' };
  } else if (meldNa < 40) {
    return { score: meldNa, ninetyDayMortality: '52.6%', color: '#dc2626', severity: 'high', description: 'High mortality risk. Urgent transplant listing recommended.' };
  } else {
    return { score: meldNa, ninetyDayMortality: '71.3%', color: '#7c3aed', severity: 'critical', description: 'Critical. Extremely high 90-day mortality. ICU-level care required.' };
  }
}

export class MeldNaCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'meld-na',
    title: 'MELD-Na Score',
    description:
      'Calculates MELD and MELD-Na scores for predicting 90-day mortality in end-stage liver disease. Used for transplant prioritization.',
    category: 'liver',
    tags: ['liver', 'MELD', 'MELD-Na', 'transplant', 'cirrhosis', 'hepatology', 'end-stage liver disease'],
    version: '1.0.0',
    references: [
      {
        title: 'MELD-Na as a predictor of 90-day mortality in patients with end-stage liver disease',
        authors: 'Kim WR, et al.',
        journal: 'Hepatology',
        year: 2008,
        doi: '10.1002/hep.22349',
      },
      {
        title: 'A model to predict survival in patients with end-stage liver disease',
        authors: 'Malinchoc M, Kamath PS, Gordon FD, et al.',
        journal: 'Hepatology',
        year: 2000,
        doi: '10.1053/he.2000.5794',
      },
    ],
    inputs: [
      {
        id: 'bilirubin',
        label: 'Total Bilirubin',
        type: 'number',
        required: true,
        units: ['mg/dL', 'umol/L'],
        defaultUnit: 'mg/dL',
        min: 0.1,
        max: 100,
        validationRules: [{ type: 'required', message: 'Bilirubin is required' }],
        helpText: 'Total serum bilirubin (minimum 1.0 mg/dL used in calculation)',
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
        id: 'inr',
        label: 'INR',
        type: 'number',
        required: true,
        min: 0.5,
        max: 20,
        validationRules: [{ type: 'required', message: 'INR is required' }],
        helpText: 'International Normalized Ratio (minimum 1.0 used in calculation)',
      },
      {
        id: 'creatinine',
        label: 'Serum Creatinine',
        type: 'number',
        required: true,
        units: ['mg/dL', 'umol/L'],
        defaultUnit: 'mg/dL',
        min: 0.1,
        max: 20,
        validationRules: [{ type: 'required', message: 'Creatinine is required' }],
        helpText: 'Serum creatinine. Capped at 4.0 mg/dL; use 4.0 if on dialysis.',
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
        id: 'sodium',
        label: 'Serum Sodium',
        type: 'number',
        required: true,
        units: ['mEq/L'],
        defaultUnit: 'mEq/L',
        min: 100,
        max: 160,
        validationRules: [{ type: 'required', message: 'Serum sodium is required' }],
        helpText: 'Serum sodium used as Na in the MELD-Na calculation',
        clinicalRange: { min: 135, max: 145, unit: 'mEq/L', warning: 'Outside normal sodium range' },
      },
      {
        id: 'onDialysis',
        label: 'On Dialysis or CRRT',
        type: 'boolean',
        required: false,
        validationRules: [],
        helpText: 'If patient has had dialysis ≥2× in the past week or is on CRRT, use creatinine = 4.0 mg/dL',
      },
    ],
    outputs: [
      {
        id: 'meld',
        label: 'MELD Score',
        type: 'score',
        description: 'Model for End-Stage Liver Disease score',
      },
      {
        id: 'meld_na',
        label: 'MELD-Na Score',
        type: 'score',
        description: 'MELD score adjusted for serum sodium',
      },
      {
        id: 'mortality_90day',
        label: '90-Day Mortality',
        type: 'percentage',
        description: 'Estimated 90-day waitlist mortality',
      },
    ],
    clinicalNotes: [
      'MELD-Na is the current UNOS/OPTN standard for transplant waitlist prioritization (replaced MELD in 2016).',
      'MELD-Na = MELD Score - Na - 0.025 x MELD x (140-Na) + 140.',
      'Creatinine is capped at 4.0 mg/dL. Patients on dialysis ≥2×/week use creatinine = 4.0.',
      'All lab values use minimum of 1.0 mg/dL to prevent log(0) errors.',
    ],
    warnings: [
      'MELD scores change with lab values — reassess frequently in hospitalized patients.',
      'Values below minimum thresholds are floored to prevent mathematical errors.',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    if (!inputs['bilirubin'] && inputs['bilirubin'] !== 0) errors.push('Bilirubin is required');
    if (!inputs['inr'] && inputs['inr'] !== 0) errors.push('INR is required');
    if (!inputs['creatinine'] && inputs['creatinine'] !== 0) errors.push('Creatinine is required');
    if (!inputs['sodium'] && inputs['sodium'] !== 0) errors.push('Serum sodium is required');
    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    // Parse and convert bilirubin
    let bilirubinMgdl = Number(inputs['bilirubin']);
    if (String(inputs['bilirubinUnit']) === 'umol/L') {
      bilirubinMgdl = bilirubinMgdl / 17.1;
      notes.push(`Bilirubin converted: ${inputs['bilirubin']} umol/L to ${roundTo(bilirubinMgdl, 2)} mg/dL`);
    }

    // Parse and convert creatinine
    let creatinineMgdl = Number(inputs['creatinine']);
    if (String(inputs['creatinineUnit']) === 'umol/L') {
      creatinineMgdl = creatinineMgdl / 88.42;
      notes.push(`Creatinine converted: ${inputs['creatinine']} umol/L to ${roundTo(creatinineMgdl, 3)} mg/dL`);
    }

    const inr = Number(inputs['inr']);
    const sodium = Number(inputs['sodium']);
    const onDialysis = Boolean(inputs['onDialysis']);

    // Apply dialysis rule
    if (onDialysis) {
      creatinineMgdl = 4.0;
      notes.push('Patient on dialysis: creatinine set to 4.0 mg/dL per MELD convention.');
    }

    // Cap creatinine at 4.0
    if (creatinineMgdl > 4.0) {
      warnings.push(`Creatinine capped at 4.0 mg/dL (actual: ${roundTo(creatinineMgdl, 2)} mg/dL)`);
      creatinineMgdl = 4.0;
    }

    // Apply minimum floor of 1.0 to prevent log errors
    const bilirubinCalc = Math.max(bilirubinMgdl, 1.0);
    const inrCalc = Math.max(inr, 1.0);
    const creatinineCalc = Math.max(creatinineMgdl, 1.0);

    if (bilirubinMgdl < 1.0) notes.push('Bilirubin floored to 1.0 mg/dL for calculation.');
    if (inr < 1.0) notes.push('INR floored to 1.0 for calculation.');
    if (creatinineMgdl < 1.0) notes.push('Creatinine floored to 1.0 mg/dL for calculation.');

    // ── MELD = 3.78×ln(bili) + 11.2×ln(INR) + 9.57×ln(Cr) + 6.43 ───
    const meld = roundTo(
      3.78 * safeLn(bilirubinCalc) +
      11.2 * safeLn(inrCalc) +
      9.57 * safeLn(creatinineCalc) +
      6.43,
      1,
    );

    // Use serum sodium directly as Na in the requested MELD-Na formula.
    const sodiumUsed = sodium;

    // MELD-Na = MELD Score - Na - 0.025 x MELD x (140-Na) + 140
    const meldNa = roundTo(
      meld - sodiumUsed - (0.025 * meld * (140 - sodiumUsed)) + 140,
      1,
    );

    const mortalityData = getMeldMortality(meldNa);

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        meld: roundTo(meld, 0),
        meld_na: roundTo(meldNa, 0),
        mortality_90day: mortalityData.ninetyDayMortality,
        mortality_data: mortalityData,
        calculation_values: {
          bilirubin_used: roundTo(bilirubinCalc, 2),
          inr_used: roundTo(inrCalc, 2),
          creatinine_used: roundTo(creatinineCalc, 2),
          sodium_used: sodiumUsed,
        },
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new MeldNaCalculator());
