import { describe, expect, it } from 'vitest'
import { MOLAR_MASSES } from './unit-registry'
import {
  MedicalUnitConverter,
  albuminConvert,
  bilirubinConvert,
  creatinineConvert,
  heightConvert,
  weightConvert,
} from './converter'

/**
 * Unit conversion is the highest-consequence arithmetic in the app: a factor that
 * is off by ten reports a different patient.
 *
 * The three converters the calculators actually call (creatinine, bilirubin,
 * albumin) are pinned here against the standard clinical factors. The generic
 * substance path is pinned too — it is not wired into any form today, but it sat
 * with a 100x error in both directions (88.4 µmol/L of creatinine converting back
 * to 100 mg/dL instead of 1.0), which is exactly what these tests exist to stop.
 */

describe('creatinine', () => {
  // The standard factor is 10000 / 113.12 = 88.4 µmol/L per mg/dL.
  it('converts 1.0 mg/dL to 88.4 µmol/L', () => {
    expect(creatinineConvert(1.0, 'mg/dL')).toBeCloseTo(88.4, 1)
  })

  it('converts 88.4 µmol/L back to 1.0 mg/dL', () => {
    expect(creatinineConvert(88.4, 'µmol/L')).toBeCloseTo(1.0, 2)
  })

  // 1.2 mg/dL is the worked example in the eGFR tests; the form shows 106.1.
  it('converts 1.2 mg/dL to 106.1 µmol/L', () => {
    expect(creatinineConvert(1.2, 'mg/dL')).toBe(106.1)
  })

  it('round-trips within a hundredth of a mg/dL', () => {
    for (const mgdl of [0.4, 0.8, 1.2, 2.5, 5.0, 10.0]) {
      const back = creatinineConvert(creatinineConvert(mgdl, 'mg/dL'), 'µmol/L')
      expect(back).toBeCloseTo(mgdl, 2)
    }
  })
})

describe('bilirubin', () => {
  // The standard factor is 10000 / 584.66 = 17.10 µmol/L per mg/dL.
  it('converts 1.0 mg/dL to 17.1 µmol/L', () => {
    expect(bilirubinConvert(1.0, 'mg/dL')).toBeCloseTo(17.1, 1)
  })

  // 20 mg/dL, the MELD-relevant end of the range, is 342 µmol/L.
  it('converts 20 mg/dL to 342 µmol/L', () => {
    expect(bilirubinConvert(20, 'mg/dL')).toBe(342)
  })

  it('round-trips within a hundredth of a mg/dL', () => {
    for (const mgdl of [0.5, 1.0, 3.0, 12.0, 35.0]) {
      const back = bilirubinConvert(bilirubinConvert(mgdl, 'mg/dL'), 'µmol/L')
      expect(back).toBeCloseTo(mgdl, 2)
    }
  })
})

describe('albumin, weight and height', () => {
  it('converts albumin between g/dL and g/L by a factor of ten', () => {
    expect(albuminConvert(3.5, 'g/dL')).toBe(35)
    expect(albuminConvert(35, 'g/L')).toBe(3.5)
  })

  it('converts weight between kg and lb', () => {
    expect(weightConvert(70, 'kg')).toBe(154.3) // 70 × 2.20462
    expect(weightConvert(154.3, 'lb')).toBeCloseTo(70, 1)
  })

  it('converts height without losing the foot/inch split', () => {
    const h = heightConvert(180, 'cm')
    expect(h.cm).toBe(180)
    expect(h.m).toBe(1.8)
    expect(h.in).toBe(70.9) // 180 / 2.54
    expect(h.ft).toBe(5)
    expect(h.remaining_in).toBeCloseTo(10.9, 1)
  })
})

describe('generic mass ↔ molar conversion', () => {
  const convert = (v: number, from: string, to: string, substance: string) =>
    MedicalUnitConverter.convert(v, from, to, substance)

  // Same numbers as the dedicated creatinine/bilirubin helpers above — the two
  // paths must not disagree, since that is how a 100x error hid in plain sight.
  it('agrees with creatinineConvert', () => {
    expect(convert(1.0, 'mg/dL', 'µmol/L', 'creatinine')).toBeCloseTo(88.4, 1)
    expect(convert(88.4, 'µmol/L', 'mg/dL', 'creatinine')).toBeCloseTo(1.0, 2)
  })

  it('agrees with bilirubinConvert', () => {
    expect(convert(1.0, 'mg/dL', 'µmol/L', 'bilirubin')).toBeCloseTo(17.1, 1)
    expect(convert(17.1, 'µmol/L', 'mg/dL', 'bilirubin')).toBeCloseTo(1.0, 2)
  })

  // Glucose: 10000 / 180.16 = 55.5 µmol/L per mg/dL, i.e. the familiar
  // mg/dL ÷ 18 = mmol/L.
  it('converts glucose 90 mg/dL to 5.0 mmol/L', () => {
    expect(convert(90, 'mg/dL', 'mmol/L', 'glucose')).toBeCloseTo(5.0, 1)
  })

  // Serum iron is reported in µg/dL: 10 µg/dL = 0.1 mg/dL, and
  // 10000 / 55.85 = 179.1 µmol/L per mg/dL, so the factor is 0.179.
  it('converts serum iron 100 µg/dL to 17.9 µmol/L', () => {
    expect(convert(100, 'µg/dL', 'µmol/L', 'iron')).toBeCloseTo(17.9, 1)
  })

  it('round-trips every substance it knows a molar mass for', () => {
    for (const substance of Object.keys(MOLAR_MASSES)) {
      const there = convert(10, 'mg/dL', 'µmol/L', substance)
      const back = convert(there, 'µmol/L', 'mg/dL', substance)
      // Rounding to each unit's declared precision costs a little on the way, so
      // allow a tenth of a mg/dL rather than demanding an exact round-trip.
      expect(back, `${substance} round-trip: 10 -> ${there} -> ${back}`).toBeCloseTo(10, 1)
    }
  })

  it('leaves a same-unit conversion untouched', () => {
    expect(convert(1.23, 'mg/dL', 'mg/dL', 'creatinine')).toBe(1.23)
  })

  it('returns 0 rather than NaN for a non-finite input', () => {
    expect(convert(NaN, 'mg/dL', 'µmol/L', 'creatinine')).toBe(0)
    expect(convert(Infinity, 'mg/dL', 'µmol/L', 'creatinine')).toBe(0)
  })
})

describe('temperature', () => {
  it('converts the clinically important points', () => {
    expect(MedicalUnitConverter.convert(37, '°C', '°F')).toBe(98.6)
    expect(MedicalUnitConverter.convert(98.6, '°F', '°C')).toBe(37)
    expect(MedicalUnitConverter.convert(0, '°C', '°F')).toBe(32)
    expect(MedicalUnitConverter.convert(40, '°C', '°F')).toBe(104)
  })
})
