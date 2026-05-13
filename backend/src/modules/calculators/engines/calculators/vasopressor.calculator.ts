import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
  CalculatorRegistry,
} from '../calculator.registry';
import { roundTo } from '../../../../common/utils/calculation.utils';

/**
 * Vasopressor Intensity Score (VIS) Calculator
 *
 * Formula (Auer 2012 modified):
 *   VIS = Dopamine (mcg/kg/min)
 *       + Dobutamine (mcg/kg/min)
 *       + 100 × Epinephrine (mcg/kg/min)
 *       + 10 × Milrinone (mcg/kg/min)
 *       + 10,000 × Vasopressin (units/min)
 *       + 100 × Norepinephrine (mcg/kg/min)
 *       + 100 × Phenylephrine (mcg/kg/min)
 *
 * References:
 *   Auer J et al. J Intensive Care Med 2012.
 *   McIntosh AM et al. Pediatr Crit Care Med 2017.
 *   Validated in adult and pediatric ICU settings.
 */

interface DrugInput {
  name: string;
  dose: number;
  unit: string;
  enabled: boolean;
}

const DRUG_VIS_WEIGHTS: Record<string, number> = {
  dopamine: 1,
  dobutamine: 1,
  epinephrine: 100,
  norepinephrine: 100,
  phenylephrine: 100,
  milrinone: 10,
  vasopressin: 10000, // units/min scale
};

/**
 * Convert any drug dose to mcg/kg/min.
 * For vasopressin: units/min stays as units/min (VIS applies 10,000× to units/min)
 */
function toDosePerKgMin(
  dose: number,
  unit: string,
  weightKg: number,
  drugName: string
): { doseNormalized: number; conversionNote: string } {
  const drug = drugName.toLowerCase();

  // Vasopressin special case — keep as units/min
  if (drug === 'vasopressin') {
    if (unit === 'units/min' || unit === 'U/min' || unit === 'u/min') {
      return { doseNormalized: dose, conversionNote: `${dose} units/min` };
    }
    if (unit === 'units/hr' || unit === 'U/hr') {
      return { doseNormalized: dose / 60, conversionNote: `${dose} units/hr → ${roundTo(dose / 60, 4)} units/min` };
    }
    return { doseNormalized: dose, conversionNote: `${dose} ${unit}` };
  }

  // Standard: target is mcg/kg/min
  if (unit === 'mcg/kg/min' || unit === 'µg/kg/min' || unit === 'ug/kg/min') {
    return { doseNormalized: dose, conversionNote: `${dose} mcg/kg/min` };
  }

  if (unit === 'mcg/min' || unit === 'µg/min' || unit === 'ug/min') {
    const normalized = dose / weightKg;
    return { doseNormalized: normalized, conversionNote: `${dose} mcg/min ÷ ${weightKg} kg = ${roundTo(normalized, 3)} mcg/kg/min` };
  }

  if (unit === 'mg/hr') {
    // mg/hr → mcg/min: ×1000/60; then /kg
    const mcgPerMin = (dose * 1000) / 60;
    const normalized = mcgPerMin / weightKg;
    return {
      doseNormalized: normalized,
      conversionNote: `${dose} mg/hr → ${roundTo(mcgPerMin, 2)} mcg/min → ${roundTo(normalized, 3)} mcg/kg/min`,
    };
  }

  if (unit === 'mcg/hr' || unit === 'µg/hr') {
    const mcgPerMin = dose / 60;
    const normalized = mcgPerMin / weightKg;
    return {
      doseNormalized: normalized,
      conversionNote: `${dose} mcg/hr → ${roundTo(mcgPerMin, 2)} mcg/min → ${roundTo(normalized, 3)} mcg/kg/min`,
    };
  }

  if (unit === 'ng/kg/min') {
    const normalized = dose / 1000;
    return { doseNormalized: normalized, conversionNote: `${dose} ng/kg/min → ${roundTo(normalized, 5)} mcg/kg/min` };
  }

  // Unknown unit — use as-is with warning
  return { doseNormalized: dose, conversionNote: `${dose} ${unit} (unit not converted — assumed mcg/kg/min)` };
}

