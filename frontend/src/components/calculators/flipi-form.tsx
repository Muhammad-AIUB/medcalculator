'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateFLIPI } from '@/lib/calculators/flipi';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

function Field({
  label, hint, description, children,
}: {
  label: string;
  hint?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="sm:w-1/2 flex-shrink-0">
        <span className="text-sm text-gray-700 leading-snug">{label}</span>
        {hint && <p className="text-xs text-teal-600 mt-0.5">{hint}</p>}
        {description && <div className="mt-1">{description}</div>}
      </div>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function Btn<T extends number>({
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

export function FlipIForm({ onResult }: Props) {
  const [age60,       setAge60]       = useState<0|1>(0);
  const [nodalSites,  setNodalSites]  = useState<0|1>(0);
  const [ldh,         setLdh]         = useState<0|1>(0);
  const [hemoglobin,  setHemoglobin]  = useState<0|1>(0);
  const [stageIIIIV,  setStageIIIIV]  = useState<0|1>(0);

  const liveResult = useMemo(() =>
    calculateFLIPI({ age60, nodalSites, ldhElevated: ldh, hemoglobin, stageIIIIV }),
    [age60, nodalSites, ldh, hemoglobin, stageIIIIV],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'flipi',
        label: 'FLIPI Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { age60, nodalSites, ldh, hemoglobin, stageIIIIV },
      formulaUsed: 'Addition of the selected points (each +1):\n\nAge >60 years\n>4 nodal sites\nLDH elevated\nHemoglobin <120 g/L (12 g/dL)\nStage III–IV\n\n0–1: Low Risk (~71% 10-yr OS)\n2:   Intermediate Risk (~51% 10-yr OS)\n3–5: High Risk (~36% 10-yr OS)',
      references: liveResult.references,
    });
  }, [liveResult, age60, hemoglobin, ldh, nodalSites, stageIIIIV]);

  const stageDesc = (
    <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside leading-snug">
      <li>Stage I: single region, one lymph node and surrounding area</li>
      <li>Stage II: two separate regions on same side of diaphragm</li>
      <li>Stage III: both sides of diaphragm, including spleen</li>
      <li>Stage IV: diffuse extranodal involvement</li>
    </ul>
  );

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age >60 years">
        <Btn<0|1>
          value={age60} onChange={setAge60}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label=">4 nodal sites" hint="See nodal diagram for reference.">
        <Btn<0|1>
          value={nodalSites} onChange={setNodalSites}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="LDH elevated">
        <Btn<0|1>
          value={ldh} onChange={setLdh}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Hemoglobin <120 g/L or 12 g/dL">
        <Btn<0|1>
          value={hemoglobin} onChange={setHemoglobin}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Stage III-IV" description={stageDesc}>
        <Btn<0|1>
          value={stageIIIIV} onChange={setStageIIIIV}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>
    </div>
  );
}
