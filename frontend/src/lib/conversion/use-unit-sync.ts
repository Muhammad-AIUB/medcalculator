'use client'

import { useState, useCallback, useRef } from 'react'
import { MedicalUnitConverter } from './converter'
import { findUnit } from './unit-registry'

interface UseUnitSyncOptions {
  initialValue?: number
  initialUnit?: string
  substance?: string
  precision?: number
  onChange?: (value: number, unit: string, allValues: Record<string, number>) => void
}

interface UseUnitSyncReturn {
  value: number
  activeUnit: string
  allValues: Record<string, number>
  displayValue: string
  setValue: (val: number, unit?: string) => void
  setUnit: (unit: string) => void
  setDisplayValue: (raw: string) => void
}

export function useUnitSync(
  units: string[],
  options: UseUnitSyncOptions = {}
): UseUnitSyncReturn {
  const {
    initialValue = 0,
    initialUnit,
    substance,
    onChange,
  } = options

  const defaultUnit = initialUnit ?? units[0] ?? ''
  const [activeUnit, setActiveUnitState] = useState(defaultUnit)
  const [value, setValueState] = useState(initialValue)
  const [displayValue, setDisplayValueState] = useState(
    initialValue > 0 ? String(initialValue) : ''
  )
  const lastValueRef = useRef(initialValue)

  const computeAllValues = useCallback(
    (val: number, fromUnit: string): Record<string, number> => {
      const result: Record<string, number> = {}
      for (const unit of units) {
        if (unit === fromUnit) {
          result[unit] = val
        } else {
          result[unit] = MedicalUnitConverter.convert(val, fromUnit, unit, substance)
        }
      }
      return result
    },
    [units, substance]
  )

  const [allValues, setAllValues] = useState<Record<string, number>>(() =>
    computeAllValues(initialValue, defaultUnit)
  )

  const setValue = useCallback(
    (val: number, unit?: string) => {
      const targetUnit = unit ?? activeUnit
      const numVal = isNaN(val) ? 0 : val
      const newAllValues = computeAllValues(numVal, targetUnit)

      lastValueRef.current = numVal
      setValueState(numVal)
      setAllValues(newAllValues)
      const unitDef = findUnit(targetUnit)
      setDisplayValueState(numVal > 0 ? String(numVal) : '')

      onChange?.(numVal, targetUnit, newAllValues)
    },
    [activeUnit, computeAllValues, onChange]
  )

  const setUnit = useCallback(
    (newUnit: string) => {
      // Convert current value to new unit
      const convertedValue = MedicalUnitConverter.convert(
        lastValueRef.current,
        activeUnit,
        newUnit,
        substance
      )
      const newAllValues = computeAllValues(convertedValue, newUnit)
      const unitDef = findUnit(newUnit)
      const precision = unitDef?.precision ?? 2

      setActiveUnitState(newUnit)
      setValueState(convertedValue)
      setAllValues(newAllValues)
      setDisplayValueState(
        convertedValue > 0
          ? String(MedicalUnitConverter.round(convertedValue, precision))
          : ''
      )

      onChange?.(convertedValue, newUnit, newAllValues)
    },
    [activeUnit, substance, computeAllValues, onChange]
  )

  const setDisplayValue = useCallback(
    (raw: string) => {
      setDisplayValueState(raw)
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        const newAllValues = computeAllValues(parsed, activeUnit)
        lastValueRef.current = parsed
        setValueState(parsed)
        setAllValues(newAllValues)
        onChange?.(parsed, activeUnit, newAllValues)
      }
    },
    [activeUnit, computeAllValues, onChange]
  )

  return {
    value,
    activeUnit,
    allValues,
    displayValue,
    setValue,
    setUnit,
    setDisplayValue,
  }
}
