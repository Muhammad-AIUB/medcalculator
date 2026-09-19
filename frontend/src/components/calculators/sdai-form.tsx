'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SDAI_FORMULA, calculateSDAI } from '@/lib/calculators/sdai';
import { NumInput, isFilled } from './shared-ui';

interface SdaiFormProps {
  onResult: (result: any) => void;
}

// SDAI is scored on the 28-joint count; above 28 is a miscount or a value meant
// for another box. The CRP ceilings are the same number in the two units
// (50 mg/dL = 500 mg/L) and sit well above what severe sepsis reaches, so they
// only catch a unit mix-up — entering 120 mg/L into the mg/dL box.
const JOINT_COUNT_MAX = 28;
const CRP_MAX_MG_DL = 50;
const CRP_MAX_MG_L = 500;

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
  min,
  max,
  step,
  placeholder,
}: {
  title: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <label className="text-base font-normal leading-tight text-foreground" htmlFor={title}>
        {title}
      </label>
      <NumInput
        id={title}
        value={value}
        onChange={onChange}
        suffix={unit}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
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
        <NumInput
          value={mgDl}
          onChange={onMgDlChange}
          suffix="mg/dL"
          min={0}
          max={CRP_MAX_MG_DL}
          step="0.1"
          placeholder="Norm: < 0.5"
        />
        <span className="text-center text-sm font-semibold text-muted-foreground">OR</span>
        <NumInput
          value={mgL}
          onChange={onMgLChange}
          suffix="mg/L"
          min={0}
          max={CRP_MAX_MG_L}
          step="1"
          placeholder="Norm: < 5"
        />
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
  const complete =
    isFilled(tenderJointCount) && isFilled(swollenJointCount) && isFilled(crpMgDl, crpMgL);

  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    // A blank box is read as 0 (or 1, to keep a division safe), so without this
    // an untouched form reports a real-looking score. Hold the result until the
    // clinician has actually entered the values.
    if (!complete) {
      onResultRef.current(null);
      return;
    }
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
  }, [complete, crpMgL, inputs, liveResult]);

  return (
    <div>
      <NumberRow
        title="Tender joint count"
        unit="joints"
        value={tenderJointCount}
        onChange={setTenderJointCount}
        min={0}
        max={JOINT_COUNT_MAX}
        step="1"
        placeholder="0 - 28"
      />
      <NumberRow
        title="Swollen joint count"
        unit="joints"
        value={swollenJointCount}
        onChange={setSwollenJointCount}
        min={0}
        max={JOINT_COUNT_MAX}
        step="1"
        placeholder="0 - 28"
      />
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
