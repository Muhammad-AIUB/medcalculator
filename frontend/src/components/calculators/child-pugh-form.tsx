'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface ChildPughFormProps {
  onResult: (result: any) => void;
}

interface Option {
  label: string;
  score: 1 | 2 | 3;
}

const groups = [
  {
    id: 'bilirubin',
    title: 'Bilirubin (Total)',
    options: [
      { label: '<2 mg/dL (<34.2 µmol/L)', score: 1 },
      { label: '2-3 mg/dL (34.2-51.3 µmol/L)', score: 2 },
      { label: '>3 mg/dL (>51.3 µmol/L)', score: 3 },
    ],
  },
  {
    id: 'albumin',
    title: 'Albumin',
    options: [
      { label: '>3.5 g/dL (>35 g/L)', score: 1 },
      { label: '2.8-3.5 g/dL (28-35 g/L)', score: 2 },
      { label: '<2.8 g/dL (<28 g/L)', score: 3 },
    ],
  },
  {
    id: 'inr',
    title: 'INR',
    options: [
      { label: '<1.7', score: 1 },
      { label: '1.7-2.3', score: 2 },
      { label: '>2.3', score: 3 },
    ],
  },
  {
    id: 'ascites',
    title: 'Ascites',
    options: [
      { label: 'Absent', score: 1 },
      { label: 'Slight', score: 2 },
      { label: 'Moderate', score: 3 },
    ],
  },
  {
    id: 'encephalopathy',
    title: 'Encephalopathy',
    note: 'See encephalopathy grades in Evidence > Facts & Figures',
    options: [
      { label: 'No Encephalopathy', score: 1 },
      { label: 'Grade 1-2', score: 2 },
      { label: 'Grade 3-4', score: 3 },
    ],
  },
] as const;

type GroupId = typeof groups[number]['id'];
type Scores = Record<GroupId, 1 | 2 | 3>;

function getClass(total: number) {
  if (total <= 6) return { label: 'Child-Pugh Class A', severity: 'success' as const };
  if (total <= 9) return { label: 'Child-Pugh Class B', severity: 'warning' as const };
  return { label: 'Child-Pugh Class C', severity: 'danger' as const };
}

function OptionGroup({
  title,
  note,
  options,
  value,
  onChange,
}: {
  title: string;
  note?: string;
  options: readonly Option[];
  value: 1 | 2 | 3;
  onChange: (score: 1 | 2 | 3) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-5 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <p className="text-xl font-normal leading-tight text-foreground">{title}</p>
        {note && <p className="max-w-xl text-base leading-relaxed text-foreground">{note}</p>}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.score)}
            className={`flex h-[52px] w-full items-center justify-between border-border px-5 text-left text-base font-bold transition-colors ${
              index > 0 ? 'border-t' : ''
            } ${value === option.score ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            <span>{option.label}</span>
            <span className={value === option.score ? 'text-white' : 'text-muted-foreground'}>+{option.score}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChildPughForm({ onResult }: ChildPughFormProps) {
  const [scores, setScores] = useState<Scores>({
    bilirubin: 1,
    albumin: 1,
    inr: 1,
    ascites: 1,
    encephalopathy: 1,
  });

  const total = useMemo(
    () => Object.values(scores).reduce((sum, score) => sum + score, 0),
    [scores]
  );

  const classification = getClass(total);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = classification.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'child-pugh',
          label: 'Child-Pugh Score',
          value: total,
          unit: '/15',
          interpretation: {
            text: `Score ${total}/15`,
            severity,
            classification: classification.label,
          },
        },
      ],
      inputs: scores,
      formulaUsed: 'Addition of assigned points.',
    });
  }, [classification.label, classification.severity, scores, total]);

  return (
    <div>
      {groups.map((group) => (
        <OptionGroup
          key={group.id}
          title={group.title}
          note={'note' in group ? group.note : undefined}
          options={group.options}
          value={scores[group.id]}
          onChange={(score) => setScores((current) => ({ ...current, [group.id]: score }))}
        />
      ))}
    </div>
  );
}
