/**
 * Concentration-specific conversion helpers
 * These handle common clinical chemistry conversions that are frequently needed
 */

import { Injectable } from '@nestjs/common';
import { roundTo } from '../../../../common/utils/calculation.utils';

export interface ConcentrationConversion {
  mgdl: number;
  mmolL: number;
  umolL: number;
  gL?: number;
  gdL?: number;
}

@Injectable()
export class ConcentrationConverter {
  /**
   * Convert glucose between common units
   * Molar mass of glucose: 180.16 g/mol
   */
  glucose(value: number, fromUnit: 'mg/dL' | 'mmol/L'): ConcentrationConversion {
    const MOLAR_MASS = 180.16;
    let mgdl: number;

    if (fromUnit === 'mg/dL') {
      mgdl = value;
    } else {
      mgdl = value * MOLAR_MASS / 10;
    }

    const mmolL = (mgdl * 10) / MOLAR_MASS;

    return {
      mgdl: roundTo(mgdl, 1),
      mmolL: roundTo(mmolL, 2),
      umolL: roundTo(mmolL * 1000, 0),
    };
  }

  /**
   * Convert creatinine between common units
   * Molar mass of creatinine: 113.12 g/mol
   * Commonly used conversion factor: 88.42 µmol/L per mg/dL
   */
  creatinine(value: number, fromUnit: 'mg/dL' | 'µmol/L' | 'umol/L'): ConcentrationConversion {
    const CONVERSION_FACTOR = 88.42; // µmol/L per mg/dL
    let mgdl: number;
    let umolL: number;

    if (fromUnit === 'mg/dL') {
      mgdl = value;
      umolL = value * CONVERSION_FACTOR;
    } else {
      umolL = value;
      mgdl = value / CONVERSION_FACTOR;
    }

    return {
      mgdl: roundTo(mgdl, 3),
      mmolL: roundTo(umolL / 1000, 4),
      umolL: roundTo(umolL, 1),
    };
  }

  /**
   * Convert bilirubin between common units
   * Molar mass of bilirubin: 584.66 g/mol
   * Commonly used: 1 mg/dL = 17.1 µmol/L
   */
  bilirubin(value: number, fromUnit: 'mg/dL' | 'µmol/L' | 'umol/L'): ConcentrationConversion {
    const CONVERSION_FACTOR = 17.1; // µmol/L per mg/dL
    let mgdl: number;
    let umolL: number;

    if (fromUnit === 'mg/dL') {
      mgdl = value;
      umolL = value * CONVERSION_FACTOR;
    } else {
      umolL = value;
      mgdl = value / CONVERSION_FACTOR;
    }

    return {
      mgdl: roundTo(mgdl, 2),
      mmolL: roundTo(umolL / 1000, 3),
      umolL: roundTo(umolL, 1),
    };
  }

  /**
   * Convert urea between BUN (blood urea nitrogen) and urea
   * BUN × 2.14 = Urea (mmol/L)
   * Or: BUN (mg/dL) / 2.8 = Urea (mmol/L)
   */
  urea(value: number, fromUnit: 'BUN mg/dL' | 'urea mmol/L' | 'urea mg/dL'): {
    bunMgdl: number;
    ureaMmolL: number;
    ureaMgdl: number;
  } {
    let bunMgdl: number;
    let ureaMmolL: number;
    let ureaMgdl: number;

    if (fromUnit === 'BUN mg/dL') {
      bunMgdl = value;
      ureaMmolL = roundTo(value / 2.8, 2);
      ureaMgdl = roundTo(value * 2.14, 1);
    } else if (fromUnit === 'urea mmol/L') {
      ureaMmolL = value;
      bunMgdl = roundTo(value * 2.8, 1);
      ureaMgdl = roundTo(value * 6.006, 1);
    } else {
      ureaMgdl = value;
      ureaMmolL = roundTo(value / 6.006, 2);
      bunMgdl = roundTo(value / 2.14, 1);
    }

    return { bunMgdl, ureaMmolL, ureaMgdl };
  }

  /**
   * Convert hemoglobin between g/dL and mmol/L
   * Molar mass of hemoglobin (tetramer): 64,500 g/mol
   * Conversion factor: 1 g/dL = 0.6206 mmol/L
   */
  hemoglobin(value: number, fromUnit: 'g/dL' | 'mmol/L'): {
    gdL: number;
    mmolL: number;
    gL: number;
  } {
    const FACTOR = 0.6206; // mmol/L per g/dL
    let gdL: number;
    let mmolL: number;

    if (fromUnit === 'g/dL') {
      gdL = value;
      mmolL = value * FACTOR;
    } else {
      mmolL = value;
      gdL = value / FACTOR;
    }

    return {
      gdL: roundTo(gdL, 1),
      mmolL: roundTo(mmolL, 2),
      gL: roundTo(gdL * 10, 0),
    };
  }
}
