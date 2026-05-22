'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCha2ds2Vasc } from '@/lib/calculators/cha2ds2-vasc';

interface Props { onResult: (result: any) => void; }

type Age    = 0 | 1 | 2;
type Binary = 0 | 1;
type Stroke = 0 | 2;

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="sm:w-1/2 text-sm text-gray-700 leading-snug flex-shrink-0">{label}</span>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function Btn<T extends number>({
  options, value, onChange, cols,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols: number;
}) {
  return (
    <div
      className="grid rounded-lg overflow-hidden border border-gray-200"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {options.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={`${o.label}-${o.val}`}
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

export function Cha2ds2VascForm({ onResult }: Props) {
  // Age and Sex start unselected (null) — user must actively choose
  const [age,          setAge]          = useState<Age | null>(null);
  const [sex,          setSex]          = useState<Binary | null>(null);
  // Binary fields default to 0 (No selected)
  const [chf,          setChf]          = useState<Binary>(0);
  const [hypertension, setHypertension] = useState<Binary>(0);
  const [stroke,       setStroke]       = useState<Stroke>(0);
  const [vascular,     setVascular]     = useState<Binary>(0);
  const [diabetes,     setDiabetes]     = useState<Binary>(0);

  const liveResult = useMemo(() => {
    if (age === null || sex === null) return null;
    return calculateCha2ds2Vasc({ age, sex, chf, hypertension, stroke, vascular, diabetes });
  }, [age, sex, chf, hypertension, stroke, vascular, diabetes]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'cha2ds2-vasc',
        label: 'CHA₂DS₂-VASc Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { age, sex, chf, hypertension, stroke, vascular, diabetes },
      formulaUsed: 'Addition of the selected points:\n\nAge <65: 0 | 65-74: +1 | ≥75: +2\nSex female: +1\nCHF history: +1\nHypertension history: +1\nStroke/TIA/thromboembolism history: +2\nVascular disease history: +1\nDiabetes history: +1',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age">
        <Btn<Age>
          cols={3}
          value={age}
          onChange={setAge}
          options={[
            { val: 0, label: '<65',   sub: '0'  },
            { val: 1, label: '65-74', sub: '+1' },
            { val: 2, label: '≥75',   sub: '+2' },
          ]}
        />
      </Field>

      <Field label="Sex">
        <Btn<Binary>
          cols={2}
          value={sex}
          onChange={setSex}
          options={[
            { val: 1, label: 'Female', sub: '+1' },
            { val: 0, label: 'Male',   sub: '0'  },
          ]}
        />
      </Field>

      <Field label="CHF history">
        <Btn<Binary>
          cols={2}
          value={chf}
          onChange={setChf}
          options={[
            { val: 0, label: 'No',  sub: '0'  },
            { val: 1, label: 'Yes', sub: '+1' },
          ]}
        />
      </Field>

      <Field label="Hypertension history">
        <Btn<Binary>
          cols={2}
          value={hypertension}
          onChange={setHypertension}
          options={[
            { val: 0, label: 'No',  sub: '0'  },
            { val: 1, label: 'Yes', sub: '+1' },
          ]}
        />
      </Field>

      <Field label="Stroke/TIA/thromboembolism history">
        <Btn<Stroke>
          cols={2}
          value={stroke}
          onChange={setStroke}
          options={[
            { val: 0, label: 'No',  sub: '0'  },
            { val: 2, label: 'Yes', sub: '+2' },
          ]}
        />
      </Field>

      <Field label="Vascular disease history (prior MI, peripheral artery disease, or aortic plaque)">
        <Btn<Binary>
          cols={2}
          value={vascular}
          onChange={setVascular}
          options={[
            { val: 0, label: 'No',  sub: '0'  },
            { val: 1, label: 'Yes', sub: '+1' },
          ]}
        />
      </Field>

      <Field label="Diabetes history">
        <Btn<Binary>
          cols={2}
          value={diabetes}
          onChange={setDiabetes}
          options={[
            { val: 0, label: 'No',  sub: '0'  },
            { val: 1, label: 'Yes', sub: '+1' },
          ]}
        />
      </Field>
    </div>
  );
}
