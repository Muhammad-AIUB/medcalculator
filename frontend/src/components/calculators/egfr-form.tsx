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
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function EgfrForm({ onResult }: EgfrFormProps) {
  const [sex, setSex]       = useState<'female' | 'male'>('female');
  const [ageStr, setAgeStr] = useState('');
  const [mgdlStr, setMgdlStr] = useState('');
  const [umolStr, setUmolStr] = useState('');

  const onMgdlChange = useCallback((v: string) => {
    setMgdlStr(v);
    const n = parseFloat(v);
    setUmolStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '');
  }, []);

  const onUmolChange = useCallback((v: string) => {
    setUmolStr(v);
    const n = parseFloat(v);
    setMgdlStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '');
  }, []);

  const creatMgdl = parseFloat(mgdlStr) || 0;
  const age       = parseInt(ageStr) || 0;

  const liveResult = useMemo(() => {
    if (creatMgdl <= 0 || age < 1) return null;
    try {
      return calculateEGFR({ creatinine: creatMgdl, creatinineUnit: 'mg/dL', age, sex, formula: 'ckd-epi-2021' });
    } catch { return null; }
  }, [creatMgdl, age, sex]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'egfr',
        label: 'eGFR',
        value: liveResult.score ?? 0,
        unit: 'mL/min/1.73m²',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity as any },
      }],
      inputs: { creatinine: creatMgdl, creatinineUnit: 'mg/dL', age, sex },
      formulaUsed: 'eGFR = 142 × min(Scr/κ,1)^α × max(Scr/κ,1)^⁻¹·² × 0.9938^Age × (1.012 if female)   [CKD-EPI 2021, race-free]',
      references: liveResult.references,
    });
  }, [liveResult, age, creatMgdl, sex]);

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

      {/* 3. Creatinine */}
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
