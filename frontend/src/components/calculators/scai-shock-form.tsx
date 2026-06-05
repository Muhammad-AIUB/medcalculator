'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateSCAIShock, STAGE_DATA, SCAIStage } from '@/lib/calculators/scai-shock';

interface Props { onResult: (result: any) => void; }

const STAGES: SCAIStage[] = ['A', 'B', 'C', 'D', 'E'];

export function ScaiShockForm({ onResult }: Props) {
  const [stage, setStage] = useState<SCAIStage | null>(null);

  const liveResult = useMemo(() => (stage ? calculateSCAIShock({ stage }) : null), [stage]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'scai-shock',
        label: 'SCAI Shock Stage',
        value: liveResult.stage,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { stage: liveResult.stage },
      formulaUsed:
        'SCAI SHOCK staging — select the highest stage whose criteria the patient meets:\n' +
        'A At Risk · B Beginning · C Classic · D Deteriorating · E Extremis',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select the <span className="font-semibold">highest</span> stage whose criteria the patient meets:
      </p>
      <div className="flex flex-col gap-2">
        {STAGES.map((s) => {
          const data = STAGE_DATA[s];
          const active = stage === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className="w-full rounded-xl border-2 px-4 py-3 text-left transition-colors"
              style={active
                ? { background: '#0E7490', color: '#ffffff', borderColor: '#0E7490' }
                : { background: '#ffffff', color: '#1e293b', borderColor: 'rgba(14,116,144,0.4)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{data.name}</span>
                <span className="text-xs font-semibold" style={{ opacity: 0.8 }}>
                  Mortality {data.mortality}
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug" style={{ opacity: active ? 0.9 : 0.7 }}>
                {data.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
