import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CALCULATORS, CALCULATOR_CATEGORIES, getCalculator } from './calculator-registry'

/**
 * Structural guard for the registry.
 *
 * Adding a calculator means touching four places that nothing currently ties
 * together: the calculation module, the registry entry, FORM_MAP in the
 * calculator page (which decides whether the page renders at all) and
 * FORMULA_MAP (which fills the "Formula Used" panel before the first input).
 * Miss one and the failure is silent — a "Calculator not found" page, or a
 * formula panel stuck on "--". These tests make each of those a red build.
 */

const pageClientSource = fs.readFileSync(
  new URL('../../app/calculators/[id]/page-client.tsx', import.meta.url),
  'utf8',
)

/** Pulls the keys out of one `const NAME: Record<string, X> = { ... };` block. */
function mapKeys(mapName: string): Set<string> {
  const start = pageClientSource.indexOf(`const ${mapName}`)
  if (start === -1) throw new Error(`${mapName} not found in page-client.tsx`)
  const open = pageClientSource.indexOf('{', start)
  const close = pageClientSource.indexOf('\n};', open)
  const block = pageClientSource.slice(open + 1, close)

  const keys = new Set<string>()
  // Only entries at the top level of the block: one indent, then a bare or
  // quoted key. Keys inside multi-line strings are indented differently or not
  // followed by a value, so they do not match.
  for (const line of block.split('\n')) {
    const m = /^ {2}'?([a-z0-9-]+)'?:\s*\S/.exec(line)
    if (m) keys.add(m[1])
  }
  return keys
}

const FORM_MAP_KEYS = mapKeys('FORM_MAP')
const FORMULA_MAP_KEYS = mapKeys('FORMULA_MAP')

describe('registry integrity', () => {
  it('parses both maps out of the page source', () => {
    // If the parsing above ever silently returns nothing, every other test in
    // this file would pass vacuously.
    expect(FORM_MAP_KEYS.size).toBeGreaterThan(50)
    expect(FORMULA_MAP_KEYS.size).toBeGreaterThan(50)
  })

  it('has no duplicate calculator ids', () => {
    const ids = CALCULATORS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every id through getCalculator', () => {
    for (const c of CALCULATORS) {
      expect(getCalculator(c.id)?.id).toBe(c.id)
    }
  })

  it.each(CALCULATORS.map((c) => [c.id, c] as const))(
    '%s carries the metadata the UI reads',
    (_id, calc) => {
      expect(calc.title.trim()).not.toBe('')
      expect(calc.shortTitle.trim()).not.toBe('')
      expect(calc.description.trim()).not.toBe('')
      expect(calc.icon.trim()).not.toBe('')
      expect(calc.emoji.trim()).not.toBe('')
      expect(calc.color.trim()).not.toBe('')
      expect(calc.bgColor.trim()).not.toBe('')
      expect(calc.tags.length).toBeGreaterThan(0)
      expect(Array.isArray(calc.inputs)).toBe(true)
      expect(typeof calc.calculate).toBe('function')
    },
  )

  /**
   * `inputs` is not what the page renders — each calculator has a hand-written
   * form in FORM_MAP — but calculator-search.ts indexes the input labels, so an
   * empty array costs that calculator one matching signal. Forty entries were
   * added without it. Filling them in means writing the clinical field labels
   * for each, so this is a ratchet rather than a hard assertion: it stops the
   * gap from growing while the existing forty are worked through.
   */
  const KNOWN_MISSING_INPUT_LABELS = 40

  it('does not add new calculators with an empty inputs array', () => {
    const empty = CALCULATORS.filter((c) => (c.inputs ?? []).length === 0).map((c) => c.id)
    expect(
      empty.length,
      `calculators with no searchable input labels:\n  ${empty.join('\n  ')}`,
    ).toBeLessThanOrEqual(KNOWN_MISSING_INPUT_LABELS)
  })

  it.each(CALCULATORS.map((c) => [c.id, c.category] as const))(
    '%s uses a declared category (%s)',
    (_id, category) => {
      expect(CALCULATOR_CATEGORIES).toContain(category)
    },
  )

  it.each(CALCULATORS.map((c) => [c.id] as const))(
    '%s has a form component wired into FORM_MAP',
    (id) => {
      expect(FORM_MAP_KEYS.has(id)).toBe(true)
    },
  )

  it.each(CALCULATORS.map((c) => [c.id] as const))(
    '%s has a FORMULA_MAP fallback for the empty state',
    (id) => {
      expect(FORMULA_MAP_KEYS.has(id)).toBe(true)
    },
  )

  it('has no FORM_MAP or FORMULA_MAP entry pointing at a calculator that no longer exists', () => {
    const ids = new Set(CALCULATORS.map((c) => c.id))
    expect([...FORM_MAP_KEYS].filter((k) => !ids.has(k))).toEqual([])
    expect([...FORMULA_MAP_KEYS].filter((k) => !ids.has(k))).toEqual([])
  })

  it.each(CALCULATORS.map((c) => [c.id, c] as const))(
    '%s declares usable input fields',
    (_id, calc) => {
      const fieldIds = calc.inputs.map((i) => i.id)
      expect(new Set(fieldIds).size).toBe(fieldIds.length)

      for (const input of calc.inputs) {
        expect(input.label.trim()).not.toBe('')
        // A select or radio with no options renders an empty control.
        if (input.type === 'select' || input.type === 'radio') {
          expect(input.options?.length ?? 0).toBeGreaterThan(0)
        }
        // A unit dropdown needs a default, otherwise the form has to guess.
        if (input.units && input.units.length > 0) {
          expect(input.units).toContain(input.defaultUnit)
        }
        if (input.min !== undefined && input.max !== undefined) {
          expect(input.min).toBeLessThan(input.max)
        }
      }
    },
  )
})
