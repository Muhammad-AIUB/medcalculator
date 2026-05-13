import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry
} from '../calculator.registry';
import { roundTo } from '../../../../common/utils/calculation.utils';

interface BmiClassification {
  bmi: number;
  category: string;
  color: string;
  severity: string;
  description: string;
  riskLevel: string;
}

function getWhoClassification(bmi: number): BmiClassification {
  if (bmi < 18.5) {
    return { bmi, category: 'Underweight', color: '#2563eb', severity: 'low', description: 'Below healthy weight range', riskLevel: 'Increased' };
  } else if (bmi < 25) {
    return { bmi, category: 'Normal weight', color: '#16a34a', severity: 'normal', description: 'Healthy weight range', riskLevel: 'Average' };
  } else if (bmi < 30) {
    return { bmi, category: 'Overweight', color: '#ca8a04', severity: 'elevated', description: 'Above healthy weight range', riskLevel: 'Increased' };
  } else if (bmi < 35) {
    return { bmi, category: 'Obesity Class I', color: '#ea580c', severity: 'high', description: 'Moderate obesity', riskLevel: 'High' };
  } else if (bmi < 40) {
    return { bmi, category: 'Obesity Class II', color: '#dc2626', severity: 'very-high', description: 'Severe obesity', riskLevel: 'Very High' };
  } else {
    return { bmi, category: 'Obesity Class III', color: '#7c3aed', severity: 'extreme', description: 'Extreme / morbid obesity', riskLevel: 'Extremely High' };
  }
}

function getAsianClassification(bmi: number): BmiClassification {
  if (bmi < 18.5) {
    return { bmi, category: 'Underweight', color: '#2563eb', severity: 'low', description: 'Below healthy weight range (Asian criteria)', riskLevel: 'Increased' };
  } else if (bmi < 23) {
    return { bmi, category: 'Normal weight', color: '#16a34a', severity: 'normal', description: 'Healthy range per Asian criteria', riskLevel: 'Average' };
  } else if (bmi < 25) {
    return { bmi, category: 'Overweight (Asian)', color: '#ca8a04', severity: 'elevated', description: 'At-risk weight range per Asian criteria', riskLevel: 'Increased' };
  } else {
    return { bmi, category: 'Obese (Asian)', color: '#dc2626', severity: 'high', description: 'Obese per Asian criteria', riskLevel: 'High' };
  }
}

