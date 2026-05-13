import { Injectable } from '@nestjs/common';
import { roundTo } from '../../../../common/utils/calculation.utils';

@Injectable()
export class WeightConverter {
  private readonly KG_PER_LB = 0.45359237;
  private readonly KG_PER_ST = 6.35029318;
  private readonly KG_PER_OZ = 0.028349523;

  toKg(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'kg': return value;
      case 'lb': case 'lbs': return value * this.KG_PER_LB;
      case 'g': return value * 0.001;
      case 'oz': return value * this.KG_PER_OZ;
      case 'st': return value * this.KG_PER_ST;
      default: throw new Error(`Unknown weight unit: ${unit}`);
    }
  }

  fromKg(kg: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'kg': return roundTo(kg, 2);
      case 'lb': case 'lbs': return roundTo(kg / this.KG_PER_LB, 1);
      case 'g': return roundTo(kg * 1000, 0);
      case 'oz': return roundTo(kg / this.KG_PER_OZ, 1);
      case 'st': return roundTo(kg / this.KG_PER_ST, 2);
      default: throw new Error(`Unknown weight unit: ${unit}`);
    }
  }

  convertAll(value: number, fromUnit: string): Record<string, number> {
    const kg = this.toKg(value, fromUnit);
    return {
      kg: roundTo(kg, 2),
      lb: roundTo(kg / this.KG_PER_LB, 1),
      g: roundTo(kg * 1000, 0),
      oz: roundTo(kg / this.KG_PER_OZ, 1),
      st: roundTo(kg / this.KG_PER_ST, 2),
    };
  }
}
