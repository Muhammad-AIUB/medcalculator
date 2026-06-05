'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateShockIndex } from '@/lib/calculators/shock-index';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function ShockIndexForm({ onResult }: Props) {
  const [hrStr,  setHrStr]  = useState('');
  const [sbpStr, setSbpStr] = useState('');

  const hr  = parseFloat(hrStr)  || 0;
  const sbp = parseFloat(sbpStr) || 0;

  const liveResult = useMemo(() => {
    if (hr <= 0 || sbp <= 0) return null;
    try { return calculateShockIndex({ heartRate: hr, sbp }); }
    catch { return null; }
  }, [hr, sbp]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'shock-index',
          label: 'Shock Index',
          value: liveResult.shockIndex,
          unit: '',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { heartRate: hr, sbp },
      formulaUsed: 'Shock Index = HR / SBP',
      references: liveResult.references,
    });
  }, [liveResult, hr, sbp]);

  return (
    <div className="space-y-6">
      <FieldRow label="Heart Rate/Pulse">
        <NumInput value={hrStr} onChange={setHrStr} suffix="beats/min" step="1" min={20} max={300} placeholder="Norm: 60 - 100" />
      </FieldRow>

      <FieldRow label="Systolic BP">
        <NumInput value={sbpStr} onChange={setSbpStr} suffix="mm Hg" step="1" min={40} max={300} placeholder="Norm: 100 - 120" />
      </FieldRow>
    </div>
  );
}
