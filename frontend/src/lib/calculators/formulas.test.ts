import { describe, expect, it } from 'vitest'
import { calculateAnionGap } from './anion-gap'
import { calculateBMI } from './bmi'
import { calculateBSA } from './bsa'
import { calculateCalciumCorrection } from './calcium-correction'
import { calculateCockcroftGault } from './cockcroft-gault'
import { calculateEGFR } from './egfr'
import { calculateLDL } from './ldl'
import { calculateMAP } from './map'
import { calculateMeldCombined } from './meld-combined'
import { calculateQTc } from './qtc'
import { calculateShockIndex } from './shock-index'
import { calculateURR } from './urr'

/**
 * Arithmetic guard for the closed-form calculators.
 *
 * Every expectation here is worked through by hand in the comment above it, so
 * a failure says either "the formula changed" or "the rounding changed" rather
 * than "the snapshot moved". Only calculators whose equation is published as a
 * formula are covered — the nomogram-derived and points-table scores are not
 * something an independent hand calculation can confirm.
 */

describe('mean arterial pressure', () => {
  // MAP = SBP/3 + 2·DBP/3 = 40 + 53.333 = 93.333, shown to 1 dp
  it('120/80 gives 93.3', () => {
    expect(calculateMAP({ sbp: 120, dbp: 80 }).map).toBe(93.3)
  })

  // 90/60: 30 + 40 = 70
  it('90/60 gives 70', () => {
    expect(calculateMAP({ sbp: 90, dbp: 60 }).map).toBe(70)
  })

  // Below 60 mmHg is the perfusion threshold the interpretation keys off.
  it('flags a MAP below 60 as dangerous', () => {
    expect(calculateMAP({ sbp: 70, dbp: 40 }).severity).toBe('danger')
    expect(calculateMAP({ sbp: 90, dbp: 60 }).severity).toBe('success')
  })
})

describe('body surface area (Mosteller)', () => {
  // √(180 × 70 / 3600) = √3.5 = 1.8708, shown to 2 dp
  it('180 cm / 70 kg gives 1.87 m2', () => {
    expect(calculateBSA({ heightCm: 180, weightKg: 70 }).bsa).toBe(1.87)
  })

  // √(100 × 36 / 3600) = √1 = 1 exactly
  it('lands on exactly 1 m2 at 100 cm / 36 kg', () => {
    expect(calculateBSA({ heightCm: 100, weightKg: 36 }).bsa).toBe(1)
  })
})

describe('body mass index', () => {
  // 70 / 1.8^2 = 70 / 3.24 = 21.605, shown to 1 dp
  it('180 cm / 70 kg gives 21.6', () => {
    expect(calculateBMI({ heightCm: 180, weightKg: 70 }).score).toBe(21.6)
  })

  // Same subject, so the Mosteller BSA carried in the sub-results must agree
  // with the standalone BSA calculator.
  it('agrees with the BSA calculator on the same subject', () => {
    const bmi = calculateBMI({ heightCm: 180, weightKg: 70 })
    const bsa = calculateBSA({ heightCm: 180, weightKg: 70 })
    const bsaSub = bmi.subResults?.find((s) => s.label === 'Body Surface Area')
    expect(bsaSub?.value).toBe(bsa.bsa)
  })

  it('refuses to score a zero height or weight', () => {
    expect(calculateBMI({ heightCm: 0, weightKg: 70 }).score).toBe(0)
    expect(calculateBMI({ heightCm: 180, weightKg: 0 }).severity).toBe('neutral')
  })
})

describe('anion gap', () => {
  // AG = Na − (Cl + HCO3) = 140 − 114 = 26
  // Delta gap = 26 − 12 = 14; delta ratio = 14 / (24 − 14) = 1.4
  it('Na 140, Cl 100, HCO3 14 gives AG 26 and a delta ratio of 1.4', () => {
    const r = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 14 })
    expect(r.ag).toBe(26)
    expect(r.deltaGap).toBe(14)
    expect(r.deltaRatio).toBeCloseTo(1.4, 10)
  })

  // Albumin correction: AG + 2.5 × (4 − albumin) = 26 + 2.5 × 2 = 31
  it('corrects for an albumin of 2.0 g/dL', () => {
    const r = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 14, albumin: 2.0 })
    expect(r.correctedAg).toBeCloseTo(31, 10)
  })

  // A normal albumin leaves the gap untouched.
  it('leaves the gap alone at an albumin of 4.0 g/dL', () => {
    const r = calculateAnionGap({ sodium: 140, chloride: 100, bicarbonate: 14, albumin: 4.0 })
    expect(r.correctedAg).toBeCloseTo(r.ag, 10)
  })

  // HCO3 of 24 would divide by zero.
  it('does not produce Infinity when bicarbonate is 24', () => {
    const r = calculateAnionGap({ sodium: 140, chloride: 104, bicarbonate: 24 })
    expect(Number.isFinite(r.deltaRatio)).toBe(true)
  })
})

