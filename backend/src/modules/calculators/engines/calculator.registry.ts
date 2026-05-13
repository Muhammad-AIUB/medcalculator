export type CalculatorCategory =
  | 'renal'
  | 'liver'
  | 'cardiac'
  | 'nutrition'
  | 'obstetric'
  | 'critical-care'
  | 'hematology';

export interface Reference {
  title: string;
  authors?: string;
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'required' | 'pattern' | 'custom';
  value?: number | string;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ClinicalRange {
  min: number;
  max: number;
  unit: string;
  warning: string;
}

export interface InputDefinition {
  id: string;
  label: string;
  type: 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  units?: string[];
  defaultUnit?: string;
  min?: number;
  max?: number;
  options?: SelectOption[];
  linkedConversions?: string[];
  validationRules: ValidationRule[];
  helpText?: string;
  clinicalRange?: ClinicalRange;
  placeholder?: string;
}

export interface OutputDefinition {
  id: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'classification' | 'score' | 'percentage';
  unit?: string;
  description?: string;
  interpretations?: Array<{
    range: { min?: number; max?: number };
    label: string;
    color: string;
    description?: string;
  }>;
}

export interface CalculatorMetadata {
  id: string;
  title: string;
  description: string;
  category: CalculatorCategory;
  tags: string[];
  version: string;
  references: Reference[];
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  clinicalNotes?: string[];
  warnings?: string[];
}

export interface CalculationInput {
  [key: string]: number | string | boolean | null | undefined;
}

export interface InterpretedValue {
  label: string;
  color: string;
  severity?: string;
  description?: string;
}

export interface CalculationOutput {
  [key: string]: number | string | boolean | null | undefined | InterpretedValue | object;
}

export interface CalculationResult {
  calculatorId: string;
  calculatorName: string;
  inputs: CalculationInput;
  outputs: CalculationOutput;
  warnings: string[];
  notes: string[];
  timestamp: string;
}

export interface ICalculator {
  metadata: CalculatorMetadata;
  calculate(inputs: CalculationInput): CalculationResult;
  validate(inputs: CalculationInput): string[];
}

/**
 * Calculator Registry — singleton map of all registered calculators
 */
export class CalculatorRegistry {
  private static instance: CalculatorRegistry;
  private readonly calculators = new Map<string, ICalculator>();

  static getInstance(): CalculatorRegistry {
    if (!CalculatorRegistry.instance) {
      CalculatorRegistry.instance = new CalculatorRegistry();
    }
    return CalculatorRegistry.instance;
  }

  register(calculator: ICalculator): void {
    this.calculators.set(calculator.metadata.id, calculator);
  }

  get(id: string): ICalculator | undefined {
    return this.calculators.get(id);
  }

  getAll(): ICalculator[] {
    return Array.from(this.calculators.values());
  }

  getAllMetadata(): CalculatorMetadata[] {
    return this.getAll().map((c) => c.metadata);
  }

  getByCategory(category: CalculatorCategory): ICalculator[] {
    return this.getAll().filter((c) => c.metadata.category === category);
  }

  has(id: string): boolean {
    return this.calculators.has(id);
  }
}
