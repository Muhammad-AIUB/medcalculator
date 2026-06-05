'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateHasBled } from '@/lib/calculators/has-bled';

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

export function HasBledForm({ onResult }: Props) {
  const [hypertension, setHypertension] = useState<Binary>(0);
  const [renalDisease, setRenalDisease] = useState<Binary>(0);
  const [liverDisease, setLiverDisease] = useState<Binary>(0);
  const [stroke,       setStroke]       = useState<Binary>(0);
  const [bleeding,     setBleeding]     = useState<Binary>(0);
  const [labileINR,    setLabileINR]    = useState<Binary>(0);
  const [elderly,      setElderly]      = useState<Binary>(0);
  const [medications,  setMedications]  = useState<Binary>(0);
  const [alcohol,      setAlcohol]      = useState<Binary>(0);

  const liveResult = useMemo(() =>
    calculateHasBled({
      hypertension,
      renalDisease,
      liverDisease,
      strokeHistory: stroke,
      priorBleeding: bleeding,
      labileINR,
      elderly,
      medications,
      alcoholUse: alcohol,
    }),
    [hypertension, renalDisease, liverDisease, stroke, bleeding, labileINR, elderly, medications, alcohol],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'has-bled',
          label: 'HAS-BLED Score',
          value: liveResult.score,
          unit: '',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { hypertension, renalDisease, liverDisease, stroke, bleeding, labileINR, elderly, medications, alcohol },
      formulaUsed:
        'Addition of the selected points:\n\n' +
        'Hypertension (uncontrolled, >160 mmHg systolic): +1\n' +
        'Renal disease (dialysis, transplant, Cr >2.26 mg/dL or >200 umol/L): +1\n' +
        'Liver disease (cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal): +1\n' +
        'Stroke history: +1\n' +
        'Prior major bleeding or predisposition to bleeding: +1\n' +
        'Labile INR (unstable/high INRs, time in therapeutic range <60%): +1\n' +
        'Elderly (age >65): +1\n' +
        'Medication usage predisposing to bleeding (aspirin, clopidogrel, NSAIDs): +1\n' +
        'Alcohol use (>=8 drinks/week): +1',
      references: liveResult.references,
    });
  }, [liveResult, alcohol, bleeding, elderly, hypertension, labileINR, liverDisease, medications, renalDisease, stroke]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Hypertension" hint="Uncontrolled, >160 mmHg systolic">
        <YesNo value={hypertension} onChange={setHypertension} />
      </Field>

      <Field label="Renal disease" hint="Dialysis, transplant, Cr >2.26 mg/dL or >200 µmol/L">
        <YesNo value={renalDisease} onChange={setRenalDisease} />
      </Field>

      <Field label="Liver disease" hint="Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal">
        <YesNo value={liverDisease} onChange={setLiverDisease} />
      </Field>

      <Field label="Stroke history">
        <YesNo value={stroke} onChange={setStroke} />
      </Field>

      <Field label="Prior major bleeding or predisposition to bleeding">
        <YesNo value={bleeding} onChange={setBleeding} />
      </Field>

      <Field label="Labile INR" hint="Unstable/high INRs, time in therapeutic range <60%">
        <YesNo value={labileINR} onChange={setLabileINR} />
      </Field>

      <Field label="Age >65">
        <YesNo value={elderly} onChange={setElderly} />
      </Field>

      <Field label="Medication usage predisposing to bleeding" hint="Aspirin, clopidogrel, NSAIDs">
        <YesNo value={medications} onChange={setMedications} />
      </Field>

      <Field label="Alcohol use" hint="≥8 drinks/week">
        <YesNo value={alcohol} onChange={setAlcohol} />
      </Field>
    </div>
  );
}
