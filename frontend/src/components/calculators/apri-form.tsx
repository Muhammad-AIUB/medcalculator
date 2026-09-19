'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { APRI_FORMULA, calculateAPRI } from '@/lib/calculators/apri';
import { NumInput, isFilled } from './shared-ui';

interface ApriFormProps {
  onResult: (result: any) => void;
}

// Ranges warn, they never block — the point is to catch a value that landed in
// the wrong box, not to argue with a real patient. The ceilings are deliberately
// generous: AST does reach the low thousands in ischaemic or acute viral
// hepatitis, and a reactive thrombocytosis can pass 1000. Platelet bounds match
// what cci-form already declares for the same two units.
const AST_MIN = 0;
const AST_MAX = 5000;
const PLATELET_MIN = 0;
const PLATELET_MAX = 1000;

function NumberRow({
  title,
  unit,
  placeholder,
  value,
  onChange,
  min,
  max,
  step,
}: {
  title: string;
  unit: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: string;
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

function PlateletRow({
  platelets109L,
  platelets103Ul,
  onPlatelets109LChange,
  onPlatelets103UlChange,
}: {
  platelets109L: string;
  platelets103Ul: string;
  onPlatelets109LChange: (value: string) => void;
  onPlatelets103UlChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <label className="text-base font-normal leading-tight text-foreground" htmlFor="Platelet count 10^9/L">
        Platelet count
      </label>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <NumInput
          id="Platelet count 10^9/L"
          value={platelets109L}
          onChange={onPlatelets109LChange}
          suffix="x 10^9/L"
          min={PLATELET_MIN}
          max={PLATELET_MAX}
          step="1"
          placeholder="Norm: 150 - 400"
        />
        <span className="text-center text-sm font-semibold text-muted-foreground">OR</span>
        <NumInput
          id="Platelet count 10^3/uL"
          value={platelets103Ul}
          onChange={onPlatelets103UlChange}
          suffix="x 10^3/uL"
          min={PLATELET_MIN}
          max={PLATELET_MAX}
          step="1"
          placeholder="Norm: 150 - 400"
        />
      </div>
    </div>
  );
}

export function ApriForm({ onResult }: ApriFormProps) {
  const [ast, setAst] = useState('');
  const [astUpperLimit, setAstUpperLimit] = useState('');
  const [platelets109L, setPlatelets109L] = useState('');
  const [platelets103Ul, setPlatelets103Ul] = useState('');

  const handlePlatelets109LChange = (value: string) => {
    setPlatelets109L(value);
    setPlatelets103Ul(value);
  };

  const handlePlatelets103UlChange = (value: string) => {
    setPlatelets103Ul(value);
    setPlatelets109L(value);
  };

  const inputs = useMemo(
    () => ({
      ast: Number(ast || 0),
      astUpperLimit: Number(astUpperLimit || 1),
      platelets: Number(platelets109L || platelets103Ul || 1),
      plateletUnit: '10^9/L' as const,
    }),
    [ast, astUpperLimit, platelets103Ul, platelets109L],
  );

  const liveResult = useMemo(() => calculateAPRI(inputs), [inputs]);
  const complete =
    isFilled(ast) && isFilled(astUpperLimit) && isFilled(platelets109L, platelets103Ul);

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
          id: 'apri',
          label: 'APRI Score',
          value: liveResult.score ?? 0,
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: { ...inputs, platelets109L: Number(platelets109L || 0), platelets103Ul: Number(platelets103Ul || 0) },
      formulaUsed: APRI_FORMULA,
    });
  }, [complete, inputs, liveResult, platelets103Ul, platelets109L]);

  return (
    <div>
      <NumberRow
        title="AST"
        unit="U/L"
        placeholder="Norm: 10 - 40"
        value={ast}
        onChange={setAst}
        min={AST_MIN}
        max={AST_MAX}
        step="1"
      />
      {/* The reporting lab's own cut-off, and the divisor in the formula — a
          zero here would send the score to infinity, so the floor is 1. */}
      <NumberRow
        title="AST upper limit of normal"
        unit="U/L"
        placeholder="Typically 30 - 40"
        value={astUpperLimit}
        onChange={setAstUpperLimit}
        min={1}
        max={100}
        step="1"
      />
      <PlateletRow
        platelets109L={platelets109L}
        platelets103Ul={platelets103Ul}
        onPlatelets109LChange={handlePlatelets109LChange}
        onPlatelets103UlChange={handlePlatelets103UlChange}
      />
    </div>
  );
}