export class VasopressorCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'vasopressor',
    title: 'Vasopressor Score (VIS)',
    description:
      'Vasoactive-Inotropic Score (VIS) with automatic unit normalization for dopamine, dobutamine, norepinephrine, epinephrine, vasopressin, milrinone, and phenylephrine',
    category: 'critical-care',
    tags: ['vasopressors', 'shock', 'VIS', 'ICU', 'hemodynamics', 'inotropes', 'septic shock', 'cardiogenic shock'],
    version: '1.0.0',
    references: [
      {
        title: 'Vasoactive-Inotropic Score as a Predictor of Morbidity and Mortality in Infants after Cardiothoracic Surgery',
        authors: 'Gaies MG et al.',
        journal: 'Pediatric Critical Care Medicine',
        year: 2010,
        doi: '10.1097/PCC.0b013e3181e2a30b',
      },
      {
        title: 'Vasoactive-Inotropic Score and clinical outcome in non-cardiac pediatric critical illness',
        authors: 'McIntosh AM et al.',
        journal: 'Pediatric Critical Care Medicine',
        year: 2017,
        doi: '10.1097/PCC.0000000000001224',
      },
      {
        title: 'Association of Vasoactive-Inotropic Score with outcomes in adult cardiac surgery patients',
        authors: 'Auer J et al.',
        journal: 'Journal of Intensive Care Medicine',
        year: 2012,
      },
    ],
    inputs: [
      {
        id: 'weight',
        label: 'Patient Weight (kg)',
        type: 'number',
        required: true,
        units: ['kg', 'lb'],
        defaultUnit: 'kg',
        min: 1,
        max: 300,
        validationRules: [
          { type: 'required', message: 'Patient weight is required for dose normalization' },
          { type: 'min', value: 1, message: 'Weight must be at least 1 kg' },
        ],
      },
    ],
    outputs: [
      {
        id: 'vis',
        label: 'Vasoactive-Inotropic Score',
        type: 'score',
        description: 'Total VIS score (sum of all weighted drug contributions)',
        interpretations: [
          { range: { max: 10 }, label: 'Low Support', color: '#16a34a' },
          { range: { min: 10, max: 20 }, label: 'Moderate Support', color: '#ca8a04' },
          { range: { min: 20, max: 40 }, label: 'High Support', color: '#ea580c' },
          { range: { min: 40 }, label: 'Very High Support', color: '#dc2626' },
        ],
      },
      { id: 'mortalityRisk', label: 'Mortality Risk', type: 'classification' },
    ],
    clinicalNotes: [
      'VIS = Dopamine + Dobutamine + (100 × Epi) + (10,000 × Vasopressin in units/min) + (10 × Milrinone) + (100 × Norepinephrine) + (100 × Phenylephrine)',
      'All doses are normalized to mcg/kg/min before applying weights (vasopressin uses units/min)',
      'VIS >40 associated with significantly increased mortality in critically ill patients',
      'VIS is a real-time measure — should be reassessed frequently during hemodynamic resuscitation',
      'Originally validated in pediatric cardiac surgery; validated in adult ICU settings',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    const weight = Number(inputs.weight);
    if (!inputs.weight) errors.push('Patient weight is required');
    else if (isNaN(weight) || weight <= 0) errors.push('Patient weight must be a positive number');
    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    // Weight
    let weightKg = Number(inputs.weight);
    if (String(inputs.weightUnit) === 'lb') weightKg = weightKg * 0.453592;
    weightKg = roundTo(weightKg, 1);

    // Parse drug list (sent as JSON array or individual fields)
    let drugs: DrugInput[] = [];
    if (inputs.drugs && Array.isArray(inputs.drugs)) {
      drugs = inputs.drugs as DrugInput[];
    } else {
      // Support individual field format: dopamine, dopamineUnit, dopamineEnabled, etc.
      const drugNames = ['dopamine', 'dobutamine', 'epinephrine', 'norepinephrine', 'phenylephrine', 'milrinone', 'vasopressin'];
      for (const name of drugNames) {
        const dose = Number(inputs[name] ?? 0);
        const unit = String(inputs[`${name}Unit`] ?? 'mcg/kg/min');
        const enabled = inputs[`${name}Enabled`] !== false && dose > 0;
        if (dose > 0) {
          drugs.push({ name, dose, unit, enabled });
        }
      }
    }

    // Calculate VIS
    let vis = 0;
    const drugBreakdown: Record<string, { doseNormalized: number; weight: number; contribution: number; conversionNote: string }> = {};

    for (const drug of drugs) {
      if (!drug.enabled || drug.dose <= 0) continue;
      const drugName = drug.name.toLowerCase();
      const visWeight = DRUG_VIS_WEIGHTS[drugName];
      if (visWeight === undefined) {
        warnings.push(`Unknown drug "${drug.name}" — not included in VIS calculation`);
        continue;
      }

      const { doseNormalized, conversionNote } = toDosePerKgMin(drug.dose, drug.unit, weightKg, drugName);
      const contribution = roundTo(doseNormalized * visWeight, 2);
      vis += contribution;

      drugBreakdown[drugName] = { doseNormalized: roundTo(doseNormalized, 4), weight: visWeight, contribution, conversionNote };
      notes.push(`${drug.name}: ${conversionNote} × ${visWeight} = ${contribution}`);
    }

    vis = roundTo(vis, 1);

    // Interpret
    let visCategory: string;
    let visSeverity: string;
    let mortalityRisk: string;
    let clinicalNote: string;

    if (vis <= 5) {
      visCategory = 'Minimal Support';
      visSeverity = 'success';
      mortalityRisk = 'Low';
      clinicalNote = 'VIS ≤5: Minimal vasopressor/inotrope support. Favorable hemodynamic status.';
    } else if (vis <= 15) {
      visCategory = 'Low–Moderate Support';
      visSeverity = 'info';
      mortalityRisk = 'Low–Moderate';
      clinicalNote = 'VIS 5–15: Mild vasopressor support. Monitor closely for escalation.';
    } else if (vis <= 30) {
      visCategory = 'Moderate–High Support';
      visSeverity = 'warning';
      mortalityRisk = 'Moderate (~15–25%)';
      clinicalNote = 'VIS 15–30: Substantial vasopressor burden. Consider source control and fluid optimization.';
      warnings.push('Moderate VIS — escalating vasopressor requirements associated with increased mortality');
    } else if (vis <= 60) {
      visCategory = 'High Support';
      visSeverity = 'danger';
      mortalityRisk = 'High (~30–50%)';
      clinicalNote = 'VIS 30–60: Very high vasopressor support. Associated with significant ICU mortality.';
      warnings.push('High VIS — consider goals-of-care discussion');
    } else {
      visCategory = 'Extreme Support';
      visSeverity = 'danger';
      mortalityRisk = 'Very High (>50%)';
      clinicalNote = 'VIS >60: Extreme vasopressor support. Very high predicted mortality.';
      warnings.push('Extreme VIS >60 — very high predicted mortality; goals-of-care review indicated');
    }

    notes.push(clinicalNote);

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        vis,
        visCategory,
        visSeverity,
        mortalityRisk,
        drugBreakdown,
        weightKg,
        activeDrugs: drugs.filter((d) => d.enabled && d.dose > 0).length,
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new VasopressorCalculator());
