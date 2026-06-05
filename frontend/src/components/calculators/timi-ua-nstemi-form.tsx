'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateTimiUaNstemi } from '@/lib/calculators/timi-ua-nstemi';

interface Props { onResult: (result: any) => void; }

type Binary = 0 | 1;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="sm:w-1/2 flex-shrink-0">
        <span className="text-sm text-gray-700 leading-snug">{label}</span>
        {hint && <p className="text-xs text-[#0E7490] mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function YesNo({ value, onChange }: { value: Binary; onChange: (v: Binary) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
      {([0, 1] as Binary[]).map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className="h-11 text-sm font-semibold transition-colors"
            style={{ background: active ? '#0E7490' : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}
          >
            {v === 0 ? 'No  0' : 'Yes  +1'}
          </button>
        );
      })}
    </div>
  );
}

export function TimiUaNstemiForm({ onResult }: Props) {
  const [age65,          setAge65]          = useState<Binary>(0);
  const [cadRiskFactors, setCadRiskFactors] = useState<Binary>(0);
  const [knownCAD,       setKnownCAD]       = useState<Binary>(0);
  const [asaUse,         setAsaUse]         = useState<Binary>(0);
  const [severeAngina,   setSevereAngina]   = useState<Binary>(0);
  const [stChanges,      setStChanges]      = useState<Binary>(0);
  const [cardiacMarker,  setCardiacMarker]  = useState<Binary>(0);

  const liveResult = useMemo(() =>
    calculateTimiUaNstemi({ age65, cadRiskFactors, knownCAD, asaUse, severeAngina, stChanges, cardiacMarker }),
    [age65, cadRiskFactors, knownCAD, asaUse, severeAngina, stChanges, cardiacMarker],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'timi-ua-nstemi',
          label: 'TIMI Score (UA/NSTEMI)',
          value: liveResult.score,
          unit: '',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { age65, cadRiskFactors, knownCAD, asaUse, severeAngina, stChanges, cardiacMarker },
      formulaUsed:
        'Addition of the selected points (each +1):\n\n' +
        'Age >=65\n' +
        '>=3 CAD risk factors (hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker)\n' +
        'Known CAD (stenosis >=50%)\n' +
        'ASA use in past 7 days\n' +
        'Severe angina (>=2 episodes in 24 hrs)\n' +
        'EKG ST changes >=0.5mm\n' +
        'Positive cardiac marker',
      references: liveResult.references,
    });
  }, [liveResult, age65, asaUse, cadRiskFactors, cardiacMarker, knownCAD, severeAngina, stChanges]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age ≥65">
        <YesNo value={age65} onChange={setAge65} />
      </Field>

      <Field
        label="≥3 CAD risk factors"
        hint="Hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker"
      >
        <YesNo value={cadRiskFactors} onChange={setCadRiskFactors} />
      </Field>

      <Field label="Known CAD (stenosis ≥50%)">
        <YesNo value={knownCAD} onChange={setKnownCAD} />
      </Field>

      <Field label="ASA use in past 7 days">
        <YesNo value={asaUse} onChange={setAsaUse} />
      </Field>

      <Field label="Severe angina (≥2 episodes in 24 hrs)">
        <YesNo value={severeAngina} onChange={setSevereAngina} />
      </Field>

      <Field label="EKG ST changes ≥0.5mm">
        <YesNo value={stChanges} onChange={setStChanges} />
      </Field>

      <Field label="Positive cardiac marker">
        <YesNo value={cardiacMarker} onChange={setCardiacMarker} />
      </Field>
    </div>
  );
}
