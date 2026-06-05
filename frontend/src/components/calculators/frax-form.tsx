'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FRAX_FORMULA, calculateFRAX } from '@/lib/calculators/frax';

interface FraxFormProps {
  onResult: (result: any) => void;
}

interface FraxOption {
  label: string;
  score: number;
}

const groups = [
  {
    id: 'age',
    title: 'Age, years',
    options: [
      { label: '<65', score: 0 },
      { label: '65-69', score: 1 },
      { label: '70-74', score: 2 },
      { label: '75-79', score: 3 },
      { label: '80-84', score: 4 },
      { label: '>=85', score: 5 },
    ],
  },
  {
    id: 'fractureHistory',
    title: 'History of any fracture after age 50',
    options: [
      { label: "No/don't know", score: 0 },
      { label: 'Yes', score: 1 },
    ],
  },
  {
    id: 'motherHipFracture',
    title: "Mother's history of a hip fracture after age 50",
    options: [
      { label: "No/don't know", score: 0 },
      { label: 'Yes', score: 1 },
    ],
  },
  {
    id: 'weight',
    title: 'Weight',
    options: [
      { label: '>125 lb (>56.7 kg)', score: 0 },
      { label: '<=125 lb (<=56.7 kg)', score: 1 },
    ],
  },
  {
    id: 'smoker',
    title: 'Current smoker',
    segmented: true,
    options: [
      { label: 'No', score: 0 },
      { label: 'Yes', score: 1 },
    ],
  },
  {
    id: 'chairRise',
    title: 'Need to use arms to assist themself in standing up from a chair',
    options: [
      { label: "No/don't know", score: 0 },
      { label: 'Yes', score: 2 },
    ],
  },
  {
    id: 'bmd',
    title: 'BMD results: total hip T-score',
    note: 'Optional',
    options: [
      { label: '>=-1', score: 0 },
      { label: 'Between -1 and -2', score: 2 },
      { label: 'Between -2 and -2.5', score: 3 },
      { label: '<-2.5', score: 4 },
    ],
  },
] as const;

type GroupId = typeof groups[number]['id'];
type Scores = Record<GroupId, number>;

function formatScore(score: number) {
  if (score > 0) return `+${score}`;
  return String(score);
}

function OptionGroup({
  title,
  note,
  options,
  value,
  onChange,
  segmented,
}: {
  title: string;
  note?: string;
  options: readonly FraxOption[];
  value: number;
  onChange: (score: number) => void;
  segmented?: boolean;
}) {
  const selectedClass = 'bg-[#16836e] text-white';
  const idleClass = 'bg-background text-foreground hover:bg-muted';

  if (segmented) {
    return (
      <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
        <div className="space-y-2">
          <p className="text-base font-normal leading-tight text-foreground">{title}</p>
          {note && <p className="text-sm leading-relaxed text-foreground">{note}</p>}
        </div>
        <div className={`grid min-h-[36px] overflow-hidden rounded-lg border border-border bg-background shadow-sm`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
          {options.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.score)}
              className={`flex items-center justify-between gap-3 border-border px-3 py-2 text-sm font-bold transition-colors ${
                index > 0 ? 'border-l' : ''
              } ${value === option.score ? selectedClass : idleClass}`}
            >
              <span>{option.label}</span>
              <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>{formatScore(option.score)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <p className="text-base font-normal leading-tight text-foreground">{title}</p>
        {note && <p className="text-sm leading-relaxed text-foreground">{note}</p>}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.score)}
            className={`flex min-h-[36px] w-full items-center justify-between gap-4 border-border px-3 py-2 text-left text-sm font-bold leading-snug transition-colors ${
              index > 0 ? 'border-t' : ''
            } ${value === option.score ? selectedClass : idleClass}`}
          >
            <span>{option.label}</span>
            <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>{formatScore(option.score)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FraxForm({ onResult }: FraxFormProps) {
  const [scores, setScores] = useState<Scores>({
    age: 0,
    fractureHistory: 0,
    motherHipFracture: 0,
    weight: 0,
    smoker: 0,
    chairRise: 0,
    bmd: 0,
  });

  const liveResult = useMemo(() => calculateFRAX(scores), [scores]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'frax',
          label: 'FRACTURE Index',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: scores,
      formulaUsed: FRAX_FORMULA,
    });
  }, [liveResult, scores]);

  return (
    <div>
      {groups.map((group) => (
        <OptionGroup
          key={group.id}
          title={group.title}
          note={'note' in group ? group.note : undefined}
          options={group.options}
          value={scores[group.id]}
          segmented={'segmented' in group ? group.segmented : false}
          onChange={(score) => setScores((current) => ({ ...current, [group.id]: score }))}
        />
      ))}
    </div>
  );
}