describe('corrected calcium', () => {
  // 0.8 × (4.0 − 2.0) + 7.6 = 1.6 + 7.6 = 9.2 mg/dL
  it('Ca 7.6 with albumin 2.0 corrects to 9.2 mg/dL', () => {
    const r = calculateCalciumCorrection({
      calciumMgDl: 7.6,
      albuminGdl: 2.0,
      normalAlbuminGdl: 4.0,
    })
    expect(r.correctedCaMgDl).toBeCloseTo(9.2, 6)
    expect(r.correctedCaMmolL).toBeCloseTo(2.3, 6)
  })

  // Albumin already at the reference means no correction.
  it('is a no-op at the reference albumin', () => {
    const r = calculateCalciumCorrection({
      calciumMgDl: 9.0,
      albuminGdl: 4.0,
      normalAlbuminGdl: 4.0,
    })
    expect(r.correctedCaMgDl).toBeCloseTo(9.0, 10)
  })
})

describe('urea reduction ratio', () => {
  // (80 − 24) / 80 × 100 = 70%
  it('pre 80, post 24 gives 70%', () => {
    expect(calculateURR({ upre: 80, upost: 24 }).urr).toBe(70)
  })

  // 65% is the KDOQI minimum; below it the result is flagged.
  it('flags dialysis below the KDOQI minimum', () => {
    expect(calculateURR({ upre: 80, upost: 32 }).severity).toBe('danger') // 60%
    expect(calculateURR({ upre: 80, upost: 24 }).severity).toBe('success')
  })
})

describe('shock index', () => {
  // HR / SBP = 100 / 80 = 1.25, left unrounded for the display layer
  it('HR 100 over SBP 80 gives 1.25', () => {
    expect(calculateShockIndex({ heartRate: 100, sbp: 80 }).shockIndex).toBeCloseTo(1.25, 10)
  })

  // 0.5–0.7 is the normal band.
  it('calls 60/100 normal', () => {
    expect(calculateShockIndex({ heartRate: 60, sbp: 100 }).severity).toBe('success')
  })
})

describe('LDL (Friedewald)', () => {
  // LDL = TC − HDL − TG/5 = 200 − 50 − 30 = 120 mg/dL
  // In mmol/L: 120 / 38.67 = 3.10, shown to 2 dp
  it('TC 200, HDL 50, TG 150 gives 120 mg/dL', () => {
    const r = calculateLDL({ tcMgDl: 200, hdlMgDl: 50, tgMgDl: 150 })
    expect(r.ldlMgDl).toBe(120)
    expect(r.ldlMmol).toBe(3.1)
  })

  // Friedewald is not valid above a triglyceride of 400 mg/dL.
  it('warns when triglycerides exceed 400 mg/dL', () => {
    expect(calculateLDL({ tcMgDl: 250, hdlMgDl: 40, tgMgDl: 450 }).warnings).toHaveLength(1)
    expect(calculateLDL({ tcMgDl: 250, hdlMgDl: 40, tgMgDl: 350 }).warnings).toHaveLength(0)
  })

  // HDL + TG/5 above total cholesterol is not a lipid panel, it is a typo. The
  // arithmetic still lands under 70, so without a guard the screen reads
  // "Optimal LDL — target for very high-risk patients", in green.
  it('does not call an impossible negative LDL optimal', () => {
    const r = calculateLDL({ tcMgDl: 100, hdlMgDl: 60, tgMgDl: 300 })
    expect(r.ldlMgDl).toBeLessThan(0)
    expect(r.severity).toBe('danger')
    expect(r.interpretation).not.toMatch(/optimal/i)
    expect(r.warnings.join(' ')).toMatch(/exceeds total cholesterol/i)
  })

  // Exactly zero is the same impossible case, and is the boundary the guard uses.
  it('flags an LDL of exactly zero', () => {
    const r = calculateLDL({ tcMgDl: 100, hdlMgDl: 50, tgMgDl: 250 })
    expect(r.ldlMgDl).toBe(0)
    expect(r.severity).toBe('danger')
  })
})

