'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateICH } from '@/lib/calculators/ich';

interface Props { onResult: (result: any) => void; }

const ACTIVE   = { background: '#0E7490', color: '#ffffff' } as const;
const INACTIVE = { background: '#ffffff', color: '#1e293b' } as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="space-y-1 pr-2">
        <p className="text-sm font-semibold text-[#0E7490]">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Horizontal 2-column No / Yes
function YesNo({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
         style={{ borderColor: '#0E7490' }}>
      {[{ label: 'No', val: 0, pts: '0' }, { label: 'Yes', val: 1, pts: '+1' }].map(opt => (
        <button key={opt.val} type="button" onClick={() => onChange(opt.val)}
          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors"
          style={value === opt.val ? ACTIVE : INACTIVE}>
          <span>{opt.label}</span>
          <span className="text-xs" style={{ opacity: 0.7 }}>{opt.pts}</span>
        </button>
      ))}
    </div>
  );
}

export function IchForm({ onResult }: Props) {
  const [gcs,            setGcs]            = useState<0|1|2>(0);
  const [age80,          setAge80]          = useState<0|1>(0);
  const [ichVolume,      setIchVolume]      = useState<0|1>(0);
  const [ivh,            setIvh]            = useState<0|1>(0);
  const [infratentorial, setInfratentorial] = useState<0|1>(0);

  const liveResult = useMemo(() =>
    calculateICH({ gcs, age80, ichVolume, ivh, infratentorial }),
    [gcs, age80, ichVolume, ivh, infratentorial],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'ich',
        label: 'ICH Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { gcs, age80, ichVolume, ivh, infratentorial },
      formulaUsed:
        `ICH Score = GCS + Age(≥80) + Volume(≥30mL) + IVH + Infratentorial\n` +
        `          = ${gcs} + ${age80} + ${ichVolume} + ${ivh} + ${infratentorial} = ${liveResult.score}\n\n` +
        `30-day mortality: ${liveResult.mortality}`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      {/* GCS — 3-column horizontal */}
      <Field label="Glasgow Coma Score">
        <div className="grid grid-cols-3 rounded-xl border-2 overflow-hidden divide-x divide-gray-100"
             style={{ borderColor: '#0E7490' }}>
          {([
            { label: '3-4',   val: 2 as 0|1|2, pts: '+2' },
            { label: '5-12',  val: 1 as 0|1|2, pts: '+1' },
            { label: '13-15', val: 0 as 0|1|2, pts: '0'  },
          ] as const).map(opt => (
            <button key={opt.val} type="button" onClick={() => setGcs(opt.val)}
              className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors"
              style={gcs === opt.val ? ACTIVE : INACTIVE}>
              <span>{opt.label}</span>
              <span className="text-xs ml-1" style={{ opacity: 0.7 }}>{opt.pts}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Age ≥80">
        <YesNo value={age80} onChange={v => setAge80(v as 0|1)} />
      </Field>

      <Field label="ICH volume ≥30 mL">
        <YesNo value={ichVolume} onChange={v => setIchVolume(v as 0|1)} />
      </Field>

      <Field label="Intraventricular hemorrhage">
        <YesNo value={ivh} onChange={v => setIvh(v as 0|1)} />
      </Field>

      <Field label="Infratentorial origin of hemorrhage">
        <YesNo value={infratentorial} onChange={v => setInfratentorial(v as 0|1)} />
      </Field>
    </div>
  );
}
