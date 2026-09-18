'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateNEWS2 } from '@/lib/calculators/news2';

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

interface Opt { label: string; pts: number }

// Stacked options; selection tracked by index (ranges can share the same points).
function Stacked({ options, index, onChange }: { options: Opt[]; index: number; onChange: (i: number) => void }) {
  return (
    <div className="rounded-xl border-2 overflow-hidden divide-y divide-gray-100" style={{ borderColor: '#0E7490' }}>
      {options.map((opt, i) => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-left transition-colors"
          style={i === index ? ACTIVE : INACTIVE}>
          <span className="flex-1 mr-2">{opt.label}</span>
          <span className="shrink-0 text-xs" style={{ opacity: 0.7 }}>{opt.pts > 0 ? `+${opt.pts}` : '0'}</span>
        </button>
      ))}
    </div>
  );
}

const RESP: Opt[] = [
  { label: '≤8', pts: 3 }, { label: '9–11', pts: 1 }, { label: '12–20', pts: 0 },
  { label: '21–24', pts: 2 }, { label: '≥25', pts: 3 },
];
// SpO₂ Scale 1 — everyone without hypercapnic respiratory failure.
const SPO2_S1: Opt[] = [
  { label: '≤91%', pts: 3 }, { label: '92–93%', pts: 2 }, { label: '94–95%', pts: 1 }, { label: '≥96%', pts: 0 },
];
// SpO₂ Scale 2 — hypercapnic respiratory failure, target range 88–92%. The upper
// rows depend on whether the patient is on air or oxygen, so they are spelled out.
const SPO2_S2: Opt[] = [
  { label: '≤83%', pts: 3 }, { label: '84–85%', pts: 2 }, { label: '86–87%', pts: 1 },
  { label: '88–92%, or ≥93% on room air', pts: 0 },
  { label: '93–94% on supplemental O₂', pts: 1 },
  { label: '95–96% on supplemental O₂', pts: 2 },
  { label: '≥97% on supplemental O₂', pts: 3 },
];
const HYPERCAPNIC: Opt[] = [{ label: 'No', pts: 0 }, { label: 'Yes', pts: 0 }];
const AIR_O2: Opt[] = [{ label: 'Room air', pts: 0 }, { label: 'Supplemental O₂', pts: 2 }];
const TEMP: Opt[] = [
  { label: '≤35.0°C', pts: 3 }, { label: '35.1–36.0°C', pts: 1 }, { label: '36.1–38.0°C', pts: 0 },
  { label: '38.1–39.0°C', pts: 1 }, { label: '≥39.1°C', pts: 2 },
];
const SBP: Opt[] = [
  { label: '≤90', pts: 3 }, { label: '91–100', pts: 2 }, { label: '101–110', pts: 1 },
  { label: '111–219', pts: 0 }, { label: '≥220', pts: 3 },
];
const HR: Opt[] = [
  { label: '≤40', pts: 3 }, { label: '41–50', pts: 1 }, { label: '51–90', pts: 0 },
  { label: '91–110', pts: 1 }, { label: '111–130', pts: 2 }, { label: '≥131', pts: 3 },
];
// ACVPU: NEWS2 adds new-onset Confusion alongside Voice / Pain / Unresponsive.
const ACVPU: Opt[] = [
  { label: 'Alert', pts: 0 },
  { label: 'New confusion, voice, pain or unresponsive', pts: 3 },
];

// Index of the 0-point row in each SpO₂ scale, used when switching scales.
const SPO2_NORMAL = { s1: 3, s2: 3 };

