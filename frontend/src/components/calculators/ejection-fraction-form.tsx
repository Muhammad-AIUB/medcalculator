'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateEjectionFraction } from '@/lib/calculators/ejection-fraction';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function EjectionFractionForm({ onResult }: Props) {
  const [edvStr, setEdvStr] = useState('');
  const [esvStr, setEsvStr] = useState('');

  const edv = parseFloat(edvStr) || 0;
  const esv = parseFloat(esvStr) || 0;

  const liveResult = useMemo(() => {
    if (edv <= 0 || esv < 0 || esv >= edv) return null;
    try { return calculateEjectionFraction({ edv, esv }); }
    catch { return null; }
  }, [edv, esv]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'ejection-fraction',
          label: 'Ejection Fraction (LVEF)',
          value: liveResult.ef,
          unit: '%',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        {
          id: 'stroke-volume',
          label: 'Stroke Volume',
          value: liveResult.strokeVolume,
          unit: 'mL',
          interpretation: { text: `SV = EDV − ESV = ${liveResult.strokeVolume} mL`, severity: 'success' },
        },
      ],
      inputs: { edv, esv },
      formulaUsed: 'LVEF (%) = (EDV − ESV) / EDV × 100\nStroke Volume = EDV − ESV',
      references: liveResult.references,
    });
  }, [liveResult, edv, esv]);

  return (
    <div className="space-y-6">
      <FieldRow label="End-diastolic volume (EDV)">
        <NumInput value={edvStr} onChange={setEdvStr} suffix="mL" step="1" min={0} max={600} placeholder="Norm: 65 - 240" />
      </FieldRow>

      <FieldRow label="End-systolic volume (ESV)">
        <NumInput value={esvStr} onChange={setEsvStr} suffix="mL" step="1" min={0} max={600} placeholder="Norm: 16 - 143" />
      </FieldRow>
    </div>
  );
}
