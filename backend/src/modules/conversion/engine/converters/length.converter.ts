import { Injectable } from '@nestjs/common';
import { roundTo } from '../../../../common/utils/calculation.utils';

@Injectable()
export class LengthConverter {
  private readonly M_PER_FT = 0.3048;
  private readonly M_PER_IN = 0.0254;
  private readonly M_PER_CM = 0.01;
  private readonly M_PER_MM = 0.001;

  toMeters(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'm': return value;
      case 'cm': return value * this.M_PER_CM;
      case 'mm': return value * this.M_PER_MM;
      case 'ft': case 'feet': return value * this.M_PER_FT;
      case 'in': case 'inch': case 'inches': return value * this.M_PER_IN;
      default: throw new Error(`Unknown length unit: ${unit}`);
    }
  }

  fromMeters(meters: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'm': return roundTo(meters, 2);
      case 'cm': return roundTo(meters / this.M_PER_CM, 1);
      case 'mm': return roundTo(meters / this.M_PER_MM, 0);
      case 'ft': case 'feet': return roundTo(meters / this.M_PER_FT, 1);
      case 'in': case 'inch': case 'inches': return roundTo(meters / this.M_PER_IN, 1);
      default: throw new Error(`Unknown length unit: ${unit}`);
    }
  }

  /**
   * Parse feet+inches string like "5'10\"" or separate feet and inches values
   */
  feetInchesToMeters(feet: number, inches: number): number {
    return (feet * this.M_PER_FT) + (inches * this.M_PER_IN);
  }

  metersToFeetInches(meters: number): { feet: number; inches: number; display: string } {
    const totalInches = meters / this.M_PER_IN;
    const feet = Math.floor(totalInches / 12);
    const inches = roundTo(totalInches % 12, 1);
    return { feet, inches, display: `${feet}'${inches}"` };
  }

  convertAll(value: number, fromUnit: string): Record<string, number | object> {
    const meters = this.toMeters(value, fromUnit);
    const feetInches = this.metersToFeetInches(meters);
    return {
      m: roundTo(meters, 3),
      cm: roundTo(meters / this.M_PER_CM, 1),
      mm: roundTo(meters / this.M_PER_MM, 0),
      ft: roundTo(meters / this.M_PER_FT, 2),
      in: roundTo(meters / this.M_PER_IN, 1),
      feetAndInches: feetInches,
    };
  }
}
