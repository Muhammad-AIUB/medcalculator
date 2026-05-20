'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AIH_FORMULA, calculateAIH } from '@/lib/calculators/aih';

interface AihFormProps {
  onResult: (result: any) => void;
}

interface AihOption {
  label: string;
  score: number;
  displayScore?: string;
}

const groups = [
  {
    id: 'anaSma',
    title: 'ANA or SMA/F-actin',
    options: [
      { label: 'Negative', score: 0 },
      { label: 'Positive or strongly positive', score: 1 },
    ],
  },
  {
    id: 'lkm1',
    title: 'LKM1 antibody',
    segmented: true,
    options: [
      { label: '<1:40', score: 0 },
      { label: '>=1:40', score: 2 },
    ],
  },
  {
    id: 'sla',
    title: 'SLA',
    options: [
      { label: 'Negative', score: 0 },
      { label: 'Positive', score: 2 },
    ],
  },
  {
    id: 'igg',
    title: 'IgG',
    options: [
      { label: 'Normal', score: 0, displayScore: '0' },
      { label: '>Upper limit of normal', score: 1 },
      { label: '>1.1x upper limit of normal', score: 2 },
    ],
  },
  {
    id: 'histology',
    title: 'Liver histology',
    note: 'If histology is normal, AIH is not the diagnosis.',
    options: [
      { label: 'Compatible with AIH', score: 1 },
      { label: 'Typical of AIH', score: 2 },
    ],
  },
  {
    id: 'viralHepatitis',
    title: 'Viral hepatitis',
    segmented: true,
    options: [
      { label: 'Present', score: 0, displayScore: '0' },
      { label: 'Absent', score: 2 },
    ],
  },
] as const;

type GroupId = typeof groups[number]['id'];
type Scores = Record<GroupId, number>;

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
  options: readonly AihOption[];
  value: number;
  onChange: (score: number) => void;
  segmented?: boolean;
}) {
  if (segmented) {
    return (
      <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
        <div className="space-y-2">
          <p className="text-base font-normal leading-tight text-foreground underline decoration-dotted underline-offset-2">{title}</p>
          {note && <p className="text-sm leading-relaxed text-foreground">{note}</p>}
        </div>
        <div className="grid min-h-[36px] grid-cols-2 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
          {options.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.score)}
              className={`flex items-center justify-center gap-3 border-border px-3 py-2 text-sm font-bold transition-colors ${
                index > 0 ? 'border-l' : ''
              } ${value === option.score ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
            >
              <span>{option.label}</span>
              {(option.score > 0 || option.displayScore) && (
                <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>
                  {option.displayScore ?? `+${option.score}`}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <p className="text-base font-normal leading-tight text-foreground underline decoration-dotted underline-offset-2">{title}</p>
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
            } ${value === option.score ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'}`}
          >
            <span>{option.label}</span>
            {(option.score > 0 || option.displayScore) && (
              <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>
                {option.displayScore ?? `+${option.score}`}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AihForm({ onResult }: AihFormProps) {
  const [scores, setScores] = useState<Scores>({
    anaSma: 1,
    lkm1: 0,
    sla: 0,
    igg: 0,
    histology: 1,
    viralHepatitis: 0,
  });

  const liveResult = useMemo(() => calculateAIH(scores), [scores]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'aih',
          label: 'AIH Score',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: scores,
      formulaUsed: AIH_FORMULA,
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
