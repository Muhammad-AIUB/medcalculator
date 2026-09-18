'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCnsIpi } from '@/lib/calculators/cns-ipi';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="space-y-1 pr-2">
        <p className="text-sm font-semibold text-[#0E7490]">{label}</p>
        {hint && <p className="text-xs text-amber-600">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100" style={{ borderColor: '#0E7490' }}>
      {[false, true].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-left transition-colors"
          style={v === value ? ACTIVE : INACTIVE}>
          <span className="flex-1 mr-2">{v ? 'Yes' : 'No'}</span>
          <span className="shrink-0 text-xs" style={{ opacity: 0.7 }}>{v ? '+1' : '0'}</span>
        </button>
      ))}
    </div>
  );
}

export function CnsIpiForm({ onResult }: Props) {
  const [ageOver60, setAgeOver60] = useState(false);
  const [ldhElevated, setLdhElevated] = useState(false);
  const [ecogOver1, setEcogOver1] = useState(false);
  const [stageIIIorIV, setStageIIIorIV] = useState(false);
  const [extranodalOver1, setExtranodalOver1] = useState(false);
  const [kidneyOrAdrenal, setKidneyOrAdrenal] = useState(false);

  const inputs = useMemo(
    () => ({ ageOver60, ldhElevated, ecogOver1, stageIIIorIV, extranodalOver1, kidneyOrAdrenal }),
    [ageOver60, ldhElevated, ecogOver1, stageIIIorIV, extranodalOver1, kidneyOrAdrenal],
  );

  const liveResult = useMemo(() => calculateCnsIpi(inputs), [inputs]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'cns-ipi',
          label: 'CNS-IPI Score',
          value: liveResult.score,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        { id: 'risk-group',   label: 'Risk group',                    value: liveResult.riskGroup },
        { id: 'relapse-risk', label: '2-year CNS relapse risk',       value: liveResult.relapseRisk },
      ],
      inputs,
      formulaUsed:
        `CNS-IPI = Age >60 + LDH > normal + ECOG >1 + Stage III/IV + >1 extranodal site\n` +
        `          + kidney and/or adrenal involvement\n` +
        `        = ${Object.values(inputs).filter(Boolean).length} of 6 risk factors\n\n` +
        `0–1:  Low risk — 2-year CNS relapse 0.6%\n` +
        `2–3:  Intermediate risk — 3.4%\n` +
        `4–6:  High risk — 10.2%\n\n` +
        `Score ≥4: consider CNS-directed prophylaxis during remission induction.`,
      references: liveResult.references,
      warnings: liveResult.score >= 4
        ? ['High risk of CNS relapse — consider CNS-directed prophylaxis per institutional protocol.']
        : [],
    });
  }, [liveResult, inputs]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age >60 years">
        <YesNo value={ageOver60} onChange={setAgeOver60} />
      </Field>
      <Field label="LDH > normal" hint="Upper limit of normal varies by institution — follow your local lab ranges">
        <YesNo value={ldhElevated} onChange={setLdhElevated} />
      </Field>
      <Field label="ECOG performance status >1">
        <YesNo value={ecogOver1} onChange={setEcogOver1} />
      </Field>
      <Field label="Ann Arbor stage III or IV">
        <YesNo value={stageIIIorIV} onChange={setStageIIIorIV} />
      </Field>
      <Field label=">1 extranodal disease site" hint="Bone marrow, CNS, liver/GI tract, or lungs">
        <YesNo value={extranodalOver1} onChange={setExtranodalOver1} />
      </Field>
      <Field label="Kidney and/or adrenal gland involvement">
        <YesNo value={kidneyOrAdrenal} onChange={setKidneyOrAdrenal} />
      </Field>
    </div>
  );
}
