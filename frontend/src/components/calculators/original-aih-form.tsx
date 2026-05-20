'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ORIGINAL_AIH_FORMULA, calculateOriginalAIH } from '@/lib/calculators/original-aih';

interface OriginalAihFormProps {
  onResult: (result: any) => void;
}

interface OriginalAihOption {
  label: string;
  score: number;
  displayScore?: string;
}

const groups = [
  {
    id: 'sex',
    title: 'Sex',
    segmented: true,
    options: [
      { label: 'Male', score: 0 },
      { label: 'Female', score: 2 },
    ],
  },
  {
    id: 'alpAstAltRatio',
    title: 'ALP:AST or ALP:ALT ratio',
    options: [
      { label: '<1.5', score: 2 },
      { label: '1.5-3.0', score: 0 },
      { label: '>3.0', score: -2 },
    ],
  },
  {
    id: 'serumGlobulinsIgg',
    title: 'Serum globulins or IgG',
    note: 'Times above upper limit of normal',
    options: [
      { label: '>2.0', score: 3 },
      { label: '1.5-2.0', score: 2 },
      { label: '1.0-1.5', score: 1 },
      { label: '<1.0', score: 0 },
    ],
  },
  {
    id: 'antibodies',
    title: 'ANA, SMA, or LKM-1 antibody',
    options: [
      { label: '>1:80', score: 3 },
      { label: '1:80', score: 2 },
      { label: '1:40', score: 1 },
      { label: '<1:40', score: 0 },
    ],
  },
  {
    id: 'optionalAutoantibodies',
    title: 'Optional additional parameters',
    note: 'If ANA, SMA, LKM-1 are negative',
    options: [
      { label: 'Seropositivity for other defined autoantibodies', score: 2 },
      { label: 'HLA-DR3 or HLA-DR4', score: 1 },
      { label: 'None of the above', score: 0 },
    ],
  },
  {
    id: 'ama',
    title: 'AMA',
    options: [
      { label: 'Positive', score: -4 },
      { label: 'Negative', score: 0 },
    ],
  },
  {
    id: 'hepatitisViralMarkers',
    title: 'Hepatitis viral markers',
    note:
      'Hepatitis A, B and C viruses (i.e., positive/negative for IgM anti-HAV, HBsAg, IgM anti-HBc, anti-HCV and HCV-RNA); if all are negative and viral etiology is still suspected, CMV/EBV testing may be relevant',
    options: [
      { label: 'Positive', score: -3 },
      { label: 'Negative', score: 3 },
    ],
  },
  {
    id: 'hepatotoxicDrugs',
    title: 'Recent or current use of hepatotoxic drugs',
    segmented: true,
    options: [
      { label: 'Yes', score: -4 },
      { label: 'No', score: 1 },
    ],
  },
  {
    id: 'alcoholIntake',
    title: 'Average alcohol intake',
    options: [
      { label: '<25 g/day', score: 2 },
      { label: '25-60 g/day', score: 0 },
      { label: '>60 g/day', score: -2 },
    ],
  },
  {
    id: 'interfaceHepatitis',
    title: 'Liver histology: interface hepatitis',
    segmented: true,
    options: [
      { label: 'Yes', score: 3 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'lymphoplasmacytic',
    title: 'Liver histology: predominantly lymphoplasmacytic',
    segmented: true,
    options: [
      { label: 'Yes', score: 1 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'rosetting',
    title: 'Liver histology: rosetting of liver cells',
    note:
      'If no interface hepatitis, not predominantly lymphoplasmacytic infiltrate, and no rosetting of liver cells, then subtract 5 points',
    segmented: true,
    options: [
      { label: 'Yes', score: 1 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'biliaryChanges',
    title: 'Liver histology: biliary changes',
    note:
      'Bile duct changes typical of primary biliary cirrhosis or primary sclerosing cholangitis, and/or periportal ductal reaction with copper-associated protein accumulation',
    segmented: true,
    options: [
      { label: 'Yes', score: -3 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'otherChanges',
    title: 'Liver histology: other changes',
    note: 'Any other prominent features suggesting different etiology',
    segmented: true,
    options: [
      { label: 'Yes', score: -3 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'autoimmuneDisease',
    title: 'Other autoimmune disease(s)',
    note: 'In patient or 1st degree relatives',
    segmented: true,
    options: [
      { label: 'Yes', score: 2 },
      { label: 'No', score: 0 },
    ],
  },
  {
    id: 'responseTherapy',
    title: 'Response to therapy',
    options: [
      { label: 'Complete', score: 2 },
      { label: 'Relapse', score: 3 },
    ],
  },
] as const;

type GroupId = typeof groups[number]['id'];
type Scores = Record<GroupId, number>;

function formatScore(option: OriginalAihOption) {
  if (option.displayScore) return option.displayScore;
  if (option.score > 0) return `+${option.score}`;
  return String(option.score);
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
  options: readonly OriginalAihOption[];
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
          <p className="text-base font-normal leading-tight text-foreground underline decoration-dotted underline-offset-2">{title}</p>
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
              <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>{formatScore(option)}</span>
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
            } ${value === option.score ? selectedClass : idleClass}`}
          >
            <span>{option.label}</span>
            <span className={value === option.score ? 'text-white/80' : 'text-muted-foreground'}>{formatScore(option)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function OriginalAihForm({ onResult }: OriginalAihFormProps) {
  const [scores, setScores] = useState<Scores>({
    sex: 0,
    alpAstAltRatio: 0,
    serumGlobulinsIgg: 0,
    antibodies: 0,
    optionalAutoantibodies: 0,
    ama: 0,
    hepatitisViralMarkers: 3,
    hepatotoxicDrugs: 1,
    alcoholIntake: 2,
    interfaceHepatitis: 0,
    lymphoplasmacytic: 0,
    rosetting: 0,
    biliaryChanges: 0,
    otherChanges: 0,
    autoimmuneDisease: 0,
    responseTherapy: 0,
  });

  const liveResult = useMemo(() => calculateOriginalAIH(scores), [scores]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'original-aih',
          label: 'Original AIH Score',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: scores,
      formulaUsed: ORIGINAL_AIH_FORMULA,
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
