import { BadRequestException, Injectable } from '@nestjs/common';
import {
  MOLAR_MASSES,
  UNIT_REGISTRY,
  UnitDefinition,
  resolveUnit,
  getUnitsByCategory,
  UnitCategory,
} from './conversion.registry';
import { roundTo } from '../../../common/utils/calculation.utils';

export interface ConversionResult {
  value: number;
  fromUnit: string;
  toUnit: string;
  fromDefinition: UnitDefinition;
  toDefinition: UnitDefinition;
  substance?: string;
  precision: number;
}

export interface ConvertAllResult {
  original: { value: number; unit: string };
  conversions: Array<{ value: number; unit: string; name: string; precision: number }>;
  category: UnitCategory;
  substance?: string;
}

@Injectable()
export class UnitNormalizer {

  /**
   * Convert a value from one unit to another.
   * Optionally specify a substance for molar mass conversions (e.g. 'creatinine').
   */
  convert(
    value: number,
    fromUnitInput: string,
    toUnitInput: string,
    substance?: string,
  ): ConversionResult {
    if (value === null || value === undefined || isNaN(value)) {
      throw new BadRequestException('Value must be a valid number');
    }

    const fromSymbol = resolveUnit(fromUnitInput);
    const toSymbol = resolveUnit(toUnitInput);

    if (!fromSymbol) {
      throw new BadRequestException(`Unknown unit: "${fromUnitInput}"`);
    }
    if (!toSymbol) {
      throw new BadRequestException(`Unknown unit: "${toUnitInput}"`);
    }

    if (fromSymbol === toSymbol) {
      return {
        value: roundTo(value, UNIT_REGISTRY[fromSymbol].precision),
        fromUnit: fromSymbol,
        toUnit: toSymbol,
        fromDefinition: UNIT_REGISTRY[fromSymbol],
        toDefinition: UNIT_REGISTRY[toSymbol],
        substance,
        precision: UNIT_REGISTRY[fromSymbol].precision,
      };
    }

    const fromDef = UNIT_REGISTRY[fromSymbol];
    const toDef = UNIT_REGISTRY[toSymbol];

    // Check for temperature — needs special formula
    const tempUnits = new Set(['°C', '°F', 'K']);
    if (tempUnits.has(fromSymbol) || tempUnits.has(toSymbol)) {
      if (!tempUnits.has(fromSymbol) || !tempUnits.has(toSymbol)) {
        throw new BadRequestException(
          'Cannot convert between temperature and non-temperature units',
        );
      }
      const converted = this.convertTemperature(value, fromSymbol, toSymbol);
      return {
        value: roundTo(converted, toDef.precision),
        fromUnit: fromSymbol,
        toUnit: toSymbol,
        fromDefinition: fromDef,
        toDefinition: toDef,
        substance,
        precision: toDef.precision,
      };
    }

    // Check if cross-canonical conversion is needed (e.g. mg/dL ↔ µmol/L — both concentration but different canonical)
    const needsMolarMass =
      fromDef.category === 'concentration' &&
      toDef.category === 'concentration' &&
      fromDef.canonicalUnit !== toDef.canonicalUnit;

    if (needsMolarMass) {
      if (!substance) {
        throw new BadRequestException(
          `Converting between "${fromSymbol}" and "${toSymbol}" requires a substance name (e.g. "creatinine") for molar mass lookup.`,
        );
      }
      const converted = this.convertWithMolarMass(
        value,
        fromSymbol,
        toSymbol,
        substance,
      );
      return {
        value: roundTo(converted, toDef.precision),
        fromUnit: fromSymbol,
        toUnit: toSymbol,
        fromDefinition: fromDef,
        toDefinition: toDef,
        substance,
        precision: toDef.precision,
      };
    }

    // Same canonical unit — simple factor conversion
    if (fromDef.category !== toDef.category) {
      throw new BadRequestException(
        `Cannot convert "${fromSymbol}" (${fromDef.category}) to "${toSymbol}" (${toDef.category}): incompatible categories`,
      );
    }
    if (fromDef.canonicalUnit !== toDef.canonicalUnit) {
      throw new BadRequestException(
        `Cannot directly convert "${fromSymbol}" to "${toSymbol}": different canonical units. Provide a substance for molar mass conversion.`,
      );
    }

    // canonical_value = value * fromDef.toCanonical
    // target_value = canonical_value / toDef.toCanonical
    const canonicalValue = value * fromDef.toCanonical;
    const result = canonicalValue / toDef.toCanonical;

    return {
      value: roundTo(result, toDef.precision),
      fromUnit: fromSymbol,
      toUnit: toSymbol,
      fromDefinition: fromDef,
      toDefinition: toDef,
      substance,
      precision: toDef.precision,
    };
  }

