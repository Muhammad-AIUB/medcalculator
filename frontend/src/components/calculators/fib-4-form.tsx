'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FIB4_FORMULA, calculateFIB4 } from '@/lib/calculators/fib-4';

interface Fib4FormProps {
  onResult: (result: any) => void;
}

type PlateletUnit = '10^9/L' | '10^3/uL';

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
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  value: string;
  unit: PlateletUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: PlateletUnit) => void;
}) {
  const nextUnit: PlateletUnit = unit === '10^9/L' ? '10^3/uL' : '10^9/L';

  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <label className="text-base font-normal leading-tight text-foreground" htmlFor="Platelet count">
        Platelet count
      </label>
      <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <input
          id="Platelet count"
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          placeholder="Norm: 150 - 350"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="min-h-[42px] flex-1 bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => onUnitChange(nextUnit)}
          className="flex min-w-[104px] items-center justify-center gap-2 border-l border-border bg-muted px-3 text-sm font-bold text-foreground transition-colors hover:bg-muted/80"
        >
          <span>{unit === '10^9/L' ? 'x 10^9/L' : 'x 10^3/uL'}</span>
          <span className="text-base text-muted-foreground">&lt;-&gt;</span>
        </button>
      </div>
    </div>
  );
}

export function Fib4Form({ onResult }: Fib4FormProps) {
  const [age, setAge] = useState('');
  const [ast, setAst] = useState('');
  const [alt, setAlt] = useState('');
  const [platelets, setPlatelets] = useState('');
  const [plateletUnit, setPlateletUnit] = useState<PlateletUnit>('10^9/L');

  const inputs = useMemo(
    () => ({
      age: Number(age || 0),
      ast: Number(ast || 0),
      alt: Number(alt || 1),
      platelets: Number(platelets || 1),
      plateletUnit,
    }),
    [age, alt, ast, plateletUnit, platelets],
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
      inputs,
      formulaUsed: FIB4_FORMULA,
    });
  }, [inputs, liveResult]);

  return (
    <div>
      <NumberRow
        title="Age"
        note="Use with caution in patients <35 or >65 years old, as the score has been shown to be less reliable in these patients"
        unit="years"
        value={age}
        onChange={setAge}
      />
      <NumberRow title="AST" note="Aspartate aminotransferase" unit="U/L" placeholder="Norm: 15 - 41" value={ast} onChange={setAst} />
      <NumberRow title="ALT" note="Alanine aminotransferase" unit="U/L" placeholder="Norm: 1 - 35" value={alt} onChange={setAlt} />
      <PlateletRow value={platelets} unit={plateletUnit} onValueChange={setPlatelets} onUnitChange={setPlateletUnit} />
    </div>
  );
}
