/**
 * Medical Unit Conversion Registry
 * Canonical SI base units used for all conversions.
 * All conversions: canonical_value = value * toCanonical
 * Inverse: unit_value = canonical_value / toCanonical
 */

export type UnitCategory =
  | 'concentration'
  | 'weight'
  | 'length'
  | 'pressure'
  | 'rate'
  | 'volume'
  | 'temperature'
  | 'time'
  | 'ratio';

export interface UnitDefinition {
  symbol: string;
  name: string;
  category: UnitCategory;
  toCanonical: number;
  canonicalUnit: string;
  precision: number;
  aliases: string[];
  isSpecialFormula?: boolean; // e.g. temperature
}

export const UNIT_REGISTRY: Record<string, UnitDefinition> = {
  // ─────────────────────────────────────────────────────────────────
  // CONCENTRATION (canonical: mmol/L for molar, g/L for mass, IU/L for enzyme)
  // ─────────────────────────────────────────────────────────────────
  'mg/dL': {
    symbol: 'mg/dL',
    name: 'Milligrams per deciliter',
    category: 'concentration',
    toCanonical: 0.01,        // mg/dL → g/L  (canonical for mass concentration)
    canonicalUnit: 'g/L',
    precision: 3,
    aliases: ['mg/dl', 'MG/DL', 'mgdl', 'mg dl'],
  },
  'mmol/L': {
    symbol: 'mmol/L',
    name: 'Millimoles per liter',
    category: 'concentration',
    toCanonical: 1,
    canonicalUnit: 'mmol/L',
    precision: 2,
    aliases: ['mmol/l', 'mM', 'MMOL/L'],
  },
  'µmol/L': {
    symbol: 'µmol/L',
    name: 'Micromoles per liter',
    category: 'concentration',
    toCanonical: 0.001,       // µmol/L → mmol/L
    canonicalUnit: 'mmol/L',
    precision: 1,
    aliases: ['umol/L', 'umol/l', 'µmol/l', 'micromol/L', 'UMOL/L'],
  },
  'nmol/L': {
    symbol: 'nmol/L',
    name: 'Nanomoles per liter',
    category: 'concentration',
    toCanonical: 0.000001,    // nmol/L → mmol/L
    canonicalUnit: 'mmol/L',
    precision: 1,
    aliases: ['nmol/l', 'nM'],
  },
  'g/dL': {
    symbol: 'g/dL',
    name: 'Grams per deciliter',
    category: 'concentration',
    toCanonical: 10,          // g/dL → g/L
    canonicalUnit: 'g/L',
    precision: 1,
    aliases: ['g/dl', 'G/DL', 'gdl'],
  },
  'g/L': {
    symbol: 'g/L',
    name: 'Grams per liter',
    category: 'concentration',
    toCanonical: 1,
    canonicalUnit: 'g/L',
    precision: 1,
    aliases: ['g/l', 'G/L'],
  },
  'mg/L': {
    symbol: 'mg/L',
    name: 'Milligrams per liter',
    category: 'concentration',
    toCanonical: 0.001,       // mg/L → g/L
    canonicalUnit: 'g/L',
    precision: 2,
    aliases: ['mg/l', 'MG/L'],
  },
  'µg/L': {
    symbol: 'µg/L',
    name: 'Micrograms per liter',
    category: 'concentration',
    toCanonical: 0.000001,    // µg/L → g/L
    canonicalUnit: 'g/L',
    precision: 2,
    aliases: ['ug/L', 'mcg/L', 'ug/l', 'µg/l'],
  },
  'ng/mL': {
    symbol: 'ng/mL',
    name: 'Nanograms per milliliter',
    category: 'concentration',
    toCanonical: 0.000001,    // ng/mL = µg/L → g/L
    canonicalUnit: 'g/L',
    precision: 2,
    aliases: ['ng/ml', 'nanogram/mL', 'ng/ML'],
  },
  'pg/mL': {
    symbol: 'pg/mL',
    name: 'Picograms per milliliter',
    category: 'concentration',
    toCanonical: 0.000000001, // pg/mL = ng/L → g/L
    canonicalUnit: 'g/L',
    precision: 1,
    aliases: ['pg/ml'],
  },
  'mEq/L': {
    symbol: 'mEq/L',
    name: 'Milliequivalents per liter',
    category: 'concentration',
    toCanonical: 1,
    canonicalUnit: 'mEq/L',
    precision: 1,
    aliases: ['meq/L', 'mEq/l', 'meq/l', 'MEQ/L'],
  },
  'IU/L': {
    symbol: 'IU/L',
    name: 'International units per liter',
    category: 'concentration',
    toCanonical: 1,
    canonicalUnit: 'IU/L',
    precision: 0,
    aliases: ['iu/L', 'IU/l'],
  },
  'U/L': {
    symbol: 'U/L',
    name: 'Units per liter',
    category: 'concentration',
    toCanonical: 1,
    canonicalUnit: 'IU/L',
    precision: 0,
    aliases: ['u/L', 'unit/L', 'units/L'],
  },
  'mIU/mL': {
    symbol: 'mIU/mL',
    name: 'Milli-international units per milliliter',
    category: 'concentration',
    toCanonical: 1,
    canonicalUnit: 'mIU/mL',
    precision: 2,
    aliases: ['mIU/ml', 'mU/mL', 'mU/ml', 'miu/ml'],
  },
  'mIU/L': {
    symbol: 'mIU/L',
    name: 'Milli-international units per liter',
    category: 'concentration',
    toCanonical: 0.001,       // mIU/L → mIU/mL
    canonicalUnit: 'mIU/mL',
    precision: 3,
    aliases: ['miu/L', 'mU/L'],
  },
  '%': {
    symbol: '%',
    name: 'Percent',
    category: 'ratio',
    toCanonical: 1,
    canonicalUnit: '%',
    precision: 1,
    aliases: ['percent', 'pct'],
  },

  // ─────────────────────────────────────────────────────────────────
  // WEIGHT (canonical: kg)
  // ─────────────────────────────────────────────────────────────────
  'kg': {
    symbol: 'kg',
    name: 'Kilograms',
    category: 'weight',
    toCanonical: 1,
    canonicalUnit: 'kg',
    precision: 2,
    aliases: ['KG', 'kilogram', 'kilograms', 'kgs'],
  },
  'lb': {
    symbol: 'lb',
    name: 'Pounds',
    category: 'weight',
    toCanonical: 0.45359237,
    canonicalUnit: 'kg',
    precision: 1,
    aliases: ['lbs', 'pound', 'pounds', 'LB', 'LBS'],
  },
  'g': {
    symbol: 'g',
    name: 'Grams',
    category: 'weight',
    toCanonical: 0.001,
    canonicalUnit: 'kg',
    precision: 0,
    aliases: ['gram', 'grams', 'GR', 'gm'],
  },
  'oz': {
    symbol: 'oz',
    name: 'Ounces',
    category: 'weight',
    toCanonical: 0.028349523,
    canonicalUnit: 'kg',
    precision: 1,
    aliases: ['ounce', 'ounces', 'OZ'],
  },
  'st': {
    symbol: 'st',
    name: 'Stone',
    category: 'weight',
    toCanonical: 6.35029318,
    canonicalUnit: 'kg',
    precision: 1,
    aliases: ['stone', 'stones'],
  },
  'mg': {
    symbol: 'mg',
    name: 'Milligrams',
    category: 'weight',
    toCanonical: 0.000001,
    canonicalUnit: 'kg',
    precision: 0,
    aliases: ['milligram', 'milligrams', 'MG'],
  },
  'µg': {
    symbol: 'µg',
    name: 'Micrograms',
    category: 'weight',
    toCanonical: 0.000000001,
    canonicalUnit: 'kg',
    precision: 0,
    aliases: ['ug', 'mcg', 'microgram', 'micrograms'],
  },

  // ─────────────────────────────────────────────────────────────────
  // LENGTH (canonical: m)
  // ─────────────────────────────────────────────────────────────────
  'm': {
    symbol: 'm',
    name: 'Meters',
    category: 'length',
    toCanonical: 1,
    canonicalUnit: 'm',
    precision: 2,
    aliases: ['M', 'meter', 'meters'],
  },
  'cm': {
    symbol: 'cm',
    name: 'Centimeters',
    category: 'length',
    toCanonical: 0.01,
    canonicalUnit: 'm',
    precision: 1,
    aliases: ['CM', 'centimeter', 'centimeters', 'cms'],
  },
  'mm': {
    symbol: 'mm',
    name: 'Millimeters',
    category: 'length',
    toCanonical: 0.001,
    canonicalUnit: 'm',
    precision: 0,
    aliases: ['MM', 'millimeter', 'millimeters'],
  },
  'ft': {
    symbol: 'ft',
    name: 'Feet',
    category: 'length',
    toCanonical: 0.3048,
    canonicalUnit: 'm',
    precision: 1,
    aliases: ['feet', 'foot', 'FT'],
  },
  'in': {
    symbol: 'in',
    name: 'Inches',
    category: 'length',
    toCanonical: 0.0254,
    canonicalUnit: 'm',
    precision: 1,
    aliases: ['inch', 'inches', '"', 'IN'],
  },

  // ─────────────────────────────────────────────────────────────────
  // PRESSURE (canonical: mmHg)
  // ─────────────────────────────────────────────────────────────────
  'mmHg': {
    symbol: 'mmHg',
    name: 'Millimeters of mercury',
    category: 'pressure',
    toCanonical: 1,
    canonicalUnit: 'mmHg',
    precision: 0,
    aliases: ['mm Hg', 'torr', 'MMHG'],
  },
  'kPa': {
    symbol: 'kPa',
    name: 'Kilopascals',
    category: 'pressure',
    toCanonical: 7.50061683,
    canonicalUnit: 'mmHg',
    precision: 1,
    aliases: ['KPA', 'kilopascal', 'kilopascals'],
  },
  'cmH2O': {
    symbol: 'cmH2O',
    name: 'Centimeters of water',
    category: 'pressure',
    toCanonical: 0.73555912,
    canonicalUnit: 'mmHg',
    precision: 1,
    aliases: ['cm H2O', 'cmH₂O', 'cmh2o', 'cm h2o'],
  },
  'atm': {
    symbol: 'atm',
    name: 'Atmospheres',
    category: 'pressure',
    toCanonical: 760,
    canonicalUnit: 'mmHg',
    precision: 3,
    aliases: ['atmosphere', 'atmospheres', 'ATM'],
  },
  'Pa': {
    symbol: 'Pa',
    name: 'Pascals',
    category: 'pressure',
    toCanonical: 0.00750062,
    canonicalUnit: 'mmHg',
    precision: 2,
    aliases: ['pascal', 'PA'],
  },
  'bar': {
    symbol: 'bar',
    name: 'Bar',
    category: 'pressure',
    toCanonical: 750.062,
    canonicalUnit: 'mmHg',
    precision: 3,
    aliases: ['BAR'],
  },
  'psi': {
    symbol: 'psi',
    name: 'Pounds per square inch',
    category: 'pressure',
    toCanonical: 51.7149,
    canonicalUnit: 'mmHg',
    precision: 2,
    aliases: ['PSI'],
  },

  // ─────────────────────────────────────────────────────────────────
  // DRUG INFUSION RATES (multiple canonical units by type)
  // ─────────────────────────────────────────────────────────────────
  'mcg/kg/min': {
    symbol: 'mcg/kg/min',
    name: 'Micrograms per kg per minute',
    category: 'rate',
    toCanonical: 1,
    canonicalUnit: 'mcg/kg/min',
    precision: 3,
    aliases: ['µg/kg/min', 'ug/kg/min', 'mcg/kg/minute'],
  },
  'mcg/kg/hr': {
    symbol: 'mcg/kg/hr',
    name: 'Micrograms per kg per hour',
    category: 'rate',
    toCanonical: 0.016667,    // divide by 60 → mcg/kg/min
    canonicalUnit: 'mcg/kg/min',
    precision: 2,
    aliases: ['µg/kg/hr', 'ug/kg/hr', 'mcg/kg/h'],
  },
  'mg/kg/min': {
    symbol: 'mg/kg/min',
    name: 'Milligrams per kg per minute',
    category: 'rate',
    toCanonical: 1000,        // → mcg/kg/min
    canonicalUnit: 'mcg/kg/min',
    precision: 4,
    aliases: ['mg/kg/minute'],
  },
  'mg/hr': {
    symbol: 'mg/hr',
    name: 'Milligrams per hour',
    category: 'rate',
    toCanonical: 1,
    canonicalUnit: 'mg/hr',
    precision: 2,
    aliases: ['mg/h', 'MG/HR', 'mg/hour'],
  },
  'mg/min': {
    symbol: 'mg/min',
    name: 'Milligrams per minute',
    category: 'rate',
    toCanonical: 60,          // → mg/hr
    canonicalUnit: 'mg/hr',
    precision: 2,
    aliases: ['mg/minute'],
  },
  'mcg/min': {
    symbol: 'mcg/min',
    name: 'Micrograms per minute',
    category: 'rate',
    toCanonical: 1,
    canonicalUnit: 'mcg/min',
    precision: 1,
    aliases: ['µg/min', 'ug/min', 'mcg/minute'],
  },
  'mcg/hr': {
    symbol: 'mcg/hr',
    name: 'Micrograms per hour',
    category: 'rate',
    toCanonical: 0.016667,    // → mcg/min
    canonicalUnit: 'mcg/min',
    precision: 1,
    aliases: ['µg/hr', 'ug/hr', 'mcg/h'],
  },
  'units/min': {
    symbol: 'units/min',
    name: 'Units per minute',
    category: 'rate',
    toCanonical: 1,
    canonicalUnit: 'units/min',
    precision: 3,
    aliases: ['U/min', 'u/min', 'unit/min'],
  },
  'units/hr': {
    symbol: 'units/hr',
    name: 'Units per hour',
    category: 'rate',
    toCanonical: 0.016667,    // → units/min
    canonicalUnit: 'units/min',
    precision: 2,
    aliases: ['U/hr', 'u/hr', 'unit/hr', 'units/h'],
  },
  'mL/hr': {
    symbol: 'mL/hr',
    name: 'Milliliters per hour',
    category: 'rate',
    toCanonical: 1,
    canonicalUnit: 'mL/hr',
    precision: 1,
    aliases: ['ml/hr', 'ml/h', 'mL/h', 'ML/HR'],
  },
  'mL/min': {
    symbol: 'mL/min',
    name: 'Milliliters per minute',
    category: 'rate',
    toCanonical: 60,          // → mL/hr
    canonicalUnit: 'mL/hr',
    precision: 2,
    aliases: ['ml/min', 'mL/minute'],
  },

  // ─────────────────────────────────────────────────────────────────
  // TEMPERATURE (canonical: °C, special formula)
  // ─────────────────────────────────────────────────────────────────
  '°C': {
    symbol: '°C',
    name: 'Degrees Celsius',
    category: 'temperature',
    toCanonical: 1,
    canonicalUnit: '°C',
    precision: 1,
    aliases: ['C', 'celsius', 'degC', 'Celsius'],
    isSpecialFormula: true,
  },
  '°F': {
    symbol: '°F',
    name: 'Degrees Fahrenheit',
    category: 'temperature',
    toCanonical: 1,
    canonicalUnit: '°C',
    precision: 1,
    aliases: ['F', 'fahrenheit', 'degF', 'Fahrenheit'],
    isSpecialFormula: true,
  },
  'K': {
    symbol: 'K',
    name: 'Kelvin',
    category: 'temperature',
    toCanonical: 1,
    canonicalUnit: '°C',
    precision: 1,
    aliases: ['kelvin', 'Kelvin', 'KELVIN'],
    isSpecialFormula: true,
  },

  // ─────────────────────────────────────────────────────────────────
  // VOLUME (canonical: L)
  // ─────────────────────────────────────────────────────────────────
  'L': {
    symbol: 'L',
    name: 'Liters',
    category: 'volume',
    toCanonical: 1,
    canonicalUnit: 'L',
    precision: 2,
    aliases: ['l', 'liter', 'liters', 'litre', 'litres'],
  },
  'mL': {
    symbol: 'mL',
    name: 'Milliliters',
    category: 'volume',
    toCanonical: 0.001,
    canonicalUnit: 'L',
    precision: 1,
    aliases: ['ml', 'cc', 'milliliter', 'milliliters', 'ML'],
  },
  'dL': {
    symbol: 'dL',
    name: 'Deciliters',
    category: 'volume',
    toCanonical: 0.1,
    canonicalUnit: 'L',
    precision: 2,
    aliases: ['dl', 'deciliter', 'deciliters'],
  },
  'µL': {
    symbol: 'µL',
    name: 'Microliters',
    category: 'volume',
    toCanonical: 0.000001,
    canonicalUnit: 'L',
    precision: 0,
    aliases: ['uL', 'ul', 'microliter'],
  },

  // ─────────────────────────────────────────────────────────────────
  // TIME (canonical: seconds)
  // ─────────────────────────────────────────────────────────────────
  's': {
    symbol: 's',
    name: 'Seconds',
    category: 'time',
    toCanonical: 1,
    canonicalUnit: 's',
    precision: 0,
    aliases: ['sec', 'second', 'seconds'],
  },
  'min': {
    symbol: 'min',
    name: 'Minutes',
    category: 'time',
    toCanonical: 60,
    canonicalUnit: 's',
    precision: 0,
    aliases: ['minute', 'minutes'],
  },
  'hr': {
    symbol: 'hr',
    name: 'Hours',
    category: 'time',
    toCanonical: 3600,
    canonicalUnit: 's',
    precision: 0,
    aliases: ['h', 'hour', 'hours'],
  },
  'd': {
    symbol: 'd',
    name: 'Days',
    category: 'time',
    toCanonical: 86400,
    canonicalUnit: 's',
    precision: 0,
    aliases: ['day', 'days'],
  },
};

