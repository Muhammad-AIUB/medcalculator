'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateIPIDlbcl } from '@/lib/calculators/ipi-dlbcl';

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

// No / Yes toggle worth 0 or 1 point.
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

export function IpiDlbclForm({ onResult }: Props) {
  const [ageOver60, setAgeOver60] = useState(false);
  const [stageIIIorIV, setStageIIIorIV] = useState(false);
  const [ecogOver1, setEcogOver1] = useState(false);
  const [ldhElevated, setLdhElevated] = useState(false);
  const [extranodalOver1, setExtranodalOver1] = useState(false);

  const inputs = useMemo(
    () => ({ ageOver60, stageIIIorIV, ecogOver1, ldhElevated, extranodalOver1 }),
    [ageOver60, stageIIIorIV, ecogOver1, ldhElevated, extranodalOver1],
  );

  const liveResult = useMemo(() => calculateIPIDlbcl(inputs), [inputs]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'ipi-dlbcl',
          label: 'IPI Score',
          value: liveResult.score,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        { id: 'r-ipi-group', label: 'R-IPI risk group', value: liveResult.rIpiGroup },
        { id: 'ipi-group',   label: 'IPI risk group',   value: liveResult.ipiGroup },
        { id: 'os',  label: '4-year overall survival (R-IPI / IPI)',          value: `${liveResult.rIpiOs} / ${liveResult.ipiOs}` },
        { id: 'pfs', label: '4-year progression-free survival (R-IPI / IPI)', value: `${liveResult.rIpiPfs} / ${liveResult.ipiPfs}` },
      ],
      inputs,
      formulaUsed:
        `IPI = Age >60 + Stage III-IV + ECOG ≥2 + LDH >1× normal + >1 extranodal site\n` +
        `    = ${Object.values(inputs).filter(Boolean).length} of 5 risk factors\n\n` +
        `R-IPI (Sehn 2007, R-CHOP era)\n` +
        `  0:    Very good prognosis\n` +
        `  1–2:  Good prognosis\n` +
        `  3–5:  Poor prognosis\n\n` +
        `IPI (Shipp 1993, historical comparison only)\n` +
        `  0–1:  Low risk\n` +
        `  2:    Low-intermediate risk\n` +
        `  3:    High-intermediate risk\n` +
        `  4–5:  High risk`,
      references: liveResult.references,
    });
  }, [liveResult, inputs]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age >60 years">
        <YesNo value={ageOver60} onChange={setAgeOver60} />
      </Field>
      <Field label="Ann Arbor stage III-IV" hint="III: both sides of the diaphragm; IV: extranodal involvement">
        <YesNo value={stageIIIorIV} onChange={setStageIIIorIV} />
      </Field>
      <Field label="ECOG performance status ≥2">
        <YesNo value={ecogOver1} onChange={setEcogOver1} />
      </Field>
      <Field label="Serum LDH >1× normal">
        <YesNo value={ldhElevated} onChange={setLdhElevated} />
      </Field>
      <Field label=">1 extranodal site" hint="Bone marrow, GI tract, liver, lung, CNS, skin, testes, Waldeyer's ring">
        <YesNo value={extranodalOver1} onChange={setExtranodalOver1} />
      </Field>
    </div>
  );
}
