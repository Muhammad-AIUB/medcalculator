import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry
} from '../calculator.registry';
import {
  addDays,
  toDateString,
  formatGestationalAge,
} from '../../../../common/utils/calculation.utils';

interface Milestone {
  name: string;
  weeksRange: string;
  dateRange: string;
  description: string;
}

function getTrimester(totalDays: number): { trimester: number; label: string } {
  const weeks = totalDays / 7;
  if (weeks < 13) return { trimester: 1, label: 'First Trimester (0-12+6 weeks)' };
  if (weeks < 28) return { trimester: 2, label: 'Second Trimester (13-27+6 weeks)' };
  return { trimester: 3, label: 'Third Trimester (28+ weeks)' };
}

function getMilestones(edd: Date): Milestone[] {
  const lmp = addDays(edd, -280);
  return [
    {
      name: 'Nuchal Translucency Scan',
      weeksRange: '11+0 to 13+6 weeks',
      dateRange: `${toDateString(addDays(lmp, 77))} to ${toDateString(addDays(lmp, 97))}`,
      description: 'NT scan for chromosomal abnormality screening',
    },
    {
      name: 'First Trimester Screening (Combined)',
      weeksRange: '11+0 to 13+6 weeks',
      dateRange: `${toDateString(addDays(lmp, 77))} to ${toDateString(addDays(lmp, 97))}`,
      description: 'PAPP-A, free β-hCG + NT + dating ultrasound',
    },
    {
      name: 'Cell-Free Fetal DNA (cfDNA)',
      weeksRange: '10+ weeks',
      dateRange: `After ${toDateString(addDays(lmp, 70))}`,
      description: 'Non-invasive prenatal testing (NIPT) — optional',
    },
    {
      name: 'Anatomy / Anomaly Scan',
      weeksRange: '18+0 to 22+0 weeks',
      dateRange: `${toDateString(addDays(lmp, 126))} to ${toDateString(addDays(lmp, 154))}`,
      description: 'Detailed fetal anatomy survey',
    },
    {
      name: 'Gestational Diabetes Screen (OGTT)',
      weeksRange: '24 to 28 weeks',
      dateRange: `${toDateString(addDays(lmp, 168))} to ${toDateString(addDays(lmp, 196))}`,
      description: '75g 2-hour OGTT (or 50g GCT followed by 100g OGTT if abnormal)',
    },
    {
      name: 'Tdap Vaccination',
      weeksRange: '27 to 36 weeks',
      dateRange: `${toDateString(addDays(lmp, 189))} to ${toDateString(addDays(lmp, 252))}`,
      description: 'Pertussis booster — recommended in every pregnancy',
    },
    {
      name: 'Group B Streptococcus (GBS) Screen',
      weeksRange: '35 to 37 weeks',
      dateRange: `${toDateString(addDays(lmp, 245))} to ${toDateString(addDays(lmp, 259))}`,
      description: 'Vaginal/rectal GBS culture',
    },
    {
      name: 'Term (37 weeks)',
      weeksRange: '37+0 weeks',
      dateRange: toDateString(addDays(lmp, 259)),
      description: 'Early term begins. Low-risk pregnancies may be managed expectantly to 39+ weeks.',
    },
    {
      name: 'Full Term (39 weeks)',
      weeksRange: '39+0 to 40+6 weeks',
      dateRange: `${toDateString(addDays(lmp, 273))} to ${toDateString(addDays(lmp, 286))}`,
      description: 'Optimal delivery window for low-risk pregnancies',
    },
    {
      name: 'Estimated Due Date (EDD)',
      weeksRange: '40+0 weeks',
      dateRange: toDateString(edd),
      description: 'Based on Naegele\'s rule (LMP + 280 days)',
    },
    {
      name: 'Post-term (≥42 weeks)',
      weeksRange: '42+0 weeks',
      dateRange: toDateString(addDays(lmp, 294)),
      description: 'Post-term pregnancy. Delivery usually recommended by this point.',
    },
  ];
}

