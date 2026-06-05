'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateHuntHess } from '@/lib/calculators/hunt-hess';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

const OPTIONS = [
  { grade: 1, label: 'Mild Headache, Alert and Oriented, Minimal (if any) Nuchal Rigidity' },
  { grade: 2, label: 'Full Nuchal Rigidity, Moderate-Severe Headache, Alert and Oriented, No Neuro Deficit (Besides CN Palsy)' },
  { grade: 3, label: 'Lethargy or Confusion, Mild Focal Neurological Deficits' },
  { grade: 4, label: 'Stuporous, More Severe Focal Deficit' },
  { grade: 5, label: 'Comatose, showing signs of severe neurological impairment (ex: posturing)' },
];

export function HuntHessForm({ onResult }: Props) {
  const [selected, setSelected] = useState(1); // Grade I by default

  const liveResult = useMemo(() => calculateHuntHess(selected), [selected]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'hunt-hess',
        label: 'Hunt-Hess Grade',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { grade: selected },
      formulaUsed: 'Selection of group of symptoms, assigned point value (Grade I–V).',
      references: liveResult.references,
    });
  }, [liveResult, selected]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-2">
        <div className="space-y-1 pr-2">
          <p className="text-sm font-semibold text-[#0E7490]">Signs/Symptoms</p>
        </div>

        <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.grade}
              type="button"
              onClick={() => setSelected(opt.grade)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
              style={selected === opt.grade ? ACTIVE : INACTIVE}
            >
              <span className="flex-1 mr-2">{opt.label}</span>
              <span
                className="shrink-0 font-bold text-xs"
                style={{ color: selected === opt.grade ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}
              >
                +{opt.grade}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
