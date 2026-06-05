'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateIpssR } from '@/lib/calculators/ipss-r';

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
            className="min-h-[44px] py-2 flex items-center justify-between px-3 text-sm font-semibold transition-colors text-left gap-2"
            style={active ? ACTIVE : IDLE}
          >
            <span className="leading-snug">{o.label}</span>
            <span className="text-xs font-bold opacity-75 whitespace-nowrap">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function HorizBtn<T extends number>({
  options, value, onChange,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
      {options.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={String(o.val)}
            type="button"
            onClick={() => onChange(o.val)}
            className="h-11 flex items-center justify-between px-3 text-sm font-semibold transition-colors"
            style={active ? ACTIVE : IDLE}
          >
            <span>{o.label}</span>
            <span className="text-xs font-bold opacity-75">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IpssRForm({ onResult }: Props) {
  const [cytogenetics, setCytogenetics] = useState<0|1|2|3|4>(0);
  const [blasts,       setBlasts]       = useState<0|1|2|3>(0);
  const [hemoglobin,   setHemoglobin]   = useState<0|1|1.5>(0);
  const [platelets,    setPlatelets]    = useState<0|0.5|1>(0);
  const [anc,          setAnc]          = useState<0|0.5>(0);

  const liveResult = useMemo(() =>
    calculateIpssR({ cytogenetics, blasts, hemoglobin, platelets, anc }),
    [cytogenetics, blasts, hemoglobin, platelets, anc],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'ipss-r',
        label: 'IPSS-R Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { cytogenetics, blasts, hemoglobin, platelets, anc },
      formulaUsed: 'Addition of the selected points.',
      references: liveResult.references,
    });
  }, [liveResult, anc, blasts, cytogenetics, hemoglobin, platelets]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Cytogenetic group">
        <StackedBtn<0|1|2|3|4>
          value={cytogenetics} onChange={setCytogenetics}
          options={[
            { val: 0, label: 'Very good: del(11q) or -Y',                                                          sub: '0'  },
            { val: 1, label: 'Good: normal karyotype, del(20q), del(5q), del(12p), or double including del(5q)',    sub: '+1' },
            { val: 2, label: 'Intermediate: +8, del(7q), i(17q), +19, or any other single or double independent clone', sub: '+2' },
            { val: 3, label: 'Poor: -7, inv(3)/t(3q)/del(3q), double including -7/del(7q), or complex (3 abnormalities)', sub: '+3' },
            { val: 4, label: 'Very poor: complex >3 abnormalities',                                                 sub: '+4' },
          ]}
        />
      </Field>

      <Field label="Medullary blasts, %">
        <StackedBtn<0|1|2|3>
          value={blasts} onChange={setBlasts}
          options={[
            { val: 0, label: '≤2',       sub: '0'  },
            { val: 1, label: '>2 to <5', sub: '+1' },
            { val: 2, label: '5 to 10',  sub: '+2' },
            { val: 3, label: '>10',      sub: '+3' },
          ]}
        />
      </Field>

      <Field label="Hemoglobin, g/dL (g/L)">
        <StackedBtn<0|1|1.5>
          value={hemoglobin} onChange={setHemoglobin}
          options={[
            { val: 0,   label: '≥10 (≥100)',          sub: '0'    },
            { val: 1,   label: '8 to <10 (80 to <100)', sub: '+1'   },
            { val: 1.5, label: '<8 (<80)',             sub: '+1.5' },
          ]}
        />
      </Field>

      <Field label="Platelets, ×10³/µL (10⁹/L)">
        <StackedBtn<0|0.5|1>
          value={platelets} onChange={setPlatelets}
          options={[
            { val: 0,   label: '≥100',       sub: '0'    },
            { val: 0.5, label: '50 to <100', sub: '+0.5' },
            { val: 1,   label: '<50',        sub: '+1'   },
          ]}
        />
      </Field>

      <Field label="ANC, ×10³/µL (10⁹/L)">
        <HorizBtn<0|0.5>
          value={anc} onChange={setAnc}
          options={[
            { val: 0,   label: '≥0.8', sub: '0'    },
            { val: 0.5, label: '<0.8', sub: '+0.5' },
          ]}
        />
      </Field>
    </div>
  );
}
