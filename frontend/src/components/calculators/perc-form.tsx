'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculatePERC } from '@/lib/calculators/perc';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

interface FieldDef { id: string; label: string; hint?: string; }

const FIELDS: FieldDef[] = [
  { id: 'age50',      label: 'Age ≥50' },
  { id: 'hr100',      label: 'HR ≥100' },
  { id: 'o2sat',      label: 'O₂ sat on room air <95%' },
  { id: 'legSwelling',label: 'Unilateral leg swelling' },
  { id: 'hemoptysis', label: 'Hemoptysis' },
  { id: 'surgery',    label: 'Recent surgery or trauma',
    hint: 'Surgery or trauma ≤4 weeks ago requiring treatment with general anesthesia' },
  { id: 'priorPeDvt', label: 'Prior PE or DVT' },
  { id: 'hormones',   label: 'Hormone use',
    hint: 'Oral contraceptives, hormone replacement or estrogenic hormones use in males or female patients' },
];

type Vals = Record<string, 0 | 1>;
const initVals = (): Vals => Object.fromEntries(FIELDS.map(f => [f.id, 0]));

export function PercForm({ onResult }: Props) {
  const [vals, setVals] = useState<Vals>(initVals);

  const set = (id: string, v: 0 | 1) => setVals(prev => ({ ...prev, [id]: v }));

  const liveResult = useMemo(() => calculatePERC(vals as any), [vals]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'perc',
        label: 'PERC Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: vals,
      formulaUsed:
        `PERC = sum of positive criteria (0–8)\n` +
        `     = ${liveResult.score}\n\n` +
        `0 (PERC Negative): PE can be ruled out in low pre-test probability\n` +
        `≥1 (PERC Positive): Cannot rule out PE — further workup required`,
      references: liveResult.references,
    });
  }, [liveResult, vals]);

  return (
    <div className="space-y-0">
      {FIELDS.map(f => (
        <div key={f.id}
          className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-100 last:border-0">
          <div className="pr-1 self-center">
            <p className="text-sm font-semibold text-[#0E7490]">{f.label}</p>
            {f.hint && (
              <p className="text-xs text-[#0E7490]/70 mt-0.5 leading-relaxed">{f.hint}</p>
            )}
          </div>
          <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
               style={{ borderColor: '#0E7490' }}>
            <button type="button" onClick={() => set(f.id, 0)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
              style={vals[f.id] === 0 ? ACTIVE : INACTIVE}>
              <span>No</span><span className="text-xs" style={{ opacity: 0.7 }}>0</span>
            </button>
            <button type="button" onClick={() => set(f.id, 1)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
              style={vals[f.id] === 1 ? ACTIVE : INACTIVE}>
              <span>Yes</span><span className="text-xs" style={{ opacity: 0.7 }}>+1</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
