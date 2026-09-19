'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateLDL } from '@/lib/calculators/ldl';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

// Conversion factors
const CHOL_FACTOR = 38.67;  // 1 mmol/L cholesterol = 38.67 mg/dL
const TG_FACTOR   = 88.57;  // 1 mmol/L TG          = 88.57 mg/dL

export function LdlForm({ onResult }: Props) {
  // Total Cholesterol
  const [tcMmStr,  setTcMmStr]  = useState('');
  const [tcMgStr,  setTcMgStr]  = useState('');
  // HDL
  const [hdlMmStr, setHdlMmStr] = useState('');
  const [hdlMgStr, setHdlMgStr] = useState('');
  // Triglycerides
  const [tgMmStr,  setTgMmStr]  = useState('');
  const [tgMgStr,  setTgMgStr]  = useState('');

  const [lastTc,  setLastTc]  = useState<'mg' | 'mm'>('mg');
  const [lastHdl, setLastHdl] = useState<'mg' | 'mm'>('mg');
  const [lastTg,  setLastTg]  = useState<'mg' | 'mm'>('mg');

  const onTcMmChange = useCallback((v: string) => {
    setLastTc('mm');
    setTcMmStr(v);
    const n = parseFloat(v);
    setTcMgStr(Number.isFinite(n) && n > 0 ? fmt(n * CHOL_FACTOR, 1) : '');
  }, []);
  const onTcMgChange = useCallback((v: string) => {
    setLastTc('mg');
    setTcMgStr(v);
    const n = parseFloat(v);
    setTcMmStr(Number.isFinite(n) && n > 0 ? fmt(n / CHOL_FACTOR, 2) : '');
  }, []);

  const onHdlMmChange = useCallback((v: string) => {
    setLastHdl('mm');
    setHdlMmStr(v);
    const n = parseFloat(v);
    setHdlMgStr(Number.isFinite(n) && n > 0 ? fmt(n * CHOL_FACTOR, 1) : '');
  }, []);
  const onHdlMgChange = useCallback((v: string) => {
    setLastHdl('mg');
    setHdlMgStr(v);
    const n = parseFloat(v);
    setHdlMmStr(Number.isFinite(n) && n > 0 ? fmt(n / CHOL_FACTOR, 2) : '');
  }, []);

  const onTgMmChange = useCallback((v: string) => {
    setLastTg('mm');
    setTgMmStr(v);
    const n = parseFloat(v);
    setTgMgStr(Number.isFinite(n) && n > 0 ? fmt(n * TG_FACTOR, 1) : '');
  }, []);
  const onTgMgChange = useCallback((v: string) => {
    setLastTg('mg');
    setTgMgStr(v);
    const n = parseFloat(v);
    setTgMmStr(Number.isFinite(n) && n > 0 ? fmt(n / TG_FACTOR, 2) : '');
  }, []);

  // Calculate from the box the user typed in. The mg/dL mirror is rounded to 1 dp for
  // display, and computing from it shifts the result (TC 3.0, HDL 0.5, TG 0.6 mmol/L
  // gave 86.1 mg/dL where MDCalc gives 86.0).
  const tcMgDl  = lastTc  === 'mm' ? (parseFloat(tcMmStr)  || 0) * CHOL_FACTOR : (parseFloat(tcMgStr)  || 0);
  const hdlMgDl = lastHdl === 'mm' ? (parseFloat(hdlMmStr) || 0) * CHOL_FACTOR : (parseFloat(hdlMgStr) || 0);
  const tgMgDl  = lastTg  === 'mm' ? (parseFloat(tgMmStr)  || 0) * TG_FACTOR   : (parseFloat(tgMgStr)  || 0);

  const liveResult = useMemo(() => {
    if (tcMgDl <= 0 || hdlMgDl <= 0 || tgMgDl <= 0) return null;
    try { return calculateLDL({ tcMgDl, hdlMgDl, tgMgDl }); }
    catch { return null; }
  }, [tcMgDl, hdlMgDl, tgMgDl]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) {
      onResultRef.current(null);
      return;
    }
    onResultRef.current({
      outputs: [
        {
          id: 'ldl-mg',
          label: 'LDL Cholesterol',
          value: liveResult.ldlMgDl,
          unit: 'mg/dL',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        {
          id: 'ldl-mm',
          label: 'LDL Cholesterol',
          value: liveResult.ldlMmol,
          unit: 'mmol/L',
          interpretation: { text: '', severity: 'neutral' as const },
        },
      ],
      inputs: { tcMgDl, hdlMgDl, tgMgDl },
      warnings: liveResult.warnings,
      formulaUsed:
        'LDL (mg/dL) = Total Cholesterol (mg/dL) - HDL (mg/dL) - Triglycerides (mg/dL) / 5\n\n' +
        'Note: Not valid when Triglycerides > 400 mg/dL (Friedewald equation)',
      references: liveResult.references,
    });
  }, [liveResult, hdlMgDl, tcMgDl, tgMgDl]);

  return (
    <div className="space-y-6">
      <FieldRow label="Total Cholesterol">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={tcMmStr} onChange={onTcMmChange} suffix="mmol/L" step="0.01" min={0} max={20}   />
          <OrDivider />
          <NumInput value={tcMgStr} onChange={onTcMgChange} suffix="mg/dL"  step="1"    min={0} max={800}  />
        </div>
      </FieldRow>

      <FieldRow label="HDL Cholesterol">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={hdlMmStr} onChange={onHdlMmChange} suffix="mmol/L" step="0.01" min={0} max={5}   />
          <OrDivider />
          <NumInput value={hdlMgStr} onChange={onHdlMgChange} suffix="mg/dL"  step="1"    min={0} max={200} />
        </div>
      </FieldRow>

      <FieldRow label="Triglycerides">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={tgMmStr} onChange={onTgMmChange} suffix="mmol/L" step="0.01" min={0} max={50}   />
          <OrDivider />
          <NumInput value={tgMgStr} onChange={onTgMgChange} suffix="mg/dL"  step="1"    min={0} max={4500} />
        </div>
      </FieldRow>
    </div>
  );
}
