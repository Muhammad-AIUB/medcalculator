import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CalculationResult } from '@/types/calculator'

interface CalculatorState {
  fieldValues: Record<string, Record<string, Record<string, number>>>
  activeUnits: Record<string, Record<string, string>>
  results: Record<string, CalculationResult | null>
  isCalculating: boolean

  setFieldValue: (
    calcId: string,
    fieldId: string,
    value: number,
    unit: string,
    allUnits: Record<string, number>
  ) => void
  setActiveUnit: (calcId: string, fieldId: string, unit: string) => void
  setResult: (calcId: string, result: CalculationResult) => void
  resetCalculator: (calcId: string) => void
  setIsCalculating: (val: boolean) => void
}

export const useCalculatorStore = create<CalculatorState>()(
  immer((set) => ({
    fieldValues: {},
    activeUnits: {},
    results: {},
    isCalculating: false,

    setFieldValue: (calcId, fieldId, value, unit, allUnits) => {
      set((state) => {
        if (!state.fieldValues[calcId]) state.fieldValues[calcId] = {}
        if (!state.fieldValues[calcId][fieldId]) state.fieldValues[calcId][fieldId] = {}
        state.fieldValues[calcId][fieldId] = { ...allUnits, [unit]: value }
        if (!state.activeUnits[calcId]) state.activeUnits[calcId] = {}
        state.activeUnits[calcId][fieldId] = unit
      })
    },

    setActiveUnit: (calcId, fieldId, unit) => {
      set((state) => {
        if (!state.activeUnits[calcId]) state.activeUnits[calcId] = {}
        state.activeUnits[calcId][fieldId] = unit
      })
    },

    setResult: (calcId, result) => {
      set((state) => {
        state.results[calcId] = result
      })
    },

    resetCalculator: (calcId) => {
      set((state) => {
        delete state.fieldValues[calcId]
        delete state.activeUnits[calcId]
        state.results[calcId] = null
      })
    },

    setIsCalculating: (val) => {
      set((state) => {
        state.isCalculating = val
      })
    },
  }))
)
