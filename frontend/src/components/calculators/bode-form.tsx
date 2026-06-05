'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateBODE } from '@/lib/calculators/bode';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

interface Option  { label: string; score: number; }
interface FieldDef { id: string; label: string; options: Option[]; }

const FEV1: FieldDef = {
  id: 'fev1',
  label: 'FEV₁ (% of predicted)',
  options: [
    { label: '≥65%',    score: 0 },
    { label: '50–64%',  score: 1 },
    { label: '36–49%',  score: 2 },
    { label: '≤35%',    score: 3 },
  ],
};

const MWD: FieldDef = {
  id: 'mwd',
  label: '6 Minute Walk Distance',
  options: [
    { label: '≥350 m (383 yds)',        score: 0 },
    { label: '250–349 m (273–382 yds)', score: 1 },
    { label: '150–249 m (164–272 yds)', score: 2 },
    { label: '≤149 m (163 yds)',        score: 3 },
  ],
};

const MMRC: FieldDef = {
  id: 'mmrc',
  label: 'mMRC Dyspnea Scale',
  options: [
    { label: 'Dyspnea only with strenuous exercise',                                                                           score: 0 },
    { label: 'Dyspnea when hurrying or walking up a slight hill',                                                              score: 0 },
    { label: 'Walks slower than people of same age because of dyspnea or stops for breath when walking at own pace',           score: 1 },
    { label: 'Stops for breath after walking 100 yards (91 m) or after a few minutes',                                        score: 2 },
    { label: 'Too dyspneic to leave house or breathless when dressing',                                                        score: 3 },
  ],
};

const STACKED_FIELDS = [FEV1, MWD, MMRC];

type SelState = Record<string, number>;
const initSel = (): SelState => ({ fev1: 0, mwd: 0, mmrc: 0, bmi: 0 });

export function BodeForm({ onResult }: Props) {
  const [sel, setSel] = useState<SelState>(initSel);

  const set = (id: string, i: number) => setSel(prev => ({ ...prev, [id]: i }));

  const liveResult = useMemo(() => {
    const score =
      FEV1.options[sel.fev1].score +
      MWD.options[sel.mwd].score +
      MMRC.options[sel.mmrc].score +
      sel.bmi; // bmi: 0=>0pts, 1=>+1pt
    return calculateBODE(score);
  }, [sel]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    const fev1Score = FEV1.options[sel.fev1].score;
    const mwdScore  = MWD.options[sel.mwd].score;
    const mmrcScore = MMRC.options[sel.mmrc].score;
    const bmiScore  = sel.bmi;

    onResultRef.current({
      outputs: [{
        id: 'bode',
        label: 'BODE Index',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { fev1: fev1Score, mwd: mwdScore, mmrc: mmrcScore, bmi: bmiScore },
      formulaUsed:
        `BODE = FEV₁ + 6MWD + mMRC + BMI\n` +
        `     = ${fev1Score} + ${mwdScore} + ${mmrcScore} + ${bmiScore} = ${liveResult.score}\n\n` +
        `FEV₁: ≥65%→0, 50-64%→1, 36-49%→2, ≤35%→3\n` +
        `6MWD: ≥350m→0, 250-349m→1, 150-249m→2, ≤149m→3\n` +
        `mMRC: 0-1→0, 2→1, 3→2, 4→3\n` +
        `BMI:  >21→0, ≤21→1`,
      references: liveResult.references,
    });
  }, [liveResult, sel.bmi, sel.fev1, sel.mmrc, sel.mwd]);

  return (
    <div className="space-y-0">

      {/* ── Stacked fields (FEV₁, 6MWD, mMRC) ──────────────────────────── */}
      {STACKED_FIELDS.map(field => (
        <div key={field.id}
          className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-[#0E7490] self-start pr-1">{field.label}</p>
          <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
               style={{ borderColor: '#0E7490' }}>
            {field.options.map((opt, i) => {
              const active = sel[field.id] === i;
              return (
                <button key={i} type="button" onClick={() => set(field.id, i)}
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
      ))}

      {/* ── BMI — horizontal 2-column ─────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-100 last:border-0">
        <p className="text-sm font-semibold text-[#0E7490] self-center">BMI (kg/m²)</p>
        <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          <button type="button" onClick={() => set('bmi', 0)}
            className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
            style={sel.bmi === 0 ? ACTIVE : INACTIVE}>
            <span>&gt;21</span><span className="text-xs" style={{ opacity: 0.7 }}>0</span>
          </button>
          <button type="button" onClick={() => set('bmi', 1)}
            className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
            style={sel.bmi === 1 ? ACTIVE : INACTIVE}>
            <span>≤21</span><span className="text-xs" style={{ opacity: 0.7 }}>+1</span>
          </button>
        </div>
      </div>
    </div>
  );
}
