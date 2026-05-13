import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry
} from '../calculator.registry';
import { roundTo, clamp } from '../../../../common/utils/calculation.utils';

interface CkdStage {
  stage: string;
  label: string;
  description: string;
  color: string;
  severity: string;
}

function getCkdStage(egfr: number): CkdStage {
  if (egfr >= 90) {
    return {
      stage: 'G1',
      label: 'G1 - Normal or High',
      description: 'Normal or high kidney function',
      color: '#16a34a',
      severity: 'normal',
    };
  } else if (egfr >= 60) {
    return {
      stage: 'G2',
      label: 'G2 - Mildly Decreased',
      description: 'Mildly decreased kidney function',
      color: '#65a30d',
      severity: 'mild',
    };
  } else if (egfr >= 45) {
    return {
      stage: 'G3a',
      label: 'G3a - Mild to Moderately Decreased',
      description: 'Mild to moderately decreased kidney function',
      color: '#ca8a04',
      severity: 'moderate',
    };
  } else if (egfr >= 30) {
    return {
      stage: 'G3b',
      label: 'G3b - Moderately to Severely Decreased',
      description: 'Moderately to severely decreased kidney function',
      color: '#ea580c',
      severity: 'moderate-severe',
    };
  } else if (egfr >= 15) {
    return {
      stage: 'G4',
      label: 'G4 - Severely Decreased',
      description: 'Severely decreased kidney function',
      color: '#dc2626',
      severity: 'severe',
    };
  } else {
    return {
      stage: 'G5',
      label: 'G5 - Kidney Failure',
      description: 'Kidney failure; dialysis or transplant may be indicated',
      color: '#7c3aed',
      severity: 'failure',
    };
  }
}

/**
 * eGFR Calculator
 * Implements CKD-EPI 2021 (race-free) and MDRD formulas
 */
