'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateGOLD, GOLDInput } from '@/lib/calculators/gold-copd';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

// ── Stacked button block (no score labels) ────────────────────────────────────
function Stacked({
  options, selectedIdx, onChange,
}: { options: string[]; selectedIdx: number; onChange: (i: number) => void }) {
  return (
    <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
         style={{ borderColor: '#0E7490' }}>
      {options.map((label, i) => {
        const active = selectedIdx === i;
        return (
          <button key={i} type="button" onClick={() => onChange(i)}
            className="w-full flex items-center px-3 py-2.5 text-xs font-medium text-left transition-colors leading-snug"
            style={active ? { background: '#0E7490', color: '#ffffff' } : { background: '#ffffff', color: '#1e293b' }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function GoldCopdForm({ onResult }: Props) {
  const [symptomsIdx,      setSymptomsIdx]      = useState(0); // 0=lower, 1=higher
  const [exacerbationIdx,  setExacerbationIdx]  = useState(0); // 0-3
  const [fev1Idx,          setFev1Idx]          = useState(0); // 0-3

  const liveResult = useMemo(() => calculateGOLD({
    symptoms:       symptomsIdx === 0 ? 'lower' : 'higher',
    exacerbationIdx: exacerbationIdx as GOLDInput['exacerbationIdx'],
    fev1Idx:         fev1Idx         as GOLDInput['fev1Idx'],
  }), [symptomsIdx, exacerbationIdx, fev1Idx]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'gold-grade',
          label: 'GOLD Grade',
          value: `GOLD ${liveResult.grade}`,
          unit: '',
          interpretation: { text: liveResult.gradeInterpretation, severity: liveResult.gradeSeverity },
        },
        {
          id: 'gold-group',
          label: 'GOLD Group',
          value: `Group ${liveResult.group}`,
          unit: '',
          interpretation: { text: liveResult.groupInterpretation, severity: liveResult.groupSeverity },
        },
      ],
      inputs: { symptomsIdx, exacerbationIdx, fev1Idx },
      formulaUsed:
        `GOLD Grade (1–4) — determined by post-bronchodilator FEV₁ % predicted:\n` +
        `  GOLD 1: ≥80% | GOLD 2: 50–79% | GOLD 3: 30–49% | GOLD 4: <30%\n\n` +
        `GOLD Group (A/B/E) — determined by symptoms + exacerbation history:\n` +
        `  Group E: ≥2 exacerbations OR ≥1 leading to hospitalization\n` +
        `  Group A: 0–1 exacerbation (no admission) AND lower symptoms (mMRC <2, CAT <10)\n` +
        `  Group B: 0–1 exacerbation (no admission) AND higher symptoms (mMRC ≥2, CAT ≥10)\n\n` +
        `Result: ${liveResult.gradeLabel} / ${liveResult.groupLabel}`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-0">

      {/* ── Symptom burden ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100">
        <div className="pr-1">
          <p className="text-sm font-semibold text-[#0E7490]">Symptom burden</p>
          <p className="text-xs text-[#0E7490]/70 mt-1 leading-relaxed">
            mMRC 2 = Walks slower than people of the same age because of dyspnea or has to stop for breath when walking at own pace;
            CAT 10 = COPD symptoms have low-medium impact on patient&apos;s life
          </p>
        </div>
        <Stacked
          options={[
            'Lower (mMRC <2 or CAT Score <10)',
            'Higher (mMRC ≥2 or CAT Score ≥10)',
          ]}
          selectedIdx={symptomsIdx}
          onChange={setSymptomsIdx}
        />
      </div>

      {/* ── Exacerbation history ───────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-[#0E7490] self-start pr-1">Exacerbation history</p>
        <Stacked
          options={[
            '0 exacerbations',
            '1 exacerbation without hospital admission',
            '≥1 exacerbation with hospital admission',
            '≥2 exacerbations',
          ]}
          selectedIdx={exacerbationIdx}
          onChange={setExacerbationIdx}
        />
      </div>

      {/* ── FEV₁ ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100 last:border-0">
        <p className="text-sm font-semibold text-[#0E7490] self-start pr-1">FEV₁ % of predicted</p>
        <Stacked
          options={['≥80', '50–79', '30–49', '<30']}
          selectedIdx={fev1Idx}
          onChange={setFev1Idx}
        />
      </div>
    </div>
  );
}
