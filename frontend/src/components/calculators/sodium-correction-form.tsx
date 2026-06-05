'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateSodiumCorrection } from '@/lib/calculators/sodium-correction';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function SodiumCorrectionForm({ onResult }: Props) {
  // Sodium: mEq/L OR mmol/L (1:1)
  const [naMeqStr,  setNaMeqStr]  = useState('');
  const [naMmolStr, setNaMmolStr] = useState('');

  // Glucose: mg/dL OR mmol/L (factor 18)
  const [glcMgStr, setGlcMgStr] = useState('');
  const [glcMmStr, setGlcMmStr] = useState('');

  const onNaMeqChange   = (v: string) => { setNaMeqStr(v);  setNaMmolStr(v); };
  const onNaMmolChange  = (v: string) => { setNaMmolStr(v); setNaMeqStr(v);  };

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

  const na     = parseFloat(naMeqStr)  || 0;
  const glcMg  = parseFloat(glcMgStr)  || 0;

  const liveResult = useMemo(() => {
    if (na <= 0 || glcMg <= 0) return null;
    try { return calculateSodiumCorrection({ sodium: na, glucose: glcMg }); }
    catch { return null; }
  }, [na, glcMg]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'katz',
          label: 'Corrected Sodium (Katz, 1973)',
          value: liveResult.katz,
          unit: 'mEq/L',
          interpretation: { text: '', severity: 'neutral' as const },
        },
        {
          id: 'hillier',
          label: 'Corrected Sodium (Hillier, 1999)',
          value: liveResult.hillier,
          unit: 'mEq/L',
          interpretation: { text: '', severity: 'neutral' as const },
        },
      ],
      inputs: { sodium: na, glucose: glcMg },
      formulaUsed:
        'Corrected Na (Katz, 1973) = Measured Na + 0.016 x (Serum glucose - 100)\nCorrected Na (Hillier, 1999) = Measured Na + 0.024 x (Serum glucose - 100)\n\nNote: Serum glucose must be in mg/dL',
    });
  }, [liveResult, glcMg, na]);

  return (
    <div className="space-y-6">
      <FieldRow label="Sodium">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={naMmolStr} onChange={onNaMmolChange} suffix="mmol/L" step="1" min={100} max={180} />
          <OrDivider />
          <NumInput value={naMeqStr}  onChange={onNaMeqChange}  suffix="mEq/L"  step="1" min={100} max={180} />
        </div>
      </FieldRow>

      <FieldRow label="Serum Glucose">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={glcMmStr} onChange={onGlcMmChange} suffix="mmol/L" step="0.1" min={5.6} max={111}  />
          <OrDivider />
          <NumInput value={glcMgStr} onChange={onGlcMgChange} suffix="mg/dL"  step="1"   min={100} max={2000} />
        </div>
      </FieldRow>
    </div>
  );
}
