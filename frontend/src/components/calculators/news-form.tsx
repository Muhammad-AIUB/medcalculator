'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateNEWS } from '@/lib/calculators/news';

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

// Parameter option tables (index → points)
const RESP: Opt[] = [
  { label: '≤8', pts: 3 }, { label: '9–11', pts: 1 }, { label: '12–20', pts: 0 },
  { label: '21–24', pts: 2 }, { label: '≥25', pts: 3 },
];
const SPO2: Opt[] = [
  { label: '≤91%', pts: 3 }, { label: '92–93%', pts: 2 }, { label: '94–95%', pts: 1 }, { label: '≥96%', pts: 0 },
];
const SUPP_O2: Opt[] = [{ label: 'No', pts: 0 }, { label: 'Yes', pts: 2 }];
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
const AVPU: Opt[] = [{ label: 'A (Alert)', pts: 0 }, { label: 'V, P or U', pts: 3 }];

// Default to the "normal" (0-point) option for each parameter.
const DEFAULTS = { resp: 2, spo2: 3, suppO2: 0, temp: 2, sbp: 3, hr: 2, avpu: 0 };

export function NewsForm({ onResult }: Props) {
  const [resp, setResp] = useState(DEFAULTS.resp);
  const [spo2, setSpo2] = useState(DEFAULTS.spo2);
  const [suppO2, setSuppO2] = useState(DEFAULTS.suppO2);
  const [temp, setTemp] = useState(DEFAULTS.temp);
  const [sbp, setSbp] = useState(DEFAULTS.sbp);
  const [hr, setHr] = useState(DEFAULTS.hr);
  const [avpu, setAvpu] = useState(DEFAULTS.avpu);

  const pts = useMemo(() => ({
    respiratory: RESP[resp].pts,
    spo2: SPO2[spo2].pts,
    supplementalO2: SUPP_O2[suppO2].pts,
    temperature: TEMP[temp].pts,
    systolicBP: SBP[sbp].pts,
    heartRate: HR[hr].pts,
    consciousness: AVPU[avpu].pts,
  }), [resp, spo2, suppO2, temp, sbp, hr, avpu]);

  const liveResult = useMemo(() => calculateNEWS(pts), [pts]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    onResultRef.current({
      outputs: [{
        id: 'news',
        label: 'NEWS',
        value: liveResult.score,
        unit: 'points',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: pts,
      formulaUsed:
        `NEWS = Respiratory + SpO₂ + Supplemental O₂ + Temperature + Systolic BP + Heart Rate + Consciousness\n` +
        `     = ${pts.respiratory} + ${pts.spo2} + ${pts.supplementalO2} + ${pts.temperature} + ${pts.systolicBP} + ${pts.heartRate} + ${pts.consciousness} = ${liveResult.score}`,
      references: liveResult.references,
      warnings: liveResult.redFlag && liveResult.score < 5
        ? ['RED score: a single parameter scoring 3 — urgent clinical review advised.']
        : [],
    });
  }, [liveResult, pts]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Respiratory Rate" hint="breaths/min">
        <Stacked options={RESP} index={resp} onChange={setResp} />
      </Field>
      <Field label="Oxygen Saturation">
        <Stacked options={SPO2} index={spo2} onChange={setSpo2} />
      </Field>
      <Field label="Any Supplemental Oxygen">
        <Stacked options={SUPP_O2} index={suppO2} onChange={setSuppO2} />
      </Field>
      <Field label="Temperature">
        <Stacked options={TEMP} index={temp} onChange={setTemp} />
      </Field>
      <Field label="Systolic Blood Pressure" hint="mmHg">
        <Stacked options={SBP} index={sbp} onChange={setSbp} />
      </Field>
      <Field label="Heart Rate" hint="beats/min">
        <Stacked options={HR} index={hr} onChange={setHr} />
      </Field>
      <Field label="Consciousness (AVPU)" hint="Alert, Voice, Pain, Unresponsive">
        <Stacked options={AVPU} index={avpu} onChange={setAvpu} />
      </Field>
    </div>
  );
}
