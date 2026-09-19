import { describe, expect, it } from 'vitest'
import { CALCULATORS } from './calculator-registry'
import { searchCalculators } from './calculator-search'

const topHit = (query: string) => searchCalculators(CALCULATORS, query)[0]?.id

/**
 * Queries people actually type, paired with the calculator they mean.
 *
 * These are the regression guard: a calculator that the search cannot reach is
 * reported as a missing calculator, and that has already happened twice on this
 * repo — first "reticulocyte production index", then "corrected sodium in
 * hyperglycemia". Both were sitting in the registry the whole time.
 */
const CLINICAL_PHRASINGS: [query: string, calculatorId: string][] = [
  ['corrected sodium in hyperglycemia', 'sodium-correction'],
  ['corrected sodium', 'sodium-correction'],
  ['sodium correction', 'sodium-correction'],
  ['hyperglycemia sodium', 'sodium-correction'],
  ['reticulocyte production index', 'corrected-reticulocyte'],
  ['wells criteria pe', 'wells-pe'],
  ['wells score for pe', 'wells-pe'],
  ['creatinine clearance cockcroft', 'cockcroft-gault'],
  ['cockcroft gault crcl', 'cockcroft-gault'],
  ['child pugh score', 'child-pugh'],
  ['body mass index calculator', 'bmi'],
  ['corrected anion gap', 'anion-gap'],
  ['qtc bazett', 'qtc'],
  ['mean arterial pressure map', 'map'],
  ['meld score sodium', 'meld-na'],
  ['corrected calcium', 'calcium-correction'],
  ['glasgow coma score', 'gcs'],
  ['sleep apnea stop bang', 'stop-bang'],
  ['fractional excretion of sodium', 'fena'],
  ['modified rankin', 'mrs'],
]

/** Typing the registered name must still win outright. */
const EXACT_NAMES: [query: string, calculatorId: string][] = [
  ['MELD-Na Score', 'meld-na'],
  ['BMI', 'bmi'],
  ['SOFA Score', 'sofa'],
  ['Hunt and Hess Scale', 'hunt-hess'],
]

/**
 * Lab values the calculator takes as an input but never names in its title,
 * description or tags. Before the inputs were indexed, every one of these
 * returned nothing at all.
 */
const LAB_VALUES: [query: string, calculatorIds: string[]][] = [
  ['inr', ['child-pugh', 'meld-na']],
  ['bilirubin', ['child-pugh', 'meld-na', 'sofa']],
  ['chloride', ['anion-gap']],
  ['potassium', ['apache2']],
  ['fio2', ['sofa']],
  ['pao2', ['sofa']],
  ['hb', ['iron-deficit']],
]

/** Spellings that must lead to the same place, whichever the reader uses. */
const SPELLING_PAIRS: [string, string][] = [
  ['haemoglobin', 'hemoglobin'],
  ['haematocrit', 'hematocrit'],
  ['anaemia', 'anemia'],
  ['leukaemia', 'leukemia'],
  ['hypoalbuminaemia', 'hypoalbuminemia'],
  ['hyponatraemia', 'hyponatremia'],
]

/** The registry writes these with subscript digits, not ASCII ones. */
const SUBSCRIPT_TERMS: [query: string, calculatorId: string][] = [
  ['spo2', 'sofa'],
  ['fio2', 'sofa'],
  ['cha2ds2', 'cha2ds2-vasc'],
  ['cha2ds2-vasc', 'cha2ds2-vasc'],
  ['abcd2', 'abcd2'],
  ['fev1', 'bode'],
]

describe('searchCalculators', () => {
  it.each(CLINICAL_PHRASINGS)('finds %s', (query, calculatorId) => {
    expect(topHit(query)).toBe(calculatorId)
  })

  it.each(EXACT_NAMES)('ranks the exact name first for %s', (query, calculatorId) => {
    expect(topHit(query)).toBe(calculatorId)
  })

  // The strongest guard there is: if a calculator cannot be found by its own
  // name, it is invisible, and an invisible calculator gets reported as one the
  // app does not have.
  it.each(CALCULATORS.map(c => [c.title, c.id] as const))(
    'leads with the calculator for its own title %s',
    (title, id) => {
      expect(topHit(title)).toBe(id)
    },
  )

  it.each(CALCULATORS.map(c => [c.shortTitle, c.id] as const))(
    'leads with the calculator for its own short title %s',
    (shortTitle, id) => {
      expect(topHit(shortTitle)).toBe(id)
    },
  )

  it.each(LAB_VALUES)('finds the calculators that take %s', (query, calculatorIds) => {
    const found = searchCalculators(CALCULATORS, query).map(c => c.id)
    for (const id of calculatorIds) expect(found).toContain(id)
  })

  it.each(SPELLING_PAIRS)('treats %s and %s as the same word', (british, american) => {
    const a = searchCalculators(CALCULATORS, british).map(c => c.id)
    const b = searchCalculators(CALCULATORS, american).map(c => c.id)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
  })

  it.each(SUBSCRIPT_TERMS)('reaches subscript-spelled %s', (query, calculatorId) => {
    expect(searchCalculators(CALCULATORS, query).map(c => c.id)).toContain(calculatorId)
  })

  // The failure that started this: a pinned home slot was mistaken for a search
  // hit, so pin the real contract down — unrelated queries return nothing of
  // the sort.
  it.each(['precise DAPT', 'DAPT', 'bleeding', 'wells', 'meld'])(
    'does not return Sodium Correction for %s',
    query => {
      expect(searchCalculators(CALCULATORS, query).map(c => c.id)).not.toContain('sodium-correction')
    },
  )

  it('returns every calculator for an empty query', () => {
    expect(searchCalculators(CALCULATORS, '')).toHaveLength(CALCULATORS.length)
    expect(searchCalculators(CALCULATORS, '   ')).toHaveLength(CALCULATORS.length)
  })

  it('returns nothing for a query that matches nothing', () => {
    expect(searchCalculators(CALCULATORS, 'zzzz not a calculator')).toHaveLength(0)
  })

  // Matching on every word is what keeps the list from becoming a wall of
  // results: each extra word has to land somewhere, so the list only narrows.
  it('narrows as words are added rather than emptying', () => {
    const broad = searchCalculators(CALCULATORS, 'sodium').length
    const narrow = searchCalculators(CALCULATORS, 'corrected sodium in hyperglycemia').length
    expect(broad).toBeGreaterThan(0)
    expect(narrow).toBeGreaterThan(0)
    expect(narrow).toBeLessThanOrEqual(broad)
  })
})
