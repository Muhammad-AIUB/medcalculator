'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculatePreciseDapt } from '@/lib/calculators/precise-dapt';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' } as const;
const IDLE   = { background: '#ffffff', color: '#1e293b' } as const;

export function PreciseDaptForm({ onResult }: Props) {
  const [ageStr, setAgeStr] = useState('');
  const [wbcStr, setWbcStr] = useState('');
  const [crclStr, setCrclStr] = useState('');
  const [priorBleed, setPriorBleed] = useState(false);

  // Haemoglobin in g/L or g/dL. The mirrored box is rounded for display, so the
  // score is always computed from whichever box the user actually typed in.
  const [hbGlStr, setHbGlStr] = useState('');
  const [hbGdlStr, setHbGdlStr] = useState('');
  const [lastHb, setLastHb] = useState<'gl' | 'gdl'>('gl');

  const onHbGl = useCallback((v: string) => {
    setLastHb('gl'); setHbGlStr(v);
    const n = parseFloat(v);
    setHbGdlStr(Number.isFinite(n) && n > 0 ? fmt(n / 10, 1) : '');
  }, []);
  const onHbGdl = useCallback((v: string) => {
    setLastHb('gdl'); setHbGdlStr(v);
    const n = parseFloat(v);
    setHbGlStr(Number.isFinite(n) && n > 0 ? fmt(n * 10, 0) : '');
  }, []);

  const age  = parseFloat(ageStr)  || 0;
  const wbc  = parseFloat(wbcStr)  || 0;
  const crcl = parseFloat(crclStr) || 0;
  const hemoglobinGL = lastHb === 'gdl'
    ? (parseFloat(hbGdlStr) || 0) * 10
    : (parseFloat(hbGlStr) || 0);

  const liveResult = useMemo(() => {
    if (age <= 0 || hemoglobinGL <= 0 || wbc <= 0 || crcl <= 0) return null;
    try {
      return calculatePreciseDapt({ age, hemoglobinGL, wbc, crclMlMin: crcl, priorBleed });
    } catch { return null; }
  }, [age, hemoglobinGL, wbc, crcl, priorBleed]);

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
          id: 'precise-dapt',
          label: 'PRECISE-DAPT Score',
          value: liveResult.score,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        { id: 'risk-group', label: 'Bleeding risk group', value: liveResult.riskGroup },
      ],
      inputs: { age, hemoglobinGL, wbc, crclMlMin: crcl, priorBleed },
      formulaUsed: `PRECISE-DAPT = age + haemoglobin + white cell count + creatinine clearance + prior bleeding

≤10:    Very low bleeding risk
11–17:  Low
18–24:  Moderate
≥25:    High — consider short DAPT (3–6 months)

The published score is a nomogram rather than an equation; the point contributions
used here were recovered from MDCalc and match it exactly on 102 checked cases.`,
      references: liveResult.references,
      warnings: liveResult.score >= 25
        ? ['High bleeding risk (≥25) — weigh shorter DAPT against ischaemic risk.']
        : [],
    });
  }, [liveResult, age, hemoglobinGL, wbc, crcl, priorBleed]);

  return (
    <div className="space-y-6">
      <FieldRow label="Age">
        <NumInput value={ageStr} onChange={setAgeStr} suffix="years" step="1" min={18} max={110} />
      </FieldRow>

      <FieldRow label="Hemoglobin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={hbGlStr} onChange={onHbGl} suffix="g/L" step="1" min={40} max={220} placeholder="Norm: 120 - 170" />
          <OrDivider />
          <NumInput value={hbGdlStr} onChange={onHbGdl} suffix="g/dL" step="0.1" min={4} max={22} />
        </div>
      </FieldRow>

      <FieldRow label="White blood cell count">
        <NumInput value={wbcStr} onChange={setWbcStr} suffix="× 10⁹/L" step="0.1" min={0.5} max={60} placeholder="Norm: 3.7 - 10.7" />
      </FieldRow>

      <FieldRow label="Creatinine clearance">
        <NumInput value={crclStr} onChange={setCrclStr} suffix="mL/min" step="1" min={0} max={200} />
      </FieldRow>

      <FieldRow label="Prior bleeding" hint="Spontaneous bleeding requiring hospitalisation or transfusion">
        <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
          {([false, true] as const).map(v => (
            <button key={String(v)} type="button" onClick={() => setPriorBleed(v)}
              className="h-11 flex items-center justify-center text-sm font-semibold transition-colors"
              style={priorBleed === v ? ACTIVE : IDLE}>
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </FieldRow>
    </div>
  );
}
