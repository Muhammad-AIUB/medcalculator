import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './ui.store'

/**
 * The calculator page records a result every time a form emits one, and forms
 * emit on each keystroke. Without collapsing, typing one creatinine filed three
 * entries and the 100-entry cap evicted other calculators three times faster than
 * intended, so the summary line under a home-screen slot disappeared early.
 */

const entry = (calculatorId: string, summary: string) => ({
  calculatorId,
  calculatorName: calculatorId,
  inputs: {},
  outputs: [],
  calculatedAt: new Date().toISOString(),
  summary,
})

const history = () => useUIStore.getState().history

describe('history', () => {
  beforeEach(() => {
    useUIStore.setState({ history: [] })
  })

  it('keeps one entry while a single calculation is typed out', () => {
    const { addHistoryEntry } = useUIStore.getState()
    // What typing "1.25" into a creatinine box looks like.
    addHistoryEntry(entry('egfr', 'eGFR: 82.0'))
    addHistoryEntry(entry('egfr', 'eGFR: 66.1'))
    addHistoryEntry(entry('egfr', 'eGFR: 61.8'))

    expect(history()).toHaveLength(1)
    expect(history()[0].summary).toBe('eGFR: 61.8')
  })

  it('keeps the entry id stable while it is refined', () => {
    const { addHistoryEntry } = useUIStore.getState()
    addHistoryEntry(entry('egfr', 'eGFR: 82.0'))
    const firstId = history()[0].id
    addHistoryEntry(entry('egfr', 'eGFR: 61.8'))

    expect(history()[0].id).toBe(firstId)
  })

  it('starts a new entry for a different calculator', () => {
    const { addHistoryEntry } = useUIStore.getState()
    addHistoryEntry(entry('egfr', 'eGFR: 61.8'))
    addHistoryEntry(entry('bmi', 'BMI: 21.6'))

    expect(history().map((h) => h.calculatorId)).toEqual(['bmi', 'egfr'])
  })

  it('does not overwrite an earlier calculator when you come back to it', () => {
    const { addHistoryEntry } = useUIStore.getState()
    addHistoryEntry(entry('egfr', 'eGFR: 61.8'))
    addHistoryEntry(entry('bmi', 'BMI: 21.6'))
    addHistoryEntry(entry('egfr', 'eGFR: 45.8'))

    // The eGFR result the home screen shows is the newest one...
    expect(history().find((h) => h.calculatorId === 'egfr')?.summary).toBe('eGFR: 45.8')
    // ...and the BMI result in between is still there.
    expect(history().find((h) => h.calculatorId === 'bmi')?.summary).toBe('BMI: 21.6')
  })

  it('caps the history at 100 entries', () => {
    const { addHistoryEntry } = useUIStore.getState()
    // Alternate so nothing collapses, which is the worst case for the cap.
    for (let i = 0; i < 130; i++) {
      addHistoryEntry(entry(i % 2 === 0 ? 'egfr' : 'bmi', `run ${i}`))
    }
    expect(history()).toHaveLength(100)
    expect(history()[0].summary).toBe('run 129')
  })

  it('surfaces the newest result per calculator, which is what the home screen reads', () => {
    const { addHistoryEntry } = useUIStore.getState()
    addHistoryEntry(entry('bmi', 'BMI: 21.6'))
    addHistoryEntry(entry('egfr', 'eGFR: 82.0'))
    addHistoryEntry(entry('egfr', 'eGFR: 61.8'))

    expect(history().find((h) => h.calculatorId === 'bmi')?.summary).toBe('BMI: 21.6')
    expect(history().find((h) => h.calculatorId === 'egfr')?.summary).toBe('eGFR: 61.8')
    // Three calls, two calculations.
    expect(history()).toHaveLength(2)
  })
})
