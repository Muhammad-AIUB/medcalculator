'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateBSA } from '@/lib/calculators/bsa';
import { FieldRow, NumInput, OrDivider } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function BsaForm({ onResult }: Props) {
  // ── Weight: lb OR kg
  const [wtLbStr, setWtLbStr] = useState('');
  const [wtKgStr, setWtKgStr] = useState('');

  // ── Height: cm OR ft + inch
  const [htCmStr, setHtCmStr] = useState('');
  const [htFtStr, setHtFtStr] = useState('');
  const [htInStr, setHtInStr] = useState('');

  // ── Resolve to canonical units (kg, cm) ───────────────────────────────────
  const weightKg = wtKgStr !== '' ? parseFloat(wtKgStr)
                 : wtLbStr !== '' ? parseFloat(wtLbStr) * 0.453592
                 : NaN;

  const heightCm = htCmStr !== '' ? parseFloat(htCmStr)
                 : (htFtStr !== '' || htInStr !== '')
                   ? (parseFloat(htFtStr || '0') * 30.48 + parseFloat(htInStr || '0') * 2.54)
                   : NaN;

  const ready = Number.isFinite(weightKg) && weightKg > 0 &&
                Number.isFinite(heightCm) && heightCm > 0;

  const liveResult = useMemo(() => {
    if (!ready) return null;
    try { return calculateBSA({ heightCm, weightKg }); }
    catch { return null; }
  }, [heightCm, weightKg, ready]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'bsa',
        label: 'Body Surface Area (BSA)',
        value: liveResult.bsa,
        unit: 'm²',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { heightCm, weightKg },
      formulaUsed: 'BSA (m²) = √[(Height in cm × Weight in kg) / 3600]   (Mosteller)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wtLbStr}
            onChange={v => { setWtLbStr(v); setWtKgStr(''); }}
            suffix="lb" step="0.1" min={0} max={1100} placeholder="Pound"
          />
          <OrDivider />
          <NumInput
            value={wtKgStr}
            onChange={v => { setWtKgStr(v); setWtLbStr(''); }}
            suffix="kg" step="0.1" min={0} max={500} placeholder="kg"
          />
        </div>
      </FieldRow>

      <FieldRow label="Height">
        <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2">
          <NumInput
            value={htCmStr}
            onChange={v => { setHtCmStr(v); setHtFtStr(''); setHtInStr(''); }}
            suffix="cm" step="0.1" min={0} max={300} placeholder="cm"
          />
          <OrDivider />
          <NumInput
            value={htFtStr}
            onChange={v => { setHtFtStr(v); setHtCmStr(''); }}
            suffix="ft" step="1" min={0} max={9} placeholder="ft"
          />
          <NumInput
            value={htInStr}
            onChange={v => { setHtInStr(v); setHtCmStr(''); }}
            suffix="in" step="0.1" min={0} max={11.9} placeholder="in"
          />
        </div>
      </FieldRow>
    </div>
  );
}
