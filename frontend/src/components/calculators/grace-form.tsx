'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateGrace } from '@/lib/calculators/grace';
import { NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

type Binary  = 0 | 1;
type Killip  = 1 | 2 | 3 | 4;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="sm:w-1/2 text-sm text-gray-700 leading-snug flex-shrink-0">{label}</span>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

function YesNo({ value, onChange }: { value: Binary; onChange: (v: Binary) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
      {([0, 1] as Binary[]).map((v) => {
        const active = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className="h-11 text-sm font-semibold transition-colors"
            style={{ background: active ? '#0E7490' : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}>
            {v === 0 ? 'No' : 'Yes'}
          </button>
        );
      })}
    </div>
  );
}

const KILLIP_OPTIONS: { value: Killip; label: string }[] = [
  { value: 1, label: 'No CHF' },
  { value: 2, label: 'Rales and/or JVD' },
  { value: 3, label: 'Pulmonary edema' },
  { value: 4, label: 'Cardiogenic shock' },
];

export function GraceForm({ onResult }: Props) {
  const [ageStr,       setAgeStr]       = useState('');
  const [hrStr,        setHrStr]        = useState('');
  const [sbpStr,       setSbpStr]       = useState('');

  // Creatinine: µmol/L OR mg/dL  (1 mg/dL = 88.4 µmol/L)
  const [crMgStr,  setCrMgStr]  = useState('');
  const [crUmStr,  setCrUmStr]  = useState('');

  const [cardiacArrest,   setCardiacArrest]   = useState<Binary>(0);
  const [stDeviation,     setStDeviation]     = useState<Binary>(0);
  const [abnormalEnzymes, setAbnormalEnzymes] = useState<Binary>(0);
  const [killip,          setKillip]          = useState<Killip>(1);

  const onCrMgChange = useCallback((v: string) => {
    setCrMgStr(v);
    const n = parseFloat(v);
    setCrUmStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '');
  }, []);
  const onCrUmChange = useCallback((v: string) => {
    setCrUmStr(v);
    const n = parseFloat(v);
    setCrMgStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 3) : '');
  }, []);

  const age  = parseFloat(ageStr) || 0;
  const hr   = parseFloat(hrStr)  || 0;
  const sbp  = parseFloat(sbpStr) || 0;
  const crMg = parseFloat(crMgStr) || 0;

  const liveResult = useMemo(() => {
    if (age <= 0 || hr <= 0 || sbp <= 0 || crMg <= 0) return null;
    try {
      return calculateGrace({
        age, heartRate: hr, systolicBP: sbp,
        creatinineMgDl: crMg,
        cardiacArrest, stDeviation, abnormalEnzymes, killipClass: killip,
      });
    } catch { return null; }
  }, [age, hr, sbp, crMg, cardiacArrest, stDeviation, abnormalEnzymes, killip]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'grace',
          label: 'GRACE Score',
          value: liveResult.score,
          unit: '',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
      ],
      inputs: { age, heartRate: hr, systolicBP: sbp, creatinineMgDl: crMg, cardiacArrest, stDeviation, abnormalEnzymes, killip },
      formulaUsed:
        'Nomogram (Fox Model) — point-based sum:\n\n' +
        'Age + Heart rate + Systolic BP + Creatinine +\n' +
        'Killip class + Cardiac arrest + ST deviation + Abnormal enzymes\n\n' +
        'Score  |  6-month mortality\n' +
        '0-87   |  0-2%\n' +
        '88-128 |  3-10%\n' +
        '129-149|  10-20%\n' +
        '150-173|  20-30%\n' +
        '174-182|  40%\n' +
        '183-190|  50%\n' +
        '191-199|  60%\n' +
        '200-207|  70%\n' +
        '208-218|  80%\n' +
        '219-284|  90%\n' +
        '>=285  |  99%',
      references: liveResult.references,
    });
  }, [liveResult, abnormalEnzymes, age, cardiacArrest, crMg, hr, killip, sbp, stDeviation]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Age">
        <NumInput value={ageStr} onChange={setAgeStr} suffix="years" step="1" min={18} max={110} />
      </Field>

      <Field label="Heart rate/pulse">
        <NumInput value={hrStr} onChange={setHrStr} suffix="beats/min" step="1" min={20} max={300} placeholder="Norm: 60 - 100" />
      </Field>

      <Field label="Systolic BP">
        <NumInput value={sbpStr} onChange={setSbpStr} suffix="mm Hg" step="1" min={40} max={300} placeholder="Norm: 100 - 120" />
      </Field>

      <Field label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={crUmStr} onChange={onCrUmChange} suffix="µmol/L" step="1"     min={0} max={1500} />
          <OrDivider />
          <NumInput value={crMgStr} onChange={onCrMgChange} suffix="mg/dL"  step="0.01"  min={0} max={17}   />
        </div>
      </Field>

      <Field label="Cardiac arrest at admission">
        <YesNo value={cardiacArrest} onChange={setCardiacArrest} />
      </Field>

      <Field label="ST segment deviation on EKG?">
        <YesNo value={stDeviation} onChange={setStDeviation} />
      </Field>

      <Field label="Abnormal cardiac enzymes">
        <YesNo value={abnormalEnzymes} onChange={setAbnormalEnzymes} />
      </Field>

      <Field label="Killip class (signs/symptoms)">
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {KILLIP_OPTIONS.map((opt) => {
            const active = killip === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKillip(opt.value)}
                className="w-full h-11 text-sm font-semibold transition-colors border-b border-gray-200 last:border-0"
                style={{ background: active ? '#0E7490' : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
