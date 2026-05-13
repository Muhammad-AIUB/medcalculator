import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CalculationInput, CalculationResult, CalculatorMetadata, CalculatorRegistry } from './calculator.registry';

/**
 * FormulaEngine
 *
 * Thin orchestration layer over the singleton CalculatorRegistry.
 * Handles validation, logging, and error propagation.
 * All calculators register themselves when their module file is imported
 * (side-effect pattern via calculators/index.ts).
 */
@Injectable()
export class FormulaEngine {
  private readonly logger = new Logger(FormulaEngine.name);

  /** Always use the singleton — ensures auto-registered calculators are visible. */
  private get registry(): CalculatorRegistry {
    return CalculatorRegistry.getInstance();
  }

  calculate(calculatorId: string, inputs: CalculationInput): CalculationResult {
    const calculator = this.registry.get(calculatorId);
    if (!calculator) {
      const available = this.registry.getAll().map((c) => c.metadata.id).join(', ');
      throw new NotFoundException(
        `Calculator "${calculatorId}" not found. Available: ${available}`,
      );
    }

    const validationErrors = calculator.validate(inputs);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
    }

    const result = calculator.calculate(inputs);
    this.logger.debug(
      `[${calculatorId}] calculated — outputs: ${Object.keys(result.outputs).join(', ')}`,
    );
    return result;
  }

  getMetadata(calculatorId: string): CalculatorMetadata {
    const calculator = this.registry.get(calculatorId);
    if (!calculator) {
      throw new NotFoundException(`Calculator "${calculatorId}" not found`);
    }
    return calculator.metadata;
  }

  getAllMetadata(): CalculatorMetadata[] {
    return this.registry.getAllMetadata();
  }

  listIds(): string[] {
    return this.registry.getAll().map((c) => c.metadata.id);
  }
}
