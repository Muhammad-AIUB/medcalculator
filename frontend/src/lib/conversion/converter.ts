import { UNIT_REGISTRY, MOLAR_MASSES, findUnit, SUBSTANCE_UNIT_PAIRS } from './unit-registry'

export class MedicalUnitConverter {
  /**
   * Convert a value from one unit to another.
   * Handles substance-specific (molar mass) conversions automatically.
   */
  static convert(value: number, fromUnit: string, toUnit: string, substance?: string): number {
    if (fromUnit === toUnit) return value
    if (isNaN(value) || !isFinite(value)) return 0

    // Temperature is non-linear
    if (this.isTemperatureUnit(fromUnit) || this.isTemperatureUnit(toUnit)) {
      return this.convertTemperature(value, fromUnit, toUnit)
    }

    // Substance-specific: mass ↔ molar
    if (substance && MOLAR_MASSES[substance]) {
      const substancePair = SUBSTANCE_UNIT_PAIRS[substance]
      if (substancePair) {
        return this.convertSubstance(value, fromUnit, toUnit, substance)
      }
    }

    // Auto-detect substance from unit pair
    if (this.isMassConc(fromUnit) && this.isMolarConc(toUnit)) {
      if (substance && MOLAR_MASSES[substance]) {
        return this.convertSubstance(value, fromUnit, toUnit, substance)
      }
    }
    if (this.isMolarConc(fromUnit) && this.isMassConc(toUnit)) {
      if (substance && MOLAR_MASSES[substance]) {
        return this.convertSubstance(value, fromUnit, toUnit, substance)
      }
    }

    const from = findUnit(fromUnit)
    const to = findUnit(toUnit)

    if (!from || !to) {
      console.warn(`Unknown unit: ${!from ? fromUnit : toUnit}`)
      return value
    }

    if (from.category !== to.category) {
      // Cross-category: try substance conversion
      if (substance && MOLAR_MASSES[substance]) {
        return this.convertSubstance(value, fromUnit, toUnit, substance)
      }
      console.warn(`Cannot convert between ${from.category} and ${to.category} without substance`)
      return value
    }

    // Convert via canonical unit
    const canonical = typeof from.toCanonical === 'function'
      ? from.toCanonical(value)
      : value * from.toCanonical

    const result = typeof to.toCanonical === 'function'
      ? (to.fromCanonical ? to.fromCanonical(canonical) : canonical)
      : canonical / to.toCanonical

    return this.round(result, to.precision)
  }

  /**
   * Get all equivalent values across all units in compatible categories.
   */
  static convertAll(value: number, fromUnit: string, substance?: string): Record<string, number> {
    const from = findUnit(fromUnit)
    if (!from) return {}

    const results: Record<string, number> = { [fromUnit]: value }
    const targetCategories = this.getCompatibleCategories(from.category, substance)

    for (const [symbol, unit] of Object.entries(UNIT_REGISTRY)) {
      if (symbol === fromUnit) continue
      if (!targetCategories.includes(unit.category)) continue

      try {
        const converted = this.convert(value, fromUnit, symbol, substance)
        if (isFinite(converted) && !isNaN(converted)) {
          results[symbol] = converted
        }
      } catch {
        // Skip unconvertible units
      }
    }

    return results
  }

  private static getCompatibleCategories(
    category: string,
    substance?: string
  ): string[] {
    if (substance && MOLAR_MASSES[substance]) {
      if (category === 'concentration-mass') return ['concentration-mass', 'concentration-molar']
      if (category === 'concentration-molar') return ['concentration-molar', 'concentration-mass']
    }
    return [category]
  }

  private static isTemperatureUnit(unit: string): boolean {
    return ['°C', '°F', 'K', 'C', 'F', 'celsius', 'fahrenheit'].includes(unit)
  }

  private static isMassConc(unit: string): boolean {
    const u = findUnit(unit)
    return u?.category === 'concentration-mass'
  }

  private static isMolarConc(unit: string): boolean {
    const u = findUnit(unit)
    return u?.category === 'concentration-molar'
  }

  private static convertTemperature(value: number, from: string, to: string): number {
    const fromUnit = findUnit(from)
    const toUnit = findUnit(to)
    if (!fromUnit || !toUnit) return value

    // Convert to Celsius (canonical)
    const celsius = typeof fromUnit.toCanonical === 'function'
      ? fromUnit.toCanonical(value)
      : value * (fromUnit.toCanonical as number)

    // Convert from Celsius to target
    if (toUnit.fromCanonical) {
      return this.round(toUnit.fromCanonical(celsius), toUnit.precision)
    }
    return this.round(celsius, toUnit.precision)
  }

