'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateASPECTS } from '@/lib/calculators/aspects';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

interface FieldDef { id: string; label: string; }

const SUBCORTICAL: FieldDef[] = [
  { id: 'caudate',         label: 'Caudate (C)' },
  { id: 'internalCapsule', label: 'Internal Capsule (IC)' },
  { id: 'lentiform',       label: 'Lentiform nucleus (L)' },
];

const MCA_CORTEX: FieldDef[] = [
  { id: 'insularRibbon', label: 'Insular Ribbon (I)' },
  { id: 'm1',            label: 'Anterior MCA cortex (M1)' },
  { id: 'm2',            label: 'MCA cortex lateral to the insular ribbon (M2)' },
  { id: 'm3',            label: 'Posterior MCA cortex (M3)' },
  { id: 'm4',            label: 'Anterior cortex immediately rostral to M1 (M4)' },
  { id: 'm5',            label: 'Lateral cortex immediately rostral to M3 (M5)' },
  { id: 'm6',            label: 'Posterior cortex immediately rostral to M3 (M6)' },
];

const ALL_FIELDS = [...SUBCORTICAL, ...MCA_CORTEX];

// No = 0, Yes = −1
type Vals = Record<string, 0 | -1>;
const initVals = (): Vals => Object.fromEntries(ALL_FIELDS.map(f => [f.id, 0]));

function YesNo({
  label, value, onChange,
}: { label: string; value: 0 | -1; onChange: (v: 0 | -1) => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm font-semibold text-[#0E7490] self-center">{label}</p>
      <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
           style={{ borderColor: '#0E7490' }}>
        <button type="button" onClick={() => onChange(0)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={value === 0 ? ACTIVE : INACTIVE}>
          <span>No</span><span className="text-xs" style={{ opacity: 0.7 }}>0</span>
        </button>
        <button type="button" onClick={() => onChange(-1)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={value === -1 ? ACTIVE : INACTIVE}>
          <span>Yes</span><span className="text-xs" style={{ opacity: 0.7 }}>−1</span>
        </button>
      </div>
    </div>
  );
}

export function AspectsForm({ onResult }: Props) {
  const [vals, setVals] = useState<Vals>(initVals);

  const set = (id: string, v: 0 | -1) => setVals(prev => ({ ...prev, [id]: v }));

  const liveResult = useMemo(() => calculateASPECTS(vals as any), [vals]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'aspects',
        label: 'ASPECTS Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: vals,
      formulaUsed:
        `ASPECTS = 10 − (number of affected regions)\n` +
        `        = 10 − ${Object.values(vals).filter(v => v === -1).length} = ${liveResult.score}\n\n` +
        `Subcortical structures: C, IC, L (3 points)\n` +
        `MCA Cortex: I, M1, M2, M3, M4, M5, M6 (7 points)`,
      references: liveResult.references,
    });
  }, [liveResult, vals]);

  return (
    <div className="space-y-0">
      {/* Subcortical Structures */}
      <div className="pb-1 pt-2 border-b border-gray-200">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Subcortical Structures</p>
      </div>
      {SUBCORTICAL.map(f => (
        <YesNo key={f.id} label={f.label} value={vals[f.id]} onChange={v => set(f.id, v)} />
      ))}

      {/* MCA Cortex */}
      <div className="pb-1 pt-4 border-b border-gray-200">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">MCA Cortex</p>
      </div>
      {MCA_CORTEX.map(f => (
        <YesNo key={f.id} label={f.label} value={vals[f.id]} onChange={v => set(f.id, v)} />
      ))}
    </div>
  );
}
