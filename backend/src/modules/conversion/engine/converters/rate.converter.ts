import { Injectable } from '@nestjs/common';
import { roundTo } from '../../../../common/utils/calculation.utils';

export interface VasopressorRate {
  drug: string;
  dose: number;
  unit: 'mcg/kg/min' | 'mcg/min' | 'mg/hr' | 'units/min' | 'units/hr' | 'mL/hr';
  weightKg?: number;
  concentration?: number;  // mg/mL for computing mL/hr
  concentrationUnit?: string;
}

export interface NormalizedRate {
  drug: string;
  mcgPerKgPerMin?: number;
  mcgPerMin?: number;
  mgPerHr?: number;
  mLPerHr?: number;
  originalDose: number;
  originalUnit: string;
}

@Injectable()
export class RateConverter {
  /**
   * Normalize vasopressor rate to mcg/kg/min
   */
  toMcgPerKgPerMin(
    dose: number,
    unit: string,
    weightKg: number,
  ): number {
    switch (unit.toLowerCase()) {
      case 'mcg/kg/min':
      case 'µg/kg/min':
      case 'ug/kg/min':
        return dose;
      case 'mcg/kg/hr':
      case 'µg/kg/hr':
        return dose / 60;
      case 'mcg/min':
      case 'µg/min':
        return dose / weightKg;
      case 'mcg/hr':
      case 'µg/hr':
        return dose / (weightKg * 60);
      case 'mg/hr':
        return (dose * 1000) / (weightKg * 60);
      case 'mg/min':
        return (dose * 1000) / weightKg;
      default:
        throw new Error(`Cannot convert rate unit "${unit}" to mcg/kg/min`);
    }
  }

  /**
   * Vasopressin: convert units/min to standard reporting
   */
  vasopressinUnitsPerMin(unitsPerMin: number): {
    unitsPerMin: number;
    unitsPerHr: number;
    display: string;
  } {
    return {
      unitsPerMin: roundTo(unitsPerMin, 4),
      unitsPerHr: roundTo(unitsPerMin * 60, 2),
      display: `${roundTo(unitsPerMin * 60, 2)} units/hr`,
    };
  }

  /**
   * Calculate mL/hr from dose rate, weight, and concentration
   */
  calcMlPerHr(params: {
    dosePerKgPerMin: number;  // mcg/kg/min
    weightKg: number;
    concentrationMgPerMl: number;
  }): number {
    const { dosePerKgPerMin, weightKg, concentrationMgPerMl } = params;
    // mcg/kg/min × kg × 60 min/hr = mcg/hr / 1000 = mg/hr / concentration = mL/hr
    const mgPerHr = (dosePerKgPerMin * weightKg * 60) / 1000;
    return roundTo(mgPerHr / concentrationMgPerMl, 1);
  }
}
