'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateWellsPE } from '@/lib/calculators/wells-pe';

interface Props { onResult: (result: any) => void; }

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
  options, value, onChange,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T;
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

export function WellsPeForm({ onResult }: Props) {
  const [dvtSigns,       setDvtSigns]       = useState<0|3>(0);
  const [pe1st,          setPe1st]          = useState<0|3>(0);
  const [heartRate,      setHeartRate]      = useState<0|1.5>(0);
  const [immobilization, setImmobilization] = useState<0|1.5>(0);
  const [previousPeDvt,  setPreviousPeDvt]  = useState<0|1.5>(0);
  const [hemoptysis,     setHemoptysis]     = useState<0|1>(0);
  const [malignancy,     setMalignancy]     = useState<0|1>(0);

  const liveResult = useMemo(() =>
    calculateWellsPE({ dvtSigns, pe1stDiagnosis: pe1st, heartRate100: heartRate,
      immobilization, previousPeDvt, hemoptysis, malignancy }),
    [dvtSigns, pe1st, heartRate, immobilization, previousPeDvt, hemoptysis, malignancy],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'wells-pe',
        label: "Wells' Score (PE)",
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { dvtSigns, pe1st, heartRate, immobilization, previousPeDvt, hemoptysis, malignancy },
      formulaUsed:
        'Addition of selected points:\n\n' +
        'Clinical signs/symptoms of DVT: +3\n' +
        'PE is #1 diagnosis or equally likely: +3\n' +
        'Heart rate > 100: +1.5\n' +
        'Immobilization ≥3 days or surgery in past 4 weeks: +1.5\n' +
        'Previous objectively diagnosed PE or DVT: +1.5\n' +
        'Hemoptysis: +1\n' +
        'Malignancy (treatment within 6 months or palliative): +1\n\n' +
        'Three-Tier: 0–1 Low | 2–6 Moderate | >6 High\n' +
        'Two-Tier:   ≤4 PE Unlikely (D-dimer) | ≥5 PE Likely (CTPA)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Clinical signs and symptoms of DVT">
        <Btn<0|3>
          value={dvtSigns} onChange={setDvtSigns}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 3, label: 'Yes', sub: '+3' }]}
        />
      </Field>

      <Field label="PE is #1 diagnosis OR equally likely">
        <Btn<0|3>
          value={pe1st} onChange={setPe1st}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 3, label: 'Yes', sub: '+3' }]}
        />
      </Field>

      <Field label="Heart rate >100">
        <Btn<0|1.5>
          value={heartRate} onChange={setHeartRate}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1.5, label: 'Yes', sub: '+1.5' }]}
        />
      </Field>

      <Field label="Immobilization at least 3 days OR surgery in the previous 4 weeks">
        <Btn<0|1.5>
          value={immobilization} onChange={setImmobilization}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1.5, label: 'Yes', sub: '+1.5' }]}
        />
      </Field>

      <Field label="Previous, objectively diagnosed PE or DVT">
        <Btn<0|1.5>
          value={previousPeDvt} onChange={setPreviousPeDvt}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1.5, label: 'Yes', sub: '+1.5' }]}
        />
      </Field>

      <Field label="Hemoptysis">
        <Btn<0|1>
          value={hemoptysis} onChange={setHemoptysis}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Malignancy w/ treatment within 6 months or palliative">
        <Btn<0|1>
          value={malignancy} onChange={setMalignancy}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>
    </div>
  );
}
