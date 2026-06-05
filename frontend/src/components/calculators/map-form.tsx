'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateMAP } from '@/lib/calculators/map';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function MapForm({ onResult }: Props) {
  const [sbpStr, setSbpStr] = useState('');
  const [dbpStr, setDbpStr] = useState('');

  const sbp = parseFloat(sbpStr) || 0;
  const dbp = parseFloat(dbpStr) || 0;

  const liveResult = useMemo(() => {
    if (sbp <= 0 || dbp <= 0) return null;
    try { return calculateMAP({ sbp, dbp }); }
    catch { return null; }
  }, [sbp, dbp]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'map',
          label: 'Mean Arterial Pressure (MAP)',
          value: liveResult.map,
          unit: 'mm Hg',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { sbp, dbp },
      formulaUsed: 'MAP = 1/3 x SBP + 2/3 x DBP',
      references: liveResult.references,
    });
  }, [liveResult, dbp, sbp]);

  return (
    <div className="space-y-6">
      <FieldRow label="Systolic BP">
        <NumInput value={sbpStr} onChange={setSbpStr} suffix="mm Hg" step="1" min={40} max={300} placeholder="Norm: 100 - 120" />
      </FieldRow>

      <FieldRow label="Diastolic BP">
        <NumInput value={dbpStr} onChange={setDbpStr} suffix="mm Hg" step="1" min={20} max={200} placeholder="Norm: 60 - 80" />
      </FieldRow>
    </div>
  );
}
