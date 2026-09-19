'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateEGFR } from '@/lib/calculators/egfr';
import { NumInput, OrDivider, fmt } from './shared-ui';

interface EgfrFormProps {
  onResult: (result: any) => void;
}

const TEAL = '#0E7490';

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid rounded-lg overflow-hidden border border-gray-200" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="py-3 text-sm font-semibold transition-colors"
            style={{ background: active ? TEAL : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-gray-100 last:border-0 flex items-start gap-4">
      <div className="w-32 shrink-0 pt-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: TEAL }}>{hint}</p>}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function EgfrForm({ onResult }: EgfrFormProps) {
  const [sex, setSex]       = useState<'female' | 'male'>('female');
  const [black, setBlack]   = useState<'no' | 'yes'>('no');
  const [ageStr, setAgeStr] = useState('');
  const [mgdlStr, setMgdlStr] = useState('');
  const [umolStr, setUmolStr] = useState('');

  // Which box the user actually typed in. The mirrored box is rounded for display,
  // so calculating from it would feed a rounded creatinine into the equation
  // (100 umol/L shows as 1.13 mg/dL, and 1.13 gives 66.2 where MDCalc gives 66.1).
  const [lastEdited, setLastEdited] = useState<'mgdl' | 'umol'>('mgdl');

  const onMgdlChange = useCallback((v: string) => {
    setLastEdited('mgdl');
    setMgdlStr(v);
    const n = parseFloat(v);
    setUmolStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '');
  }, []);

  const onUmolChange = useCallback((v: string) => {
    setLastEdited('umol');
    setUmolStr(v);
    const n = parseFloat(v);
    setMgdlStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '');
  }, []);

  // Convert from the value the user entered, not from the rounded mirror.
  const creatMgdl = lastEdited === 'umol'
    ? (parseFloat(umolStr) || 0) / 88.4
    : (parseFloat(mgdlStr) || 0);
  const age       = parseInt(ageStr) || 0;

  const liveResult = useMemo(() => {
    if (creatMgdl <= 0 || age < 1) return null;
    try {
      return calculateEGFR({ creatinine: creatMgdl, creatinineUnit: 'mg/dL', age, sex, formula: 'mdrd', black: black === 'yes' });
    } catch { return null; }
  }, [creatMgdl, age, sex, black]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) {
      onResultRef.current(null);
      return;
    }
    onResultRef.current({
      outputs: [{
        id: 'egfr',
        label: 'eGFR',
        value: liveResult.score ?? 0,
        unit: 'mL/min/1.73m²',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity as any },
      }],
      inputs: { creatinine: creatMgdl, creatinineUnit: 'mg/dL', age, sex, black: black === 'yes' },
      formulaUsed:
        'eGFR = 175 × Scr^−1.154 × Age^−0.203 × (0.742 if female) × (1.212 if Black)   [MDRD 4-variable]\n\n' +
        'Scr in mg/dL. Result in mL/min/1.73 m².',
      references: liveResult.references,
    });
  }, [liveResult, age, creatMgdl, sex, black]);

  return (
    <div>
      {/* 1. Sex */}
      <Field label="Sex">
        <Toggle
          options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]}
          value={sex}
          onChange={setSex}
        />
      </Field>

      {/* 2. Age */}
      <Field label="Age">
        <NumInput value={ageStr} onChange={setAgeStr} suffix="years" step="1" min={1} max={120} />
      </Field>

      {/* 3. Black race */}
      <Field label="Black race" hint="Race may or may not provide better estimates of GFR; optional">
        <Toggle
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
          value={black}
          onChange={setBlack}
        />
      </Field>

      {/* 4. Creatinine */}
      <Field label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={umolStr} onChange={onUmolChange} suffix="µmol/L" step="1" min={1} max={2650} />
          <OrDivider />
          <NumInput value={mgdlStr} onChange={onMgdlChange} suffix="mg/dL" step="0.01" min={0.1} max={30} />
        </div>
      </Field>
    </div>
  );
}