describe('QTc', () => {
  // At 60 bpm the RR interval is exactly 1 s, so every correction returns QT.
  it('returns QT unchanged at 60 bpm', () => {
    const r = calculateQTc({ qtMs: 400, heartRate: 60 }).results
    expect(r.bazett).toBe(400)
    expect(r.fridericia).toBe(400)
    expect(r.framingham).toBe(400)
    expect(r.hodges).toBe(400)
    expect(r.rautaharju).toBe(400)
  })

  // At 100 bpm, RR = 0.6 s:
  //   Bazett     400 / √0.6      = 516.4  -> 516
  //   Fridericia 400 / ∛0.6      = 474.2  -> 474
  //   Framingham 400 + 154×0.4   = 461.6  -> 462
  //   Hodges     400 + 1.75×40   = 470
  //   Rautaharju 400 × 220 / 180 = 488.9  -> 489
  it('matches each published correction at 100 bpm', () => {
    const r = calculateQTc({ qtMs: 400, heartRate: 100 }).results
    expect(r.bazett).toBe(516)
    expect(r.fridericia).toBe(474)
    expect(r.framingham).toBe(462)
    expect(r.hodges).toBe(470)
    expect(r.rautaharju).toBe(489)
  })
})

describe('Cockcroft-Gault creatinine clearance', () => {
  // (140 − 60) × 70 / (72 × 1.0) = 5600 / 72 = 77.78 mL/min
  it('male, 60 y, 70 kg, Cr 1.0 gives 77.8 mL/min', () => {
    const r = calculateCockcroftGault({
      sex: 'male',
      age: 60,
      weightKg: 70,
      creatinineMgDl: 1.0,
    })
    expect(r.crclActual).toBe(77.8)
  })

  // The female factor is 0.85: 77.78 × 0.85 = 66.11
  it('applies the 0.85 female factor', () => {
    const r = calculateCockcroftGault({
      sex: 'female',
      age: 60,
      weightKg: 70,
      creatinineMgDl: 1.0,
    })
    expect(r.crclActual).toBe(66.1)
  })

  // Devine IBW for a 70 in male: 50 + 2.3 × 10 = 73 kg
  it('derives the Devine ideal body weight when height is given', () => {
    const r = calculateCockcroftGault({
      sex: 'male',
      age: 60,
      weightKg: 90,
      creatinineMgDl: 1.0,
      heightCm: 177.8, // 70 inches
    })
    expect(r.ibwKg).toBe(73)
    // Adjusted BW = IBW + 0.4 × (actual − IBW) = 73 + 0.4 × 17 = 79.8
    expect(r.abwKg).toBe(79.8)
  })
})

describe('eGFR', () => {
  // MDRD: 175 × 1.2^−1.154 × 60^−0.203
  //     = 175 × 0.81026 × 0.43558 = 61.76 -> 61.8
  it('MDRD, male, 60 y, Cr 1.2 gives 61.8', () => {
    const r = calculateEGFR({
      creatinine: 1.2,
      creatinineUnit: 'mg/dL',
      age: 60,
      sex: 'male',
      formula: 'mdrd',
    })
    expect(r.score).toBe(61.8)
  })

  // The MDRD female factor is 0.742: 61.76 × 0.742 = 45.83 -> 45.8
  it('applies the MDRD female factor', () => {
    const r = calculateEGFR({
      creatinine: 1.2,
      creatinineUnit: 'mg/dL',
      age: 60,
      sex: 'female',
      formula: 'mdrd',
    })
    expect(r.score).toBe(45.8)
  })

  // CKD-EPI 2021, male (κ 0.9, α −0.302), Scr/κ = 1.3333 so only the >1 branch applies:
  //   142 × 1.3333^−1.200 × 0.9938^60 = 142 × 0.70804 × 0.68851 = 69.22 -> 69.2
  it('CKD-EPI 2021, male, 60 y, Cr 1.2 gives 69.2', () => {
    const r = calculateEGFR({
      creatinine: 1.2,
      creatinineUnit: 'mg/dL',
      age: 60,
      sex: 'male',
      formula: 'ckd-epi-2021',
    })
    expect(r.score).toBe(69.2)
  })

  // 1.2 mg/dL is 106.1 µmol/L; entering either unit must score the same.
  it('scores the same creatinine in mg/dL and µmol/L', () => {
    const mgdl = calculateEGFR({
      creatinine: 1.2,
      creatinineUnit: 'mg/dL',
      age: 60,
      sex: 'male',
      formula: 'mdrd',
    })
    const umol = calculateEGFR({
      creatinine: 106.1,
      creatinineUnit: 'µmol/L',
      age: 60,
      sex: 'male',
      formula: 'mdrd',
    })
    expect(umol.score).toBeCloseTo(mgdl.score ?? 0, 0)
  })

  // Staging boundaries the interpretation text keys off.
  it('stages G2 just above 60 and G3a just below', () => {
    const above = calculateEGFR({
      creatinine: 1.2,
      creatinineUnit: 'mg/dL',
      age: 60,
      sex: 'male',
      formula: 'mdrd',
    })
    const below = calculateEGFR({
      creatinine: 1.2,
      creatinineUnit: 'mg/dL',
      age: 60,
      sex: 'female',
      formula: 'mdrd',
    })
    expect(above.label).toBe('CKD Stage G2') // 61.8
    expect(below.label).toBe('CKD Stage G3a') // 45.8
  })
})

