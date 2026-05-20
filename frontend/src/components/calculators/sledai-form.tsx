'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SLEDAI_FORMULA, calculateSLEDAI } from '@/lib/calculators/sledai';

interface SledaiFormProps {
  onResult: (result: any) => void;
}

const items = [
  {
    id: 'seizure',
    title: 'Recent onset seizure',
    note: 'Exclude metabolic, infectious, or drug causes',
    score: 8,
  },
  {
    id: 'psychosis',
    title: 'Psychosis',
    note:
      'Altered ability to function in normal activity due to severe disturbance in the perception of reality (include hallucinations, incoherence, marked loose associations, impoverished thought content, marked illogical thinking, and bizarre, disorganized, or catatonic behavior); exclude uremia and drug causes',
    score: 8,
  },
  {
    id: 'organicBrainSyndrome',
    title: 'Organic brain syndrome',
    note:
      'Altered mental function with impaired orientation, memory, or other intellectual function (with rapid onset and fluctuating clinical features), inability to sustain attention to environment, and >=2 of the following: perceptual disturbance, incoherent speech, insomnia or daytime drowsiness, and increased or decreased psychomotor activity; exclude metabolic, infectious, or drug causes',
    score: 8,
  },
  {
    id: 'visualDisturbance',
    title: 'Visual disturbance',
    note:
      'Retinal changes of SLE (include cytoid bodies, retinal hemorrhages, serous exudates or hemorrhages in choroid, and optic neuritis); exclude hypertensive, infectious, or drug causes',
    score: 8,
  },
  {
    id: 'neuropathy',
    title: 'New onset sensory or motor neuropathy involving cranial nerves',
    score: 8,
  },
  {
    id: 'lupusHeadache',
    title: 'Lupus headache',
    note: 'Severe, persistent headache (may be migrainous but must be nonresponsive to narcotic analgesia)',
    score: 8,
  },
  {
    id: 'stroke',
    title: 'New onset stroke',
    note: 'Exclude arteriosclerosis',
    score: 8,
  },
  {
    id: 'vasculitis',
    title: 'Vasculitis',
    note:
      'Ulceration, gangrene, tender finger nodules, periungual infarction, splinter hemorrhages or biopsy, and angiogram proof of vasculitis',
    score: 8,
  },
  {
    id: 'arthritis',
    title: 'Arthritis',
    note: '>=2 joints with pain and signs of inflammation (i.e., tenderness, swelling, or effusion)',
    score: 4,
  },
  {
    id: 'myositis',
    title: 'Myositis',
    note: 'Proximal muscle aching/weakness associated with elevated',
    score: 4,
  },
  {
    id: 'urinaryCasts',
    title: 'Heme-granular or RBC urinary casts',
    score: 4,
  },
  {
    id: 'hematuria',
    title: 'Hematuria',
    note: '>5 RBC/high-power field; exclude stone, infection, or other cause',
    score: 4,
  },
  {
    id: 'proteinuria',
    title: 'Proteinuria',
    note: '>0.5 g/24 hours',
    score: 4,
  },
  {
    id: 'pyuria',
    title: 'Pyuria',
    note: '>5 WBC/high-power field; exclude infection',
    score: 4,
  },
  {
    id: 'rash',
    title: 'Inflammatory-type rash',
    score: 2,
  },
  {
    id: 'alopecia',
    title: 'Alopecia',
    score: 2,
  },
  {
    id: 'mucosalUlcers',
    title: 'Oral or nasal mucosal ulcers',
    score: 2,
  },
  {
    id: 'pleuriticPain',
    title: 'Pleuritic chest pain with pleural rub/effusion or pleural thickening',
    score: 2,
  },
  {
    id: 'pericarditis',
    title: 'Pericarditis',
    note: 'Pericardial pain with >=1 of the following: rub, effusion, or EKG/echocardiogram confirmation',
    score: 2,
  },
  {
    id: 'lowComplement',
    title: 'Low complement',
    note: 'CH50, C3, or C4 decreased below lower limit of normal for lab',
    score: 2,
  },
  {
    id: 'highDnaBinding',
    title: 'High DNA binding',
    note: 'Increased above normal range for lab',
    score: 2,
  },
  {
    id: 'fever',
    title: 'Temp >100.4 °F (38°C)',
    note: 'Exclude infectious causes',
    score: 1,
  },
  {
    id: 'platelets',
    title: 'Platelets <100 x 10^9/L',
    note: 'Exclude drug causes',
    score: 1,
  },
  {
    id: 'wbc',
    title: 'WBC <3 x 10^9/L',
    note: 'Exclude drug causes',
    score: 1,
  },
] as const;

type ItemId = typeof items[number]['id'];
type Scores = Record<ItemId, number>;

function ToggleRow({
  title,
  note,
  score,
  value,
  onChange,
}: {
  title: string;
  note?: string;
  score: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border py-4 md:grid-cols-[1fr_1fr] md:gap-8">
      <div className="space-y-2">
        <p className="text-base font-normal leading-tight text-foreground">{title}</p>
        {note && <p className="text-sm leading-relaxed text-foreground">{note}</p>}
      </div>
      <div className="grid min-h-[36px] grid-cols-2 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`flex items-center justify-between gap-3 px-3 py-2 text-sm font-bold transition-colors ${
            value === 0 ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'
          }`}
        >
          <span>No</span>
          <span className={value === 0 ? 'text-white/80' : 'text-muted-foreground'}>0</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(score)}
          className={`flex items-center justify-between gap-3 border-l border-border px-3 py-2 text-sm font-bold transition-colors ${
            value === score ? 'bg-[#16836e] text-white' : 'bg-background text-foreground hover:bg-muted'
          }`}
        >
          <span>Yes</span>
          <span className={value === score ? 'text-white/80' : 'text-muted-foreground'}>+{score}</span>
        </button>
      </div>
    </div>
  );
}

export function SledaiForm({ onResult }: SledaiFormProps) {
  const [scores, setScores] = useState<Scores>(() =>
    items.reduce((current, item) => ({ ...current, [item.id]: 0 }), {} as Scores),
  );

  const liveResult = useMemo(() => calculateSLEDAI(scores), [scores]);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const severity = liveResult.severity as any;
    onResultRef.current({
      outputs: [
        {
          id: 'sledai',
          label: 'SLEDAI Score',
          value: liveResult.score ?? 0,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity, classification: liveResult.label },
        },
      ],
      inputs: scores,
      formulaUsed: SLEDAI_FORMULA,
    });
  }, [liveResult, scores]);

  return (
    <div>
      {items.map((item) => (
        <ToggleRow
          key={item.id}
          title={item.title}
          note={'note' in item ? item.note : undefined}
          score={item.score}
          value={scores[item.id]}
          onChange={(value) => setScores((current) => ({ ...current, [item.id]: value }))}
        />
      ))}
    </div>
  );
}
