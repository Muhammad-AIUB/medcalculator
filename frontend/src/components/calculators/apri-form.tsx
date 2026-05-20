'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { APRI_FORMULA, calculateAPRI } from '@/lib/calculators/apri';

interface ApriFormProps {
  onResult: (result: any) => void;
}

function NumberRow({
  title,
  unit,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  unit: string;
  placeholder: string;
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
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
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
  }, [inputs, liveResult, platelets103Ul, platelets109L]);

  return (
    <div>
      <NumberRow title="AST" unit="U/L" placeholder="" value={ast} onChange={setAst} />
      <NumberRow
        title="AST upper limit of normal"
        unit="U/L"
        placeholder=""
        value={astUpperLimit}
        onChange={setAstUpperLimit}
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
