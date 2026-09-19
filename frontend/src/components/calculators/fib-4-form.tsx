'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FIB4_FORMULA, calculateFIB4 } from '@/lib/calculators/fib-4';
import { NumInput, isFilled } from './shared-ui';

interface Fib4FormProps {
  onResult: (result: any) => void;
}

// Warn, never block. Transaminases run into the thousands in acute hepatitis and
// a reactive thrombocytosis passes 1000, so the ceilings only catch a value that
// went into the wrong box. Platelet bounds match cci-form for the same units.
const TRANSAMINASE_MIN = 0;
const TRANSAMINASE_MAX = 5000;
const PLATELET_MIN = 0;
const PLATELET_MAX = 1000;

function NumberRow({
  title,
  note,
  unit,
  placeholder,
  value,
  onChange,
  min,
  max,
  step,
}: {
  title: string;
  note?: string;
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
      <div className="space-y-2">
        <label className="text-base font-normal leading-tight text-foreground" htmlFor={title}>
          {title}
        </label>
        {note && <p className="text-sm leading-relaxed text-foreground">{note}</p>}
      </div>
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

export function Fib4Form({ onResult }: Fib4FormProps) {
  const [age, setAge] = useState('');
  const [ast, setAst] = useState('');
  const [alt, setAlt] = useState('');
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
      age: Number(age || 0),
      ast: Number(ast || 0),
      alt: Number(alt || 1),
      platelets: Number(platelets109L || platelets103Ul || 1),
      plateletUnit: '10^9/L' as const,
    }),
    [age, alt, ast, platelets103Ul, platelets109L],
  );

  const liveResult = useMemo(() => calculateFIB4(inputs), [inputs]);
  const complete =
    isFilled(age) && isFilled(ast) && isFilled(alt) && isFilled(platelets109L, platelets103Ul);

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
          id: 'fib-4',
          label: 'FIB-4 Score',
          value: liveResult.score ?? 0,
          decimals: 2,   // MDCalc shows FIB-4 to 2 dp (e.g. 0.45)
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: { ...inputs, platelets109L: Number(platelets109L || 0), platelets103Ul: Number(platelets103Ul || 0) },
      formulaUsed: FIB4_FORMULA,
    });
  }, [complete, inputs, liveResult, platelets103Ul, platelets109L]);

  return (
    <div>
      {/* FIB-4 was derived and validated in adults, so the floor is 18 rather
          than the 1 that age-in-a-formula calculators such as eGFR use. */}
      <NumberRow
        title="Age"
        note="Use with caution in patients <35 or >65 years old, as the score has been shown to be less reliable in these patients"
        unit="years"
        value={age}
        onChange={setAge}
        min={18}
        max={110}
        step="1"
      />
      <NumberRow
        title="AST"
        note="Aspartate aminotransferase"
        unit="U/L"
        placeholder="Norm: 10 - 40"
        value={ast}
        onChange={setAst}
        min={TRANSAMINASE_MIN}
        max={TRANSAMINASE_MAX}
        step="1"
      />
      {/* ALT divides the score, so a zero would send it to infinity. */}
      <NumberRow
        title="ALT"
        note="Alanine aminotransferase"
        unit="U/L"
        placeholder="Norm: 7 - 56"
        value={alt}
        onChange={setAlt}
        min={1}
        max={TRANSAMINASE_MAX}
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