  private static convertSubstance(
    value: number,
    fromUnit: string,
    toUnit: string,
    substance: string
  ): number {
    const molarMass = MOLAR_MASSES[substance]
    if (!molarMass) return value

    const from = findUnit(fromUnit)
    const to = findUnit(toUnit)
    if (!from || !to) return value

    // First convert to canonical within its own category
    let inFromCanonical: number
    if (typeof from.toCanonical === 'function') {
      inFromCanonical = from.toCanonical(value)
    } else {
      inFromCanonical = value * from.toCanonical
    }

    // Cross-category conversion runs through the two canonical units: mg/dL for
    // concentration-mass, µmol/L for concentration-molar.
    //
    //   mg/dL → g/dL (÷1000) → g/L (×10) → mol/L (÷M) → µmol/L (×1e6)
    //     = mg/dL × 10000 / M
    //
    // For creatinine (M = 113.12) that is ×88.40, and for bilirubin (M = 584.66)
    // ×17.10 — the factors creatinineConvert and bilirubinConvert already use, which
    // is what pins this down. An earlier derivation here converted litres to
    // decilitres by multiplying by 10 instead of 0.1 and came out 100× wrong in both
    // directions (88.4 µmol/L of creatinine read back as 100 mg/dL rather than 1.0).
    const UMOL_PER_L_PER_MG_PER_DL = 10000

    let mgPerDL: number
    if (from.category === 'concentration-mass') {
      // Canonical for concentration-mass is already mg/dL.
      mgPerDL = inFromCanonical
    } else if (from.category === 'concentration-molar') {
      // Canonical for concentration-molar is µmol/L.
      mgPerDL = (inFromCanonical * molarMass) / UMOL_PER_L_PER_MG_PER_DL
    } else {
      return value
    }

    if (to.category === 'concentration-mass') {
      const result = mgPerDL / (to.toCanonical as number)
      return this.round(result, to.precision)
    } else if (to.category === 'concentration-molar') {
      const umolPerL = (mgPerDL * UMOL_PER_L_PER_MG_PER_DL) / molarMass
      const result = umolPerL / (to.toCanonical as number)
      return this.round(result, to.precision)
    }

    return value
  }

  static round(value: number, precision: number): number {
    if (!isFinite(value) || isNaN(value)) return 0
    const factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
  }

  static format(value: number, unit: string): string {
    const unitDef = findUnit(unit)
    const precision = unitDef?.precision ?? 2
    return `${this.round(value, precision)} ${unit}`
  }
}

// Convenience functions
export function convert(value: number, from: string, to: string, substance?: string): number {
  return MedicalUnitConverter.convert(value, from, to, substance)
}

export function convertAll(value: number, fromUnit: string, substance?: string): Record<string, number> {
  return MedicalUnitConverter.convertAll(value, fromUnit, substance)
}

// Specific clinical conversions
export function creatinineConvert(value: number, from: 'mg/dL' | 'µmol/L'): number {
  if (from === 'mg/dL') return MedicalUnitConverter.round(value * 88.42, 1)
  return MedicalUnitConverter.round(value / 88.42, 2)
}

export function bilirubinConvert(value: number, from: 'mg/dL' | 'µmol/L'): number {
  if (from === 'mg/dL') return MedicalUnitConverter.round(value * 17.1, 1)
  return MedicalUnitConverter.round(value / 17.1, 2)
}

export function albuminConvert(value: number, from: 'g/dL' | 'g/L'): number {
  if (from === 'g/dL') return MedicalUnitConverter.round(value * 10, 1)
  return MedicalUnitConverter.round(value / 10, 2)
}

export function weightConvert(value: number, from: 'kg' | 'lb'): number {
  if (from === 'kg') return MedicalUnitConverter.round(value * 2.20462, 1)
  return MedicalUnitConverter.round(value * 0.453592, 1)
}

export function heightConvert(value: number, from: 'cm' | 'm' | 'in'): Record<string, number> {
  let cm: number
  if (from === 'cm') cm = value
  else if (from === 'm') cm = value * 100
  else cm = value * 2.54

  return {
    cm: MedicalUnitConverter.round(cm, 1),
    m: MedicalUnitConverter.round(cm / 100, 2),
    in: MedicalUnitConverter.round(cm / 2.54, 1),
    ft: MedicalUnitConverter.round(Math.floor(cm / 30.48), 0),
    remaining_in: MedicalUnitConverter.round((cm / 2.54) % 12, 1),
  }
}
