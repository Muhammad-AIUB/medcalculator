'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { calculateBMI } from '@/lib/calculators/bmi';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';
import { getSaved, saveField } from './use-persist-form';
const CID = 'bmi';

interface BmiFormProps {
  onResult: (result: any) => void;
}

export function BmiForm({ onResult }: BmiFormProps) {
  const [cmStr, setCmStr] = useState(() => getSaved(CID, 'cm'));
  const [ftStr, setFtStr] = useState(() => getSaved(CID, 'ft'));
  const [inStr, setInStr] = useState(() => getSaved(CID, 'in'));
  const [kgStr, setKgStr] = useState(() => getSaved(CID, 'kg'));
  const [lbStr, setLbStr] = useState(() => getSaved(CID, 'lb'));
  const [sex, setSex] = useState<'male' | 'female'>(() => (getSaved(CID, 'sex') as 'male' | 'female') || 'male');

  const heightCm = useMemo(() => parseFloat(cmStr) || 0, [cmStr]);
  const weightKg = useMemo(() => parseFloat(kgStr) || 0, [kgStr]);

  const onCmChange = useCallback((v: string) => {
    setCmStr(v); saveField(CID, 'cm', v);
    const cm = parseFloat(v);
    if (Number.isFinite(cm) && cm > 0) {
      const totalIn = cm / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inches = totalIn - ft * 12;
      setFtStr(ft.toString()); saveField(CID, 'ft', ft.toString());
      setInStr(fmt(inches, 1)); saveField(CID, 'in', fmt(inches, 1));
    } else { setFtStr(''); setInStr(''); saveField(CID, 'ft', ''); saveField(CID, 'in', ''); }
  }, []);

  const syncFtIn = useCallback((ft: string, inches: string) => {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    const cm = f > 0 || i > 0 ? fmt(f * 30.48 + i * 2.54, 1) : '';
    setCmStr(cm); saveField(CID, 'cm', cm);
  }, []);

  const onFtChange = useCallback((v: string) => { setFtStr(v); saveField(CID, 'ft', v); syncFtIn(v, inStr); }, [inStr, syncFtIn]);
  const onInChange = useCallback((v: string) => { setInStr(v); saveField(CID, 'in', v); syncFtIn(ftStr, v); }, [ftStr, syncFtIn]);

  const onKgChange = useCallback((v: string) => {
    setKgStr(v); saveField(CID, 'kg', v);
    const kg = parseFloat(v);
    const lb = Number.isFinite(kg) && kg > 0 ? fmt(kg * 2.20462, 1) : '';
    setLbStr(lb); saveField(CID, 'lb', lb);
  }, []);

  const onLbChange = useCallback((v: string) => {
    setLbStr(v); saveField(CID, 'lb', v);
    const lb = parseFloat(v);
    const kg = Number.isFinite(lb) && lb > 0 ? fmt(lb / 2.20462, 1) : '';
    setKgStr(kg); saveField(CID, 'kg', kg);
  }, []);

  const heightInvalid = heightCm > 0 && (heightCm < 50 || heightCm > 300);
  const weightInvalid = weightKg > 0 && (weightKg < 1 || weightKg > 500);
  const canSave = heightCm > 0 && weightKg > 0 && !heightInvalid && !weightInvalid;

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!canSave) return;
    const raw = calculateBMI({ heightCm, weightKg, sex });
    const severity = raw.severity as any;
    onResultRef.current({
      outputs: [
        { id: 'bmi', label: 'BMI', value: raw.score ?? 0, unit: 'kg/m²',
          interpretation: { text: raw.interpretation, severity, classification: raw.label } },
        ...(raw.subResults?.map((sr, i) => ({
          id: `sub-${i}`, label: sr.label, value: sr.value, unit: sr.unit,
          interpretation: { text: String(sr.value), severity: (sr.severity ?? 'neutral') as any },
        })) ?? []),
      ],
      inputs: { heightCm, weightKg, sex },
      references: raw.references,
      formulaUsed: 'WHO BMI',
    });
  }, [heightCm, weightKg, sex, canSave]);

  const clearAll = () => {
    setCmStr(''); setFtStr(''); setInStr(''); setKgStr(''); setLbStr('');
    saveField(CID, 'cm', ''); saveField(CID, 'ft', ''); saveField(CID, 'in', '');
    saveField(CID, 'kg', ''); saveField(CID, 'lb', '');
  };

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
            ⚠ Height should be between 50–300 cm (1.5–9.8 ft)
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
            ⚠ Weight should be between 1–500 kg
          </p>
        )}
      </FieldRow>

      <FieldRow label="Biological Sex">
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as const).map((s) => (
            <button key={s} type="button" onClick={() => { setSex(s); saveField(CID, 'sex', s); }}
              className={cn('h-11 rounded-lg border text-sm font-medium transition-all',
                sex === s ? 'border-[#0E7490] bg-[#0E7490]/10 text-[#0E7490] dark:bg-[#0E7490]/20 dark:text-cyan-300'
                  : 'border-border bg-background text-muted-foreground hover:border-muted-foreground')}>
              {s === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </FieldRow>

    </div>
  );
}
