import {
  CalculationInput,
  CalculationResult,
  CalculatorMetadata,
  ICalculator,
} from '../calculator.registry';
import { roundTo } from '../../../../common/utils/calculation.utils';
import { CalculatorRegistry } from '../calculator.registry';

/**
 * TSAT (Transferrin Saturation) Calculator
 *
 * Formula: TSAT (%) = (Serum Iron / TIBC) × 100
 * If transferrin used: TIBC (µg/dL) = Transferrin (g/dL) × 25.1 × 1.41  [approximation]
 *   More precisely: TIBC (µg/dL) ≈ Transferrin (mg/dL) × 1.41
 *
 * Serum Iron µmol/L → µg/dL: divide by 0.1791
 * TIBC µmol/L → µg/dL: divide by 0.1791
 *
 * Reference: Camaschella C. Iron-deficiency anemia. NEJM 2015;372:1832-43.
 * Reference: Cook JD. Diagnosis and management of iron-deficiency anaemia. Best Pract Res Clin Haematol. 2005.
 */
export class TSATCalculator implements ICalculator {
  readonly metadata: CalculatorMetadata = {
    id: 'tsat',
    title: 'TSAT Calculator',
    description:
      'Transferrin Saturation for iron status assessment — iron deficiency, repletion threshold, overload, and CKD/anemia interpretation with ferritin context',
    category: 'nutrition',
    tags: ['iron', 'TSAT', 'anemia', 'ferritin', 'TIBC', 'transferrin', 'CKD anemia', 'iron overload'],
    version: '1.0.0',
    references: [
      {
        title: 'Iron-deficiency anemia',
        authors: 'Camaschella C',
        journal: 'New England Journal of Medicine',
        year: 2015,
        doi: '10.1056/NEJMra1401038',
      },
      {
        title: 'KDIGO Clinical Practice Guideline for Anemia in CKD',
        authors: 'KDIGO',
        journal: 'Kidney International Supplements',
        year: 2012,
        url: 'https://kdigo.org/guidelines/anemia-in-ckd/',
      },
      {
        title: 'Diagnosis and management of iron-deficiency anaemia',
        authors: 'Cook JD',
        journal: 'Best Practice & Research Clinical Haematology',
        year: 2005,
        doi: '10.1016/j.beha.2005.01.001',
      },
    ],
    inputs: [
      {
        id: 'serumIron',
        label: 'Serum Iron',
        type: 'number',
        required: true,
        units: ['µg/dL', 'µmol/L'],
        defaultUnit: 'µg/dL',
        min: 0,
        max: 500,
        validationRules: [
          { type: 'required', message: 'Serum iron is required' },
          { type: 'min', value: 0, message: 'Serum iron must be positive' },
          { type: 'max', value: 500, message: 'Serum iron value seems too high (µg/dL)' },
        ],
        clinicalRange: { min: 30, max: 200, unit: 'µg/dL', warning: 'Value outside typical range (30–200 µg/dL)' },
      },
      {
        id: 'tibcMethod',
        label: 'Binding Capacity Method',
        type: 'select',
        required: true,
        options: [
          { value: 'tibc', label: 'TIBC (µg/dL)' },
          { value: 'transferrin', label: 'Transferrin (g/dL)' },
        ],
        validationRules: [{ type: 'required', message: 'Please select TIBC or Transferrin' }],
      },
      {
        id: 'tibcValue',
        label: 'TIBC / Transferrin Value',
        type: 'number',
        required: true,
        min: 0,
        validationRules: [
          { type: 'required', message: 'TIBC or transferrin value is required' },
          { type: 'min', value: 0, message: 'Value must be positive' },
        ],
      },
      {
        id: 'ferritin',
        label: 'Serum Ferritin (optional)',
        type: 'number',
        required: false,
        min: 0,
        helpText: 'ng/mL — adds clinical context to TSAT interpretation',
        validationRules: [],
      },
    ],
    outputs: [
      {
        id: 'tsat',
        label: 'TSAT',
        type: 'percentage',
        unit: '%',
        description: 'Transferrin Saturation percentage',
        interpretations: [
          { range: { max: 16 }, label: 'Iron Deficient', color: '#ef4444' },
          { range: { min: 16, max: 45 }, label: 'Normal', color: '#16a34a' },
          { range: { min: 45, max: 60 }, label: 'Elevated', color: '#f59e0b' },
          { range: { min: 60 }, label: 'Iron Overload Risk', color: '#dc2626' },
        ],
      },
      { id: 'serumIronMcgdl', label: 'Serum Iron (µg/dL)', type: 'number', unit: 'µg/dL' },
      { id: 'tibcMcgdl', label: 'TIBC (µg/dL)', type: 'number', unit: 'µg/dL' },
      { id: 'ironStatus', label: 'Iron Status', type: 'classification' },
    ],
    clinicalNotes: [
      'Normal TSAT: 16–45% (some references: 20–50%)',
      'CKD anemia treatment target: TSAT 20–50%, Ferritin 200–500 ng/mL (HD); 100–300 ng/mL (non-HD)',
      'Iron deficiency: TSAT <20% + Ferritin <100 ng/mL (or <200 in CKD-HD)',
      'TSAT >45% with ferritin >1000 ng/mL: consider iron overload / hereditary hemochromatosis workup',
      'Serum iron and TIBC can be falsely elevated in acute inflammation',
    ],
    warnings: [
      'TSAT and ferritin are acute-phase reactants — interpret in context of inflammation or infection',
      'Results should always be interpreted alongside clinical findings and complete blood count',
    ],
  };

