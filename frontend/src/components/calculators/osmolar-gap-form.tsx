'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateOsmolarGap } from '@/lib/calculators/osmolar-gap';
import { FieldRow, NumInput, OptionButtons } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function OsmolarGapForm({ onResult }: Props) {
  const [method, setMethod]       = useState<'measured' | 'assumed'>('measured');
  const [measuredStr, setMeasuredStr] = useState('');
  const [naStr, setNaStr]         = useState('');
  const [kStr, setKStr]           = useState('');

  const measured  = parseFloat(measuredStr) || 0;
  const na        = parseFloat(naStr) || 0;
  const k         = parseFloat(kStr) || 0;

  const canCalc = na > 0 && k >= 0 && (method === 'assumed' || measured > 0);

  const liveResult = useMemo(() => {
    if (!canCalc) return null;
    try {
      return calculateOsmolarGap({
        method,
        measuredOsm: method === 'measured' ? measured : undefined,
        sodium: na,
        potassium: k,
      });
    } catch { return null; }
  }, [canCalc, method, measured, na, k]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'osmolar-gap',
        label: 'Stool Osmolal Gap',
        value: liveResult.score ?? 0,
        unit: 'mOsm/kg',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { method, measuredOsm: measured, sodium: na, potassium: k },
      formulaUsed: liveResult.formulaUsed,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Formula Method">
        <OptionButtons
          options={[
            { value: 'measured' as const, label: 'Use Measured Osm' },
            { value: 'assumed' as const,  label: 'Assume 290 mOsm/kg' },
          ]}
          value={method}
          onChange={(v) => { setMethod(v); setMeasuredStr(''); }}
          columns={2}
        />
      </FieldRow>

      {method === 'measured' && (
        <FieldRow label="Measured Stool Osmolality">
          <NumInput value={measuredStr} onChange={setMeasuredStr} suffix="mOsm/kg" step="1" min={50} max={600} />
        </FieldRow>
      )}

      <FieldRow label="Stool Sodium (Na)">
        <NumInput value={naStr} onChange={setNaStr} suffix="mEq/L" step="1" min={0} max={200} />
      </FieldRow>

      <FieldRow label="Stool Potassium (K)">
        <NumInput value={kStr} onChange={setKStr} suffix="mEq/L" step="1" min={0} max={150} />
      </FieldRow>
    </div>
  );
}