export class BmiCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'bmi',
    title: 'BMI & Ideal/Adjusted Body Weight',
    description:
      'Calculates BMI with WHO and Asian-specific classifications, Ideal Body Weight (Devine formula), and Adjusted Body Weight.',
    category: 'nutrition',
    tags: ['BMI', 'body mass index', 'weight', 'obesity', 'nutrition', 'ideal body weight', 'IBW', 'ABW'],
    version: '1.0.0',
    references: [
      {
        title: 'WHO Expert Consultation. Appropriate body-mass index for Asian populations',
        journal: 'The Lancet',
        year: 2004,
        doi: '10.1016/S0140-6736(03)15268-3',
      },
      {
        title: 'Ideal body weight estimation (Devine formula)',
        authors: 'Devine BJ',
        journal: 'Drug Intelligence and Clinical Pharmacy',
        year: 1974,
      },
    ],
    inputs: [
      {
        id: 'weight',
        label: 'Weight',
        type: 'number',
        required: true,
        units: ['kg', 'lb', 'g'],
        defaultUnit: 'kg',
        min: 1,
        max: 700,
        validationRules: [{ type: 'required', message: 'Weight is required' }],
        helpText: 'Patient body weight',
      },
      {
        id: 'weightUnit',
        label: 'Weight Unit',
        type: 'select',
        required: false,
        options: [
          { value: 'kg', label: 'kg' },
          { value: 'lb', label: 'lb' },
          { value: 'g', label: 'g' },
        ],
        validationRules: [],
      },
      {
        id: 'height',
        label: 'Height',
        type: 'number',
        required: true,
        units: ['cm', 'm', 'in'],
        defaultUnit: 'cm',
        min: 50,
        max: 300,
        validationRules: [{ type: 'required', message: 'Height is required' }],
        helpText: 'Patient height',
      },
      {
        id: 'heightUnit',
        label: 'Height Unit',
        type: 'select',
        required: false,
        options: [
          { value: 'cm', label: 'cm' },
          { value: 'm', label: 'm' },
          { value: 'in', label: 'in (inches)' },
          { value: 'ft_in', label: 'ft + in' },
        ],
        validationRules: [],
      },
      {
        id: 'heightFeet',
        label: 'Height (feet)',
        type: 'number',
        required: false,
        min: 0,
        max: 8,
        validationRules: [],
        helpText: 'Feet component when using ft+in input',
      },
      {
        id: 'heightInches',
        label: 'Height (inches)',
        type: 'number',
        required: false,
        min: 0,
        max: 11.9,
        validationRules: [],
        helpText: 'Inches component when using ft+in input',
      },
      {
        id: 'sex',
        label: 'Biological Sex',
        type: 'select',
        required: false,
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
        validationRules: [],
        helpText: 'Required for Ideal Body Weight calculation (Devine formula)',
      },
      {
        id: 'useAsianCriteria',
        label: 'Use Asian BMI Criteria',
        type: 'boolean',
        required: false,
        validationRules: [],
        helpText: 'Use WHO Asian-specific cutoffs (lower thresholds for overweight/obesity)',
      },
    ],
    outputs: [
      { id: 'bmi', label: 'BMI', type: 'number', unit: 'kg/m²', description: 'Body Mass Index' },
      { id: 'classification', label: 'WHO Classification', type: 'classification', description: 'Weight category per WHO criteria' },
      { id: 'ibw', label: 'Ideal Body Weight (Devine)', type: 'number', unit: 'kg', description: 'IBW = 50 (male) or 45.5 (female) + 2.3 × (height_in - 60)' },
      { id: 'abw', label: 'Adjusted Body Weight', type: 'number', unit: 'kg', description: 'ABW = IBW + 0.4 × (Actual - IBW); used for obese patients' },
      { id: 'bmi_prime', label: 'BMI Prime', type: 'number', description: 'BMI / 25 (ratio to upper limit of normal)' },
    ],
    clinicalNotes: [
      'BMI = weight (kg) / height (m)². WHO standard formula.',
      'Ideal Body Weight (Devine): Male: 50 + 2.3×(inches-60); Female: 45.5 + 2.3×(inches-60). Valid for height > 60 inches.',
      'Adjusted Body Weight used for obese patients (BMI > 30) for drug dosing: ABW = IBW + 0.4×(TBW - IBW).',
      'Asian BMI cutoffs (WHO 2004): Overweight ≥23, Obese ≥25 (vs standard Overweight ≥25, Obese ≥30).',
    ],
    warnings: [
      'BMI does not differentiate lean mass from fat mass. Muscular individuals may be misclassified.',
      'IBW/ABW are estimates; clinical judgment required for dosing decisions.',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    if (!inputs['weight'] && inputs['weight'] !== 0) errors.push('Weight is required');
    if (!inputs['height'] && inputs['height'] !== 0 && String(inputs['heightUnit']) !== 'ft_in') {
      errors.push('Height is required');
    }
    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    // ── Weight → kg ──────────────────────────────────────────────
    let weightKg = Number(inputs['weight']);
    const weightUnit = String(inputs['weightUnit'] || 'kg');
    switch (weightUnit) {
      case 'lb': weightKg = weightKg * 0.45359237; break;
      case 'g': weightKg = weightKg * 0.001; break;
      case 'oz': weightKg = weightKg * 0.028349523; break;
    }

    // ── Height → meters ──────────────────────────────────────────
    let heightM: number;
    const heightUnit = String(inputs['heightUnit'] || 'cm');

    if (heightUnit === 'ft_in') {
      const feet = Number(inputs['heightFeet'] || 0);
      const inches = Number(inputs['heightInches'] || 0);
      heightM = (feet * 0.3048) + (inches * 0.0254);
      notes.push(`Height converted: ${feet}ft ${inches}in = ${roundTo(heightM * 100, 1)} cm`);
    } else {
      const heightRaw = Number(inputs['height']);
      switch (heightUnit) {
        case 'cm': heightM = heightRaw * 0.01; break;
        case 'm': heightM = heightRaw; break;
        case 'in': heightM = heightRaw * 0.0254; break;
        case 'ft': heightM = heightRaw * 0.3048; break;
        default: heightM = heightRaw * 0.01;
      }
    }

    if (heightM <= 0) {
      throw new Error('Height must be > 0');
    }

    // ── BMI ───────────────────────────────────────────────────────
    const bmi = roundTo(weightKg / (heightM * heightM), 1);
    const useAsian = Boolean(inputs['useAsianCriteria']);

    const classification = useAsian
      ? getAsianClassification(bmi)
      : getWhoClassification(bmi);

    // ── Ideal Body Weight (Devine formula) ───────────────────────
    // Requires sex and height > 60 inches
    const sex = String(inputs['sex'] || '');
    const heightInches = heightM / 0.0254;

    let ibw: number | null = null;
    let abw: number | null = null;

    if (sex === 'male' || sex === 'female') {
      if (heightInches >= 60) {
        ibw = sex === 'male'
          ? roundTo(50 + 2.3 * (heightInches - 60), 1)
          : roundTo(45.5 + 2.3 * (heightInches - 60), 1);
      } else {
        notes.push('Devine IBW formula not validated for height < 60 inches (152.4 cm).');
        // Use proportional method for shorter patients
        ibw = sex === 'male'
          ? roundTo(50 * (heightM / 1.524), 1)
          : roundTo(45.5 * (heightM / 1.524), 1);
        notes.push(`IBW estimated proportionally for height < 60in: ${ibw} kg`);
      }

      // ── Adjusted Body Weight ──────────────────────────────────
      if (bmi >= 30 && ibw !== null) {
        abw = roundTo(ibw + 0.4 * (weightKg - ibw), 1);
        notes.push(`ABW calculated for BMI ≥ 30: IBW=${ibw}kg, TBW=${roundTo(weightKg, 1)}kg, ABW=${abw}kg`);
      }
    } else {
      notes.push('Sex not provided — Ideal Body Weight and Adjusted Body Weight not calculated.');
    }

    // ── BMI Prime ─────────────────────────────────────────────────
    const bmiPrime = roundTo(bmi / 25, 2);

    // Warnings
    if (bmi < 16) warnings.push('Severely underweight — assess for malnutrition, eating disorder.');
    if (bmi > 40) warnings.push('Class III obesity — high risk for comorbidities. Consider bariatric evaluation.');

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        bmi,
        bmi_category: classification.category,
        classification,
        weight_kg: roundTo(weightKg, 2),
        height_cm: roundTo(heightM * 100, 1),
        height_m: roundTo(heightM, 3),
        height_in: roundTo(heightInches, 1),
        ibw_kg: ibw,
        abw_kg: abw,
        bmi_prime: bmiPrime,
        asian_classification: useAsian ? null : getAsianClassification(bmi),
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new BmiCalculator());
