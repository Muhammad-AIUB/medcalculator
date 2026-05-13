import { Injectable } from '@nestjs/common';
import {
  UNIT_REGISTRY,
  MOLAR_MASSES,
  getUnitsByCategory,
  UnitCategory,
  UnitDefinition,
} from './conversion.registry';

export type { UnitCategory };

/**
 * ConversionRegistryService
 * NestJS injectable wrapper over the static UNIT_REGISTRY constants.
 */
@Injectable()
export class ConversionRegistryService {
  getAllUnits(): Record<string, UnitDefinition> {
    return UNIT_REGISTRY;
  }

  getUnitsByCategory(category: UnitCategory): UnitDefinition[] {
    return getUnitsByCategory(category);
  }

  getCategories(): { id: string; label: string; count: number }[] {
    const cats = new Map<string, number>();
    for (const unit of Object.values(UNIT_REGISTRY)) {
      cats.set(unit.category, (cats.get(unit.category) ?? 0) + 1);
    }
    return Array.from(cats.entries()).map(([id, count]) => ({
      id,
      label: id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));
  }

  getMolarMasses(): Record<string, number> {
    return MOLAR_MASSES;
  }

  hasUnit(symbol: string): boolean {
    return symbol in UNIT_REGISTRY;
  }
}
