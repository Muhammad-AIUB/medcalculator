import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Guard against a result panel that shows a number the clinician did not enter.
 *
 * Every form reads its number boxes as strings and falls back when one is blank —
 * `Number(esr || 1)`, `Number(ast || 0)`. The fallback keeps a division safe, but
 * it also means an untouched form can emit a complete-looking score. DAS28-ESR
 * reported "Remission" on an empty form, and FIB-4 and APRI reported 0; the eGFR
 * form kept the previous patient's 61.8 on screen after its creatinine was cleared.
 *
 * The rule: a form that starts any field empty must be able to hand the page a
 * null result, so the panel falls back to "--" instead of holding a stale or
 * fabricated value. Forms built only from option buttons are exempt — every item
 * has a visible, deliberate default, which is how MDCalc presents them too.
 */

const FORM_DIR = fileURLToPath(new URL('.', import.meta.url))

const forms = fs
  .readdirSync(FORM_DIR)
  .filter((f) => f.endsWith('-form.tsx'))
  .map((f) => ({ name: f, source: fs.readFileSync(path.join(FORM_DIR, f), 'utf8') }))

/** A field that starts as an empty string is one the clinician has to fill in. */
const hasEmptyStartField = (source: string) => source.includes("useState('')")

/** The page renders "--" whenever it is handed a null result. */
const canClearResult = (source: string) =>
  /onResult(Ref\.current)?\(null\)/.test(source)

describe('calculator form result guards', () => {
  it('finds the form components', () => {
    // Without this the table-driven tests below would pass on an empty list.
    expect(forms.length).toBeGreaterThan(70)
    expect(forms.filter((f) => hasEmptyStartField(f.source)).length).toBeGreaterThan(30)
  })

  it.each(
    forms.filter((f) => hasEmptyStartField(f.source)).map((f) => [f.name, f.source] as const),
  )('%s can clear its result back to "--"', (_name, source) => {
    expect(canClearResult(source)).toBe(true)
  })

  it.each(forms.map((f) => [f.name, f.source] as const))(
    '%s routes its result through a ref so the effect does not depend on the callback identity',
    (_name, source) => {
      // Every form follows this shape; a plain onResult(...) inside an effect
      // re-fires whenever the parent re-renders, which is how a cleared form
      // ended up re-emitting a stale result in the first place.
      if (source.includes('onResultRef')) {
        expect(source).toContain('const onResultRef = useRef(onResult)')
      }
    },
  )
})

/**
 * Guard against a number box that bypasses the shared NumInput.
 *
 * Six forms used to build their own `<input type="number">`. Those boxes lost
 * two things NumInput carries. They had no out-of-range warning, so 40 tender
 * joints went into a DAS28 that is defined on 28, and an AST meant for the
 * platelet box scored without comment. And `type="number"` is the control
 * NumInput's own comment says to avoid: some Android keyboards and locales
 * report an empty value from it, and this app ships as a Capacitor APK.
 */
describe('calculator number entry', () => {
  it.each(forms.map((f) => [f.name, f.source] as const))(
    '%s has no raw type="number" box',
    (_name, source) => {
      expect(source).not.toMatch(/type="number"/)
    },
  )

  it.each(
    forms
      .filter((f) => f.source.includes('<NumInput'))
      .map((f) => [f.name, f.source] as const),
  )('%s gives every NumInput a range to warn against', (_name, source) => {
    // A NumInput with neither bound silently drops the red warning, which is the
    // whole reason these fields route through it.
    const props = source.match(/<NumInput\b[\s\S]*?\/>/g) ?? []
    expect(props.length).toBeGreaterThan(0)
    for (const tag of props) {
      expect(/\bmin=/.test(tag) || /\bmax=/.test(tag)).toBe(true)
    }
  })
})
