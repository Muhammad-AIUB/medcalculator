import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry
} from '../calculator.registry';
import { roundTo } from '../../../../common/utils/calculation.utils';

interface ChildPughClass {
  class: 'A' | 'B' | 'C';
  score: number;
  oneYearSurvival: string;
  twoYearSurvival: string;
  surgicalMortality: string;
  surgicalRisk: 'Low' | 'Moderate' | 'High';
  color: string;
  description: string;
}

function getChildPughClass(totalScore: number): ChildPughClass {
  if (totalScore <= 6) {
    return {
      class: 'A',
      score: totalScore,
      oneYearSurvival: '100%',
      twoYearSurvival: '85%',
      surgicalMortality: '10%',
      surgicalRisk: 'Low',
      color: '#16a34a',
      description: 'Well-compensated cirrhosis. Good hepatic reserve.',
    };
  } else if (totalScore <= 9) {
    return {
      class: 'B',
      score: totalScore,
      oneYearSurvival: '81%',
      twoYearSurvival: '57%',
      surgicalMortality: '30%',
      surgicalRisk: 'Moderate',
      color: '#ca8a04',
      description: 'Significant functional compromise. Consider liver transplant evaluation.',
    };
  } else {
    return {
      class: 'C',
      score: totalScore,
      oneYearSurvival: '45%',
      twoYearSurvival: '35%',
      surgicalMortality: '82%',
      surgicalRisk: 'High',
      color: '#dc2626',
      description: 'Decompensated cirrhosis. High surgical mortality. Liver transplant indicated.',
    };
  }
}

