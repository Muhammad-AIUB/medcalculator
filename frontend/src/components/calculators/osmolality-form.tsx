'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateOsmolality } from '@/lib/calculators/osmolality';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function OsmolalityForm({ onResult }: Props) {
  const [naStr, setNaStr]         = useState('');
  const [bunMgStr, setBunMgStr]   = useState('');
  const [bunMmStr, setBunMmStr]   = useState('');
  const [glcMgStr, setGlcMgStr]   = useState('');
  const [glcMmStr, setGlcMmStr]   = useState('');

  // BUN: mg/dL <-> mmol/L  (1 mmol/L = 2.8 mg/dL)
  const onBunMgChange = useCallback((v: string) => {
    setBunMgStr(v);
    const n = parseFloat(v);
    setBunMmStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.8, 2) : '');
  }, []);
  const onBunMmChange = useCallback((v: string) => {
    setBunMmStr(v);
    const n = parseFloat(v);
    setBunMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.8, 1) : '');
  }, []);

  // Glucose: mg/dL <-> mmol/L  (1 mmol/L = 18 mg/dL)
  const onGlcMgChange = useCallback((v: string) => {
    setGlcMgStr(v);
    const n = parseFloat(v);
    setGlcMmStr(Number.isFinite(n) && n > 0 ? fmt(n / 18, 2) : '');
  }, []);
  const onGlcMmChange = useCallback((v: string) => {
    setGlcMmStr(v);
    const n = parseFloat(v);
    setGlcMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 18, 1) : '');
  }, []);

  const na      = parseFloat(naStr) || 0;
  const bunMg   = parseFloat(bunMgStr) || 0;
  const glcMg   = parseFloat(glcMgStr) || 0;

  const liveResult = useMemo(() => {
    if (na <= 0 || bunMg <= 0 || glcMg <= 0) return null;
    try { return calculateOsmolality({ sodium: na, bun: bunMg, glucose: glcMg }); }
    catch { return null; }
  }, [na, bunMg, glcMg]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'osmolality',
        label: 'Serum Osmolality',
        value: liveResult.score ?? 0,
        unit: 'mOsm/kg',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { sodium: na, bun: bunMg, glucose: glcMg },
      formulaUsed: 'Osmolality = 2 x Na + BUN/2.8 + Glucose/18',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Sodium (Na)">
        <NumInput value={naStr} onChange={setNaStr} suffix="mEq/L" step="1" min={100} max={200} />
      </FieldRow>

      <FieldRow label="BUN (Blood Urea Nitrogen)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={bunMgStr} onChange={onBunMgChange} suffix="mg/dL" step="1" min={1} max={300} />
          <OrDivider />
          <NumInput value={bunMmStr} onChange={onBunMmChange} suffix="mmol/L" step="0.1" min={0.1} max={107} />
        </div>
      </FieldRow>

      <FieldRow label="Glucose">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={glcMgStr} onChange={onGlcMgChange} suffix="mg/dL" step="1" min={1} max={2000} />
          <OrDivider />
          <NumInput value={glcMmStr} onChange={onGlcMmChange} suffix="mmol/L" step="0.1" min={0.1} max={111} />
        </div>
      </FieldRow>
    </div>
  );
}
