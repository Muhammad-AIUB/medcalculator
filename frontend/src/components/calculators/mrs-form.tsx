'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateMRS } from '@/lib/calculators/mrs';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

const OPTIONS = [
  { score: 0, label: 'No symptoms at all' },
  { score: 1, label: 'No significant disability despite symptoms; able to carry out all usual duties and activities' },
  { score: 2, label: 'Slight disability; unable to carry out all previous activities, but able to look after own affairs without assistance' },
  { score: 3, label: 'Moderate disability; requiring some help, but able to walk without assistance' },
  { score: 4, label: 'Moderately severe disability; unable to walk and attend to bodily needs without assistance' },
  { score: 5, label: 'Severe disability; bedridden, incontinent and requiring constant nursing care and attention' },
  { score: 6, label: 'Dead' },
];

export function MrsForm({ onResult }: Props) {
  const [selected, setSelected] = useState(0); // score 0 by default

  const liveResult = useMemo(() => calculateMRS(selected), [selected]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'mrs',
        label: 'mRS Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { score: selected },
      formulaUsed: 'Assignation of points based on severity of disability (0 = No symptoms, 6 = Dead).',
      references: liveResult.references,
    });
  }, [liveResult, selected]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-2">
        <div className="space-y-1 pr-2">
          <p className="text-sm font-semibold text-[#0E7490]">Patient&apos;s Baseline Activity</p>
          <p className="text-xs text-amber-600">Choose best fit of patient&apos;s ability</p>
        </div>

        <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.score}
              type="button"
              onClick={() => setSelected(opt.score)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
              style={selected === opt.score ? ACTIVE : INACTIVE}
            >
              <span className="flex-1 mr-2">{opt.label}</span>
              <span
                className="shrink-0 font-bold text-xs"
                style={{ color: selected === opt.score ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}
              >
                {opt.score === 0 ? '0' : `+${opt.score}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
