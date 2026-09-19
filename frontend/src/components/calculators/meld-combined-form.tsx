'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateMeldCombined, type MeldVersion } from '@/lib/calculators/meld-combined';
import { NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const TEAL = '#0E7490';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
      {hint && <p className="text-xs mt-0.5 mb-2" style={{ color: TEAL }}>{hint}</p>}
      <div className={hint ? '' : 'mt-2'}>{children}</div>
    </div>
  );
}

function Choice<T extends string>({ options, value, onChange, stacked }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  stacked?: boolean;
}) {
  return (
    <div
      className={stacked ? 'rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200' : 'grid rounded-lg overflow-hidden border border-gray-200'}
      style={stacked ? undefined : { gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className="w-full py-3 px-3 text-sm font-semibold transition-colors text-left"
            style={{ background: active ? TEAL : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// A value entered in either of two units. The mirrored box is rounded for display,
// so the calculation always reads back the side the user actually typed in.
function usePair(factor: number, mirrorDigits: number, typedDigits: number) {
  const [aStr, setAStr] = useState('');   // the "factor" unit, e.g. µmol/L
  const [bStr, setBStr] = useState('');   // the base unit, e.g. mg/dL
  const [last, setLast] = useState<'a' | 'b'>('b');

  const onA = useCallback((v: string) => {
    setLast('a'); setAStr(v);
    const n = parseFloat(v);
    setBStr(Number.isFinite(n) && n > 0 ? fmt(n / factor, mirrorDigits) : '');
  }, [factor, mirrorDigits]);

  const onB = useCallback((v: string) => {
    setLast('b'); setBStr(v);
    const n = parseFloat(v);
    setAStr(Number.isFinite(n) && n > 0 ? fmt(n * factor, typedDigits) : '');
  }, [factor, typedDigits]);

  const value = last === 'a'
    ? (parseFloat(aStr) || 0) / factor
    : (parseFloat(bStr) || 0);

  return { aStr, bStr, onA, onB, value };
}

export function MeldCombinedForm({ onResult }: Props) {
  const [version, setVersion] = useState<MeldVersion>('meld-3');
  const [adult, setAdult] = useState<'yes' | 'no'>('yes');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [dialysis, setDialysis] = useState<'no' | 'yes'>('no');
  const [inrStr, setInrStr] = useState('');
  const [naStr, setNaStr] = useState('');

  const creat = usePair(88.4, 2, 1);   // µmol/L ↔ mg/dL
  const bili  = usePair(17.1, 2, 1);   // µmol/L ↔ mg/dL
  const alb   = usePair(10, 2, 1);     // g/L    ↔ g/dL

  const inr = parseFloat(inrStr) || 0;
  const sodium = parseFloat(naStr) || 0;

  const needsNa  = version !== 'original';
  const needsAlb = version === 'meld-3';

  const liveResult = useMemo(() => {
    if (bili.value <= 0 || inr <= 0) return null;
    if (dialysis === 'no' && creat.value <= 0) return null;
    if (needsNa && sodium <= 0) return null;
    if (needsAlb && alb.value <= 0) return null;
    try {
      return calculateMeldCombined({
        version,
        bilirubinMgDl: bili.value,
        inr,
        creatinineMgDl: creat.value,
        sodium: needsNa ? sodium : undefined,
        albuminGdl: needsAlb ? alb.value : undefined,
        female: sex === 'female',
        onDialysis: dialysis === 'yes',
      });
    } catch { return null; }
  }, [version, bili.value, inr, creat.value, sodium, alb.value, sex, dialysis, needsNa, needsAlb]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) {
      onResultRef.current(null);
      return;
    }
    onResultRef.current({
      outputs: [
        {
          id: 'meld-combined',
          label: 'MELD',
          value: liveResult.score,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        { id: 'version', label: 'Equation', value: liveResult.versionLabel },
      ],
      inputs: {
        version, bilirubinMgDl: bili.value, inr, creatinineMgDl: creat.value,
        sodium: needsNa ? sodium : undefined, albuminGdl: needsAlb ? alb.value : undefined,
        female: sex === 'female', onDialysis: dialysis === 'yes',
      },
      formulaUsed: liveResult.formula,
      references: liveResult.references,
      warnings: version === 'meld-3' && adult === 'no'
        ? ['Under 18 — use PELD rather than MELD for paediatric transplant planning.']
        : [],
    });
  }, [liveResult, version, bili.value, inr, creat.value, sodium, alb.value, sex, dialysis, adult, needsNa, needsAlb]);

  return (
    <div>
      <Field label="Equation">
        <Choice
          stacked
          options={[
            { value: 'original', label: 'MELD Score (Original, Pre-2016)' },
            { value: 'meld-na',  label: 'MELD Na (prior UNOS/OPTN version)' },
            { value: 'meld-3',   label: 'MELD 3.0 (currently recommended by OPTN)' },
          ]}
          value={version}
          onChange={setVersion}
        />
      </Field>

      {version === 'meld-3' && (
        <>
          <Field label="Age added to the liver transplant waiting list" hint="For candidates not yet listed, use their age today">
            <Choice
              options={[{ value: 'no', label: '<18' }, { value: 'yes', label: '≥18' }]}
              value={adult}
              onChange={setAdult}
            />
          </Field>
          {adult === 'yes' && (
            <Field label="Sex">
              <Choice
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
                value={sex}
                onChange={setSex}
              />
            </Field>
          )}
        </>
      )}

      <Field
        label="Dialysis"
        hint={version === 'meld-3'
          ? 'Twice, or 24 hours of CVVHD, within the week before the creatinine test — forces creatinine to 3.0 mg/dL'
          : 'At least twice in the past week — forces creatinine to 4.0 mg/dL'}
      >
        <Choice
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
          value={dialysis}
          onChange={setDialysis}
        />
      </Field>

      <Field label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={creat.aStr} onChange={creat.onA} suffix="µmol/L" step="1" min={1} max={2650} />
          <OrDivider />
          <NumInput value={creat.bStr} onChange={creat.onB} suffix="mg/dL" step="0.01" min={0.1} max={30} />
        </div>
      </Field>

      <Field label="Total bilirubin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={bili.aStr} onChange={bili.onA} suffix="µmol/L" step="1" min={1} max={900} />
          <OrDivider />
          <NumInput value={bili.bStr} onChange={bili.onB} suffix="mg/dL" step="0.1" min={0.1} max={60} />
        </div>
      </Field>

      <Field label="INR">
        <NumInput value={inrStr} onChange={setInrStr} suffix="ratio" step="0.01" min={0.5} max={20} />
      </Field>

      {needsNa && (
        <Field label="Sodium">
          <NumInput value={naStr} onChange={setNaStr} suffix="mmol/L" step="1" min={100} max={180} />
        </Field>
      )}

      {needsAlb && (
        <Field label="Albumin">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <NumInput value={alb.aStr} onChange={alb.onA} suffix="g/L" step="1" min={5} max={70} />
            <OrDivider />
            <NumInput value={alb.bStr} onChange={alb.onB} suffix="g/dL" step="0.1" min={0.5} max={7} />
          </div>
        </Field>
      )}
    </div>
  );
}
