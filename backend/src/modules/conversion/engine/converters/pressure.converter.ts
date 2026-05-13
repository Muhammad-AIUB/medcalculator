import { Injectable } from '@nestjs/common';
import { roundTo } from '../../../../common/utils/calculation.utils';

@Injectable()
export class PressureConverter {
  private readonly MMHG_PER_KPA = 7.50061683;
  private readonly MMHG_PER_CMH2O = 0.73555912;
  private readonly MMHG_PER_ATM = 760;
  private readonly MMHG_PER_PA = 0.00750062;

  toMmHg(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'mmhg': case 'torr': return value;
      case 'kpa': return value * this.MMHG_PER_KPA;
      case 'cmh2o': return value * this.MMHG_PER_CMH2O;
      case 'atm': return value * this.MMHG_PER_ATM;
      case 'pa': return value * this.MMHG_PER_PA;
      default: throw new Error(`Unknown pressure unit: ${unit}`);
    }
  }

  fromMmHg(mmhg: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'mmhg': case 'torr': return roundTo(mmhg, 0);
      case 'kpa': return roundTo(mmhg / this.MMHG_PER_KPA, 1);
      case 'cmh2o': return roundTo(mmhg / this.MMHG_PER_CMH2O, 1);
      case 'atm': return roundTo(mmhg / this.MMHG_PER_ATM, 4);
      case 'pa': return roundTo(mmhg / this.MMHG_PER_PA, 0);
      default: throw new Error(`Unknown pressure unit: ${unit}`);
    }
  }

  convertAll(value: number, fromUnit: string): Record<string, number> {
    const mmhg = this.toMmHg(value, fromUnit);
    return {
      mmHg: roundTo(mmhg, 0),
      kPa: roundTo(mmhg / this.MMHG_PER_KPA, 2),
      cmH2O: roundTo(mmhg / this.MMHG_PER_CMH2O, 1),
      atm: roundTo(mmhg / this.MMHG_PER_ATM, 4),
      Pa: roundTo(mmhg / this.MMHG_PER_PA, 0),
    };
  }
}
