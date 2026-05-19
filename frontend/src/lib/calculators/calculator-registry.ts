import type { Calculator, CalculationResult } from '@/types/calculator'
import { calculateEGFR } from './egfr'
import { calculateChildPugh } from './child-pugh'
import { calculateMELDNa } from './meld-na'
import { calculateBMI } from './bmi'
import { calculateEDD } from './edd'
import { calculateSOFA } from './sofa'
import { calculateSOFA2 } from './sofa-2'
import { calculateGCS } from './gcs'
import { calculateVasopressor } from './vasopressor'
import { calculateTSAT } from './tsat'

export const CALCULATORS: Calculator[] = [
  {
    id: 'egfr',
    title: 'eGFR Calculator',
    shortTitle: 'eGFR',
    emoji: '🫘',
    description:
      'Estimate glomerular filtration rate using CKD-EPI 2021 or MDRD formula with automatic mg/dL ↔ µmol/L unit conversion',
    category: 'renal',
    icon: 'Droplets',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    tags: ['kidney', 'creatinine', 'CKD', 'renal function', 'nephrology'],
    inputs: [
      {
        id: 'creatinine',
        label: 'Serum Creatinine',
        type: 'number',
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        required: true,
        min: 0.1,
        max: 20,
        precision: 2,
        clinicalRange: { min: 0.5, max: 5.0, warning: 'Value outside typical clinical range' },
        substance: 'creatinine',
      },
      { id: 'age', label: 'Age', type: 'number', required: true, min: 18, max: 120, precision: 0 },
      {
        id: 'sex',
        label: 'Biological Sex',
        type: 'radio',
        required: true,
        options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
      },
      {
        id: 'formula',
        label: 'Formula',
        type: 'select',
        required: false,
        options: [
          { value: 'ckd-epi-2021', label: 'CKD-EPI 2021 (Recommended)' },
          { value: 'mdrd', label: 'MDRD 4-Variable' },
        ],
      },
    ],
    calculate: (inputs) =>
      calculateEGFR({
        creatinine: Number(inputs.creatinine),
        creatinineUnit: String(inputs.creatinineUnit ?? 'mg/dL'),
        age: Number(inputs.age),
        sex: inputs.sex as 'male' | 'female',
        formula: (inputs.formula as 'ckd-epi-2021' | 'mdrd') ?? 'ckd-epi-2021',
      }),
  },
  {
    id: 'child-pugh',
    title: 'Child-Pugh Score',
    shortTitle: 'Child-Pugh',
    emoji: '🩺',
    description:
      'Assess severity of liver cirrhosis and predict surgical risk with Class A/B/C stratification',
    category: 'liver',
    icon: 'ClipboardList',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    tags: ['liver', 'cirrhosis', 'hepatology', 'surgical risk'],
    inputs: [
      {
        id: 'bilirubin',
        label: 'Total Bilirubin',
        type: 'number',
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        required: true,
        substance: 'bilirubin',
      },
      {
        id: 'albumin',
        label: 'Serum Albumin',
        type: 'number',
        units: ['g/dL', 'g/L'],
        defaultUnit: 'g/dL',
        required: true,
      },
      { id: 'inr', label: 'INR (PT)', type: 'number', required: true, min: 0.8, max: 10 },
      {
        id: 'ascites',
        label: 'Ascites',
        type: 'radio',
        required: true,
        options: [
          { value: 'none', label: 'None' },
          { value: 'mild', label: 'Mild' },
          { value: 'moderate-severe', label: 'Moderate–Severe' },
        ],
      },
      {
        id: 'encephalopathy',
        label: 'Hepatic Encephalopathy',
        type: 'radio',
        required: true,
        options: [
          { value: 'none', label: 'None' },
          { value: 'grade1-2', label: 'Grade I–II' },
          { value: 'grade3-4', label: 'Grade III–IV' },
        ],
      },
    ],
    calculate: (inputs) =>
      calculateChildPugh({
        bilirubin: Number(inputs.bilirubin),
        bilirubinUnit: String(inputs.bilirubinUnit ?? 'mg/dL'),
        albumin: Number(inputs.albumin),
        albuminUnit: String(inputs.albuminUnit ?? 'g/dL'),
        inr: Number(inputs.inr),
        ascites: inputs.ascites as 'none' | 'mild' | 'moderate-severe',
        encephalopathy: inputs.encephalopathy as 'none' | 'grade1-2' | 'grade3-4',
      }),
  },
  {
    id: 'meld-na',
    title: 'MELD-Na Score',
    shortTitle: 'MELD-Na',
    emoji: '🧬',
    description:
      'Model for End-Stage Liver Disease with sodium for transplant priority and 90-day mortality estimation',
    category: 'liver',
    icon: 'ListOrdered',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    tags: ['liver', 'transplant', 'MELD', 'mortality', 'UNOS'],
    inputs: [
      {
        id: 'bilirubin',
        label: 'Total Bilirubin',
        type: 'number',
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        required: true,
        substance: 'bilirubin',
      },
      { id: 'inr', label: 'INR', type: 'number', required: true, min: 0.8, max: 15 },
      {
        id: 'creatinine',
        label: 'Serum Creatinine',
        type: 'number',
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        required: true,
        substance: 'creatinine',
      },
      {
        id: 'sodium',
        label: 'Serum Sodium',
        type: 'number',
        required: true,
        min: 100,
        max: 160,
        helpText: 'Normal: 135–145 mEq/L',
      },
      {
        id: 'onDialysis',
        label: 'On Dialysis',
        type: 'toggle',
        required: false,
        helpText: 'If yes, creatinine is set to 4.0 mg/dL',
      },
    ],
    calculate: (inputs) =>
      calculateMELDNa({
        bilirubin: Number(inputs.bilirubin),
        bilirubinUnit: String(inputs.bilirubinUnit ?? 'mg/dL'),
        inr: Number(inputs.inr),
        creatinine: Number(inputs.creatinine),
        creatinineUnit: String(inputs.creatinineUnit ?? 'mg/dL'),
        sodium: Number(inputs.sodium),
        onDialysis: Boolean(inputs.onDialysis),
      }),
  },
  {
    id: 'bmi',
    title: 'BMI Calculator',
    shortTitle: 'BMI',
    emoji: '⚖️',
    description:
      'Body Mass Index with WHO classification and body surface area by the Mosteller formula',
    category: 'nutrition',
    icon: 'Scale',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    tags: ['BMI', 'BSA', 'Mosteller', 'obesity', 'weight', 'nutrition'],
    inputs: [
      {
        id: 'height',
        label: 'Height',
        type: 'composite',
        units: ['cm', 'm', 'ft+in'],
        defaultUnit: 'cm',
        required: true,
      },
      {
        id: 'weight',
        label: 'Weight',
        type: 'number',
        units: ['kg', 'lb'],
        defaultUnit: 'kg',
        required: true,
        min: 1,
        max: 500,
      },
      {
        id: 'sex',
        label: 'Biological Sex (for IBW)',
        type: 'radio',
        required: false,
        options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
        helpText: 'Optional — used for Devine IBW formula',
      },
    ],
    calculate: (inputs) => {
      let heightCm = Number(inputs.heightCm ?? inputs.height ?? 0)
      if (inputs.heightUnit === 'm') heightCm = Number(inputs.height) * 100
      else if (inputs.heightUnit === 'ft+in') {
        heightCm = Number(inputs.heightFeet ?? 0) * 30.48 + Number(inputs.heightInches ?? 0) * 2.54
      }
      let weightKg = Number(inputs.weight ?? 0)
      if (inputs.weightUnit === 'lb') weightKg = weightKg * 0.453592
      return calculateBMI({ heightCm, weightKg })
    },
  },
  {
    id: 'edd',
    title: 'EDD Calculator',
    shortTitle: 'EDD',
    emoji: '👶',
    description:
      "Estimate due date via Naegele's rule (LMP) or ultrasound dating with gestational milestones",
    category: 'obstetric',
    icon: 'Baby',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    tags: ['pregnancy', 'EDD', 'gestational age', 'obstetrics', 'LMP', 'ultrasound'],
    inputs: [
      {
        id: 'method',
        label: 'Dating Method',
        type: 'radio',
        required: true,
        options: [
          { value: 'lmp', label: 'Last Menstrual Period (LMP)' },
          { value: 'ultrasound', label: 'Ultrasound Dating' },
        ],
      },
      { id: 'lmpDate', label: 'Date of LMP', type: 'date', required: false },
      { id: 'cycleLength', label: 'Cycle Length (days)', type: 'number', required: false, min: 20, max: 45 },
      { id: 'scanDate', label: 'Date of Ultrasound', type: 'date', required: false },
      { id: 'gestationalWeeks', label: 'GA at Scan (weeks)', type: 'number', required: false, min: 0, max: 42 },
      { id: 'gestationalDays', label: 'Additional Days', type: 'number', required: false, min: 0, max: 6 },
    ],
    calculate: (inputs) =>
      calculateEDD({
        method: inputs.method as 'lmp' | 'ultrasound',
        lmpDate: inputs.lmpDate as string | undefined,
        cycleLength: inputs.cycleLength ? Number(inputs.cycleLength) : undefined,
        scanDate: inputs.scanDate as string | undefined,
        gestationalWeeks: inputs.gestationalWeeks ? Number(inputs.gestationalWeeks) : undefined,
        gestationalDays: inputs.gestationalDays ? Number(inputs.gestationalDays) : undefined,
      }),
  },
  {
    id: 'gcs',
    title: 'GCS',
    shortTitle: 'GCS',
    emoji: 'GCS',
    description: 'Glasgow Coma Score',
    category: 'critical-care',
    icon: 'Brain',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 dark:bg-sky-950',
    tags: ['GCS', 'Glasgow Coma Score', 'critical care', 'neurology'],
    inputs: [],
    calculate: (inputs) =>
      calculateGCS({
        eye: (inputs.eye as number | 'NT') ?? 4,
        verbal: (inputs.verbal as number | 'NT') ?? 5,
        motor: (inputs.motor as number | 'NT') ?? 6,
      }),
  },
  {
    id: 'sofa-2',
    title: 'SOFA-2',
    shortTitle: 'SOFA-2',
    emoji: 'SOFA-2',
    description: 'SOFA-2 Score',
    category: 'critical-care',
    icon: 'ListChecks',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    tags: ['SOFA-2', 'ICU', 'sepsis', 'organ failure', 'critical care'],
    inputs: [],
    calculate: (inputs) =>
      calculateSOFA2({
        brain: Number(inputs.brain ?? 0),
        respiratory: Number(inputs.respiratory ?? 0),
        cardiovascular: Number(inputs.cardiovascular ?? 0),
        liver: Number(inputs.liver ?? 0),
        kidney: Number(inputs.kidney ?? 0),
        hemostasis: Number(inputs.hemostasis ?? 0),
      }),
  },
  {
    id: 'sofa',
    title: 'SOFA Score',
    shortTitle: 'SOFA',
    emoji: '🫀',
    description:
      'Sequential Organ Failure Assessment for ICU mortality prediction and sepsis diagnosis (6 organ systems, 0–24)',
    category: 'critical-care',
    icon: 'HeartPulse',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    tags: ['ICU', 'sepsis', 'organ failure', 'critical care', 'mortality', 'ventilator'],
    inputs: [
      { id: 'pao2', label: 'PaO₂', type: 'number', required: false, min: 20, max: 600, helpText: 'mmHg' },
      { id: 'fio2', label: 'FiO₂', type: 'number', required: false, min: 0.21, max: 1.0, helpText: '0.21–1.0' },
      { id: 'spo2', label: 'SpO₂ (%)', type: 'number', required: false, min: 50, max: 100 },
      { id: 'ventilated', label: 'Mechanically Ventilated', type: 'toggle', required: false },
      { id: 'platelets', label: 'Platelets (×10³/µL)', type: 'number', required: true, min: 0, max: 1000 },
      {
        id: 'bilirubin',
        label: 'Total Bilirubin',
        type: 'number',
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        required: true,
        substance: 'bilirubin',
      },
      { id: 'map', label: 'Mean Arterial Pressure (mmHg)', type: 'number', required: true, min: 20, max: 200 },
      { id: 'gcs', label: 'GCS Score', type: 'number', required: true, min: 3, max: 15 },
      {
        id: 'creatinine',
        label: 'Serum Creatinine',
        type: 'number',
        units: ['mg/dL', 'µmol/L'],
        defaultUnit: 'mg/dL',
        required: true,
        substance: 'creatinine',
      },
      { id: 'urineOutput', label: 'Urine Output (mL/24h)', type: 'number', required: false, min: 0, max: 10000 },
    ],
    calculate: (inputs) =>
      calculateSOFA({
        pao2: inputs.pao2 ? Number(inputs.pao2) : undefined,
        fio2: inputs.fio2 ? Number(inputs.fio2) : undefined,
        spo2: inputs.spo2 ? Number(inputs.spo2) : undefined,
        ventilated: Boolean(inputs.ventilated),
        platelets: Number(inputs.platelets),
        bilirubin: Number(inputs.bilirubin),
        bilirubinUnit: String(inputs.bilirubinUnit ?? 'mg/dL'),
        map: Number(inputs.map),
        vasopressor: inputs.vasopressor as string | undefined,
        vasopressorDose: inputs.vasopressorDose ? Number(inputs.vasopressorDose) : undefined,
        gcs: Number(inputs.gcs),
        creatinine: Number(inputs.creatinine),
        creatinineUnit: String(inputs.creatinineUnit ?? 'mg/dL'),
        urineOutput: inputs.urineOutput ? Number(inputs.urineOutput) : undefined,
      }),
  },
  {
    id: 'vasopressor',
    title: 'Vasopressor Score',
    shortTitle: 'VIS',
    emoji: '💉',
    description:
      'Vasoactive-Inotropic Score (VIS) with auto-conversion for dopamine, norepinephrine, epinephrine, vasopressin and more',
    category: 'critical-care',
    icon: 'Syringe',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    tags: ['vasopressors', 'shock', 'VIS', 'ICU', 'hemodynamics', 'inotropes'],
    inputs: [
      { id: 'weight', label: 'Patient Weight', type: 'number', units: ['kg', 'lb'], defaultUnit: 'kg', required: true, min: 1, max: 300 },
    ],
    calculate: (inputs) =>
      calculateVasopressor({
        weight: Number(inputs.weight),
        weightUnit: String(inputs.weightUnit ?? 'kg'),
        drugs: (inputs.drugs as Array<{ name: string; dose: number; unit: string; enabled: boolean }>) ?? [],
      }),
  },
  {
    id: 'tsat',
    title: 'TSAT Calculator',
    shortTitle: 'TSAT',
    emoji: '🩸',
    description:
      'Transferrin Saturation for iron status assessment — iron deficiency, overload, and CKD anemia interpretation',
    category: 'nutrition',
    icon: 'TestTube',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    tags: ['iron', 'TSAT', 'anemia', 'ferritin', 'TIBC', 'transferrin', 'CKD anemia'],
    inputs: [
      {
        id: 'serumIron',
        label: 'Serum Iron',
        type: 'number',
        units: ['µg/dL', 'µmol/L'],
        defaultUnit: 'µg/dL',
        required: true,
        min: 0,
      },
      {
        id: 'tibcMethod',
        label: 'Input Method',
        type: 'radio',
        required: true,
        options: [{ value: 'tibc', label: 'TIBC' }, { value: 'transferrin', label: 'Transferrin (g/dL)' }],
      },
      { id: 'tibcValue', label: 'TIBC / Transferrin Value', type: 'number', required: true, min: 0 },
      { id: 'ferritin', label: 'Serum Ferritin (ng/mL)', type: 'number', required: false, min: 0 },
    ],
    calculate: (inputs) =>
      calculateTSAT({
        serumIron: Number(inputs.serumIron),
        serumIronUnit: String(inputs.serumIronUnit ?? 'µg/dL'),
        tibcMethod: inputs.tibcMethod as 'tibc' | 'transferrin',
        tibcValue: Number(inputs.tibcValue),
        tibcUnit: String(inputs.tibcUnit ?? 'µg/dL'),
        ferritin: inputs.ferritin ? Number(inputs.ferritin) : undefined,
      }),
  },
]

export function getCalculator(id: string): Calculator | undefined {
  return CALCULATORS.find((c) => c.id === id)
}

export function getCalculatorsByCategory(category: string): Calculator[] {
  return CALCULATORS.filter((c) => c.category === category)
}

export const CALCULATOR_CATEGORIES = [
  'critical-care',
  'renal',
  'liver',
  'nutrition',
  'obstetric',
  'hematology',
] as const
