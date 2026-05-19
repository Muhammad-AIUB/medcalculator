'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calculateGCS, type GcsComponentValue } from '@/lib/calculators/gcs';

interface GcsFormProps {
  onResult: (result: any) => void;
}

interface GcsOption {
  label: string;
  value: GcsComponentValue;
}

const eyeOptions: GcsOption[] = [
  { label: 'Spontaneously (+4)', value: 4 },
  { label: 'To verbal command (+3)', value: 3 },
  { label: 'To pain (+2)', value: 2 },
  { label: 'No eye opening (+1)', value: 1 },
  { label: 'Not testable (NT)', value: 'NT' },
];

const verbalOptions: GcsOption[] = [
  { label: 'Oriented (+5)', value: 5 },
  { label: 'Confused (+4)', value: 4 },
  { label: 'Inappropriate words (+3)', value: 3 },
  { label: 'Incomprehensible sounds (+2)', value: 2 },
  { label: 'No verbal response (+1)', value: 1 },
  { label: 'Not testable/intubated (NT)', value: 'NT' },
];

const motorOptions: GcsOption[] = [
  { label: 'Obeys commands (+6)', value: 6 },
  { label: 'Localizes pain (+5)', value: 5 },
  { label: 'Withdrawal from pain (+4)', value: 4 },
  { label: 'Flexion to pain (+3)', value: 3 },
  { label: 'Extension to pain (+2)', value: 2 },
  { label: 'No motor response (+1)', value: 1 },
  { label: 'Not testable (NT)', value: 'NT' },
];

function ResponseGroup({
  title,
  note,
  options,
  value,
  onChange,
}: {
  title: string;
  note: string;
  options: GcsOption[];
  value: GcsComponentValue;
  onChange: (value: GcsComponentValue) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <p className="text-xl font-normal leading-tight text-foreground">{title}</p>
        <p className="max-w-xl text-base leading-relaxed text-foreground">{note}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            className={`block h-[52px] w-full border-border px-3 text-center text-base font-bold transition-colors ${
              index > 0 ? 'border-t' : ''
            } ${value === option.value ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GcsForm({ onResult }: GcsFormProps) {
  const [eye, setEye] = useState<GcsComponentValue>(4);
  const [verbal, setVerbal] = useState<GcsComponentValue>(5);
  const [motor, setMotor] = useState<GcsComponentValue>(6);

  const liveResult = useMemo(() => calculateGCS({ eye, verbal, motor }), [eye, verbal, motor]);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    const value = liveResult.score ?? liveResult.value ?? '';
    onResultRef.current({
      outputs: [
        {
          id: 'gcs',
          label: 'GCS',
          value,
          unit: liveResult.unit,
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: { eye, verbal, motor },
      formulaUsed: liveResult.formula,
    });
  }, [liveResult, eye, verbal, motor]);

  return (
    <div className="space-y-6">
      <ResponseGroup
        title="Best eye response"
        note={'If local injury, edema, or otherwise unable to be assessed, mark "Not testable (NT)"'}
        options={eyeOptions}
        value={eye}
        onChange={setEye}
      />
      <ResponseGroup
        title="Best verbal response"
        note={'If intubated or otherwise unable to be assessed, mark "Not testable (NT)"'}
        options={verbalOptions}
        value={verbal}
        onChange={setVerbal}
      />
      <ResponseGroup
        title="Best motor response"
        note={'If on sedation/paralysis or unable to be assessed, mark "Not testable (NT)"'}
        options={motorOptions}
        value={motor}
        onChange={setMotor}
      />
    </div>
  );
}