  /**
   * Convert to ALL units in the same category
   */
  convertAll(
    value: number,
    fromUnitInput: string,
    substance?: string,
  ): ConvertAllResult {
    const fromSymbol = resolveUnit(fromUnitInput);
    if (!fromSymbol) {
      throw new BadRequestException(`Unknown unit: "${fromUnitInput}"`);
    }

    const fromDef = UNIT_REGISTRY[fromSymbol];
    const categoryUnits = getUnitsByCategory(fromDef.category);

    const conversions: ConvertAllResult['conversions'] = [];

    for (const toDef of categoryUnits) {
      if (toDef.symbol === fromSymbol) continue;
      try {
        const result = this.convert(value, fromSymbol, toDef.symbol, substance);
        conversions.push({
          value: result.value,
          unit: toDef.symbol,
          name: toDef.name,
          precision: toDef.precision,
        });
      } catch {
        // Skip units that can't be converted without additional context
      }
    }

    return {
      original: { value, unit: fromSymbol },
      conversions,
      category: fromDef.category,
      substance,
    };
  }

  /**
   * Temperature conversion using formulas (not factors)
   */
  private convertTemperature(
    value: number,
    from: string,
    to: string,
  ): number {
    // First convert to Celsius as canonical
    let celsius: number;
    switch (from) {
      case '°C':
        celsius = value;
        break;
      case '°F':
        celsius = (value - 32) * (5 / 9);
        break;
      case 'K':
        celsius = value - 273.15;
        break;
      default:
        throw new BadRequestException(`Unknown temperature unit: ${from}`);
    }

    // Then convert from Celsius to target
    switch (to) {
      case '°C':
        return celsius;
      case '°F':
        return celsius * (9 / 5) + 32;
      case 'K':
        return celsius + 273.15;
      default:
        throw new BadRequestException(`Unknown temperature unit: ${to}`);
    }
  }

  /**
   * Molar mass based conversion (e.g. mg/dL ↔ µmol/L for creatinine)
   *
   * mg/dL → µmol/L:
   *   µmol/L = (mg/dL × 10 / molarMass) × 1000
   *          = mg/dL × 10000 / molarMass
   *
   * µmol/L → mg/dL:
   *   mg/dL = µmol/L × molarMass / 10000
   *
   * General approach:
   *  1) Convert from-unit to mg/L (mass-based, canonical g/L × 1000)
   *  2) Convert mg/L → mmol/L using molar mass (mg/L / molarMass = mmol/L)
   *  3) Convert mmol/L to target molar unit
   */
  private convertWithMolarMass(
    value: number,
    fromSymbol: string,
    toSymbol: string,
    substance: string,
  ): number {
    const substanceLower = substance.toLowerCase().trim();
    const molarMass = MOLAR_MASSES[substanceLower];
    if (!molarMass) {
      throw new BadRequestException(
        `Unknown substance "${substance}" for molar mass lookup. Supported substances: ${Object.keys(MOLAR_MASSES).join(', ')}`,
      );
    }

    const fromDef = UNIT_REGISTRY[fromSymbol];
    const toDef = UNIT_REGISTRY[toSymbol];

    const massCanonicals = new Set(['g/L']);

    const fromIsMass = massCanonicals.has(fromDef.canonicalUnit);
    const toIsMass = massCanonicals.has(toDef.canonicalUnit);

    let gPerL: number;

    if (fromIsMass) {
      // Convert from mass unit to g/L
      gPerL = value * fromDef.toCanonical;
    } else {
      // Convert from molar unit to mmol/L, then to g/L
      const mmolPerL = value * fromDef.toCanonical;
      gPerL = mmolPerL * molarMass; // mmol/L × g/mol = mg/L ... wait
      // mmol/L × (g/mol) = g/L × 1000 / 1000 — careful with units:
      // mmol/L = 1e-3 mol/L; × g/mol = 1e-3 g/L … so g/L = mmolPerL × molarMass × 1e-3
      gPerL = mmolPerL * molarMass * 0.001;
    }

    let result: number;

    if (toIsMass) {
      // g/L → target mass unit
      result = gPerL / toDef.toCanonical;
    } else {
      // g/L → mmol/L → target molar unit
      const mmolPerL = (gPerL / molarMass) * 1000; // g/L / (g/mol) = mol/L × 1000 = mmol/L
      result = mmolPerL / toDef.toCanonical;
    }

    return result;
  }

  /**
   * Quick helper: creatinine mg/dL → µmol/L
   */
  creatinineMgdlToUmolL(mgdl: number): number {
    return roundTo(mgdl * 88.42, 1);
  }

  /**
   * Quick helper: creatinine µmol/L → mg/dL
   */
  creatinineUmolLToMgdl(umolL: number): number {
    return roundTo(umolL / 88.42, 3);
  }

  /**
   * Quick helper: bilirubin µmol/L → mg/dL (molar mass 584.66 g/mol)
   */
  bilirubinUmolLToMgdl(umolL: number): number {
    return roundTo(umolL / 17.1, 2);
  }

  /**
   * Quick helper: bilirubin mg/dL → µmol/L
   */
  bilirubinMgdlToUmolL(mgdl: number): number {
    return roundTo(mgdl * 17.1, 1);
  }

  /**
   * Get all unit definitions for a category
   */
  getUnitsByCategory(category: UnitCategory) {
    return getUnitsByCategory(category);
  }

  /**
   * Get all available unit definitions
   */
  getAllUnits(): UnitDefinition[] {
    return Object.values(UNIT_REGISTRY);
  }

  /**
   * Resolve a unit string to its canonical symbol
   */
  resolveUnit(input: string): string | undefined {
    return resolveUnit(input);
  }
}
