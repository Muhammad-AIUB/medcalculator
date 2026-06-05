'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateURR } from '@/lib/calculators/urr';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function UrrForm({ onResult }: Props) {
  // Upre: mg/dL OR g/L  (1 g/L = 100 mg/dL)
  const [upreMgStr, setUpreMgStr] = useState('');
  const [upreGlStr, setUpreGlStr] = useState('');

  // Upost: mg/dL OR g/L
  const [upostMgStr, setUpostMgStr] = useState('');
  const [upostGlStr, setUpostGlStr] = useState('');

  const onUpreMgChange = useCallback((v: string) => {
    setUpreMgStr(v);
    const n = parseFloat(v);
    setUpreGlStr(Number.isFinite(n) && n > 0 ? fmt(n / 100, 3) : '');
  }, []);
  const onUpreGlChange = useCallback((v: string) => {
    setUpreGlStr(v);
    const n = parseFloat(v);
    setUpreMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 100, 1) : '');
  }, []);

  const onUpostMgChange = useCallback((v: string) => {
    setUpostMgStr(v);
    const n = parseFloat(v);
    setUpostGlStr(Number.isFinite(n) && n > 0 ? fmt(n / 100, 3) : '');
  }, []);
  const onUpostGlChange = useCallback((v: string) => {
    setUpostGlStr(v);
    const n = parseFloat(v);
    setUpostMgStr(Number.isFinite(n) && n > 0 ? fmt(n * 100, 1) : '');
  }, []);

  const upre  = parseFloat(upreMgStr)  || 0;
  const upost = parseFloat(upostMgStr) || 0;

  const liveResult = useMemo(() => {
    if (upre <= 0 || upost <= 0 || upost >= upre) return null;
    try { return calculateURR({ upre, upost }); }
    catch { return null; }
  }, [upre, upost]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'urr',
          label: 'Urea Reduction Ratio (URR)',
          value: liveResult.urr,
          unit: '%',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { upre, upost },
      formulaUsed:
        'URR = (Upre - Upost) / Upre x 100\n' +
        '    = (1 - Upost / Upre) x 100',
      references: liveResult.references,
    });
  }, [liveResult, upost, upre]);

  return (
    <div className="space-y-6">
      <FieldRow label="Pre-dialysis Urea (Upre)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={upreMgStr} onChange={onUpreMgChange} suffix="mg/dL" step="1"     min={1}    max={500}  />
          <OrDivider />
          <NumInput value={upreGlStr} onChange={onUpreGlChange} suffix="g/L"   step="0.001" min={0.01} max={5}    />
        </div>
      </FieldRow>

      <FieldRow label="Post-dialysis Urea (Upost)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={upostMgStr} onChange={onUpostMgChange} suffix="mg/dL" step="1"     min={1}    max={500} />
          <OrDivider />
          <NumInput value={upostGlStr} onChange={onUpostGlChange} suffix="g/L"   step="0.001" min={0.01} max={5}   />
        </div>
      </FieldRow>
    </div>
  );
}
