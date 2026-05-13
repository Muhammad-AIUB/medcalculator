'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { MedicalUnitConverter } from '@/lib/conversion/converter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface ClinicalRange {
  min: number;
  max: number;
  warning: string;
  unit: string;
}

interface UnitInputProps {
  label: string;
  fieldId: string;
  units: string[];
  defaultUnit?: string;
  value?: number | string;
  onChange?: (value: number, unit: string, allValues: Record<string, number>) => void;
  substance?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  clinicalRange?: ClinicalRange;
  disabled?: boolean;
  className?: string;
  showEquivalents?: boolean;
}

export function UnitInput({
  label, fieldId, units, defaultUnit, value: externalValue,
  onChange, substance, error, helpText, required, min, max, step = 'any',
  placeholder = '0.00', clinicalRange, disabled, className, showEquivalents = true,
}: UnitInputProps) {
  const [activeUnit, setActiveUnit] = useState(defaultUnit || units[0] || '');
  const [rawValue, setRawValue] = useState<string>('');
  const [allValues, setAllValues] = useState<Record<string, number>>({});
  const [hasWarning, setHasWarning] = useState(false);

  const updateAllValues = useCallback((numVal: number, unit: string) => {
    try {
      const converted = MedicalUnitConverter.convertAll(numVal, unit, substance);
      setAllValues(converted);
      if (clinicalRange) {
        const valInRange = converted[clinicalRange.unit] ?? numVal;
        setHasWarning(valInRange < clinicalRange.min || valInRange > clinicalRange.max);
      }
      onChange?.(numVal, unit, converted);
    } catch {
      setAllValues({});
    }
  }, [substance, clinicalRange, onChange]);

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== '' && String(externalValue) !== rawValue) {
      setRawValue(String(externalValue));
      const num = parseFloat(String(externalValue));
      if (!isNaN(num)) updateAllValues(num, activeUnit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRawValue(raw);
    const num = parseFloat(raw);
    if (!isNaN(num) && raw !== '') {
      updateAllValues(num, activeUnit);
    } else {
      setAllValues({});
      setHasWarning(false);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setActiveUnit(newUnit);
    const num = parseFloat(rawValue);
    if (!isNaN(num) && rawValue !== '') {
      try {
        const convertedVal = MedicalUnitConverter.convert(num, activeUnit, newUnit, substance);
        const rounded = MedicalUnitConverter.round(convertedVal, 4);
        setRawValue(String(rounded));
        updateAllValues(rounded, newUnit);
      } catch {
        updateAllValues(num, newUnit);
      }
    }
  };

  const equivalentUnits = units.filter(u => u !== activeUnit);
  const inputId = `unit-input-${fieldId}`;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className={cn(
        'flex items-stretch rounded-xl border bg-background transition-colors duration-150 overflow-hidden',
        error ? 'border-destructive ring-1 ring-destructive' : 'border-input',
        hasWarning && !error ? 'border-amber-400 ring-1 ring-amber-300' : '',
        'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
        disabled && 'opacity-50 pointer-events-none'
      )}>
        <input
          id={inputId}
          type="number"
          step={step}
          min={min}
          max={max}
          value={rawValue}
          onChange={handleValueChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 min-w-0 h-12 px-4 bg-transparent text-base font-medium outline-none',
            'placeholder:text-muted-foreground/50',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
        />
        {units.length > 1 ? (
          <Select value={activeUnit} onValueChange={handleUnitChange}>
            <SelectTrigger className="h-12 w-auto min-w-[90px] max-w-[130px] border-0 border-l rounded-none bg-muted/40 text-sm font-medium px-3 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center px-3 h-12 border-l bg-muted/40 text-sm font-medium text-muted-foreground min-w-[70px] justify-center">
            {activeUnit}
          </div>
        )}
      </div>

      {hasWarning && clinicalRange && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{clinicalRange.warning}</span>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}

      {showEquivalents && equivalentUnits.length > 0 && Object.keys(allValues).length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
          {equivalentUnits.slice(0, 3).map((u) => {
            const v = allValues[u];
            if (v === undefined || isNaN(v)) return null;
            return (
              <span key={u} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">
                  {MedicalUnitConverter.round(v, 3).toLocaleString()}
                </span>{' '}
                {u}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
