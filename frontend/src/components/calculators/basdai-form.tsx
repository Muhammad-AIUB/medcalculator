'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BASDAI_FORMULA, calculateBASDAI } from '@/lib/calculators/basdai';

interface BasdaiFormProps {
  onResult: (result: any) => void;
}

const severityOptions = [
  { label: 'None - 0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10 - very severe', value: 10 },
];

const durationOptions = [
  { label: '0 - None', value: 0 },
  { label: '0 - 15 minutes', value: 1 },
  { label: '15 - 30 minutes', value: 2 },
  { label: '30 - 45 minutes', value: 3 },
  { label: '45 - 60 minutes', value: 4 },
  { label: '1 hour', value: 5 },
  { label: '60 - 75 minutes', value: 6 },
  { label: '75 - 90 minutes', value: 7 },
  { label: '90 - 105 minutes', value: 8 },
  { label: '105 minutes - 2hrs', value: 9 },
  { label: '2hrs +', value: 10 },
];

const questions = [
  {
    id: 'q1',
    label: '1. How would you describe the overall level of fatigue/tiredness you have experienced?',
    options: severityOptions,
  },
  {
    id: 'q2',
    label: '2. How would you describe the overall level of AS neck, back or hip pain you have had?',
    options: severityOptions,
  },
  {
    id: 'q3',
    label: '3. How would you describe the overall level of pain/swelling in joints other than neck, back, hips you have had?',
    options: severityOptions,
  },
  {
    id: 'q4',
    label: '4. How would you describe the overall level of discomfort you have had from any areas tender to touch or pressure?',
    options: severityOptions,
  },
  {
    id: 'q5',
    label: '5. How would you describe the overall level of morning stiffness you have had from the time you wake up?',
    options: severityOptions,
  },
  {
    id: 'q6',
    label: '6. How long does your morning stiffness last from the time you wake up?',
    options: durationOptions,
  },
] as const;

type QuestionId = typeof questions[number]['id'];
type Scores = Record<QuestionId, string>;

function QuestionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { label: string; value: number }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3 border-t border-border py-4">
      <label className="block max-w-[430px] text-base font-normal leading-relaxed text-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[38px] w-full max-w-[430px] rounded border border-input bg-background px-3 text-base text-foreground outline-none focus:border-primary"
      >
        <option value="">Select One</option>
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BasdaiForm({ onResult }: BasdaiFormProps) {
  const [scores, setScores] = useState<Scores>({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
    q6: '',
  });

  const inputs = useMemo(
    () => ({
      q1: Number(scores.q1 || 0),
      q2: Number(scores.q2 || 0),
      q3: Number(scores.q3 || 0),
      q4: Number(scores.q4 || 0),
      q5: Number(scores.q5 || 0),
      q6: Number(scores.q6 || 0),
    }),
    [scores],
  );

  const liveResult = useMemo(() => calculateBASDAI(inputs), [inputs]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'basdai',
          label: 'BASDAI Score',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs,
      formulaUsed: BASDAI_FORMULA,
    });
  }, [inputs, liveResult]);

  return (
    <div>
      {questions.map((question) => (
        <QuestionSelect
          key={question.id}
          label={question.label}
          value={scores[question.id]}
          options={question.options}
          onChange={(value) => setScores((current) => ({ ...current, [question.id]: value }))}
        />
      ))}
    </div>
  );
}
