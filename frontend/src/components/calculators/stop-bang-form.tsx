'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateStopBang } from '@/lib/calculators/stop-bang';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

type Vals = Record<string, 0 | 1>;

const initVals = (): Vals => ({
  snore: 0, tired: 0, observed: 0, pressure: 0,
  bmi: 0, age: 0, neck: 0, gender: 0,
});

// Horizontal No/Yes button pair
function HorizBin({
  id, label, hint, vals, set,
}: { id: string; label: string; hint?: string; vals: Vals; set: (id: string, v: 0|1) => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-100">
      <div className="pr-1 self-center">
        <p className="text-sm font-semibold text-[#0E7490]">{label}</p>
        {hint && <p className="text-xs text-[#0E7490]/70 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
           style={{ borderColor: '#0E7490' }}>
        <button type="button" onClick={() => set(id, 0)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={vals[id] === 0 ? ACTIVE : INACTIVE}>
          <span>No</span><span className="text-xs" style={{ opacity: 0.7 }}>0</span>
        </button>
        <button type="button" onClick={() => set(id, 1)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={vals[id] === 1 ? ACTIVE : INACTIVE}>
          <span>Yes</span><span className="text-xs" style={{ opacity: 0.7 }}>+1</span>
        </button>
      </div>
    </div>
  );
}

// Stacked 2-option field
function StackedBin({
  id, label, opt0, opt1, vals, set,
}: { id: string; label: string; opt0: string; opt1: string; vals: Vals; set: (id: string, v: 0|1) => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100">
      <p className="text-sm font-semibold text-[#0E7490] self-start pr-1">{label}</p>
      <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100"
           style={{ borderColor: '#0E7490' }}>
        {[{ v: 0 as const, label: opt0, score: '0' }, { v: 1 as const, label: opt1, score: '+1' }].map(opt => {
          const active = vals[id] === opt.v;
          return (
            <button key={opt.v} type="button" onClick={() => set(id, opt.v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-left transition-colors"
              style={active ? { background: '#0E7490', color: '#ffffff' } : { background: '#ffffff', color: '#1e293b' }}>
              <span>{opt.label}</span>
              <span className="shrink-0 font-bold text-xs ml-2"
                style={{ color: active ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{opt.score}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Horizontal labeled pair (non No/Yes)
function HorizPair({
  id, label, opt0, opt1, vals, set,
}: { id: string; label: string; opt0: string; opt1: string; vals: Vals; set: (id: string, v: 0|1) => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-3 border-b border-gray-100 last:border-0">
      <p className="text-sm font-semibold text-[#0E7490] self-center pr-1">{label}</p>
      <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
           style={{ borderColor: '#0E7490' }}>
        <button type="button" onClick={() => set(id, 0)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={vals[id] === 0 ? ACTIVE : INACTIVE}>
          <span>{opt0}</span><span className="text-xs" style={{ opacity: 0.7 }}>0</span>
        </button>
        <button type="button" onClick={() => set(id, 1)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={vals[id] === 1 ? ACTIVE : INACTIVE}>
          <span>{opt1}</span><span className="text-xs" style={{ opacity: 0.7 }}>+1</span>
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="pb-1 pt-4 border-b border-gray-200">
      <p className="text-sm font-bold text-gray-700">{label}</p>
    </div>
  );
}

export function StopBangForm({ onResult }: Props) {
  const [vals, setVals] = useState<Vals>(initVals);
  const set = (id: string, v: 0 | 1) => setVals(prev => ({ ...prev, [id]: v }));

  const liveResult = useMemo(() => calculateStopBang(vals as any), [vals]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'stop-bang',
        label: 'STOP-BANG Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: vals,
      formulaUsed:
        `STOP-BANG = S + T + O + P + B + A + N + G\n` +
        `          = ${vals.snore}+${vals.tired}+${vals.observed}+${vals.pressure}+${vals.bmi}+${vals.age}+${vals.neck}+${vals.gender} = ${liveResult.score}\n\n` +
        `0–2: Low risk\n3–4: Moderate risk\n5–8: High risk for moderate-to-severe OSA`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-0">
      <SectionHeader label="Ask the patient the following:" />

      <HorizBin id="snore"    label="Do you snore loudly?"
        hint="Louder than talking or loud enough to be heard through closed doors"
        vals={vals} set={set} />
      <HorizBin id="tired"    label="Do you often feel tired, fatigued, or sleepy during the daytime?"
        vals={vals} set={set} />
      <HorizBin id="observed" label="Has anyone observed you stop breathing during sleep?"
        vals={vals} set={set} />
      <HorizBin id="pressure" label="Do you have (or are you being treated for) high blood pressure?"
        vals={vals} set={set} />

      <SectionHeader label="Objective measures:" />

      <StackedBin id="bmi"  label="BMI"
        opt0="≤35 kg/m²" opt1=">35 kg/m²" vals={vals} set={set} />
      <StackedBin id="age"  label="Age"
        opt0="≤50 years" opt1=">50 years" vals={vals} set={set} />
      <HorizPair  id="neck" label="Neck circumference"
        opt0="≤40 cm" opt1=">40 cm" vals={vals} set={set} />
      <HorizPair  id="gender" label="Gender"
        opt0="Female" opt1="Male" vals={vals} set={set} />
    </div>
  );
}
