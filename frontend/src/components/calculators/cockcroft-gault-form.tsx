'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { calculateCockcroftGault } from '@/lib/calculators/cockcroft-gault';
import { FieldRow, NumInput, OrDivider, OptionButtons, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function CockcroftGaultForm({ onResult }: Props) {
  const [sex, setSex]           = useState<'female' | 'male'>('female');
  const [ageStr, setAgeStr]     = useState('');

  // Weight: kg OR lbs
  const [wKgStr, setWKgStr]   = useState('');
  const [wLbStr, setWLbStr]   = useState('');

  // Creatinine: µmol/L OR mg/dL
  const [crMgStr, setCrMgStr] = useState('');
  const [crUmStr, setCrUmStr] = useState('');

  // Height (optional): cm OR inches
  const [hCmStr, setHCmStr]   = useState('');
  const [hInStr, setHInStr]   = useState('');

  // Weight conversions
  const onWKgChange = useCallback((v: string) => {
    setWKgStr(v);
    const n = parseFloat(v);
    setWLbStr(Number.isFinite(n) && n > 0 ? fmt(n / 0.453592, 1) : '');
  }, []);
  const onWLbChange = useCallback((v: string) => {
    setWLbStr(v);
    const n = parseFloat(v);
    setWKgStr(Number.isFinite(n) && n > 0 ? fmt(n * 0.453592, 1) : '');
  }, []);

  // Creatinine conversions (1 mg/dL = 88.4 µmol/L)
  const onCrMgChange = useCallback((v: string) => {
    setCrMgStr(v);
    const n = parseFloat(v);
    setCrUmStr(Number.isFinite(n) && n > 0 ? fmt(n * 88.4, 1) : '');
  }, []);
  const onCrUmChange = useCallback((v: string) => {
    setCrUmStr(v);
    const n = parseFloat(v);
    setCrMgStr(Number.isFinite(n) && n > 0 ? fmt(n / 88.4, 2) : '');
  }, []);

  // Height conversions (1 inch = 2.54 cm)
  const onHCmChange = useCallback((v: string) => {
    setHCmStr(v);
    const n = parseFloat(v);
    setHInStr(Number.isFinite(n) && n > 0 ? fmt(n / 2.54, 1) : '');
  }, []);
  const onHInChange = useCallback((v: string) => {
    setHInStr(v);
    const n = parseFloat(v);
    setHCmStr(Number.isFinite(n) && n > 0 ? fmt(n * 2.54, 1) : '');
  }, []);

  const age        = parseInt(ageStr)  || 0;
  const weightKg   = parseFloat(wKgStr) || 0;
  const crMgDl     = parseFloat(crMgStr) || 0;
  const heightCm   = parseFloat(hCmStr)  || 0;

  const liveResult = useMemo(() => {
    if (age <= 0 || weightKg <= 0 || crMgDl <= 0) return null;
    try {
      return calculateCockcroftGault({
        sex, age, weightKg, creatinineMgDl: crMgDl,
        heightCm: heightCm > 0 ? heightCm : undefined,
      });
    } catch { return null; }
  }, [sex, age, weightKg, crMgDl, heightCm]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [
        {
          id: 'crcl-actual',
          label: 'CrCl (Actual Weight)',
          value: liveResult.crclActual,
          unit: 'mL/min',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        },
        ...(liveResult.crclIbw !== undefined ? [{
          id: 'crcl-ibw',
          label: `CrCl (IBW ${liveResult.ibwKg} kg)`,
          value: liveResult.crclIbw,
          unit: 'mL/min',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        }] : []),
        ...(liveResult.crclAbw !== undefined ? [{
          id: 'crcl-abw',
          label: `CrCl (ABW ${liveResult.abwKg} kg)`,
          value: liveResult.crclAbw,
          unit: 'mL/min',
          interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
        }] : []),
      ],
      inputs: { sex, age, weightKg, creatinineMgDl: crMgDl, heightCm },
      formulaUsed:
        'CrCl = (140 - Age) x Weight(kg) x (0.85 if Female) / (72 x Cr mg/dL)\n' +
        'IBW male = 50 + 2.3 x (Height inches - 60)\n' +
        'IBW female = 45.5 + 2.3 x (Height inches - 60)\n' +
        'ABW = IBW + 0.4 x (Actual weight - IBW)',
      references: liveResult.references,
    });
  }, [liveResult, age, crMgDl, heightCm, sex, weightKg]);

  return (
    <div className="space-y-6">
      {/* Sex */}
      <FieldRow label="Sex">
        <OptionButtons
          options={[{ value: 'female' as const, label: 'Female' }, { value: 'male' as const, label: 'Male' }]}
          value={sex}
          onChange={setSex}
          columns={2}
        />
      </FieldRow>

      {/* Age */}
      <FieldRow label="Age">
        <NumInput value={ageStr} onChange={setAgeStr} suffix="years" step="1" min={1} max={120} />
      </FieldRow>

      {/* Weight */}
      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={wKgStr} onChange={onWKgChange} suffix="kg"  step="0.1" min={1}  max={300} />
          <OrDivider />
          <NumInput value={wLbStr} onChange={onWLbChange} suffix="lbs" step="0.1" min={2}  max={660} />
        </div>
      </FieldRow>

      {/* Creatinine */}
      <FieldRow label="Creatinine">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={crUmStr} onChange={onCrUmChange} suffix="µmol/L" step="1"    min={1}   max={2650} />
          <OrDivider />
          <NumInput value={crMgStr} onChange={onCrMgChange} suffix="mg/dL"  step="0.01" min={0.1} max={30}   />
        </div>
      </FieldRow>

      {/* Height (optional) */}
      <FieldRow label="Height" hint="optional — for IBW & ABW">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput value={hCmStr} onChange={onHCmChange} suffix="cm"   step="0.1" min={100} max={250} />
          <OrDivider />
          <NumInput value={hInStr} onChange={onHInChange} suffix="inch" step="0.1" min={39}  max={98}  />
        </div>
      </FieldRow>
    </div>
  );
}
