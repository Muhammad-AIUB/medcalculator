'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateCardiacOutput } from '@/lib/calculators/cardiac-output';
import { NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="sm:w-1/2 flex-shrink-0">
        <span className="text-sm text-gray-700 leading-snug">{label}</span>
        {hint && <p className="text-xs text-[#0E7490] mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="sm:w-1/2">{children}</div>
    </div>
  );
}

export function CardiacOutputForm({ onResult }: Props) {
  // Weight: kg OR lbs
  const [wtKgStr,  setWtKgStr]  = useState('');
  const [wtLbStr,  setWtLbStr]  = useState('');
  // Height: cm OR inch
  const [htCmStr,  setHtCmStr]  = useState('');
  const [htInStr,  setHtInStr]  = useState('');
  // SaO2, SvO2: %
  const [sao2Str,  setSao2Str]  = useState('');
  const [svo2Str,  setSvo2Str]  = useState('');
  // Hemoglobin: g/L OR g/dL
  const [hbGlStr,  setHbGlStr]  = useState('');
  const [hbGdlStr, setHbGdlStr] = useState('');
  // Heart rate
  const [hrStr,    setHrStr]    = useState('');
  // Age group
  const [age70plus, setAge70plus] = useState(false);

  const onWtKgChange = useCallback((v: string) => {
    setWtKgStr(v);
    const n = parseFloat(v);
    setWtLbStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.20462, 1) : '');
  }, []);
  const onWtLbChange = useCallback((v: string) => {
    setWtLbStr(v);
    const n = parseFloat(v);
    setWtKgStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.20462, 1) : '');
  }, []);

  const onHtCmChange = useCallback((v: string) => {
    setHtCmStr(v);
    const n = parseFloat(v);
    setHtInStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.54, 1) : '');
  }, []);
  const onHtInChange = useCallback((v: string) => {
    setHtInStr(v);
    const n = parseFloat(v);
    setHtCmStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.54, 1) : '');
  }, []);

  // Hemoglobin: g/L OR g/dL (factor 10)
  const onHbGlChange = useCallback((v: string) => {
    setHbGlStr(v);
    const n = parseFloat(v);
    setHbGdlStr(Number.isFinite(n) && n > 0 ? fmt(n / 10, 2) : '');
  }, []);
  const onHbGdlChange = useCallback((v: string) => {
    setHbGdlStr(v);
    const n = parseFloat(v);
    setHbGlStr(Number.isFinite(n) && n > 0 ? fmt(n * 10, 1) : '');
  }, []);

  const weightKg  = parseFloat(wtKgStr)  || 0;
  const heightCm  = parseFloat(htCmStr)  || 0;
  const sao2Pct   = parseFloat(sao2Str)  || 0;
  const svo2Pct   = parseFloat(svo2Str)  || 0;
  const hbGdl     = parseFloat(hbGdlStr) || 0;
  const hr        = parseFloat(hrStr)    || 0;

  const liveResult = useMemo(() => {
    if (weightKg <= 0 || heightCm <= 0 || sao2Pct <= 0 || svo2Pct <= 0 || hbGdl <= 0 || hr <= 0) return null;
    if (sao2Pct <= svo2Pct) return null;
    try {
      return calculateCardiacOutput({ weightKg, heightCm, sao2Pct, svo2Pct, hbGdl, heartRate: hr, age70plus });
    } catch { return null; }
  }, [weightKg, heightCm, sao2Pct, svo2Pct, hbGdl, hr, age70plus]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;

    const coSeverity = liveResult.co >= 4 && liveResult.co <= 8   ? 'success' as const : liveResult.co < 4 ? 'danger' as const : 'warning' as const;
    const ciSeverity = liveResult.ci >= 2.5 && liveResult.ci <= 4 ? 'success' as const : liveResult.ci < 2.5 ? 'danger' as const : 'warning' as const;
    const svSeverity = liveResult.sv >= 60 && liveResult.sv <= 100 ? 'success' as const : liveResult.sv < 60 ? 'danger' as const : 'warning' as const;

    onResultRef.current({
      outputs: [
        { id: 'co', label: 'Cardiac Output (CO)',  value: liveResult.co, unit: 'L/min',     interpretation: { text: `Normal: 4–8 L/min`,         severity: coSeverity } },
        { id: 'ci', label: 'Cardiac Index (CI)',   value: liveResult.ci, unit: 'L/min/m²',  interpretation: { text: `Normal: 2.5–4.0 L/min/m²`,  severity: ciSeverity } },
        { id: 'sv', label: 'Stroke Volume (SV)',   value: liveResult.sv, unit: 'mL/beat',   interpretation: { text: `Normal: 60–100 mL/beat`,     severity: svSeverity } },
      ],
      inputs: { weightKg, heightCm, sao2Pct, svo2Pct, hbGdl, heartRate: hr, age70plus },
      formulaUsed:
        'BSA = sqrt((Height cm x Weight kg) / 3600)\n' +
        'VO2 = 125 x BSA  (or 110 x BSA if age >= 70)\n\n' +
        'CO (L/min) = VO2 / [(SaO2 - SvO2) x Hb x 13.4]\n' +
        'CI (L/min/m2) = CO / BSA\n' +
        'SV (mL/beat) = CO / HR x 1000\n\n' +
        'SaO2 and SvO2 as decimals (auto-converted from %)',
      references: liveResult.references,
    });
  }, [liveResult, age70plus, hbGdl, heightCm, hr, sao2Pct, svo2Pct, weightKg]);

  return (
    <div className="divide-y divide-gray-100">
      <Field label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={wtKgStr} onChange={onWtKgChange} suffix="kg"  step="0.1" min={1}   max={300} placeholder="Norm: 1 - 150" />
          <OrDivider />
          <NumInput value={wtLbStr} onChange={onWtLbChange} suffix="lbs" step="0.1" min={2}   max={660} />
        </div>
      </Field>

      <Field label="Height">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={htCmStr} onChange={onHtCmChange} suffix="cm"   step="0.5" min={50}  max={250} placeholder="Norm: 152 - 213" />
          <OrDivider />
          <NumInput value={htInStr} onChange={onHtInChange} suffix="inch" step="0.5" min={20}  max={100} />
        </div>
      </Field>

      <Field label="SaO₂" hint="As measured on ABG">
        <NumInput value={sao2Str} onChange={setSao2Str} suffix="%" step="0.1" min={50} max={100} placeholder="Norm: 95 - 100" />
      </Field>

      <Field label="SvO₂" hint="As measured on mixed venous gas from PA catheter">
        <NumInput value={svo2Str} onChange={setSvo2Str} suffix="%" step="0.1" min={20} max={95} placeholder="Norm: 60 - 80" />
      </Field>

      <Field label="Hemoglobin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={hbGlStr}  onChange={onHbGlChange}  suffix="g/L"  step="1"   min={10}  max={250} placeholder="Norm: 120 - 170" />
          <OrDivider />
          <NumInput value={hbGdlStr} onChange={onHbGdlChange} suffix="g/dL" step="0.1" min={1}   max={25}  />
        </div>
      </Field>

      <Field label="Heart rate">
        <NumInput value={hrStr} onChange={setHrStr} suffix="beats/min" step="1" min={20} max={300} placeholder="Norm: 60 - 100" />
      </Field>

      <Field label="Age">
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {[false, true].map((isOld) => {
            const active = age70plus === isOld;
            return (
              <button
                key={String(isOld)}
                type="button"
                onClick={() => setAge70plus(isOld)}
                className="w-full h-11 text-sm font-semibold transition-colors border-b border-gray-200 last:border-0"
                style={{ background: active ? '#0E7490' : '#ffffff', color: active ? '#ffffff' : '#1e293b' }}
              >
                {isOld ? '≥70 years' : '<70 years'}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