export class ChildPughCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'child-pugh',
    title: 'Child-Pugh Score',
    description: 'Assesses severity of hepatic cirrhosis and predicts perioperative mortality risk.',
    category: 'liver',
    tags: ['liver', 'cirrhosis', 'hepatic', 'Child-Pugh', 'surgical risk', 'hepatology'],
    version: '1.0.0',
    references: [
      {
        title: 'Transection of the oesophagus for bleeding oesophageal varices',
        authors: 'Pugh RN, Murray-Lyon IM, Dawson JL, et al.',
        journal: 'British Journal of Surgery',
        year: 1973,
        doi: '10.1002/bjs.1800600817',
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
        validationRules: [{ type: 'required', message: 'Total bilirubin is required' }],
        helpText: 'Total serum bilirubin',
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
        id: 'albumin',
        label: 'Serum Albumin',
        type: 'number',
        required: true,
        units: ['g/dL', 'g/L'],
        defaultUnit: 'g/dL',
        min: 0.5,
        max: 10,
        validationRules: [{ type: 'required', message: 'Serum albumin is required' }],
        helpText: 'Serum albumin level',
      },
      {
        id: 'albuminUnit',
        label: 'Albumin Unit',
        type: 'select',
        required: false,
        options: [{ value: 'g/dL', label: 'g/dL' }, { value: 'g/L', label: 'g/L' }],
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
        helpText: 'International Normalized Ratio',
      },
      {
        id: 'ascites',
        label: 'Ascites',
        type: 'select',
        required: true,
        options: [
          { value: 'none', label: 'None (1 pt)' },
          { value: 'mild', label: 'Mild / Controlled (2 pts)' },
          { value: 'moderate-severe', label: 'Moderate to Severe / Refractory (3 pts)' },
        ],
        validationRules: [{ type: 'required', message: 'Ascites status is required' }],
      },
      {
        id: 'encephalopathy',
        label: 'Hepatic Encephalopathy',
        type: 'select',
        required: true,
        options: [
          { value: 'none', label: 'None (1 pt)' },
          { value: 'grade1-2', label: 'Grade 1-2 (2 pts)' },
          { value: 'grade3-4', label: 'Grade 3-4 (3 pts)' },
        ],
        validationRules: [{ type: 'required', message: 'Encephalopathy grade is required' }],
      },
    ],
    outputs: [
      {
        id: 'total_score',
        label: 'Child-Pugh Score',
        type: 'score',
        description: 'Total score 5-15 points',
      },
      {
        id: 'class',
        label: 'Child-Pugh Class',
        type: 'classification',
        description: 'A (5-6), B (7-9), C (10-15)',
      },
    ],
    clinicalNotes: [
      'Class A (5-6): 1yr survival 100%, 2yr 85%, surgical mortality ~10%',
      'Class B (7-9): 1yr survival 81%, 2yr 57%, surgical mortality ~30%',
      'Class C (10-15): 1yr survival 45%, 2yr 35%, surgical mortality ~82%',
      'MELD-Na is preferred for transplant prioritization; Child-Pugh remains clinically useful.',
    ],
    warnings: [
      'Ascites and encephalopathy grading introduces subjective variability.',
      'Not validated for acute liver failure.',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    if (!inputs['bilirubin'] && inputs['bilirubin'] !== 0) errors.push('Total bilirubin is required');
    if (!inputs['albumin'] && inputs['albumin'] !== 0) errors.push('Serum albumin is required');
    if (!inputs['inr'] && inputs['inr'] !== 0) errors.push('INR is required');
    if (!inputs['ascites']) errors.push('Ascites status is required');
    if (!inputs['encephalopathy']) errors.push('Encephalopathy grade is required');
    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    let bilirubinMgdl = Number(inputs['bilirubin']);
    const bilirubinUnit = String(inputs['bilirubinUnit'] || 'mg/dL');
    if (bilirubinUnit === 'umol/L') {
      bilirubinMgdl = bilirubinMgdl / 17.1;
      notes.push(`Bilirubin converted: ${inputs['bilirubin']} umol/L to ${roundTo(bilirubinMgdl, 2)} mg/dL`);
    }

    let albuminGdl = Number(inputs['albumin']);
    const albuminUnit = String(inputs['albuminUnit'] || 'g/dL');
    if (albuminUnit === 'g/L') {
      albuminGdl = albuminGdl / 10;
      notes.push(`Albumin converted: ${inputs['albumin']} g/L to ${roundTo(albuminGdl, 1)} g/dL`);
    }

    const inr = Number(inputs['inr']);
    const ascites = String(inputs['ascites']);
    const encephalopathy = String(inputs['encephalopathy']);

    const bilirubinScore = bilirubinMgdl < 2 ? 1 : bilirubinMgdl <= 3 ? 2 : 3;
    const albuminScore = albuminGdl > 3.5 ? 1 : albuminGdl >= 2.8 ? 2 : 3;
    const inrScore = inr < 1.7 ? 1 : inr <= 2.2 ? 2 : 3;
    const ascitesScore = ascites === 'none' ? 1 : ascites === 'mild' ? 2 : 3;
    const encephalopathyScore = encephalopathy === 'none' ? 1 : encephalopathy === 'grade1-2' ? 2 : 3;

    const totalScore = bilirubinScore + albuminScore + inrScore + ascitesScore + encephalopathyScore;
    const classification = getChildPughClass(totalScore);

    if (classification.class === 'C') {
      warnings.push('Class C: Very high surgical mortality (~82%). Elective surgery should be avoided.');
    } else if (classification.class === 'B') {
      warnings.push('Class B: Moderate surgical risk (~30%). Optimize hepatic function pre-operatively.');
    }

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        total_score: totalScore,
        class: classification.class,
        classification,
        component_scores: {
          bilirubin: { raw: roundTo(bilirubinMgdl, 2), unit: 'mg/dL', score: bilirubinScore },
          albumin: { raw: roundTo(albuminGdl, 1), unit: 'g/dL', score: albuminScore },
          inr: { raw: roundTo(inr, 2), score: inrScore },
          ascites: { value: ascites, score: ascitesScore },
          encephalopathy: { value: encephalopathy, score: encephalopathyScore },
        },
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new ChildPughCalculator());
