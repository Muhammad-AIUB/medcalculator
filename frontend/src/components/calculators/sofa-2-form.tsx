'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calculateSOFA2, SOFA2_FORMULA } from '@/lib/calculators/sofa-2';

interface Sofa2FormProps {
  onResult: (result: any) => void;
}

interface Sofa2Option {
  label: string;
  score: 0 | 1 | 2 | 3 | 4;
}

const groups = [
  {
    id: 'brain',
    title: 'Brain (GCS)',
    note: true,
    options: [
      { label: '15 (or thumbs-up, fist, or peace sign)', score: 0 },
      { label: '13-14 (or localizing to pain) or need for drugs to treat delirium', score: 1 },
      { label: '9-12 (or withdrawal to pain)', score: 2 },
      { label: '6-8 (or flexion to pain)', score: 3 },
      { label: '3-5 (or extension to pain, no response to pain, generalized myoclonus)', score: 4 },
    ],
  },
  {
    id: 'respiratory',
    title: 'Respiratory (PaO2:FiO2 ratio)',
    note: true,
    options: [
      { label: '>300 mm Hg (>40 kPa)', score: 0 },
      { label: '<=300 mm Hg (<=40 kPa)', score: 1 },
      { label: '<=225 mm Hg (<=30 kPa)', score: 2 },
      { label: '<=150 mm Hg (<=20 kPa) and advanced ventilatory support', score: 3 },
      { label: '<=75 mm Hg (<=10 kPa) and advanced ventilatory support or ECMO', score: 4 },
    ],
  },
  {
    id: 'cardiovascular',
    title: 'Cardiovascular',
    note: true,
    options: [
      { label: 'MAP >=70 mm Hg, no vasopressor or inotrope use', score: 0 },
      { label: 'MAP <70 mm Hg, no vasopressor or inotrope', score: 1 },
      { label: 'Low-dose vasopressor: (sum of norepinephrine and epinephrine <=0.2 µg/kg/min) or any dose of other vasopressor', score: 2 },
      { label: 'Medium-dose vasopressor (sum of norepinephrine and epinephrine >0.2 to <=0.4 µg/kg/min) or low-dose vasopressor (sum norepinephrine and epinephrine <=0.2 µg/kg/min) with any other vasopressor or inotrope', score: 3 },
      { label: 'High-dose vasopressor (sum of norepinephrine and epinephrine >0.4 µg/kg/min) or medium-dose vasopressor (sum of norepinephrine and epinephrine >.02 to <=0.4 µg/kg/min) with any other vasopressor or inotrope or mechanical support', score: 4 },
    ],
  },
  {
    id: 'liver',
    title: 'Liver (total bilirubin)',
    options: [
      { label: '<=1.20 mg/dL (<=20.6 µmol/L)', score: 0 },
      { label: '<=3.0 mg/dL (<=51.3 µmol/L)', score: 1 },
      { label: '<=6.0 mg/dL (<=102.6 µmol/L)', score: 2 },
      { label: '<=12.0 mg/dL (<=205 µmol/L)', score: 3 },
      { label: '>12 mg/dL (>205 µmol/L)', score: 4 },
    ],
  },
  {
    id: 'kidney',
    title: 'Kidney (creatinine)',
    note: true,
    options: [
      { label: '<=1.20 mg/dL (<=110 µmol/L)', score: 0 },
      { label: '<=2.0 mg/dL (<=170 µmol/L) or urine output <0.5 mL/kg/h for 6-12 h', score: 1 },
      { label: '<=3.50 mg/dL (<=300 µmol/L) or urine output <0.5 mL/kg/h for >=12 h', score: 2 },
      { label: '>3.50 mg/dL (>300 µmol/L) or urine output <0.3 mL/kg/h for >=24 h or anuria (0 mL) for >=12 h', score: 3 },
      { label: 'Receiving or fulfills criteria for RRT (includes chronic use)', score: 4 },
    ],
  },
  {
    id: 'hemostasis',
    title: 'Hemostasis (platelets)',
    options: [
      { label: '>150 x 10³/µL', score: 0 },
      { label: '<=150 x 10³/µL', score: 1 },
      { label: '<=100 x 10³/µL', score: 2 },
      { label: '<=80 x 10³/µL', score: 3 },
      { label: '<=50 x 10³/µL', score: 4 },
    ],
  },
] as const;

type GroupId = typeof groups[number]['id'];
type Scores = Record<GroupId, 0 | 1 | 2 | 3 | 4>;

function ScoreGroup({
  title,
  note,
  options,
  value,
  onChange,
}: {
  title: string;
  note?: boolean;
  options: readonly Sofa2Option[];
  value: 0 | 1 | 2 | 3 | 4;
  onChange: (score: 0 | 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-5 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <p className="text-base font-normal leading-tight text-foreground">{title}</p>
        {note && (
          <p className="text-sm leading-relaxed text-foreground">
            See <span className="font-semibold underline">Evidence</span> for more details.
          </p>
        )}
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
            <span className={value === option.score ? 'text-white' : 'text-muted-foreground'}>
              {option.score === 0 ? '0' : `+${option.score}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Sofa2Form({ onResult }: Sofa2FormProps) {
  const [scores, setScores] = useState<Scores>({
    brain: 0,
    respiratory: 0,
    cardiovascular: 0,
    liver: 0,
    kidney: 0,
    hemostasis: 0,
  });

  const liveResult = useMemo(() => calculateSOFA2(scores), [scores]);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'sofa-2',
          label: 'SOFA-2 Score',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: scores,
      formulaUsed: SOFA2_FORMULA,
    });
  }, [liveResult, scores]);

  return (
    <div>
      {groups.map((group) => (
        <ScoreGroup
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
