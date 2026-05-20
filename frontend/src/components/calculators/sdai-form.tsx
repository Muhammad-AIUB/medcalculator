'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SDAI_FORMULA, calculateSDAI } from '@/lib/calculators/sdai';

interface SdaiFormProps {
  onResult: (result: any) => void;
}

const assessmentOptions = Array.from({ length: 21 }, (_, index) => {
  const value = index * 0.5;
  if (value === 0) return { label: '0.0 - Very well', score: 0 };
  if (value === 10) return { label: '10.0 - Very poor', score: 10 };
  return { label: value.toFixed(1), score: value };
});

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatScore(score: number) {
  if (score === 0) return '0';
  return `+${formatNumber(score)}`;
}

function NumberRow({
  title,
  unit,
  value,
  onChange,
}: {
  title: string;
  unit: string;
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
          {unit}
        </span>
      </div>
    </div>
  );
}

function CrpRow({
  mgDl,
  mgL,
  onMgDlChange,
  onMgLChange,
}: {
  mgDl: string;
  mgL: string;
  onMgDlChange: (value: string) => void;
  onMgLChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <p className="text-base font-normal leading-tight text-foreground">C-reactive protein (CRP)</p>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={mgDl}
            onChange={(event) => onMgDlChange(event.target.value)}
            className="min-h-[42px] flex-1 bg-transparent px-3 text-right text-base font-semibold outline-none"
          />
          <span className="flex min-w-[72px] items-center justify-center border-l border-border px-3 text-sm font-semibold text-foreground">
            mg/dL
          </span>
        </div>
        <span className="text-center text-sm font-semibold text-muted-foreground">OR</span>
        <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            value={mgL}
            onChange={(event) => onMgLChange(event.target.value)}
            className="min-h-[42px] flex-1 bg-transparent px-3 text-right text-base font-semibold outline-none"
          />
          <span className="flex min-w-[72px] items-center justify-center border-l border-border px-3 text-sm font-semibold text-foreground">
            mg/L
          </span>
        </div>
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

export function SdaiForm({ onResult }: SdaiFormProps) {
  const [tenderJointCount, setTenderJointCount] = useState('');
  const [swollenJointCount, setSwollenJointCount] = useState('');
  const [crpMgDl, setCrpMgDl] = useState('');
  const [crpMgL, setCrpMgL] = useState('');
  const [patientGlobal, setPatientGlobal] = useState(0);
  const [providerGlobal, setProviderGlobal] = useState(0);

  const handleCrpMgDlChange = (value: string) => {
    setCrpMgDl(value);
    const numericValue = Number(value);
    setCrpMgL(value === '' || Number.isNaN(numericValue) ? '' : formatNumber(numericValue * 10));
  };

  const handleCrpMgLChange = (value: string) => {
    setCrpMgL(value);
    const numericValue = Number(value);
    setCrpMgDl(value === '' || Number.isNaN(numericValue) ? '' : formatNumber(numericValue / 10));
  };

  const inputs = useMemo(
    () => ({
      tenderJointCount: Number(tenderJointCount || 0),
      swollenJointCount: Number(swollenJointCount || 0),
      crpMgDl: Number(crpMgDl || 0),
      patientGlobal,
      providerGlobal,
    }),
    [crpMgDl, patientGlobal, providerGlobal, swollenJointCount, tenderJointCount],
  );

  const liveResult = useMemo(() => calculateSDAI(inputs), [inputs]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'sdai',
          label: 'SDAI',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: { ...inputs, crpMgL: Number(crpMgL || 0) },
      formulaUsed: SDAI_FORMULA,
    });
  }, [crpMgL, inputs, liveResult]);

  return (
    <div>
      <NumberRow title="Tender joint count" unit="joints" value={tenderJointCount} onChange={setTenderJointCount} />
      <NumberRow title="Swollen joint count" unit="joints" value={swollenJointCount} onChange={setSwollenJointCount} />
      <CrpRow mgDl={crpMgDl} mgL={crpMgL} onMgDlChange={handleCrpMgDlChange} onMgLChange={handleCrpMgLChange} />
      <AssessmentGroup
        title="Ask the patient: considering all the ways arthritis affects you, how well are you doing?"
        value={patientGlobal}
        onChange={setPatientGlobal}
      />
      <AssessmentGroup
        title="Per medical opinion: considering all the ways arthritis affects the patient, how well are they doing?"
        value={providerGlobal}
        onChange={setProviderGlobal}
      />
    </div>
  );
}
