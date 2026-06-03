'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateBloodVolume, PatientType, Sex } from '@/lib/calculators/blood-volume';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

const PATIENT_OPTIONS: { val: PatientType; label: string }[] = [
  { val: 'preterm', label: 'Preterm neonate'              },
  { val: 'term',    label: 'Term neonate'                 },
  { val: 'infant',  label: 'Infant aged 1-4 months'      },
  { val: 'child',   label: 'Child <25 kg (55 lbs)'       },
  { val: 'adult',   label: 'Child ≥25 kg (55 lbs) or adult' },
];

export function BloodVolumeForm({ onResult }: Props) {
  const [patientType, setPatientType] = useState<PatientType>('adult');
  const [sex,         setSex]         = useState<Sex | null>(null);
  const [heightCmStr, setHeightCmStr] = useState('');
  const [heightInStr, setHeightInStr] = useState('');
  const [weightKgStr, setWeightKgStr] = useState('');
  const [weightLbStr, setWeightLbStr] = useState('');
  const [hctStr,      setHctStr]      = useState('');

  const isAdult = patientType === 'adult';

  // Resolve height (cm)
  const heightCm = heightCmStr !== ''
    ? parseFloat(heightCmStr) || 0
    : heightInStr !== '' ? (parseFloat(heightInStr) || 0) * 2.54 : 0;

  // Resolve weight (kg)
  const weightKg = weightKgStr !== ''
    ? parseFloat(weightKgStr) || 0
    : weightLbStr !== '' ? (parseFloat(weightLbStr) || 0) / 2.205 : 0;

  const hematocrit = parseFloat(hctStr) || undefined;

  const liveResult = useMemo(() => {
    if (weightKg <= 0) return null;
    if (isAdult && (sex === null || heightCm <= 0)) return null;
    try {
      return calculateBloodVolume({
        patientType,
        sex: isAdult ? sex! : undefined,
        heightCm: isAdult ? heightCm : undefined,
        weightKg,
        hematocrit,
      });
    } catch { return null; }
  }, [patientType, sex, heightCm, weightKg, hematocrit]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    let formula = '';
    if (isAdult) {
      formula = sex === 'male'
        ? `TBV (L) = 0.3669 × H³ + 0.03219 × W + 0.6041\n= ${(liveResult.tbvMl / 1000).toFixed(3)} L`
        : `TBV (L) = 0.3561 × H³ + 0.03308 × W + 0.1833\n= ${(liveResult.tbvMl / 1000).toFixed(3)} L`;
    } else {
      const mlKg = { preterm: 100, term: 85, infant: 75, child: 70 }[patientType as 'preterm'|'term'|'infant'|'child'];
      formula = `TBV (mL) = ${weightKg.toFixed(2)} kg × ${mlKg} mL/kg`;
    }
    if (liveResult.rbcMl !== null) {
      formula += `\n\nRBC Volume = ${liveResult.tbvMl.toLocaleString()} × Hct/100 = ${liveResult.rbcMl.toLocaleString()} mL`;
      formula += `\nPlasma Volume = ${liveResult.tbvMl.toLocaleString()} × (1 − Hct/100) = ${liveResult.plasmaMl!.toLocaleString()} mL`;
    }
    onResultRef.current({
      outputs: [{
        id: 'blood-volume',
        label: 'Total Blood Volume',
        value: liveResult.tbvMl,
        unit: 'mL',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { patientType, sex, heightCm, weightKg, hematocrit },
      formulaUsed: formula,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      {/* Patient type */}
      <FieldRow label="Patient">
        <div className="grid grid-cols-1 rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200">
          {PATIENT_OPTIONS.map((o) => {
            const active = patientType === o.val;
            return (
              <button
                key={o.val}
                type="button"
                onClick={() => setPatientType(o.val)}
                className="h-11 flex items-center justify-center text-sm font-semibold transition-colors px-3"
                style={active ? ACTIVE : IDLE}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </FieldRow>

      {/* Sex — adults only */}
      {isAdult && (
        <FieldRow label="Sex">
          <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
            {(['male', 'female'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className="h-11 flex items-center justify-center text-sm font-semibold transition-colors"
                style={sex === s ? ACTIVE : IDLE}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </FieldRow>
      )}

      {/* Height — adults only */}
      {isAdult && (
        <FieldRow label="Height">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <NumInput
              value={heightCmStr}
              onChange={v => { const n = parseFloat(v); setHeightCmStr(v); setHeightInStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.54, 1) : ''); }}
              suffix="cm" step="1" min={0} max={250} placeholder="e.g. 170"
            />
            <OrDivider />
            <NumInput
              value={heightInStr}
              onChange={v => { const n = parseFloat(v); setHeightInStr(v); setHeightCmStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.54, 1) : ''); }}
              suffix="inch" step="0.5" min={0} max={100} placeholder="e.g. 67"
            />
          </div>
        </FieldRow>
      )}

      {/* Weight */}
      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={weightKgStr}
            onChange={v => { const n = parseFloat(v); setWeightKgStr(v); setWeightLbStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.205, 1) : ''); }}
            suffix="kg" step="0.1" min={0} max={300} placeholder="e.g. 70"
          />
          <OrDivider />
          <NumInput
            value={weightLbStr}
            onChange={v => { const n = parseFloat(v); setWeightLbStr(v); setWeightKgStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.205, 1) : ''); }}
            suffix="lbs" step="1" min={0} max={660} placeholder="e.g. 154"
          />
        </div>
      </FieldRow>

      {/* Hematocrit — optional */}
      <FieldRow label="Hematocrit" hint="Optional — for RBC and plasma volume">
        <NumInput
          value={hctStr} onChange={setHctStr}
          suffix="%" step="1" min={0} max={70} placeholder="Norm: 36 - 51"
        />
      </FieldRow>
    </div>
  );
}
