'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DAS28_ESR_FORMULA, calculateDAS28ESR } from '@/lib/calculators/das28-esr';
import { NumInput, isFilled } from './shared-ui';

interface Das28EsrFormProps {
  onResult: (result: any) => void;
}

// DAS28 is, by name, the 28-joint count. ESR is bounded well above the ~140
// mm/hr a Westergren tube can physically report, so the ceiling only catches a
// value meant for a different box; the formula takes ln(ESR), so the floor is 1
// rather than 0.
const JOINT_COUNT_MAX = 28;
const ESR_MAX = 150;

const globalHealthOptions = Array.from({ length: 21 }, (_, index) => {
  const value = index * 0.5;
  if (value === 0) return { label: '0.0 - Very Well', score: 0 };
  if (value === 10) return { label: '10.0 - Very Poor', score: 10 };
  return { label: value.toFixed(1), score: value };
});

function NumberRow({
  title,
  unit,
  value,
  step = '1',
  onChange,
  min,
  max,
  placeholder,
}: {
  title: string;
  unit: string;
  value: string;
  step?: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
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

function GlobalHealthGroup({
  value,
  onChange,
}: {
  value: number;
  onChange: (score: number) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <p className="text-base font-normal leading-relaxed text-foreground">Global Health</p>
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {globalHealthOptions.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.score)}
            className={`flex min-h-[34px] w-full items-center justify-center border-border px-3 py-2 text-center text-sm font-bold leading-snug transition-colors ${
              index > 0 ? 'border-t' : ''
            } ${value === option.score ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Das28EsrForm({ onResult }: Das28EsrFormProps) {
  const [tenderJointCount, setTenderJointCount] = useState('');
  const [swollenJointCount, setSwollenJointCount] = useState('');
  const [esr, setEsr] = useState('');
  const [globalHealth, setGlobalHealth] = useState(0);

  const inputs = useMemo(
    () => ({
      tenderJointCount: Number(tenderJointCount || 0),
      swollenJointCount: Number(swollenJointCount || 0),
      esr: Number(esr || 1),
      globalHealth,
    }),
    [esr, globalHealth, swollenJointCount, tenderJointCount],
  );

  const liveResult = useMemo(() => calculateDAS28ESR(inputs), [inputs]);
  const complete =
    isFilled(tenderJointCount) && isFilled(swollenJointCount) && isFilled(esr);

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
          id: 'das28-esr',
          label: 'DAS28-ESR Score',
          value: liveResult.score ?? 0,
          unit: 'points',
          minDecimals: 1,   // MDCalc pads: "4.0 points"
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs,
      formulaUsed: DAS28_ESR_FORMULA,
    });
  }, [complete, inputs, liveResult]);

  return (
    <div>
      <NumberRow
        title="Tender Joint Count"
        unit="joints"
        value={tenderJointCount}
        onChange={setTenderJointCount}
        min={0}
        max={JOINT_COUNT_MAX}
        placeholder="0 - 28"
      />
      <NumberRow
        title="Swollen Joint Count"
        unit="joints"
        value={swollenJointCount}
        onChange={setSwollenJointCount}
        min={0}
        max={JOINT_COUNT_MAX}
        placeholder="0 - 28"
      />
      <NumberRow
        title="Erythrocyte Sedimentation Rate (ESR)"
        unit="mm/hr"
        value={esr}
        onChange={setEsr}
        min={1}
        max={ESR_MAX}
        placeholder="Norm: < 20"
      />
      <GlobalHealthGroup value={globalHealth} onChange={setGlobalHealth} />
    </div>
  );
}
