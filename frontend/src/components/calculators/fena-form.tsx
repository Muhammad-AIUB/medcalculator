'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateFENa } from '@/lib/calculators/fena';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function FenaForm({ onResult }: Props) {
  // Serum Sodium: mEq/L OR mmol/L (1:1)
  const [sNaMeqStr,  setSNaMeqStr]  = useState('');
  const [sNaMmolStr, setSNaMmolStr] = useState('');

  // Serum Creatinine: µmol/L OR mg/dL
  const [sCrMgStr, setSCrMgStr] = useState('');
  const [sCrUmStr, setSCrUmStr] = useState('');

  // Urine Sodium: mmol/L OR mEq/L (1:1)
  const [uNaMeqStr,  setUNaMeqStr]  = useState('');
  const [uNaMmolStr, setUNaMmolStr] = useState('');

  // Urine Creatinine: µmol/L OR mg/dL
  const [uCrMgStr, setUCrMgStr] = useState('');
  const [uCrUmStr, setUCrUmStr] = useState('');

  // Serum Na (1:1)
  const onSNaMeqChange   = (v: string) => { setSNaMeqStr(v);  setSNaMmolStr(v); };
  const onSNaMmolChange  = (v: string) => { setSNaMmolStr(v); setSNaMeqStr(v);  };

  // Serum Creatinine (×88.4)
  const onSCrMgChange = useCallback((v: string) => {
    setSCrMgStr(v);
    const n = parseFloat(v);
    setSCrUmStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '');
  }, []);
  const onSCrUmChange = useCallback((v: string) => {
    setSCrUmStr(v);
    const n = parseFloat(v);
    setSCrMgStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '');
  }, []);

  // Urine Na (1:1)
  const onUNaMeqChange   = (v: string) => { setUNaMeqStr(v);  setUNaMmolStr(v); };
  const onUNaMmolChange  = (v: string) => { setUNaMmolStr(v); setUNaMeqStr(v);  };

  // Urine Creatinine (×88.4)
  const onUCrMgChange = useCallback((v: string) => {
    setUCrMgStr(v);
    const n = parseFloat(v);
    setUCrUmStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '');
  }, []);
  const onUCrUmChange = useCallback((v: string) => {
    setUCrUmStr(v);
    const n = parseFloat(v);
    setUCrMgStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '');
  }, []);

  const sNa  = parseFloat(sNaMeqStr)  || 0;
  const sCr  = parseFloat(sCrMgStr)   || 0;
  const uNa  = parseFloat(uNaMeqStr)  || 0;
  const uCr  = parseFloat(uCrMgStr)   || 0;

  const liveResult = useMemo(() => {
    if (sNa <= 0 || sCr <= 0 || uNa <= 0 || uCr <= 0) return null;
    try { return calculateFENa({ serumSodium: sNa, serumCreatinine: sCr, urineSodium: uNa, urineCreatinine: uCr }); }
    catch { return null; }
  }, [sNa, sCr, uNa, uCr]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'fena',
        label: 'FENa',
        value: liveResult.score ?? 0,
        unit: '%',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { serumSodium: sNa, serumCreatinine: sCr, urineSodium: uNa, urineCreatinine: uCr },
      formulaUsed: 'FENa (%) = 100 x (SCr x UNa) / (SNa x UCr)\n\nSCr = serum creatinine, UNa = urine sodium\nSNa = serum sodium, UCr = urine creatinine',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Serum Sodium (SNa)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={sNaMeqStr}  onChange={onSNaMeqChange}  suffix="mEq/L"  step="1" min={100} max={180} />
          <OrDivider />
          <NumInput value={sNaMmolStr} onChange={onSNaMmolChange} suffix="mmol/L" step="1" min={100} max={180} />
        </div>
      </FieldRow>

      <FieldRow label="Serum Creatinine (SCr)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={sCrUmStr} onChange={onSCrUmChange} suffix="µmol/L" step="1"    min={1}   max={2650} />
          <OrDivider />
          <NumInput value={sCrMgStr} onChange={onSCrMgChange} suffix="mg/dL"  step="0.01" min={0.1} max={30}   />
        </div>
      </FieldRow>

      <FieldRow label="Urine Sodium (UNa)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={uNaMmolStr} onChange={onUNaMmolChange} suffix="mmol/L" step="1" min={0} max={300} />
          <OrDivider />
          <NumInput value={uNaMeqStr}  onChange={onUNaMeqChange}  suffix="mEq/L"  step="1" min={0} max={300} />
        </div>
      </FieldRow>

      <FieldRow label="Urine Creatinine (UCr)">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={uCrUmStr} onChange={onUCrUmChange} suffix="µmol/L" step="1"    min={1}    max={50000} />
          <OrDivider />
          <NumInput value={uCrMgStr} onChange={onUCrMgChange} suffix="mg/dL"  step="0.1"  min={0.1}  max={565}   />
        </div>
      </FieldRow>
    </div>
  );
}