export class EgfrCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'egfr',
    title: 'eGFR (Estimated Glomerular Filtration Rate)',
    description:
      'Estimates kidney function using CKD-EPI 2021 (race-free) and MDRD formulas. Provides CKD stage and clinical interpretation.',
    category: 'renal',
    tags: ['kidney', 'renal', 'creatinine', 'CKD', 'GFR', 'nephrology'],
    version: '2.0.0',
    references: [
      {
        title: 'New Creatinine- and Cystatin C–Based Equations to Estimate GFR without Race',
        authors: 'Inker LA, Eneanya ND, Coresh J, et al.',
        journal: 'New England Journal of Medicine',
        year: 2021,
        doi: '10.1056/NEJMoa2102953',
      },
      {
        title: 'KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease',
        journal: 'Kidney International Supplements',
        year: 2013,
        doi: '10.1038/kisup.2012.73',
      },
      {
        title: 'A More Accurate Method to Estimate Glomerular Filtration Rate from Serum Creatinine',
        authors: 'Levey AS, et al.',
        journal: 'Annals of Internal Medicine',
        year: 1999,
        doi: '10.7326/0003-4819-130-6-199903160-00002',
      },
    ],
    inputs: [
      {
        id: 'creatinine',
        label: 'Serum Creatinine',
        type: 'number',
        required: true,
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        min: 0.1,
        max: 50,
        validationRules: [
          { type: 'required', message: 'Serum creatinine is required' },
          { type: 'min', value: 0.1, message: 'Creatinine must be ≥ 0.1 mg/dL' },
          { type: 'max', value: 50, message: 'Creatinine must be ≤ 50 mg/dL (or ≤ 4420 µmol/L)' },
        ],
        helpText: 'Enter serum creatinine value. Unit will be auto-converted.',
        clinicalRange: {
          min: 0.6,
          max: 1.2,
          unit: 'mg/dL',
          warning: 'Value outside normal reference range (0.6–1.2 mg/dL)',
        },
      },
      {
        id: 'creatinineUnit',
        label: 'Creatinine Unit',
        type: 'select',
        required: true,
        options: [
          { value: 'mg/dL', label: 'mg/dL' },
          { value: 'µmol/L', label: 'µmol/L' },
        ],
        validationRules: [],
        helpText: 'Select the unit for the creatinine value',
      },
      {
        id: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        min: 18,
        max: 120,
        validationRules: [
          { type: 'required', message: 'Age is required' },
          { type: 'min', value: 18, message: 'Age must be ≥ 18 years (pediatric dosing not covered)' },
          { type: 'max', value: 120, message: 'Age must be ≤ 120 years' },
        ],
        helpText: 'Patient age in years (adults only)',
      },
      {
        id: 'sex',
        label: 'Biological Sex',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        validationRules: [{ type: 'required', message: 'Biological sex is required' }],
        helpText: 'Biological sex affects creatinine production and CKD-EPI coefficients',
      },
      {
        id: 'formula',
        label: 'Formula',
        type: 'select',
        required: false,
        options: [
          { value: 'ckd-epi-2021', label: 'CKD-EPI 2021 (Race-free, Recommended)' },
          { value: 'mdrd', label: 'MDRD (4-variable)' },
          { value: 'both', label: 'Both formulas' },
        ],
        validationRules: [],
        helpText: 'CKD-EPI 2021 is the recommended formula per KDIGO guidelines',
      },
      {
        id: 'race',
        label: 'Race (MDRD only)',
        type: 'select',
        required: false,
        options: [
          { value: 'non-african-american', label: 'Non-African American' },
          { value: 'african-american', label: 'African American' },
        ],
        validationRules: [],
        helpText: 'Only used for MDRD formula. CKD-EPI 2021 is race-free.',
      },
    ],
    outputs: [
      {
        id: 'egfr_ckdepi',
        label: 'eGFR (CKD-EPI 2021)',
        type: 'number',
        unit: 'mL/min/1.73m²',
        description: 'Estimated GFR using CKD-EPI 2021 race-free equation',
      },
      {
        id: 'egfr_mdrd',
        label: 'eGFR (MDRD)',
        type: 'number',
        unit: 'mL/min/1.73m²',
        description: 'Estimated GFR using MDRD 4-variable equation',
      },
      {
        id: 'ckd_stage',
        label: 'CKD Stage',
        type: 'classification',
        description: 'CKD stage per KDIGO 2012 classification',
        interpretations: [
          { range: { min: 90 }, label: 'G1 - Normal or High', color: '#16a34a' },
          { range: { min: 60, max: 89 }, label: 'G2 - Mildly Decreased', color: '#65a30d' },
          { range: { min: 45, max: 59 }, label: 'G3a - Mild to Moderately Decreased', color: '#ca8a04' },
          { range: { min: 30, max: 44 }, label: 'G3b - Moderately to Severely Decreased', color: '#ea580c' },
          { range: { min: 15, max: 29 }, label: 'G4 - Severely Decreased', color: '#dc2626' },
          { range: { max: 14 }, label: 'G5 - Kidney Failure', color: '#7c3aed' },
        ],
      },
    ],
    clinicalNotes: [
      'CKD-EPI 2021 is the recommended equation by KDIGO and ACP for adults.',
      'eGFR ≥60 mL/min/1.73m² with no other evidence of kidney damage is considered normal.',
      'For medication dosing, use actual GFR when available; eGFR is an estimate normalized to BSA of 1.73m².',
      'Creatinine-based eGFR may overestimate GFR in patients with reduced muscle mass (elderly, amputees, cachexia).',
      'For more accurate estimation in special populations, consider Cystatin C-based equations.',
    ],
    warnings: [
      'This calculator is for adult patients only (age ≥ 18 years).',
      'eGFR values >60 should be interpreted cautiously — two measurements ≥3 months apart are needed to diagnose CKD.',
      'Not validated for acute kidney injury (AKI); use serum creatinine trends instead.',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    const creatinine = Number(inputs['creatinine']);
    const age = Number(inputs['age']);

    if (!inputs['creatinine'] && inputs['creatinine'] !== 0) {
      errors.push('Serum creatinine is required');
    } else if (isNaN(creatinine) || creatinine <= 0) {
      errors.push('Serum creatinine must be a positive number');
    }

    if (!inputs['age'] && inputs['age'] !== 0) {
      errors.push('Age is required');
    } else if (isNaN(age) || age < 18 || age > 120) {
      errors.push('Age must be between 18 and 120 years');
    }

    if (!inputs['sex'] || !['male', 'female'].includes(String(inputs['sex']))) {
      errors.push('Biological sex must be "male" or "female"');
    }

    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    // Parse inputs
    let creatinineMgdl = Number(inputs['creatinine']);
    const creatinineUnit = String(inputs['creatinineUnit'] || 'mg/dL');
    const age = Number(inputs['age']);
    const sex = String(inputs['sex']).toLowerCase();
    const formula = String(inputs['formula'] || 'ckd-epi-2021');
    const race = String(inputs['race'] || 'non-african-american');

    // Convert creatinine to mg/dL if necessary
    if (creatinineUnit === 'µmol/L' || creatinineUnit === 'umol/L') {
      creatinineMgdl = creatinineMgdl / 88.42;
      notes.push(`Creatinine converted: ${inputs['creatinine']} µmol/L → ${roundTo(creatinineMgdl, 3)} mg/dL`);
    }

    // Clinical range check
    if (creatinineMgdl < 0.5) {
      warnings.push('Very low creatinine — may reflect reduced muscle mass. eGFR may be overestimated.');
    }
    if (creatinineMgdl > 10) {
      warnings.push('Very high creatinine value. Confirm specimen integrity.');
    }
    if (age < 18) {
      warnings.push('This calculator is validated for adults ≥18 years.');
    }
    if (age > 85) {
      warnings.push('In patients >85 years, eGFR may overestimate true GFR due to reduced muscle mass.');
    }

    const outputs: Record<string, unknown> = {};

    // ── CKD-EPI 2021 (Race-Free) ──────────────────────────────────
    if (formula === 'ckd-epi-2021' || formula === 'both') {
      const egfrCkdEpi = this.calculateCkdEpi2021(creatinineMgdl, age, sex);
      const stage = getCkdStage(egfrCkdEpi);
      outputs['egfr_ckdepi'] = roundTo(egfrCkdEpi, 1);
      outputs['ckd_stage_ckdepi'] = stage;
      outputs['ckd_stage'] = stage;
    }

    // ── MDRD ────────────────────────────────────────────────────────
    if (formula === 'mdrd' || formula === 'both') {
      const egfrMdrd = this.calculateMdrd(creatinineMgdl, age, sex, race);
      outputs['egfr_mdrd'] = roundTo(egfrMdrd, 1);
      if (formula === 'mdrd') {
        outputs['ckd_stage'] = getCkdStage(egfrMdrd);
      }
      if (race === 'african-american') {
        notes.push('MDRD race coefficient applied (×1.212 for African American patients).');
        notes.push('Note: CKD-EPI 2021 does not use race and is the preferred equation.');
      }
    }

    // Default to CKD-EPI if "both"
    if (formula === 'both') {
      const ckdEpiVal = outputs['egfr_ckdepi'] as number;
      outputs['ckd_stage'] = getCkdStage(ckdEpiVal);
      notes.push('CKD stage derived from CKD-EPI 2021 eGFR when both formulas are calculated.');
    }

    // Dialysis note
    const primaryEgfr = (outputs['egfr_ckdepi'] || outputs['egfr_mdrd']) as number;
    if (primaryEgfr < 15) {
      notes.push('eGFR <15 suggests kidney failure. Nephrology referral recommended.');
      notes.push('Consider renal replacement therapy (dialysis or transplantation).');
    } else if (primaryEgfr < 30) {
      notes.push('Nephrology referral recommended for CKD G4.');
    }

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: outputs as Record<string, string | number | boolean | null | undefined | object>,
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * CKD-EPI 2021 Creatinine Equation (race-free)
   *
   * eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^Age [× 1.012 if female]
   *
   * Female: κ = 0.7, α = −0.241
   * Male:   κ = 0.9, α = −0.302
   */
  private calculateCkdEpi2021(
    creatinineMgdl: number,
    age: number,
    sex: string,
  ): number {
    const isFemale = sex === 'female';
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1.0;

    const scrKappa = creatinineMgdl / kappa;
    const minTerm = Math.pow(Math.min(scrKappa, 1), alpha);
    const maxTerm = Math.pow(Math.max(scrKappa, 1), -1.200);
    const ageTerm = Math.pow(0.9938, age);

    const egfr = 142 * minTerm * maxTerm * ageTerm * sexFactor;
    return Math.min(egfr, 200); // cap at 200 (physiological maximum)
  }

  /**
   * MDRD 4-Variable Equation
   *
   * eGFR = 175 × Scr^(-1.154) × Age^(-0.203) × (0.742 if female) × (1.212 if African American)
   */
  private calculateMdrd(
    creatinineMgdl: number,
    age: number,
    sex: string,
    race: string,
  ): number {
    const sexFactor = sex === 'female' ? 0.742 : 1.0;
    const raceFactor = race === 'african-american' ? 1.212 : 1.0;

    const egfr =
      175 *
      Math.pow(creatinineMgdl, -1.154) *
      Math.pow(age, -0.203) *
      sexFactor *
      raceFactor;

    return Math.min(egfr, 200);
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new EgfrCalculator());
