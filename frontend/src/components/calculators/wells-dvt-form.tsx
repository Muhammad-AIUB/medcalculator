'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateWellsDvt } from '@/lib/calculators/wells-dvt';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="sm:w-1/2 flex-shrink-0">
        <span className="text-sm text-gray-700 leading-snug">{label}</span>
        {hint && <p className="text-xs text-teal-600 mt-0.5">{hint}</p>}
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

export function WellsDvtForm({ onResult }: Props) {
  const [activeCancer,     setActiveCancer]     = useState<0|1>(0);
  const [bedridden,        setBedridden]        = useState<0|1>(0);
  const [calfSwelling,     setCalfSwelling]     = useState<0|1>(0);
  const [collateralVeins,  setCollateralVeins]  = useState<0|1>(0);
  const [entireLeg,        setEntireLeg]        = useState<0|1>(0);
  const [localTenderness,  setLocalTenderness]  = useState<0|1>(0);
  const [pittingEdema,     setPittingEdema]     = useState<0|1>(0);
  const [paralysis,        setParalysis]        = useState<0|1>(0);
  const [priorDvt,         setPriorDvt]         = useState<0|1>(0);
  const [altDiagnosis,     setAltDiagnosis]     = useState<0|-2>(0);

  const liveResult = useMemo(() =>
    calculateWellsDvt({
      activeCancer, bedridden, calfSwelling, collateralVeins,
      entireLegSwollen: entireLeg, localTenderness, pittingEdema,
      paralysis, priorDvt, altDiagnosis,
    }),
    [activeCancer, bedridden, calfSwelling, collateralVeins, entireLeg,
     localTenderness, pittingEdema, paralysis, priorDvt, altDiagnosis],
  );

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'wells-dvt',
        label: "Wells' Score (DVT)",
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { activeCancer, bedridden, calfSwelling, collateralVeins, entireLeg,
                localTenderness, pittingEdema, paralysis, priorDvt, altDiagnosis },
      formulaUsed: 'Addition of the selected points.',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Active cancer" hint="Treatment or palliation within 6 months">
        <Btn<0|1>
          value={activeCancer} onChange={setActiveCancer}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Bedridden recently >3 days or major surgery within 12 weeks">
        <Btn<0|1>
          value={bedridden} onChange={setBedridden}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Calf swelling >3 cm compared to the other leg" hint="Measured 10 cm below tibial tuberosity">
        <Btn<0|1>
          value={calfSwelling} onChange={setCalfSwelling}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Collateral (nonvaricose) superficial veins present">
        <Btn<0|1>
          value={collateralVeins} onChange={setCollateralVeins}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Entire leg swollen">
        <Btn<0|1>
          value={entireLeg} onChange={setEntireLeg}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Localized tenderness along the deep venous system">
        <Btn<0|1>
          value={localTenderness} onChange={setLocalTenderness}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Pitting edema, confined to symptomatic leg">
        <Btn<0|1>
          value={pittingEdema} onChange={setPittingEdema}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Paralysis, paresis, or recent plaster immobilization of the lower extremity">
        <Btn<0|1>
          value={paralysis} onChange={setParalysis}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Previously documented DVT">
        <Btn<0|1>
          value={priorDvt} onChange={setPriorDvt}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: 1, label: 'Yes', sub: '+1' }]}
        />
      </Field>

      <Field label="Alternative diagnosis to DVT as likely or more likely">
        <Btn<0|-2>
          value={altDiagnosis} onChange={setAltDiagnosis}
          options={[{ val: 0, label: 'No', sub: '0' }, { val: -2, label: 'Yes', sub: '-2' }]}
        />
      </Field>
    </div>
  );
}