export class EddCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'edd',
    title: 'Estimated Due Date (EDD) & Gestational Age',
    description:
      'Calculates EDD by LMP (Naegele\'s rule) or ultrasound dating. Provides gestational age, trimester, and key obstetric milestones.',
    category: 'obstetric',
    tags: ['EDD', 'obstetric', 'pregnancy', 'gestational age', 'LMP', 'due date', 'prenatal'],
    version: '1.0.0',
    references: [
      {
        title: 'Methods for Estimating the Due Date (ACOG Committee Opinion 700)',
        authors: 'American College of Obstetricians and Gynecologists',
        journal: 'Obstetrics & Gynecology',
        year: 2017,
        doi: '10.1097/AOG.0000000000002229',
      },
    ],
    inputs: [
      {
        id: 'method',
        label: 'Dating Method',
        type: 'select',
        required: true,
        options: [
          { value: 'lmp', label: 'Last Menstrual Period (LMP)' },
          { value: 'ultrasound', label: 'Ultrasound Dating' },
        ],
        validationRules: [{ type: 'required', message: 'Dating method is required' }],
      },
      {
        id: 'lmpDate',
        label: 'Last Menstrual Period (LMP) Date',
        type: 'date',
        required: false,
        validationRules: [],
        helpText: 'First day of last menstrual period',
      },
      {
        id: 'cycleLength',
        label: 'Average Cycle Length (days)',
        type: 'number',
        required: false,
        min: 21,
        max: 35,
        validationRules: [],
        helpText: 'Average menstrual cycle length. Used to correct EDD for irregular cycles (default 28 days).',
        placeholder: '28',
      },
      {
        id: 'scanDate',
        label: 'Ultrasound Scan Date',
        type: 'date',
        required: false,
        validationRules: [],
        helpText: 'Date of ultrasound examination used for dating',
      },
      {
        id: 'scanGaWeeks',
        label: 'GA at Scan (weeks)',
        type: 'number',
        required: false,
        min: 6,
        max: 40,
        validationRules: [],
        helpText: 'Gestational age in weeks at the time of the scan',
      },
      {
        id: 'scanGaDays',
        label: 'GA at Scan (days)',
        type: 'number',
        required: false,
        min: 0,
        max: 6,
        validationRules: [],
        helpText: 'Additional days beyond weeks at time of scan',
      },
      {
        id: 'referenceDate',
        label: 'Reference Date (Today)',
        type: 'date',
        required: false,
        validationRules: [],
        helpText: 'Date to calculate current gestational age (defaults to today)',
      },
    ],
    outputs: [
      { id: 'edd', label: 'Estimated Due Date', type: 'date', description: 'Expected date of confinement (EDC)' },
      { id: 'gestational_age', label: 'Current Gestational Age', type: 'string', description: 'GA in weeks + days as of reference date' },
      { id: 'trimester', label: 'Trimester', type: 'classification', description: 'Current trimester' },
      { id: 'milestones', label: 'Prenatal Milestones', type: 'string', description: 'Key dates for prenatal care' },
    ],
    clinicalNotes: [
      'Naegele\'s rule: EDD = LMP + 280 days (assuming 28-day cycle). Correction applied for other cycle lengths.',
      'Ultrasound dating supersedes LMP when the two differ by >7 days in first trimester, >10 days in second trimester, >14 days in third trimester.',
      'Crown-rump length (CRL) dating is most accurate in first trimester (<14 weeks).',
    ],
    warnings: [
      'EDD is an estimate. Only ~5% of births occur on the EDD.',
      'This calculator does not replace clinical assessment and obstetric ultrasound.',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    const method = String(inputs['method'] || '');

    if (!method) {
      errors.push('Dating method is required');
      return errors;
    }

    if (method === 'lmp') {
      if (!inputs['lmpDate']) errors.push('LMP date is required');
    } else if (method === 'ultrasound') {
      if (!inputs['scanDate']) errors.push('Scan date is required');
      if (!inputs['scanGaWeeks'] && inputs['scanGaWeeks'] !== 0) errors.push('Gestational age at scan (weeks) is required');
    }

    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    const method = String(inputs['method']);
    const referenceDate = inputs['referenceDate']
      ? new Date(String(inputs['referenceDate']))
      : new Date();

    let edd: Date;
    let lmpEquivalent: Date;

    if (method === 'lmp') {
      const lmpDate = new Date(String(inputs['lmpDate']));
      const cycleLength = Number(inputs['cycleLength'] || 28);

      // Naegele's rule: LMP + 280 days (for 28-day cycle)
      // For other cycle lengths, adjust: EDD = LMP + 280 + (cycleLength - 28)
      const adjustmentDays = cycleLength - 28;
      edd = addDays(lmpDate, 280 + adjustmentDays);
      lmpEquivalent = lmpDate;

      if (cycleLength !== 28) {
        notes.push(`Cycle length adjusted: ${cycleLength} days (standard 28). EDD adjusted by ${adjustmentDays > 0 ? '+' : ''}${adjustmentDays} days.`);
      }
      notes.push(`EDD by LMP (Naegele's rule): ${toDateString(edd)}`);
    } else {
      // Ultrasound dating
      const scanDate = new Date(String(inputs['scanDate']));
      const gaWeeks = Number(inputs['scanGaWeeks'] || 0);
      const gaDays = Number(inputs['scanGaDays'] || 0);
      const totalGaDays = gaWeeks * 7 + gaDays;

      // EDD = scanDate + (280 - totalGaDays)
      edd = addDays(scanDate, 280 - totalGaDays);
      lmpEquivalent = addDays(scanDate, -totalGaDays);

      notes.push(`EDD by ultrasound at ${gaWeeks}w ${gaDays}d on ${toDateString(scanDate)}: ${toDateString(edd)}`);

      if (gaWeeks < 11 || gaWeeks > 14) {
        if (gaWeeks < 11) {
          warnings.push('Dating by ultrasound <11 weeks: CRL measurement is most accurate.');
        } else if (gaWeeks > 20) {
          warnings.push('Third-trimester ultrasound dating is less accurate (±2-3 weeks). Early ultrasound is preferred for dating.');
        }
      }
    }

    // ── Gestational age as of reference date ─────────────────────
    const daysSinceLmp = Math.floor(
      (referenceDate.getTime() - lmpEquivalent.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceLmp < 0) {
      warnings.push('Reference date is before LMP date. Gestational age will be negative.');
    }

    const ga = formatGestationalAge(Math.max(0, daysSinceLmp));
    const trimesterInfo = getTrimester(Math.max(0, daysSinceLmp));

    // ── Days until/since EDD ──────────────────────────────────────
    const daysToEdd = Math.floor(
      (edd.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const milestones = getMilestones(edd);

    // Warnings
    if (daysToEdd < 0) {
      warnings.push(`EDD was ${Math.abs(daysToEdd)} days ago. Patient may be post-term.`);
    }
    if (daysToEdd < 0 && Math.abs(daysToEdd) > 14) {
      warnings.push('More than 2 weeks post-EDD. Delivery indication should be reviewed.');
    }

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        edd: toDateString(edd),
        lmp_equivalent: toDateString(lmpEquivalent),
        gestational_age: ga.display,
        gestational_age_weeks: ga.weeks,
        gestational_age_days: ga.days,
        total_days: Math.max(0, daysSinceLmp),
        trimester: trimesterInfo.trimester,
        trimester_label: trimesterInfo.label,
        days_to_edd: daysToEdd,
        reference_date: toDateString(referenceDate),
        milestones,
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new EddCalculator());
