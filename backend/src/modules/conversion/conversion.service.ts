import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UnitNormalizer } from './engine/unit.normalizer';
import { ConversionRegistryService } from './engine/conversion-registry.service';
import {
  ConvertDto,
  ConvertAllDto,
  ConversionResultDto,
  ConvertAllResultDto,
} from './dto/convert.dto';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    private readonly normalizer: UnitNormalizer,
    private readonly registry: ConversionRegistryService,
  ) {}

  convert(dto: ConvertDto): ConversionResultDto {
    try {
      // UnitNormalizer.convert returns a ConversionResult object { value, fromUnit, toUnit, ... }
      const result = this.normalizer.convert(
        dto.value,
        dto.fromUnit,
        dto.toUnit,
        dto.substance,
      ) as any;

      const convertedValue: number =
        typeof result === 'number' ? result : result?.value ?? result;

      return {
        originalValue: dto.value,
        originalUnit: dto.fromUnit,
        convertedValue,
        convertedUnit: dto.toUnit,
        substance: dto.substance,
      };
    } catch (err) {
      this.logger.error(`Conversion error: ${err.message}`);
      throw new BadRequestException(
        `Cannot convert from '${dto.fromUnit}' to '${dto.toUnit}': ${err.message}`,
      );
    }
  }

  convertAll(dto: ConvertAllDto): ConvertAllResultDto {
    try {
      const result = this.normalizer.convertAll(
        dto.value,
        dto.fromUnit,
        dto.substance,
      ) as any;

      let allValues: Record<string, number>;

      if (result && typeof result === 'object' && 'conversions' in result) {
        // ConvertAllResult with conversions array
        allValues = { [dto.fromUnit]: dto.value };
        for (const c of result.conversions ?? []) {
          allValues[c.unit] = c.value;
        }
      } else if (result && typeof result === 'object') {
        allValues = result as Record<string, number>;
      } else {
        allValues = { [dto.fromUnit]: dto.value };
      }

      return {
        originalValue: dto.value,
        originalUnit: dto.fromUnit,
        allValues,
      };
    } catch (err) {
      this.logger.error(`ConvertAll error: ${err.message}`);
      throw new BadRequestException(`Conversion failed: ${err.message}`);
    }
  }

  // Static registry data — memoize so repeated reads don't rebuild it.
  private cachedAllUnits?: ReturnType<ConversionRegistryService['getAllUnits']>;
  private cachedCategories?: ReturnType<ConversionRegistryService['getCategories']>;

  getAllUnits() {
    return (this.cachedAllUnits ??= this.registry.getAllUnits());
  }

  getUnitsByCategory(category: string) {
    try {
      const units = this.registry.getUnitsByCategory(category as any);
      if (!units || units.length === 0) {
        throw new BadRequestException(`Unknown or empty category: '${category}'`);
      }
      return units;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Unknown category: '${category}'`);
    }
  }

  getCategories() {
    return (this.cachedCategories ??= this.registry.getCategories());
  }
}