/**
 * Molar masses (g/mol) for substance-specific molar conversions
 * Used when converting between mass-based and molar units
 */
export const MOLAR_MASSES: Record<string, number> = {
  creatinine: 113.12,
  glucose: 180.16,
  urea: 60.06,
  'blood urea nitrogen': 28.02,  // BUN (nitrogen portion of urea)
  bun: 28.02,
  bilirubin: 584.66,
  'direct bilirubin': 584.66,
  'indirect bilirubin': 584.66,
  cholesterol: 386.65,
  triglycerides: 885.43,
  sodium: 22.99,
  potassium: 39.10,
  chloride: 35.45,
  bicarbonate: 61.02,
  calcium: 40.08,
  magnesium: 24.31,
  phosphorus: 30.97,
  phosphate: 94.97,
  uricAcid: 168.11,
  'uric acid': 168.11,
  lactate: 90.08,
  'lactic acid': 90.08,
  albumin: 66500,
  hemoglobin: 64500,
  hba1c: 64500,
  iron: 55.845,
  'serum iron': 55.845,
  tibc: 55.845,
  ferritin: 450000,
  cortisol: 362.46,
  testosterone: 288.42,
  estradiol: 272.38,
  progesterone: 314.46,
  tsh: 28000,
  freeT4: 776.87,
  't4': 776.87,
  freeT3: 650.98,
  't3': 650.98,
  insulin: 5808,
  hcg: 36700,
  vitaminD: 384.64,
  'vitamin d': 384.64,
  'vitamin b12': 1355.37,
  folate: 441.40,
  'folic acid': 441.40,
  lithium: 6.94,
  digoxin: 780.95,
  phenytoin: 252.27,
  valproate: 166.19,
  cyclosporine: 1202.61,
  tacrolimus: 822.05,
  vancomycin: 1449.25,
  gentamicin: 477.60,
  amikacin: 585.60,
  methotrexate: 454.44,
  acetaminophen: 151.16,
  salicylate: 138.12,
  theophylline: 180.17,
  caffeine: 194.19,
  ethanol: 46.07,
  methanol: 32.04,
  acetone: 58.08,
};

/**
 * Build a reverse lookup from aliases to canonical symbol
 */
export const ALIAS_TO_SYMBOL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [symbol, def] of Object.entries(UNIT_REGISTRY)) {
    map[symbol.toLowerCase()] = symbol;
    for (const alias of def.aliases) {
      map[alias.toLowerCase()] = symbol;
    }
  }
  return map;
})();

/**
 * Resolve a user-supplied unit string to a canonical symbol in UNIT_REGISTRY
 */
export function resolveUnit(input: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.trim();
  // exact match first
  if (UNIT_REGISTRY[normalized]) return normalized;
  // alias lookup (case-insensitive)
  return ALIAS_TO_SYMBOL[normalized.toLowerCase()];
}

/**
 * Get all units belonging to a category
 */
export function getUnitsByCategory(category: UnitCategory): UnitDefinition[] {
  return Object.values(UNIT_REGISTRY).filter(
    (def) => def.category === category,
  );
}
