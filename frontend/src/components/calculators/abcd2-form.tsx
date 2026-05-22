'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateABCD2 } from '@/lib/calculators/abcd2';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="space-y-1 pr-2">
        <p className="text-sm font-semibold text-[#0E7490]">{label}</p>
        {hint && <p className="text-xs text-amber-600">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Horizontal 2-column No / Yes
function YesNo({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
         style={{ borderColor: '#0E7490' }}>
      {[{ label: 'No', val: 0, pts: '0' }, { label: 'Yes', val: 1, pts: '+1' }].map(opt => (
        <button key={opt.val} type="button" onClick={() => onChange(opt.val)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={value === opt.val ? ACTIVE : INACTIVE}>
          <span>{opt.label}</span>
          <span className="text-xs" style={{ opacity: 0.7 }}>{opt.pts}</span>
        </button>
      ))}
    </div>
  );
}

// Stacked 1-column buttons (label left, score right)
function StackedBtn<T extends number>({
  options, value, onChange,
}: {
  options: { label: string; val: T; pts: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
         style={{ borderColor: '#0E7490' }}>
      {options.map(opt => (
        <button key={opt.val} type="button" onClick={() => onChange(opt.val)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-left transition-colors"
          style={value === opt.val ? ACTIVE : INACTIVE}>
          <span className="flex-1 mr-2">{opt.label}</span>
          <span className="shrink-0 text-xs" style={{ opacity: 0.7 }}>{opt.pts}</span>
        </button>
      ))}
    </div>
  );
}

export function Abcd2Form({ onResult }: Props) {
  const [age60,    setAge60]    = useState<0|1>(0);
  const [bp,       setBp]       = useState<0|1>(0);
  const [clinical, setClinical] = useState<0|1|2>(0);
  const [duration, setDuration] = useState<0|1|2>(0);
  const [diabetes, setDiabetes] = useState<0|1>(0);

  const liveResult = useMemo(() =>
    calculateABCD2({ age60, bp, clinical, duration, diabetes }),
    [age60, bp, clinical, duration, diabetes],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'abcd2',
        label: 'ABCD² Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { age60, bp, clinical, duration, diabetes },
      formulaUsed:
        `ABCD² = Age(≥60) + BP(≥140/90) + Clinical + Duration + Diabetes\n` +
        `      = ${age60} + ${bp} + ${clinical} + ${duration} + ${diabetes} = ${liveResult.score}`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age ≥60 years">
        <YesNo value={age60} onChange={v => setAge60(v as 0|1)} />
      </Field>

      <Field label="BP ≥140/90 mmHg" hint="Initial BP. Either SBP ≥140 or DBP ≥90.">
        <YesNo value={bp} onChange={v => setBp(v as 0|1)} />
      </Field>

      <Field label="Clinical features of the TIA">
        <StackedBtn
          value={clinical}
          onChange={setClinical}
          options={[
            { label: 'Unilateral weakness',                val: 2 as 0|1|2, pts: '+2' },
            { label: 'Speech disturbance without weakness', val: 1 as 0|1|2, pts: '+1' },
            { label: 'Other symptoms',                      val: 0 as 0|1|2, pts: '0'  },
          ]}
        />
      </Field>

      <Field label="Duration of symptoms">
        <StackedBtn
          value={duration}
          onChange={setDuration}
          options={[
            { label: '<10 minutes',   val: 0 as 0|1|2, pts: '0'  },
            { label: '10-59 minutes', val: 1 as 0|1|2, pts: '+1' },
            { label: '≥ 60 minutes',  val: 2 as 0|1|2, pts: '+2' },
          ]}
        />
      </Field>

      <Field label="History of diabetes">
        <YesNo value={diabetes} onChange={v => setDiabetes(v as 0|1)} />
      </Field>
    </div>
  );
}
