'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateBSACosteff } from '@/lib/calculators/bsa-costeff';
import { FieldRow, NumInput, OrDivider } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function BsaCosteffForm({ onResult }: Props) {
  // ── Weight: kg OR lb
  const [wtKgStr, setWtKgStr] = useState('');
  const [wtLbStr, setWtLbStr] = useState('');

  // ── Resolve to canonical unit (kg) ─────────────────────────────────────────
  const weightKg = wtKgStr !== '' ? parseFloat(wtKgStr)
                 : wtLbStr !== '' ? parseFloat(wtLbStr) * 0.453592
                 : NaN;

  const ready = Number.isFinite(weightKg) && weightKg > 0;

  const liveResult = useMemo(() => {
    if (!ready) return null;
    try { return calculateBSACosteff({ weightKg }); }
    catch { return null; }
  }, [weightKg, ready]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'bsa-costeff',
        label: 'Body Surface Area (BSA)',
        value: liveResult.bsa,
        unit: 'm²',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { weightKg },
      formulaUsed: 'BSA (m²) = (4 × W + 7) / (90 + W)   (Costeff, W in kg)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wtKgStr}
            onChange={v => { setWtKgStr(v); setWtLbStr(''); }}
            suffix="kg" step="0.1" min={0} max={500} placeholder="kg"
          />
          <OrDivider />
          <NumInput
            value={wtLbStr}
            onChange={v => { setWtLbStr(v); setWtKgStr(''); }}
            suffix="lb" step="0.1" min={0} max={1100} placeholder="lb"
          />
        </div>
      </FieldRow>
    </div>
  );
}
