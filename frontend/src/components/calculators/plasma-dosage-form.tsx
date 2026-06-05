'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculatePlasmaDosage } from '@/lib/calculators/plasma-dosage';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function PlasmaDosageForm({ onResult }: Props) {
  // Weight: kg OR lbs
  const [wKgStr,     setWKgStr]     = useState('');
  const [wLbStr,     setWLbStr]     = useState('');

  // Desired plasma dosage (mL/kg) — default 10
  const [dosageStr,  setDosageStr]  = useState('10');

  // Unit volume (mL) — default 200
  const [unitVolStr, setUnitVolStr] = useState('200');

  const weightKg     = wKgStr !== '' ? parseFloat(wKgStr) || 0 : (parseFloat(wLbStr) || 0) / 2.205;
  const dosageMlKg   = parseFloat(dosageStr)  || 0;
  const unitVolumeMl = parseFloat(unitVolStr) || 0;

  const liveResult = useMemo(() => {
    if (weightKg <= 0 || dosageMlKg <= 0 || unitVolumeMl <= 0) return null;
    try {
      return calculatePlasmaDosage({ weightKg, dosageMlKg, unitVolumeMl });
    } catch { return null; }
  }, [weightKg, dosageMlKg, unitVolumeMl]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'plasma-dosage',
        label: 'Total Plasma Dosage',
        value: liveResult.totalMl,
        unit: 'mL',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { weightKg, dosageMlKg, unitVolumeMl },
      formulaUsed:
        `Total plasma dosage (mL) = ${dosageMlKg} mL/kg × ${weightKg.toFixed(1)} kg\n` +
        `                         = ${liveResult.totalMl.toLocaleString()} mL\n\n` +
        `Units needed = ⌈${liveResult.totalMl} / ${unitVolumeMl}⌉ = ${liveResult.unitsNeeded} unit${liveResult.unitsNeeded !== 1 ? 's' : ''}\n\n` +
        `Note: Standard dose 10 mL/kg; up to 15–20 mL/kg may be used clinically.\n` +
        `Expected to raise coagulation factors by ~20% immediately after infusion.`,
      references: liveResult.references,
    });
  }, [liveResult, dosageMlKg, unitVolumeMl, weightKg]);

  return (
    <div className="space-y-6">
      <FieldRow label="Patient weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wKgStr}
            onChange={v => { const n = parseFloat(v); setWKgStr(v); setWLbStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.205, 1) : ''); }}
            suffix="kg" step="0.1" min={0} max={300} placeholder="Norm: 1 - 150"
          />
          <OrDivider />
          <NumInput
            value={wLbStr}
            onChange={v => { const n = parseFloat(v); setWLbStr(v); setWKgStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.205, 1) : ''); }}
            suffix="lbs" step="1" min={0} max={660} placeholder="Norm: 2 - 330"
          />
        </div>
      </FieldRow>

      <FieldRow label="Desired plasma dosage">
        <NumInput
          value={dosageStr} onChange={setDosageStr}
          suffix="mL/kg" step="1" min={1} max={30} placeholder="10"
        />
      </FieldRow>

      <FieldRow label="Unit volume">
        <NumInput
          value={unitVolStr} onChange={setUnitVolStr}
          suffix="mL" step="10" min={50} max={500} placeholder="200"
        />
      </FieldRow>
    </div>
  );
}
