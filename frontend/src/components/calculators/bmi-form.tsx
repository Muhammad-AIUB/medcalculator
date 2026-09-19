'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateBMI } from '@/lib/calculators/bmi';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface BmiFormProps {
  onResult: (result: any) => void;
}

export function BmiForm({ onResult }: BmiFormProps) {
  const [cmStr, setCmStr] = useState('');
  const [ftStr, setFtStr] = useState('');
  const [inStr, setInStr] = useState('');
  const [kgStr, setKgStr] = useState('');
  const [lbStr, setLbStr] = useState('');

  // Which unit the user typed in. The cm and kg boxes are rounded to 1 dp when mirrored
  // from ft/in and lb, so calculating from them shifts the BMI (80 lb at 4 ft 8 in gave
  // 18.0 where 17.9 is correct).
  const [lastH, setLastH] = useState<'cm' | 'ftin'>('cm');
  const [lastW, setLastW] = useState<'kg' | 'lb'>('kg');

  const heightCm = useMemo(
    () => (lastH === 'ftin'
      ? (parseFloat(ftStr) || 0) * 30.48 + (parseFloat(inStr) || 0) * 2.54
      : parseFloat(cmStr) || 0),
    [lastH, ftStr, inStr, cmStr],
  );
  const weightKg = useMemo(
    () => (lastW === 'lb' ? (parseFloat(lbStr) || 0) / 2.20462 : parseFloat(kgStr) || 0),
    [lastW, lbStr, kgStr],
  );

  const onCmChange = useCallback((v: string) => {
    setLastH('cm');
    setCmStr(v);
    const cm = parseFloat(v);
    if (Number.isFinite(cm) && cm > 0) {
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inches = totalIn - ft * 12;
      setFtStr(ft.toString());
      setInStr(fmt(inches, 1));
    } else {
      setFtStr('');
      setInStr('');
    }
  }, []);

  const syncFtIn = useCallback((ft: string, inches: string) => {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    const cm = f > 0 || i > 0 ? fmt(f * 30.48 + i * 2.54, 1) : '';
    setCmStr(cm);
  }, []);

  const onFtChange = useCallback((v: string) => {
    setLastH('ftin');
    setFtStr(v);
    syncFtIn(v, inStr);
  }, [inStr, syncFtIn]);

  const onInChange = useCallback((v: string) => {
    setLastH('ftin');
    setInStr(v);
    syncFtIn(ftStr, v);
  }, [ftStr, syncFtIn]);

  const onKgChange = useCallback((v: string) => {
    setLastW('kg');
    setKgStr(v);
    const kg = parseFloat(v);
    const lb = Number.isFinite(kg) && kg > 0 ? fmt(kg * 2.20462, 1) : '';
    setLbStr(lb);
  }, []);

  const onLbChange = useCallback((v: string) => {
    setLastW('lb');
    setLbStr(v);
    const lb = parseFloat(v);
    const kg = Number.isFinite(lb) && lb > 0 ? fmt(lb / 2.20462, 1) : '';
    setKgStr(kg);
  }, []);

  const heightInvalid = heightCm > 0 && (heightCm < 50 || heightCm > 300);
  const weightInvalid = weightKg > 0 && (weightKg < 1 || weightKg > 500);
  const canSave = heightCm > 0 && weightKg > 0 && !heightInvalid && !weightInvalid;

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!canSave) {
      onResultRef.current(null);
      return;
    }
    const raw = calculateBMI({ heightCm, weightKg });
    const severity = raw.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'bmi',
          label: 'BMI',
          value: raw.score ?? 0,
          unit: 'kg/m2',
          interpretation: { text: raw.interpretation, severity, classification: raw.label },
        },
        ...(raw.subResults?.map((sr, i) => ({
          id: `sub-${i}`,
          label: sr.label,
          value: sr.value,
          unit: sr.unit,
          // The result panel shows 1 dp unless told otherwise, which rendered the
          // Mosteller BSA as 1.9 where the BSA calculator alongside it shows 1.87.
          // BSA drives chemotherapy and cardiac-index dosing, so keep both digits.
          ...(sr.unit === 'm2' ? { decimals: 2 } : {}),
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { heightCm, weightKg },
      references: raw.references,
      formulaUsed: raw.formula,
    });
  }, [heightCm, weightKg, canSave]);

  return (
    <div className="space-y-6">
      <FieldRow label="Your Height">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={cmStr} onChange={onCmChange} suffix="cm" min={50} max={300} step="0.1" />
          <OrDivider />
          <div className="grid grid-cols-2 gap-1.5">
            <NumInput value={ftStr} onChange={onFtChange} suffix="ft" min={0} max={9} step="1" />
            <NumInput value={inStr} onChange={onInChange} suffix="in" min={0} max={11.9} step="0.1" />
          </div>
        </div>
        {heightInvalid && (
          <p className="text-xs font-medium text-red-600 mt-1">
            Height should be between 50-300 cm (1.5-9.8 ft)
          </p>
        )}
      </FieldRow>

      <FieldRow label="Your Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={kgStr} onChange={onKgChange} suffix="kg" min={1} max={500} step="0.1" />
          <OrDivider />
          <NumInput value={lbStr} onChange={onLbChange} suffix="pound" min={1} max={1100} step="0.1" />
        </div>
        {weightInvalid && (
          <p className="text-xs font-medium text-red-600 mt-1">
            Weight should be between 1-500 kg
          </p>
        )}
      </FieldRow>
    </div>
  );
}
