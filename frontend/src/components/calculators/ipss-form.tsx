'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateIPSS } from '@/lib/calculators/ipss';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="sm:w-1/2 text-sm text-gray-700 leading-snug flex-shrink-0">{label}</span>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function StackedBtn<T extends number>({
  options, value, onChange,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200">
      {options.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={String(o.val) + o.label}
            type="button"
            onClick={() => onChange(o.val)}
            className="min-h-[44px] py-2 flex items-center justify-between px-3 text-sm font-semibold transition-colors"
            style={active ? ACTIVE : IDLE}
          >
            <span className="leading-snug text-left">{o.label}</span>
            <span className="text-xs font-bold opacity-75 whitespace-nowrap ml-2">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IpssForm({ onResult }: Props) {
  const [karyotype,  setKaryotype]  = useState<0|0.5|1>(0);
  const [blasts,     setBlasts]     = useState<0|0.5|1.5|2>(0);
  const [cytopenias, setCytopenias] = useState<0|0.5>(0);

  const liveResult = useMemo(() =>
    calculateIPSS({ karyotype, blasts, cytopenias }),
    [karyotype, blasts, cytopenias],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'ipss',
        label: 'IPSS Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { karyotype, blasts, cytopenias },
      formulaUsed: 'Addition of the selected points.',
      references: liveResult.references,
    });
  }, [liveResult, blasts, cytopenias, karyotype]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Karyotype">
        <StackedBtn<0|0.5|1>
          value={karyotype} onChange={setKaryotype}
          options={[
            { val: 0,   label: 'Good: normal, −Y, del(5q), or del(20q)',                              sub: '0'    },
            { val: 0.5, label: 'Intermediate: other abnormalities not listed under good or poor',     sub: '+0.5' },
            { val: 1,   label: 'Poor: complex (≥3 abnormalities) or chromosome 7 anomalies',         sub: '+1'   },
          ]}
        />
      </Field>

      <Field label="Marrow blasts, %">
        <StackedBtn<0|0.5|1.5|2>
          value={blasts} onChange={setBlasts}
          options={[
            { val: 0,   label: '<5%',    sub: '0'    },
            { val: 0.5, label: '5–10%',  sub: '+0.5' },
            { val: 1.5, label: '11–20%', sub: '+1.5' },
            { val: 2,   label: '21–30%', sub: '+2'   },
          ]}
        />
      </Field>

      <Field label="Number of cytopenias">
        <StackedBtn<0|0.5>
          value={cytopenias} onChange={setCytopenias}
          options={[
            { val: 0,   label: '0–1', sub: '0'    },
            { val: 0.5, label: '2–3', sub: '+0.5' },
          ]}
        />
      </Field>
    </div>
  );
}
