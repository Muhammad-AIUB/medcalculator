'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { APRI_FORMULA, calculateAPRI } from '@/lib/calculators/apri';

interface ApriFormProps {
  onResult: (result: any) => void;
}

type PlateletUnit = '10^9/L' | '10^3/uL';

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

export function ApriForm({ onResult }: ApriFormProps) {
  const [ast, setAst] = useState('');
  const [astUpperLimit, setAstUpperLimit] = useState('');
  const [platelets, setPlatelets] = useState('');
  const [plateletUnit, setPlateletUnit] = useState<PlateletUnit>('10^9/L');

  const inputs = useMemo(
    () => ({
      ast: Number(ast || 0),
      astUpperLimit: Number(astUpperLimit || 1),
      platelets: Number(platelets || 1),
      plateletUnit,
    }),
    [ast, astUpperLimit, plateletUnit, platelets],
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
      inputs,
      formulaUsed: APRI_FORMULA,
    });
  }, [inputs, liveResult]);

  return (
    <div>
      <NumberRow title="AST" unit="U/L" placeholder="Norm: 15 - 41" value={ast} onChange={setAst} />
      <NumberRow
        title="AST upper limit of normal"
        unit="U/L"
        placeholder="Norm: 15 - 41"
        value={astUpperLimit}
        onChange={setAstUpperLimit}
      />
      <PlateletRow value={platelets} unit={plateletUnit} onValueChange={setPlatelets} onUnitChange={setPlateletUnit} />
    </div>
  );
}
