'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateBSA } from '@/lib/calculators/bsa';
import { FieldRow, NumInput, OrDivider, round } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const LB_PER_KG = 0.453592;

export function BsaForm({ onResult }: Props) {
  // ── Weight: lb ⇄ kg (auto-convert)
  const [wtLbStr, setWtLbStr] = useState('');
  const [wtKgStr, setWtKgStr] = useState('');

  // ── Height: cm ⇄ ft + inch (auto-convert)
  const [htCmStr, setHtCmStr] = useState('');
  const [htFtStr, setHtFtStr] = useState('');
  const [htInStr, setHtInStr] = useState('');

  // ── Weight handlers ─────────────────────────────────────────────────────
  const onLbChange = (v: string) => {
    setWtLbStr(v);
    if (v === '') { setWtKgStr(''); return; }
    const lb = parseFloat(v);
    setWtKgStr(Number.isFinite(lb) ? String(round(lb * LB_PER_KG, 2)) : '');
  };
  const onKgChange = (v: string) => {
    setWtKgStr(v);
    if (v === '') { setWtLbStr(''); return; }
    const kg = parseFloat(v);
    setWtLbStr(Number.isFinite(kg) ? String(round(kg / LB_PER_KG, 2)) : '');
  };

  // ── Height handlers ─────────────────────────────────────────────────────
  const onCmChange = (v: string) => {
    setHtCmStr(v);
    if (v === '') { setHtFtStr(''); setHtInStr(''); return; }
    const cm = parseFloat(v);
    if (!Number.isFinite(cm)) { setHtFtStr(''); setHtInStr(''); return; }
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inch = round(totalIn - ft * 12, 1);
    setHtFtStr(String(ft));
    setHtInStr(String(inch));
  };
  const onFtInChange = (ftV: string, inV: string) => {
    setHtFtStr(ftV);
    setHtInStr(inV);
    if (ftV === '' && inV === '') { setHtCmStr(''); return; }
    const ft = parseFloat(ftV) || 0;
    const inch = parseFloat(inV) || 0;
    setHtCmStr(String(round(ft * 30.48 + inch * 2.54, 1)));
  };

  // ── Resolve to canonical units (kg, cm) ───────────────────────────────────
  const weightKg = parseFloat(wtKgStr);
  const heightCm = parseFloat(htCmStr);

  const ready = Number.isFinite(weightKg) && weightKg > 0 &&
                Number.isFinite(heightCm) && heightCm > 0;

  const liveResult = useMemo(() => {
    if (!ready) return null;
    try { return calculateBSA({ heightCm, weightKg }); }
    catch { return null; }
  }, [heightCm, weightKg, ready]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'bsa',
        label: 'Body Surface Area (BSA)',
        value: liveResult.bsa,
        unit: 'm²',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { heightCm, weightKg },
      formulaUsed: 'BSA (m²) = √[(Height in cm × Weight in kg) / 3600]   (Mosteller)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wtLbStr} onChange={onLbChange}
            suffix="lb" step="0.1" min={0} max={1100}
          />
          <OrDivider />
          <NumInput
            value={wtKgStr} onChange={onKgChange}
            suffix="kg" step="0.1" min={0} max={500}
          />
        </div>
      </FieldRow>

      <FieldRow label="Height">
        <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2">
          <NumInput
            value={htCmStr} onChange={onCmChange}
            suffix="cm" step="0.1" min={0} max={300}
          />
          <OrDivider />
          <NumInput
            value={htFtStr} onChange={v => onFtInChange(v, htInStr)}
            suffix="ft" step="1" min={0} max={9}
          />
          <NumInput
            value={htInStr} onChange={v => onFtInChange(htFtStr, v)}
            suffix="in" step="0.1" min={0} max={11.9}
          />
        </div>
      </FieldRow>
    </div>
  );
}
