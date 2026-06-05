'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateKtV } from '@/lib/calculators/ktv';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function KtvForm({ onResult }: Props) {
  // Dialyzer clearance: mL/min (single unit)
  const [clearanceStr, setClearanceStr] = useState('');

  // Dialysis time: hours (single unit)
  const [timeStr, setTimeStr] = useState('');

  // Weight: kg OR lbs
  const [weightKgStr, setWeightKgStr] = useState('');
  const [weightLbStr, setWeightLbStr] = useState('');

  const onWeightKgChange = useCallback((v: string) => {
    setWeightKgStr(v);
    const n = parseFloat(v);
    setWeightLbStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.20462, 1) : '');
  }, []);
  const onWeightLbChange = useCallback((v: string) => {
    setWeightLbStr(v);
    const n = parseFloat(v);
    setWeightKgStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.20462, 1) : '');
  }, []);

  const clearance = parseFloat(clearanceStr) || 0;
  const time      = parseFloat(timeStr)      || 0;
  const weightKg  = parseFloat(weightKgStr)  || 0;

  const liveResult = useMemo(() => {
    if (clearance <= 0 || time <= 0 || weightKg <= 0) return null;
    try { return calculateKtV({ clearance, timeHours: time, weightKg }); }
    catch { return null; }
  }, [clearance, time, weightKg]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'ktv',
          label: 'Kt/V',
          value: liveResult.ktv,
          unit: '',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { clearance, timeHours: time, weightKg },
      formulaUsed:
        'Kt/V, where\n' +
        'K = dialyzer clearance of urea (mL/min)\n' +
        't = dialysis time (converted to minutes)\n' +
        'V = volume of distribution of urea ~ 0.6 x weight (kg) x 1000 mL\n\n' +
        'Kt/V = (K x t) / V',
      references: liveResult.references,
    });
  }, [liveResult, clearance, time, weightKg]);

  return (
    <div className="space-y-6">
      <FieldRow label="Dialyzer Clearance of Urea">
        <NumInput value={clearanceStr} onChange={setClearanceStr} suffix="mL/min" step="1" min={0} max={500} />
      </FieldRow>

      <FieldRow label="Dialysis Time">
        <NumInput value={timeStr} onChange={setTimeStr} suffix="hours" step="0.5" min={0} max={12} />
      </FieldRow>

      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={weightKgStr} onChange={onWeightKgChange} suffix="kg"  step="0.1" min={1} max={300} />
          <OrDivider />
          <NumInput value={weightLbStr} onChange={onWeightLbChange} suffix="lbs" step="0.1" min={2} max={660} />
        </div>
      </FieldRow>
    </div>
  );
}
