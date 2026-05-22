'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCllIpi } from '@/lib/calculators/cll-ipi';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="sm:w-1/2 text-sm text-gray-700 leading-snug flex-shrink-0">{label}</span>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

// Stacked (1-column) buttons — for options with longer labels
function StackedBtn<T extends number>({
  options, value, onChange,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200">
      {options.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={String(o.val)}
            type="button"
            onClick={() => onChange(o.val)}
            className="h-11 flex items-center justify-between px-3 text-sm font-semibold transition-colors"
            style={active ? ACTIVE : IDLE}
          >
            <span className="text-left leading-snug">{o.label}</span>
            <span className="text-xs font-bold opacity-75 ml-2 whitespace-nowrap">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

// Horizontal 2-column buttons — for short labels
function HorizBtn<T extends number>({
  options, value, onChange,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
      {options.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={String(o.val)}
            type="button"
            onClick={() => onChange(o.val)}
            className="h-11 flex items-center justify-between px-3 text-sm font-semibold transition-colors"
            style={active ? ACTIVE : IDLE}
          >
            <span>{o.label}</span>
            <span className="text-xs font-bold opacity-75">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CllIpiForm({ onResult }: Props) {
  // All start selected at their 0-point option
  const [age,           setAge]           = useState<0|1>(0);
  const [clinicalStage, setClinicalStage] = useState<0|1>(0);
  const [b2m,           setB2m]           = useState<0|2>(0);
  const [ighv,          setIghv]          = useState<0|2>(0);
  const [tp53,          setTp53]          = useState<0|4>(0);

  const liveResult = useMemo(() =>
    calculateCllIpi({ age, clinicalStage, b2m, ighv, tp53 }),
    [age, clinicalStage, b2m, ighv, tp53],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'cll-ipi',
        label: 'CLL-IPI Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { age, clinicalStage, b2m, ighv, tp53 },
      formulaUsed: 'Addition of the selected criteria:\n\nAge >65 years: +1\nBinet B-C or Rai I-IV: +1\nSerum β2-microglobulin >3.5 mg/L: +2\nIGHV unmutated: +2\nDeletion 17p and/or TP53 mutation: +4\n\n0–1: Low (~93% 5-yr OS)\n2–3: Intermediate (~79% 5-yr OS)\n4–6: High (~64% 5-yr OS)\n7–10: Very High (~23% 5-yr OS)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age">
        <StackedBtn<0|1>
          value={age} onChange={setAge}
          options={[
            { val: 0, label: '≤65 years', sub: '0'  },
            { val: 1, label: '>65 years', sub: '+1' },
          ]}
        />
      </Field>

      <Field label="Clinical stage">
        <StackedBtn<0|1>
          value={clinicalStage} onChange={setClinicalStage}
          options={[
            { val: 0, label: 'Binet A or Rai 0',    sub: '0'  },
            { val: 1, label: 'Binet B-C or Rai I-IV', sub: '+1' },
          ]}
        />
      </Field>

      <Field label="Serum β2 microglobulin, mg/L (or µg/mL)">
        <HorizBtn<0|2>
          value={b2m} onChange={setB2m}
          options={[
            { val: 0, label: '≤3.5', sub: '0'  },
            { val: 2, label: '>3.5', sub: '+2' },
          ]}
        />
      </Field>

      <Field label="IGHV mutational status">
        <StackedBtn<0|2>
          value={ighv} onChange={setIghv}
          options={[
            { val: 0, label: 'Mutated',   sub: '0'  },
            { val: 2, label: 'Unmutated', sub: '+2' },
          ]}
        />
      </Field>

      <Field label="TP53 status">
        <StackedBtn<0|4>
          value={tp53} onChange={setTp53}
          options={[
            { val: 0, label: 'No abnormalities',                              sub: '0'  },
            { val: 4, label: 'Deletion 17p (FISH) and/or TP53 mutation (sequencing)', sub: '+4' },
          ]}
        />
      </Field>
    </div>
  );
}
