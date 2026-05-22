'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateOsmolarGap } from '@/lib/calculators/osmolar-gap';
import { FieldRow, NumInput, OrDivider, OptionButtons } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function OsmolarGapForm({ onResult }: Props) {
  const [method, setMethod] = useState<'measured' | 'assumed'>('measured');

  // Stool Osm: mOsm/kg OR mmol/kg (1:1)
  const [osmMosmStr, setOsmMosmStr] = useState('');
  const [osmMmolStr, setOsmMmolStr] = useState('');

  // Stool Na: mEq/L OR mmol/L (1:1)
  const [naMeqStr, setNaMeqStr] = useState('');
  const [naMmolStr, setNaMmolStr] = useState('');

  // Stool K: mEq/L OR mmol/L (1:1)
  const [kMeqStr, setKMeqStr] = useState('');
  const [kMmolStr, setKMmolStr] = useState('');

  // Osm sync (1:1)
  const onOsmMosmChange = (v: string) => { setOsmMosmStr(v); setOsmMmolStr(v); };
  const onOsmMmolChange = (v: string) => { setOsmMmolStr(v); setOsmMosmStr(v); };

  // Na sync (1:1)
  const onNaMeqChange  = (v: string) => { setNaMeqStr(v);  setNaMmolStr(v); };
  const onNaMmolChange = (v: string) => { setNaMmolStr(v); setNaMeqStr(v);  };

  // K sync (1:1)
  const onKMeqChange  = (v: string) => { setKMeqStr(v);  setKMmolStr(v); };
  const onKMmolChange = (v: string) => { setKMmolStr(v); setKMeqStr(v);  };

  const measured = parseFloat(osmMosmStr) || 0;
  const na       = parseFloat(naMeqStr)   || 0;
  const k        = parseFloat(kMeqStr)    || 0;

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
      {/* Method selector */}
      <FieldRow label="Formula Method">
        <OptionButtons
          options={[
            { value: 'measured' as const, label: 'Use Measured Osm' },
            { value: 'assumed' as const,  label: 'Assume 290 mOsm/kg' },
          ]}
          value={method}
          onChange={(v) => { setMethod(v); setOsmMosmStr(''); setOsmMmolStr(''); }}
          columns={2}
        />
      </FieldRow>

      {/* Stool Osmolality — only when method = measured */}
      {method === 'measured' && (
        <FieldRow label="Stool Osmolality">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <NumInput value={osmMosmStr} onChange={onOsmMosmChange} suffix="mOsm/kg" step="1" min={50} max={600} />
            <OrDivider />
            <NumInput value={osmMmolStr} onChange={onOsmMmolChange} suffix="mmol/kg" step="1" min={50} max={600} />
          </div>
        </FieldRow>
      )}

      {/* Stool Sodium */}
      <FieldRow label="Stool Sodium (Na)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={naMeqStr}  onChange={onNaMeqChange}  suffix="mEq/L"  step="1" min={0} max={200} />
          <OrDivider />
          <NumInput value={naMmolStr} onChange={onNaMmolChange} suffix="mmol/L" step="1" min={0} max={200} />
        </div>
      </FieldRow>

      {/* Stool Potassium */}
      <FieldRow label="Stool Potassium (K)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={kMeqStr}  onChange={onKMeqChange}  suffix="mEq/L"  step="1" min={0} max={150} />
          <OrDivider />
          <NumInput value={kMmolStr} onChange={onKMmolChange} suffix="mmol/L" step="1" min={0} max={150} />
        </div>
      </FieldRow>
    </div>
  );
}
