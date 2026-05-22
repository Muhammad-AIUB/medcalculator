'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateIronDeficit } from '@/lib/calculators/iron-deficit';
import { FieldRow, NumInput, OrDivider } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function IronDeficitForm({ onResult }: Props) {
  // Weight: kg OR lbs
  const [wKgStr,       setWKgStr]       = useState('');
  const [wLbStr,       setWLbStr]       = useState('');

  // Target Hb: g/L OR g/dL
  const [tHbGlStr,     setTHbGlStr]     = useState('');
  const [tHbGdlStr,    setTHbGdlStr]    = useState('');

  // Actual Hb: g/L OR g/dL
  const [aHbGlStr,     setAHbGlStr]     = useState('');
  const [aHbGdlStr,    setAHbGdlStr]    = useState('');

  // Iron stores (mg) — default 500
  const [ironStoresStr, setIronStoresStr] = useState('500');

  // Resolve to base units
  const weightKg     = wKgStr  !== '' ? parseFloat(wKgStr)  || 0 : (parseFloat(wLbStr)  || 0) / 2.205;
  const targetHbGdl  = tHbGlStr  !== '' ? (parseFloat(tHbGlStr)  || 0) / 10 : parseFloat(tHbGdlStr)  || 0;
  const actualHbGdl  = aHbGlStr  !== '' ? (parseFloat(aHbGlStr)  || 0) / 10 : parseFloat(aHbGdlStr)  || 0;
  const ironStoresMg = parseFloat(ironStoresStr) || 0;

  const liveResult = useMemo(() => {
    if (weightKg <= 0 || targetHbGdl <= 0 || actualHbGdl <= 0) return null;
    try {
      return calculateIronDeficit({ weightKg, targetHbGdl, actualHbGdl, ironStoresMg });
    } catch { return null; }
  }, [weightKg, targetHbGdl, actualHbGdl, ironStoresMg]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'iron-deficit',
        label: 'Total Iron Deficit',
        value: liveResult.ironDeficitMg,
        unit: 'mg',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { weightKg, targetHbGdl, actualHbGdl, ironStoresMg },
      formulaUsed:
        `Total iron deficit (mg) = Weight (kg) × (Target Hb − Actual Hb) g/dL × 2.4 + Iron stores (mg)\n` +
        `= ${weightKg.toFixed(1)} × (${targetHbGdl.toFixed(1)} − ${actualHbGdl.toFixed(1)}) × 2.4 + ${ironStoresMg}\n` +
        `= ${liveResult.ironDeficitMg.toLocaleString()} mg`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wKgStr}
            onChange={v => { setWKgStr(v); setWLbStr(''); }}
            suffix="kg" step="0.1" min={0} max={300} placeholder="Norm: 1 - 150"
          />
          <OrDivider />
          <NumInput
            value={wLbStr}
            onChange={v => { setWLbStr(v); setWKgStr(''); }}
            suffix="lbs" step="1" min={0} max={660} placeholder="Norm: 2 - 330"
          />
        </div>
      </FieldRow>

      <FieldRow label="Target hemoglobin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={tHbGlStr}
            onChange={v => { setTHbGlStr(v); setTHbGdlStr(''); }}
            suffix="g/L" step="1" min={0} max={250} placeholder="Norm: 120 - 170"
          />
          <OrDivider />
          <NumInput
            value={tHbGdlStr}
            onChange={v => { setTHbGdlStr(v); setTHbGlStr(''); }}
            suffix="g/dL" step="0.1" min={0} max={25} placeholder="Norm: 12 - 17"
          />
        </div>
      </FieldRow>

      <FieldRow label="Actual hemoglobin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={aHbGlStr}
            onChange={v => { setAHbGlStr(v); setAHbGdlStr(''); }}
            suffix="g/L" step="1" min={0} max={250} placeholder="Norm: 120 - 170"
          />
          <OrDivider />
          <NumInput
            value={aHbGdlStr}
            onChange={v => { setAHbGdlStr(v); setAHbGlStr(''); }}
            suffix="g/dL" step="0.1" min={0} max={25} placeholder="Norm: 12 - 17"
          />
        </div>
      </FieldRow>

      <FieldRow label="Iron stores" hint="500 mg for adults/≥35 kg; 15 mg/kg if <35 kg">
        <NumInput
          value={ironStoresStr} onChange={setIronStoresStr}
          suffix="mg" step="1" min={0} max={2000} placeholder="500"
        />
      </FieldRow>
    </div>
  );
}
