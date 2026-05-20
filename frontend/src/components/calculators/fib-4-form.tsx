'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FIB4_FORMULA, calculateFIB4 } from '@/lib/calculators/fib-4';

interface Fib4FormProps {
  onResult: (result: any) => void;
}

function NumberRow({
  title,
  note,
  unit,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  note?: string;
  unit: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <label className="text-base font-normal leading-tight text-foreground" htmlFor={title}>
          {title}
        </label>
        {note && <p className="text-sm leading-relaxed text-foreground">{note}</p>}
      </div>
      <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <input
          id={title}
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[42px] flex-1 bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground"
        />
        <span className="flex min-w-[72px] items-center justify-center border-l border-border px-3 text-sm font-semibold text-foreground">
          {unit}
        </span>
      </div>
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
        <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <input
            id="Platelet count 10^9/L"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            placeholder=""
            value={platelets109L}
            onChange={(event) => onPlatelets109LChange(event.target.value)}
            className="min-h-[42px] flex-1 bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground"
          />
          <span className="flex min-w-[104px] items-center justify-center border-l border-border bg-muted px-3 text-sm font-bold text-foreground">
            x 10^9/L
          </span>
        </div>
        <span className="text-center text-sm font-semibold text-muted-foreground">OR</span>
        <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          <input
            id="Platelet count 10^3/uL"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            placeholder=""
            value={platelets103Ul}
            onChange={(event) => onPlatelets103UlChange(event.target.value)}
            className="min-h-[42px] flex-1 bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground"
          />
          <span className="flex min-w-[104px] items-center justify-center border-l border-border bg-muted px-3 text-sm font-bold text-foreground">
            x 10^3/uL
          </span>
        </div>
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
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'fib-4',
          label: 'FIB-4 Score',
          value: liveResult.score ?? 0,
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: { ...inputs, platelets109L: Number(platelets109L || 0), platelets103Ul: Number(platelets103Ul || 0) },
      formulaUsed: FIB4_FORMULA,
    });
  }, [inputs, liveResult, platelets103Ul, platelets109L]);

  return (
    <div>
      <NumberRow
        title="Age"
        note="Use with caution in patients <35 or >65 years old, as the score has been shown to be less reliable in these patients"
        unit="years"
        value={age}
        onChange={setAge}
      />
      <NumberRow title="AST" note="Aspartate aminotransferase" unit="U/L" placeholder="" value={ast} onChange={setAst} />
      <NumberRow title="ALT" note="Alanine aminotransferase" unit="U/L" placeholder="" value={alt} onChange={setAlt} />
      <PlateletRow
        platelets109L={platelets109L}
        platelets103Ul={platelets103Ul}
        onPlatelets109LChange={handlePlatelets109LChange}
        onPlatelets103UlChange={handlePlatelets103UlChange}
      />
    </div>
  );
}