describe('MELD', () => {
  // Original: 3.78 ln(2) + 11.2 ln(1.5) + 9.57 ln(1.5) + 6.43
  //         = 2.620 + 4.541 + 3.880 + 6.43 = 17.47 -> 17
  it('original MELD for bilirubin 2, INR 1.5, Cr 1.5 is 17', () => {
    const r = calculateMeldCombined({
      version: 'original',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 1.5,
      onDialysis: false,
    })
    expect(r.score).toBe(17)
  })

  // MELD Na adds the sodium term only above 11:
  //   17 + 1.32 × 7 − 0.033 × 17 × 7 = 17 + 9.24 − 3.927 = 22.31 -> 22
  it('MELD Na adds the sodium term at Na 130', () => {
    const r = calculateMeldCombined({
      version: 'meld-na',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 1.5,
      sodium: 130,
      onDialysis: false,
    })
    expect(r.score).toBe(22)
  })

  // Sodium at 137 is the top of the bounded range, so the term vanishes.
  it('MELD Na equals MELD at a sodium of 137', () => {
    const base = calculateMeldCombined({
      version: 'original',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 1.5,
      onDialysis: false,
    })
    const na = calculateMeldCombined({
      version: 'meld-na',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 1.5,
      sodium: 137,
      onDialysis: false,
    })
    expect(na.score).toBe(base.score)
  })

  // Dialysis forces creatinine to the version's ceiling: 4.0 for the original.
  it('dialysis forces creatinine to 4.0 in the original MELD', () => {
    const dialysed = calculateMeldCombined({
      version: 'original',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 0.6,
      onDialysis: true,
    })
    const atCeiling = calculateMeldCombined({
      version: 'original',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 4.0,
      onDialysis: false,
    })
    expect(dialysed.score).toBe(atCeiling.score)
  })

  // MELD 3.0 caps creatinine at 3.0, so 3.0 and 4.5 must score the same.
  it('MELD 3.0 caps creatinine at 3.0 mg/dL', () => {
    const capped = calculateMeldCombined({
      version: 'meld-3',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 4.5,
      sodium: 130,
      albuminGdl: 3.0,
      onDialysis: false,
    })
    const atCap = calculateMeldCombined({
      version: 'meld-3',
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 3.0,
      sodium: 130,
      albuminGdl: 3.0,
      onDialysis: false,
    })
    expect(capped.score).toBe(atCap.score)
  })

  // The female term adds 1.33 before rounding, so it can only raise the score.
  it('MELD 3.0 never scores a woman below an otherwise identical man', () => {
    const shared = {
      version: 'meld-3' as const,
      bilirubinMgDl: 2.0,
      inr: 1.5,
      creatinineMgDl: 1.5,
      sodium: 130,
      albuminGdl: 3.0,
      onDialysis: false,
    }
    const male = calculateMeldCombined({ ...shared, female: false })
    const female = calculateMeldCombined({ ...shared, female: true })
    expect(female.score).toBeGreaterThanOrEqual(male.score)
  })
})
