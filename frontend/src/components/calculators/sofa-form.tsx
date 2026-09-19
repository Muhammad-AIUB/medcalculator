'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { scorePulmonary } from '@/lib/calculators/sofa';
import { NumInput, OrDivider, fmt } from './shared-ui';

interface SofaFormProps {
  onResult: (result: any) => void;
}

const TEAL = '#0E7490';

function OptionGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; score: number }[];
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      {options.map((opt, i) => {
        const active = value === opt.score;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(opt.score)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors"
            style={{
              background: active ? TEAL : '#ffffff',
              color: active ? '#ffffff' : '#1e293b',
              borderBottom: i < options.length - 1 ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <span className="font-medium">{opt.label}</span>
            <span
              className="font-semibold text-xs ml-2 shrink-0"
              style={{ color: active ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}
            >
              {opt.score === 0 ? '0' : `+${opt.score}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-gray-100 last:border-0 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: TEAL }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const getSeverity = (score: number) => {
  if (score <= 1) return 'success';
  if (score <= 6) return 'warning';
  return 'danger';
};

const KPA_TO_MMHG = 7.50062;

export function SofaForm({ onResult }: SofaFormProps) {
  const [ventilated, setVentilated] = useState(false);
  // PaO2 in either unit. The mirrored box is rounded for display, so the P/F ratio is
  // always computed from whichever box the user actually typed in.
  const [pao2KpaStr,  setPao2KpaStr]  = useState('');
  const [pao2MmhgStr, setPao2MmhgStr] = useState('');
  const [lastPao2, setLastPao2] = useState<'kpa' | 'mmhg'>('kpa');
  const [fio2Str, setFio2Str] = useState('');

  const onPao2KpaChange = useCallback((v: string) => {
    setLastPao2('kpa');
    setPao2KpaStr(v);
    const n = parseFloat(v);
    setPao2MmhgStr(Number.isFinite(n) && n > 0 ? fmt(n * KPA_TO_MMHG, 1) : '');
  }, []);

  const onPao2MmhgChange = useCallback((v: string) => {
    setLastPao2('mmhg');
    setPao2MmhgStr(v);
    const n = parseFloat(v);
    setPao2KpaStr(Number.isFinite(n) && n > 0 ? fmt(n / KPA_TO_MMHG, 1) : '');
  }, []);

  const pao2MmHg = lastPao2 === 'kpa'
    ? (parseFloat(pao2KpaStr) || 0) * KPA_TO_MMHG
    : (parseFloat(pao2MmhgStr) || 0);
  const fio2Pct = parseFloat(fio2Str) || 0;

  // scorePulmonary takes FiO2 as a fraction, so a 100% entry becomes 1.0.
  const respiration = pao2MmHg > 0 && fio2Pct > 0
    ? scorePulmonary(pao2MmHg, fio2Pct / 100, undefined, ventilated)
    : null;
  const [platelets, setPlatelets]   = useState<number | null>(null);
  const [gcs, setGcs]               = useState<number | null>(null);
  const [bilirubin, setBilirubin]   = useState<number | null>(null);
  const [cardio, setCardio]         = useState<number | null>(null);
  const [renal, setRenal]           = useState<number | null>(null);

  const canSave = respiration !== null && platelets !== null && gcs !== null &&
                  bilirubin !== null && cardio !== null && renal !== null;

  const liveResult = useMemo(() => {
    if (!canSave) return null;
    const score = (respiration ?? 0) + (platelets ?? 0) + (gcs ?? 0) +
                  (bilirubin ?? 0) + (cardio ?? 0) + (renal ?? 0);
    return { score, severity: getSeverity(score) };
  }, [canSave, respiration, platelets, gcs, bilirubin, cardio, renal]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) {
      onResultRef.current(null);
      return;
    }
    onResultRef.current({
      outputs: [{
        id: 'sofa',
        label: 'SOFA Score',
        value: liveResult.score,
        unit: '/20',
        interpretation: { text: '', severity: liveResult.severity },
      }],
      inputs: { pao2MmHg, fio2Pct, ventilated, platelets, gcs, bilirubin, cardio, renal },
      formulaUsed: `SOFA = Respiration + Coagulation + Liver + Cardiovascular + CNS + Renal (each 0–4 pts)

Respiration uses the PaO₂/FiO₂ ratio (mmHg):
  ≥400: 0   |   300–399: +1   |   200–299: +2
  100–199: +3 and <100: +4, but only if mechanically ventilated (otherwise +2)

P/F ratio = ${pao2MmHg > 0 && fio2Pct > 0 ? Math.round(pao2MmHg / (fio2Pct / 100)) : '—'}  →  Respiration ${respiration ?? 0} pts`,
    });
  }, [liveResult, respiration, pao2MmHg, fio2Pct, bilirubin, cardio, gcs, platelets, renal, ventilated]);

  return (
    <div>
      {/* 1. PaO2 */}
      <Field label="PaO₂">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={pao2KpaStr} onChange={onPao2KpaChange} suffix="kPa" step="0.1" min={1} max={100} placeholder="Norm: 10 - 13.3" />
          <OrDivider />
          <NumInput value={pao2MmhgStr} onChange={onPao2MmhgChange} suffix="mmHg" step="1" min={10} max={700} />
        </div>
      </Field>

      {/* 2. FiO2 */}
      <Field label="FiO₂" hint="Room air is 21%">
        <NumInput value={fio2Str} onChange={setFio2Str} suffix="%" step="1" min={21} max={100} />
      </Field>

      {/* 3. Mechanical ventilation */}
      <Field label="On mechanical ventilation" hint="Including CPAP">
        <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
          {(['No', 'Yes'] as const).map((opt) => {
            const active = ventilated === (opt === 'Yes');
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setVentilated(opt === 'Yes')}
                className="py-3 text-sm font-semibold transition-colors"
                style={{
                  background: active ? TEAL : '#ffffff',
                  color: active ? '#ffffff' : '#1e293b',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </Field>

      {/* 2. Platelets */}
      <Field label="Platelets, ×10³/µL">
        <OptionGroup
          value={platelets}
          onChange={setPlatelets}
          options={[
            { label: '≥150', score: 0 },
            { label: '100-149', score: 1 },
            { label: '50-99', score: 2 },
            { label: '20-49', score: 3 },
            { label: '<20', score: 4 },
          ]}
        />
      </Field>

      {/* 3. GCS */}
      <Field label="Glasgow Coma Scale" hint="If on sedatives, estimate assumed GCS off sedatives">
        <OptionGroup
          value={gcs}
          onChange={setGcs}
          options={[
            { label: '15', score: 0 },
            { label: '13-14', score: 1 },
            { label: '10-12', score: 2 },
            { label: '6-9', score: 3 },
            { label: '<6', score: 4 },
          ]}
        />
      </Field>

      {/* 4. Bilirubin */}
      <Field label="Bilirubin, mg/dL (µmol/L)">
        <OptionGroup
          value={bilirubin}
          onChange={setBilirubin}
          options={[
            { label: '<1.2 (<20)', score: 0 },
            { label: '1.2–1.9 (20-32)', score: 1 },
            { label: '2.0–5.9 (33-101)', score: 2 },
            { label: '6.0–11.9 (102-204)', score: 3 },
            { label: '≥12.0 (>204)', score: 4 },
          ]}
        />
      </Field>

      {/* 5. Cardiovascular / MAP */}
      <Field
        label="Mean arterial pressure OR administration of vasoactive agents required"
        hint="Listed doses are in units of mcg/kg/min"
      >
        <OptionGroup
          value={cardio}
          onChange={setCardio}
          options={[
            { label: 'No hypotension', score: 0 },
            { label: 'MAP <70 mmHg', score: 1 },
            { label: 'DOPamine ≤5 or DOBUTamine (any dose)', score: 2 },
            { label: 'DOPamine >5, EPINEPHrine ≤0.1, or norEPINEPHrine ≤0.1', score: 3 },
            { label: 'DOPamine >15, EPINEPHrine >0.1, or norEPINEPHrine >0.1', score: 4 },
          ]}
        />
      </Field>

      {/* 6. Renal */}
      <Field label="Creatinine, mg/dL (µmol/L) (or urine output)">
        <OptionGroup
          value={renal}
          onChange={setRenal}
          options={[
            { label: '<1.2 (<110)', score: 0 },
            { label: '1.2–1.9 (110-170)', score: 1 },
            { label: '2.0–3.4 (171-299)', score: 2 },
            { label: '3.5–4.9 (300-440) or UOP <500 mL/day', score: 3 },
            { label: '≥5.0 (>440) or UOP <200 mL/day', score: 4 },
          ]}
        />
      </Field>
    </div>
  );
}
