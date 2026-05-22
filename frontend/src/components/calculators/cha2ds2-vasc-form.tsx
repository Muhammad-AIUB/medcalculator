'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCha2ds2Vasc } from '@/lib/calculators/cha2ds2-vasc';

interface Props { onResult: (result: any) => void; }

type Age     = 0 | 1 | 2;
type Binary  = 0 | 1;
type Stroke  = 0 | 2;

// Horizontal field row matching MDCalc layout
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="sm:w-1/2 text-sm text-gray-700 leading-snug flex-shrink-0">{label}</span>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function Buttons<T extends number>({
  options, value, onChange, cols,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  cols: number;
}) {
  return (
    <div
      className="grid rounded-lg overflow-hidden border border-gray-200"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="h-11 text-sm font-semibold transition-colors px-1"
            style={{
              background: active ? '#0E7490' : '#ffffff',
              color:      active ? '#ffffff' : '#1e293b',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Cha2ds2VascForm({ onResult }: Props) {
  const [age,          setAge]          = useState<Age>(0);
  const [sex,          setSex]          = useState<Binary>(0);
  const [chf,          setChf]          = useState<Binary>(0);
  const [hypertension, setHypertension] = useState<Binary>(0);
  const [stroke,       setStroke]       = useState<Stroke>(0);
  const [vascular,     setVascular]     = useState<Binary>(0);
  const [diabetes,     setDiabetes]     = useState<Binary>(0);

  const liveResult = useMemo(() =>
    calculateCha2ds2Vasc({ age, sex, chf, hypertension, stroke, vascular, diabetes }),
    [age, sex, chf, hypertension, stroke, vascular, diabetes],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'cha2ds2-vasc',
          label: 'CHA₂DS₂-VASc Score',
          value: liveResult.score,
          unit: '',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { age, sex, chf, hypertension, stroke, vascular, diabetes },
      formulaUsed: 'Addition of the selected points:\n\nAge <65: 0 | 65-74: +1 | >=75: +2\nSex female: +1\nCHF history: +1\nHypertension history: +1\nStroke/TIA/thromboembolism history: +2\nVascular disease history: +1\nDiabetes history: +1',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age">
        <Buttons<Age>
          cols={3}
          value={age}
          onChange={setAge}
          options={[
            { value: 0, label: '<65    0'  },
            { value: 1, label: '65-74  +1' },
            { value: 2, label: '≥75  +2' },
          ]}
        />
      </Field>

      <Field label="Sex">
        <Buttons<Binary>
          cols={2}
          value={sex}
          onChange={setSex}
          options={[
            { value: 1, label: 'Female  +1' },
            { value: 0, label: 'Male  0'    },
          ]}
        />
      </Field>

      <Field label="CHF history">
        <Buttons<Binary>
          cols={2}
          value={chf}
          onChange={setChf}
          options={[
            { value: 0, label: 'No  0'  },
            { value: 1, label: 'Yes  +1' },
          ]}
        />
      </Field>

      <Field label="Hypertension history">
        <Buttons<Binary>
          cols={2}
          value={hypertension}
          onChange={setHypertension}
          options={[
            { value: 0, label: 'No  0'   },
            { value: 1, label: 'Yes  +1' },
          ]}
        />
      </Field>

      <Field label="Stroke/TIA/thromboembolism history">
        <Buttons<Stroke>
          cols={2}
          value={stroke}
          onChange={setStroke}
          options={[
            { value: 0, label: 'No  0'   },
            { value: 2, label: 'Yes  +2' },
          ]}
        />
      </Field>

      <Field label="Vascular disease history (prior MI, peripheral artery disease, or aortic plaque)">
        <Buttons<Binary>
          cols={2}
          value={vascular}
          onChange={setVascular}
          options={[
            { value: 0, label: 'No  0'   },
            { value: 1, label: 'Yes  +1' },
          ]}
        />
      </Field>

      <Field label="Diabetes history">
        <Buttons<Binary>
          cols={2}
          value={diabetes}
          onChange={setDiabetes}
          options={[
            { value: 0, label: 'No  0'   },
            { value: 1, label: 'Yes  +1' },
          ]}
        />
      </Field>
    </div>
  );
}
