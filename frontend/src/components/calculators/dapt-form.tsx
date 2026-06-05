'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateDapt } from '@/lib/calculators/dapt';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-border last:border-0 px-1">
      <div className="sm:w-1/2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-teal-600 mt-0.5">{hint}</p>}
      </div>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function Btn<T extends number>({
  options, value, onChange, cols = 2,
}: {
  options: { val: T; label: string; sub: string }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div
      className="grid gap-0 rounded-lg overflow-hidden border border-gray-200"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {options.map((o) => {
        const active = value === o.val;
        return (
          <button
            key={`${o.label}-${o.val}`}
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

export function DaptForm({ onResult }: Props) {
  const [age,            setAge]            = useState<-2 | -1 | 0 | null>(null);
  const [smoking,        setSmoking]        = useState<0 | 1 | null>(null);
  const [diabetes,       setDiabetes]       = useState<0 | 1 | null>(null);
  const [miPresentation, setMiPresentation] = useState<0 | 1 | null>(null);
  const [priorPciMi,     setPriorPciMi]     = useState<0 | 1 | null>(null);
  const [paclitaxel,     setPaclitaxel]     = useState<0 | 1 | null>(null);
  const [stentDiam,      setStentDiam]      = useState<0 | 1 | null>(null);
  const [chfLvef,        setChfLvef]        = useState<0 | 2 | null>(null);
  const [veinGraft,      setVeinGraft]      = useState<0 | 2 | null>(null);

  const liveResult = useMemo(() => {
    if (
      age === null || smoking === null || diabetes === null ||
      miPresentation === null || priorPciMi === null || paclitaxel === null ||
      stentDiam === null || chfLvef === null || veinGraft === null
    ) return null;
    try {
      return calculateDapt({
        age, smoking, diabetes, miPresentation,
        priorPciMi, paclitaxelStent: paclitaxel,
        stentDiameter: stentDiam, chfLvef, veinGraft,
      });
    } catch { return null; }
  }, [age, smoking, diabetes, miPresentation, priorPciMi, paclitaxel, stentDiam, chfLvef, veinGraft]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'dapt',
        label: 'DAPT Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { age, smoking, diabetes, miPresentation, priorPciMi, paclitaxel, stentDiam, chfLvef, veinGraft },
      formulaUsed: 'Addition of the selected points.',
      references: liveResult.references,
    });
  }, [liveResult, age, chfLvef, diabetes, miPresentation, paclitaxel, priorPciMi, smoking, stentDiam, veinGraft]);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Field label="Age, years">
        <Btn
          cols={3}
          options={[
            { val: -2 as const, label: '≥75',  sub: '-2' },
            { val: -1 as const, label: '65-74', sub: '-1' },
            { val:  0 as const, label: '<65',   sub: '0'  },
          ]}
          value={age}
          onChange={setAge}
        />
      </Field>

      <Field label="Cigarette smoking" hint="Smoking within 1 year prior to index procedure.">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 1 as const, label: 'Yes', sub: '+1' },
          ]}
          value={smoking}
          onChange={setSmoking}
        />
      </Field>

      <Field label="Diabetes mellitus">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 1 as const, label: 'Yes', sub: '+1' },
          ]}
          value={diabetes}
          onChange={setDiabetes}
        />
      </Field>

      <Field label="MI at presentation">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 1 as const, label: 'Yes', sub: '+1' },
          ]}
          value={miPresentation}
          onChange={setMiPresentation}
        />
      </Field>

      <Field label="Prior PCI or prior MI">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 1 as const, label: 'Yes', sub: '+1' },
          ]}
          value={priorPciMi}
          onChange={setPriorPciMi}
        />
      </Field>

      <Field label="Paclitaxel-eluting stent">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 1 as const, label: 'Yes', sub: '+1' },
          ]}
          value={paclitaxel}
          onChange={setPaclitaxel}
        />
      </Field>

      <Field label="Stent diameter <3 mm">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 1 as const, label: 'Yes', sub: '+1' },
          ]}
          value={stentDiam}
          onChange={setStentDiam}
        />
      </Field>

      <Field label="CHF or LVEF <30%">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 2 as const, label: 'Yes', sub: '+2' },
          ]}
          value={chfLvef}
          onChange={setChfLvef}
        />
      </Field>

      <Field label="Vein graft stent">
        <Btn
          options={[
            { val: 0 as const, label: 'No',  sub: '0'  },
            { val: 2 as const, label: 'Yes', sub: '+2' },
          ]}
          value={veinGraft}
          onChange={setVeinGraft}
        />
      </Field>
    </div>
  );
}