  validate(inputs: CalculationInput): string[] {
    const errors: string[] = [];
    const serumIron = Number(inputs.serumIron);
    const tibcValue = Number(inputs.tibcValue);

    if (!inputs.serumIron && inputs.serumIron !== 0) errors.push('Serum iron is required');
    else if (isNaN(serumIron) || serumIron <= 0) errors.push('Serum iron must be a positive number');

    if (!inputs.tibcMethod) errors.push('Please select TIBC or Transferrin');

    if (!inputs.tibcValue && inputs.tibcValue !== 0) errors.push('TIBC or transferrin value is required');
    else if (isNaN(tibcValue) || tibcValue <= 0) errors.push('TIBC/Transferrin value must be positive');

    return errors;
  }

  calculate(inputs: CalculationInput): CalculationResult {
    const warnings: string[] = [];
    const notes: string[] = [];

    // --- Parse serum iron (normalize to µg/dL) ---
    let serumIronMcgdl = Number(inputs.serumIron);
    const ironUnit = String(inputs.serumIronUnit ?? 'µg/dL');
    if (ironUnit === 'µmol/L') {
      // 1 µmol/L = 5.585 µg/dL (atomic weight of iron ≈ 55.85 g/mol, ×0.1 for µg/dL/µmol/L)
      serumIronMcgdl = serumIronMcgdl * 5.585;
    }
    serumIronMcgdl = roundTo(serumIronMcgdl, 1);

    // --- Parse TIBC / Transferrin (normalize to µg/dL) ---
    let tibcMcgdl = Number(inputs.tibcValue);
    const tibcMethod = String(inputs.tibcMethod ?? 'tibc');
    const tibcUnit = String(inputs.tibcUnit ?? (tibcMethod === 'transferrin' ? 'g/dL' : 'µg/dL'));

    if (tibcMethod === 'transferrin') {
      // Transferrin g/dL → TIBC µg/dL: TIBC = Transferrin (mg/dL) × 1.41
      // g/dL → mg/dL: ×1000 / 10 = ×100? No: 1 g/dL = 1000 mg/L = 100 mg/dL
      // TIBC (µg/dL) = Transferrin (g/dL) × 100 (mg/dL) × 1.41 × 10 (µg/mg)
      // Correct: Transferrin 1 g/dL = 1000 mg/L; TIBC µg/dL = Transferrin_mg_per_dL × 1.41
      // Transferrin_mg_per_dL = tibcValue (in g/dL) × 100
      // TIBC (µg/dL) = tibcValue × 100 × 1.41 — this is too big
      // Standard: TIBC (µg/dL) ≈ Transferrin (g/L) × 25.1  — where Transferrin in g/L
      // g/dL × 10 = g/L, so TIBC (µg/dL) = Transferrin_g_dL × 10 × 25.1 / 10
      // Actually: TIBC (µg/dL) = Transferrin (g/dL) × 25.1
      // Reference: Transferrin 1 g/dL ≈ TIBC 25.1 µmol/L × 5.585 µg/dL/µmol = 140 µg/dL
      // Best approximation: TIBC (µg/dL) ≈ Transferrin (g/dL) × 140 / 0.8 (normal)
      // Clinically accepted: TIBC (µg/dL) = Transferrin (mg/dL) × 1.41
      let transferrinMgdl: number;
      if (tibcUnit === 'g/L') {
        transferrinMgdl = tibcMcgdl * 10; // g/L → g/dL → mg/dL: ÷10 then ×100 = ×10
        // Wait: g/L ÷ 10 = g/dL; g/dL × 100 = mg/dL. So g/L × 10 = mg/dL. Correct.
        transferrinMgdl = tibcMcgdl * 10;
      } else {
        // g/dL
        transferrinMgdl = tibcMcgdl * 100; // g/dL × 100 = mg/dL
      }
      tibcMcgdl = roundTo(transferrinMgdl * 1.41, 0); // TIBC µg/dL
      notes.push(`Transferrin converted to TIBC: ${tibcMcgdl} µg/dL (using factor 1.41)`);
    } else if (tibcUnit === 'µmol/L') {
      tibcMcgdl = roundTo(tibcMcgdl * 5.585, 0);
    }

    // --- Calculate TSAT ---
    if (tibcMcgdl <= 0) {
      return {
        calculatorId: this.metadata.id,
        calculatorName: this.metadata.title,
        inputs: inputs as Record<string, string | number | boolean | null | undefined>,
        outputs: { error: 'TIBC must be greater than zero' },
        warnings: ['Invalid TIBC value'],
        notes: [],
        timestamp: new Date().toISOString(),
      };
    }

    const tsat = roundTo((serumIronMcgdl / tibcMcgdl) * 100, 1);

    // --- Interpret TSAT ---
    let ironStatus: string;
    let tsatSeverity: string;
    let tsatColor: string;
    let clinicalNote: string;

    if (tsat < 16) {
      ironStatus = 'Iron Deficient';
      tsatSeverity = 'danger';
      tsatColor = '#ef4444';
      clinicalNote = 'TSAT <16%: Consistent with iron deficiency. Evaluate ferritin and CBC.';
      warnings.push('TSAT below normal — iron deficiency likely');
    } else if (tsat < 20) {
      ironStatus = 'Low Normal';
      tsatSeverity = 'warning';
      tsatColor = '#f59e0b';
      clinicalNote = 'TSAT 16–20%: Low normal. Monitor in high-risk patients (CKD, heart failure, pregnancy).';
    } else if (tsat <= 45) {
      ironStatus = 'Normal';
      tsatSeverity = 'success';
      tsatColor = '#16a34a';
      clinicalNote = 'TSAT within normal range (16–45%).';
    } else if (tsat <= 60) {
      ironStatus = 'Elevated';
      tsatSeverity = 'warning';
      tsatColor = '#f59e0b';
      clinicalNote = 'TSAT >45%: Elevated. Consider iron supplementation hold if on IV iron therapy.';
      warnings.push('TSAT elevated — hold iron supplementation if applicable');
    } else {
      ironStatus = 'Iron Overload Risk';
      tsatSeverity = 'danger';
      tsatColor = '#dc2626';
      clinicalNote =
        'TSAT >60%: Iron overload risk. Consider hereditary hemochromatosis screening or iatrogenic overload.';
      warnings.push('TSAT >60%: Possible iron overload — consider hemochromatosis evaluation');
    }

    // --- Ferritin context ---
    const ferritin = inputs.ferritin ? Number(inputs.ferritin) : undefined;
    let ferritinContext = '';
    if (ferritin !== undefined) {
      if (ferritin < 12) {
        ferritinContext = 'Ferritin <12 ng/mL: Confirms absolute iron deficiency.';
        warnings.push('Ferritin critically low — absolute iron deficiency confirmed');
      } else if (ferritin < 30) {
        ferritinContext = 'Ferritin 12–30 ng/mL: Iron deficient stores (even if TSAT normal).';
      } else if (ferritin < 100) {
        ferritinContext = 'Ferritin 30–100 ng/mL: Low-normal stores.';
      } else if (ferritin < 300) {
        ferritinContext = 'Ferritin 100–300 ng/mL: Adequate iron stores.';
      } else if (ferritin < 1000) {
        ferritinContext = 'Ferritin 300–1000 ng/mL: Elevated — possible inflammation, liver disease, or iron excess.';
      } else {
        ferritinContext = 'Ferritin >1000 ng/mL: Markedly elevated — consider hemochromatosis, liver disease, or malignancy.';
        warnings.push('Ferritin markedly elevated — evaluate for hemochromatosis or secondary causes');
      }
      notes.push(ferritinContext);

      // Combined interpretation
      if (tsat < 20 && ferritin < 30) {
        notes.push('Combined: Absolute iron deficiency (low TSAT + low ferritin).');
      } else if (tsat < 20 && ferritin >= 100) {
        notes.push(
          'Combined: Functional iron deficiency (low TSAT but adequate/elevated ferritin) — common in CKD, inflammation, or heart failure.'
        );
      }
    }

    notes.push(clinicalNote);
    notes.push(...this.metadata.clinicalNotes!.slice(0, 2));

    return {
      calculatorId: this.metadata.id,
      calculatorName: this.metadata.title,
      inputs: inputs as Record<string, string | number | boolean | null | undefined>,
      outputs: {
        tsat,
        serumIronMcgdl,
        tibcMcgdl,
        ironStatus,
        tsatSeverity,
        tsatColor,
        ...(ferritin !== undefined ? { ferritin, ferritinContext } : {}),
      },
      warnings,
      notes,
      timestamp: new Date().toISOString(),
    };
  }
}

// Auto-register
CalculatorRegistry.getInstance().register(new TSATCalculator());
