'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCURB65 } from '@/lib/calculators/curb65';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

interface FieldDef { id: string; label: string; }

const FIELDS: FieldDef[] = [
  { id: 'confusion', label: 'Confusion' },
  { id: 'bun',       label: 'BUN >19 mg/dL (>7 mmol/L urea)' },
  { id: 'rr',        label: 'Respiratory Rate ≥30' },
  { id: 'bp',        label: 'Systolic BP <90 mmHg or Diastolic BP ≤60 mmHg' },
  { id: 'age65',     label: 'Age ≥65' },
];

type Vals = Record<string, 0 | 1>;
const initVals = (): Vals => Object.fromEntries(FIELDS.map(f => [f.id, 0]));

export function Curb65Form({ onResult }: Props) {
  const [vals, setVals] = useState<Vals>(initVals);

  const set = (id: string, v: 0 | 1) => setVals(prev => ({ ...prev, [id]: v }));

  const liveResult = useMemo(() =>
    calculateCURB65(vals as any), [vals]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'curb65',
        label: 'CURB-65 Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: vals,
      formulaUsed:
        `CURB-65 = Confusion + BUN + Respiratory Rate + Blood Pressure + Age\n` +
        `        = ${vals.confusion} + ${vals.bun} + ${vals.rr} + ${vals.bp} + ${vals.age65} = ${liveResult.score}\n\n` +
        `0–1: Low risk (outpatient)\n` +
        `2:   Moderate risk (consider hospitalization)\n` +
        `3:   High risk (hospitalize)\n` +
        `4–5: Very high risk (ICU consideration)`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-0">
      {FIELDS.map(f => (
        <div key={f.id}
          className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-100 last:border-0">
          <p className="text-sm font-semibold text-[#0E7490] self-center">{f.label}</p>
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