export function News2Form({ onResult }: Props) {
  const [resp, setResp] = useState(2);
  const [hyper, setHyper] = useState(0);          // 0 = No (Scale 1), 1 = Yes (Scale 2)
  const [spo2, setSpo2] = useState(SPO2_NORMAL.s1);
  const [airO2, setAirO2] = useState(0);
  const [temp, setTemp] = useState(2);
  const [sbp, setSbp] = useState(3);
  const [hr, setHr] = useState(2);
  const [acvpu, setAcvpu] = useState(0);

  const hypercapnic = hyper === 1;
  const spo2Options = hypercapnic ? SPO2_S2 : SPO2_S1;

  // The two scales have different rows, so reset to the 0-point row when switching.
  const onHyperChange = (i: number) => {
    setHyper(i);
    setSpo2(i === 1 ? SPO2_NORMAL.s2 : SPO2_NORMAL.s1);
  };

  const pts = useMemo(() => ({
    respiratory:    RESP[resp].pts,
    spo2:           spo2Options[spo2]?.pts ?? 0,
    supplementalO2: AIR_O2[airO2].pts,
    temperature:    TEMP[temp].pts,
    systolicBP:     SBP[sbp].pts,
    heartRate:      HR[hr].pts,
    consciousness:  ACVPU[acvpu].pts,
    hypercapnic,
  }), [resp, spo2, spo2Options, airO2, temp, sbp, hr, acvpu, hypercapnic]);

  const liveResult = useMemo(() => calculateNEWS2(pts), [pts]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [
        {
          id: 'news2',
          label: 'NEWS2',
          value: liveResult.score,
          unit: 'points',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        {
          id: 'monitoring',
          label: 'Monitoring frequency',
          value: liveResult.monitoring,
          interpretation: { text: liveResult.riskBand, severity: liveResult.severity },
        },
      ],
      inputs: pts,
      formulaUsed:
        `NEWS2 = Respiratory + SpO₂ + Air/O₂ + Temperature + Systolic BP + Pulse + Consciousness\n` +
        `      = ${pts.respiratory} + ${pts.spo2} + ${pts.supplementalO2} + ${pts.temperature} + ${pts.systolicBP} + ${pts.heartRate} + ${pts.consciousness} = ${liveResult.score}\n\n` +
        `SpO₂ ${hypercapnic ? 'Scale 2 (hypercapnic respiratory failure, target 88–92%)' : 'Scale 1'}\n\n` +
        `0–4:  Low risk\n` +
        `0–4 with any single parameter scoring 3: Low-medium risk\n` +
        `5–6:  Medium risk\n` +
        `≥7:   High risk`,
      references: liveResult.references,
      warnings: liveResult.redFlag && liveResult.score < 5
        ? ['RED score: a single parameter scoring 3 — urgent review by a ward-based doctor.']
        : [],
    });
  }, [liveResult, pts, hypercapnic]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Respiratory Rate" hint="breaths/min">
        <Stacked options={RESP} index={resp} onChange={setResp} />
      </Field>
      <Field label="Hypercapnic Respiratory Failure" hint="e.g. COPD with target SpO₂ 88–92% — switches to SpO₂ Scale 2">
        <Stacked options={HYPERCAPNIC} index={hyper} onChange={onHyperChange} />
      </Field>
      <Field label="Oxygen Saturation" hint={hypercapnic ? 'Scale 2' : 'Scale 1'}>
        <Stacked options={spo2Options} index={spo2} onChange={setSpo2} />
      </Field>
      <Field label="Room Air or Supplemental Oxygen">
        <Stacked options={AIR_O2} index={airO2} onChange={setAirO2} />
      </Field>
      <Field label="Temperature">
        <Stacked options={TEMP} index={temp} onChange={setTemp} />
      </Field>
      <Field label="Systolic Blood Pressure" hint="mmHg">
        <Stacked options={SBP} index={sbp} onChange={setSbp} />
      </Field>
      <Field label="Pulse" hint="beats/min">
        <Stacked options={HR} index={hr} onChange={setHr} />
      </Field>
      <Field label="Consciousness (ACVPU)" hint="Alert, new Confusion, Voice, Pain, Unresponsive">
        <Stacked options={ACVPU} index={acvpu} onChange={setAcvpu} />
      </Field>
    </div>
  );
}
