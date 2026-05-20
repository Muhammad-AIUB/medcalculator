'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CDAI_FORMULA, calculateCDAI } from '@/lib/calculators/cdai';

interface CdaiFormProps {
  onResult: (result: any) => void;
}

const assessmentOptions = Array.from({ length: 21 }, (_, index) => {
  const value = index * 0.5;
  if (value === 0) return { label: '0.0 - Very well', score: 0 };
  if (value === 10) return { label: '10.0 - Very poor', score: 10 };
  return { label: value.toFixed(1), score: value };
});

function formatScore(score: number) {
  if (score === 0) return '0';
  return `+${Number.isInteger(score) ? score : score.toFixed(1)}`;
}

function NumberRow({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <label className="text-base font-normal leading-tight text-foreground" htmlFor={title}>
        {title}
      </label>
      <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <input
          id={title}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[42px] flex-1 bg-transparent px-3 text-right text-base font-semibold outline-none"
        />
        <span className="flex min-w-[66px] items-center justify-center border-l border-border px-3 text-sm font-semibold text-foreground">
          joints
        </span>
      </div>
    </div>
  );
}

function AssessmentGroup({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number;
  onChange: (score: number) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <p className="text-base font-normal leading-relaxed text-foreground">{title}</p>
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {assessmentOptions.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.score)}
            className={`flex min-h-[34px] w-full items-center justify-between gap-4 border-border px-3 py-2 text-left text-sm font-bold leading-snug transition-colors ${
              index > 0 ? 'border-t' : ''
            } ${value === option.score ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            <span>{option.label}</span>
            <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>{formatScore(option.score)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CdaiForm({ onResult }: CdaiFormProps) {
  const [tenderJointCount, setTenderJointCount] = useState('');
  const [swollenJointCount, setSwollenJointCount] = useState('');
  const [patientGlobal, setPatientGlobal] = useState(0);
  const [providerGlobal, setProviderGlobal] = useState(0);

  const inputs = useMemo(
    () => ({
      tenderJointCount: Number(tenderJointCount || 0),
      swollenJointCount: Number(swollenJointCount || 0),
      patientGlobal,
      providerGlobal,
    }),
    [patientGlobal, providerGlobal, swollenJointCount, tenderJointCount],
  );

  const liveResult = useMemo(() => calculateCDAI(inputs), [inputs]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'cdai',
          label: 'CDAI',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs,
      formulaUsed: CDAI_FORMULA,
    });
  }, [inputs, liveResult]);

  return (
    <div>
      <NumberRow title="Tender joint count" value={tenderJointCount} onChange={setTenderJointCount} />
      <NumberRow title="Swollen joint count" value={swollenJointCount} onChange={setSwollenJointCount} />
      <AssessmentGroup
        title="Ask the patient: Considering all the ways arthritis affects you, how well are you doing?"
        value={patientGlobal}
        onChange={setPatientGlobal}
      />
      <AssessmentGroup
        title="Per medical opinion: Considering all the ways arthritis affects the patient, how well are they doing?"
        value={providerGlobal}
        onChange={setProviderGlobal}
      />
    </div>
  );
}
