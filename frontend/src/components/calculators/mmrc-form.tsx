'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateMMRC } from '@/lib/calculators/mmrc';

interface Props { onResult: (result: any) => void; }

const OPTIONS = [
  { score: 0, label: 'Dyspnea only with strenuous exercise' },
  { score: 1, label: 'Dyspnea when hurrying or walking up a slight hill' },
  { score: 2, label: 'Walks slower than people of the same age because of dyspnea or has to stop for breath when walking at own pace' },
  { score: 3, label: 'Stops for breath after walking 100 yards (91 m) or after a few minutes' },
  { score: 4, label: 'Too dyspneic to leave house or breathless when dressing' },
];

export function MmrcForm({ onResult }: Props) {
  const [selIdx, setSelIdx] = useState(0);

  const liveResult = useMemo(() => calculateMMRC(OPTIONS[selIdx].score), [selIdx]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'mmrc',
        label: 'mMRC Grade',
        value: liveResult.grade,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { grade: liveResult.grade },
      formulaUsed:
        `mMRC = selection of appropriate grade (0–4)\n\n` +
        `Grade 0: Dyspnea only with strenuous exercise\n` +
        `Grade 1: Dyspnea when hurrying or walking up a slight hill\n` +
        `Grade 2: Walks slower than peers or stops for breath at own pace\n` +
        `Grade 3: Stops for breath after ~100 yards or a few minutes\n` +
        `Grade 4: Too dyspneic to leave house or breathless when dressing`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-4">
        <div className="pr-1">
          <p className="text-sm font-semibold text-[#0E7490]">Symptom severity</p>
          <p className="text-xs text-[#0E7490]/70 mt-0.5">Walking should be assessed on level ground</p>
        </div>
        <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          {OPTIONS.map((opt, i) => {
            const active = selIdx === i;
            return (
              <button key={i} type="button" onClick={() => setSelIdx(i)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
                style={active ? { background: '#0E7490', color: '#ffffff' } : { background: '#ffffff', color: '#1e293b' }}>
                <span className="flex-1 mr-2">{opt.label}</span>
                <span className="shrink-0 font-bold text-xs"
                  style={{ color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                  {opt.score === 0 ? '0' : `+${opt.score}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
