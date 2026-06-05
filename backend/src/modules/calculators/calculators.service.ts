import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CalculatorRegistry } from './engines/calculator.registry';
import { FormulaEngine } from './engines/formula.engine';
import { CalculateDto, BatchCalculateDto } from './dto/calculate.dto';

@Injectable()
export class CalculatorsService {
  private readonly logger = new Logger(CalculatorsService.name);
  private readonly registry = CalculatorRegistry.getInstance();

  // The registry is a startup-built singleton, so these projections never
  // change at runtime — compute them once and reuse across all requests.
  private cachedCalculators?: ReturnType<CalculatorsService['buildAllCalculators']>;
  private cachedCategories?: ReturnType<CalculatorsService['buildCategories']>;

  constructor(private readonly formulaEngine: FormulaEngine) {}

  getAllCalculators() {
    return (this.cachedCalculators ??= this.buildAllCalculators());
  }

  private buildAllCalculators() {
    return this.registry.getAllMetadata().map((meta) => ({
      id: meta.id,
      title: meta.title,
      description: meta.description,
      category: meta.category,
      tags: meta.tags,
      version: meta.version,
      references: meta.references,
      inputs: meta.inputs,
      outputs: meta.outputs,
      clinicalNotes: meta.clinicalNotes,
      warnings: meta.warnings,
    }));
  }

  getCalculatorById(id: string) {
    const calc = this.registry.get(id);
    if (!calc) {
      throw new NotFoundException(`Calculator '${id}' not found`);
    }
    return calc.metadata;
  }

  async calculate(dto: CalculateDto) {
    if (!this.registry.has(dto.calculatorId)) {
      throw new NotFoundException(`Calculator '${dto.calculatorId}' not found`);
    }

    // Merge unit hints into inputs
    const enrichedInputs = { ...dto.inputs };
    if (dto.units) {
      for (const [field, unit] of Object.entries(dto.units)) {
        enrichedInputs[`${field}Unit`] = unit;
      }
    }
    if (dto.formula) {
      enrichedInputs['formula'] = dto.formula;
    }

    try {
      const result = this.formulaEngine.calculate(dto.calculatorId, enrichedInputs);
      this.logger.log(
        `Calculated ${dto.calculatorId} → ${JSON.stringify(
          Object.entries(result.outputs)
            .filter(([, v]) => typeof v === 'number')
            .slice(0, 3)
            .map(([k, v]) => `${k}=${v}`)
        )}`
      );
      return result;
    } catch (err) {
      this.logger.error(`Calculation error for ${dto.calculatorId}: ${err.message}`);
      throw new BadRequestException(`Calculation failed: ${err.message}`);
    }
  }

  async batchCalculate(dto: BatchCalculateDto) {
    return Promise.all(dto.calculations.map((c) => this.calculate(c)));
  }

  getCategories() {
    return (this.cachedCategories ??= this.buildCategories());
  }

  private buildCategories() {
    const all = this.registry.getAllMetadata();
    const categories = [...new Set(all.map((c) => c.category))];
    return categories.map((cat) => ({
      id: cat,
      label: cat.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      calculators: all
        .filter((c) => c.category === cat)
        .map((c) => ({ id: c.id, title: c.title })),
    }));
  }
}
