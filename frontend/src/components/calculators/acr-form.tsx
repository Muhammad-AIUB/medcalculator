'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateACR } from '@/lib/calculators/acr';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

// Creatinine conversion constants
// 1 g/dL = 1000 mg/dL
// 1 mg/dL = 88.4 µmol/L  (MW creatinine = 113.12 g/mol)

export function AcrForm({ onResult }: Props) {
  // Urine Albumin: mg/dL only
  const [albuminStr, setAlbuminStr] = useState('');

  // Urine Creatinine: g/dL | mg/dL | µmol/L
  const [crGdlStr,   setCrGdlStr]   = useState('');
  const [crMgdlStr,  setCrMgdlStr]  = useState('');
  const [crUmolStr,  setCrUmolStr]  = useState('');

  const onCrGdlChange = useCallback((v: string) => {
    setCrGdlStr(v);
    const n = parseFloat(v);
    if (Number.isFinite(n) && n > 0) {
      setCrMgdlStr(fmt(n * 1000,      1));
      setCrUmolStr(fmt(n * 1000 * 88.4, 1));
    } else {
      setCrMgdlStr('');
      setCrUmolStr('');
    }
  }, []);

  const onCrMgdlChange = useCallback((v: string) => {
    setCrMgdlStr(v);
    const n = parseFloat(v);
    if (Number.isFinite(n) && n > 0) {
      setCrGdlStr(fmt(n / 1000,  4));
      setCrUmolStr(fmt(n * 88.4, 1));
    } else {
      setCrGdlStr('');
      setCrUmolStr('');
    }
  }, []);

  const onCrUmolChange = useCallback((v: string) => {
    setCrUmolStr(v);
    const n = parseFloat(v);
    if (Number.isFinite(n) && n > 0) {
      const mgdl = n / 88.4;
      setCrMgdlStr(fmt(mgdl,          2));
      setCrGdlStr(fmt(mgdl / 1000,    5));
    } else {
      setCrMgdlStr('');
      setCrGdlStr('');
    }
  }, []);

  const albumin   = parseFloat(albuminStr) || 0;
  const crGdl     = parseFloat(crGdlStr)   || 0;

  const liveResult = useMemo(() => {
    if (albumin <= 0 || crGdl <= 0) return null;
    try { return calculateACR({ albuminMgDl: albumin, creatinineGDl: crGdl }); }
    catch { return null; }
  }, [albumin, crGdl]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'acr',
          label: 'Albumin-Creatinine Ratio (ACR)',
          value: liveResult.acr,
          unit: 'mg/g',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { albuminMgDl: albumin, creatinineGDl: crGdl },
      formulaUsed:
        'ACR (mg/g) = Albumin (mg/dL) / Creatinine (g/dL)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Urine Albumin">
        <NumInput value={albuminStr} onChange={setAlbuminStr} suffix="mg/dL" step="0.1" min={0} max={500} />
      </FieldRow>

      <FieldRow label="Urine Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
          <NumInput value={crGdlStr}  onChange={onCrGdlChange}  suffix="g/dL"    step="0.001" min={0}    max={5}    />
          <OrDivider />
          <NumInput value={crMgdlStr} onChange={onCrMgdlChange} suffix="mg/dL"   step="1"     min={0}    max={5000} />
          <OrDivider />
          <NumInput value={crUmolStr} onChange={onCrUmolChange} suffix="µmol/L"  step="1"     min={0}    max={44200}/>
        </div>
      </FieldRow>
    </div>
  );
}
