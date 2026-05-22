'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCCI } from '@/lib/calculators/cci';
import { FieldRow, NumInput, OrDivider } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

export function CciForm({ onResult }: Props) {
  // Platelet counts: × 10⁹/L OR × 10³/µL (same value — OR divider, user fills one side)
  const [preE9Str,    setPreE9Str]    = useState('');
  const [preE3Str,    setPreE3Str]    = useState('');
  const [postE9Str,   setPostE9Str]   = useState('');
  const [postE3Str,   setPostE3Str]   = useState('');

  // Time toggle
  const [timeHour, setTimeHour] = useState<1|20>(1);

  // Height: cm OR in
  const [hCmStr,  setHCmStr]  = useState('');
  const [hInStr,  setHInStr]  = useState('');

  // Weight: kg OR lbs
  const [wKgStr,  setWKgStr]  = useState('');
  const [wLbStr,  setWLbStr]  = useState('');

  // Platelet unit content (× 10¹¹)
  const [unitStr, setUnitStr] = useState('');

  // Resolve values (OR logic — whichever side was filled)
  const prePlt  = parseFloat(preE9Str)  || parseFloat(preE3Str)  || 0;
  const postPlt = parseFloat(postE9Str) || parseFloat(postE3Str) || 0;
  const heightCm = hCmStr !== '' ? parseFloat(hCmStr) || 0 : (parseFloat(hInStr) || 0) * 2.54;
  const weightKg = wKgStr !== '' ? parseFloat(wKgStr) || 0 : (parseFloat(wLbStr) || 0) / 2.205;
  const unitContent = parseFloat(unitStr) || 0;

  const liveResult = useMemo(() => {
    if (prePlt <= 0 || postPlt <= 0 || heightCm <= 0 || weightKg <= 0 || unitContent <= 0) return null;
    if (postPlt <= prePlt) return null;
    try {
      return calculateCCI({ prePlt, postPlt, timeHour, heightCm, weightKg, unitContent });
    } catch { return null; }
  }, [prePlt, postPlt, timeHour, heightCm, weightKg, unitContent]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'cci',
        label: 'CCI',
        value: liveResult.cci,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { prePlt, postPlt, timeHour, heightCm, weightKg, unitContent },
      formulaUsed:
        `CCI = Count Increment × BSA / Unit Content\n` +
        `    = ${liveResult.increment} × 10⁹/L × ${liveResult.bsa} m² / ${unitContent} × 10¹¹ × 1000\n` +
        `    = ${liveResult.cci.toLocaleString()}\n\n` +
        `BSA (Mosteller) = √(H cm × W kg / 3600) = ${liveResult.bsa} m²\n\n` +
        `1-hour threshold:  CCI ≥ 7,500 = adequate\n` +
        `20-hour threshold: CCI ≥ 4,500 = adequate`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Pre-transfusion platelet count">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={preE9Str}
            onChange={v => { setPreE9Str(v); setPreE3Str(''); }}
            suffix="× 10⁹/L" step="1" min={0} max={1000} placeholder="Norm: 0 - 50"
          />
          <OrDivider />
          <NumInput
            value={preE3Str}
            onChange={v => { setPreE3Str(v); setPreE9Str(''); }}
            suffix="× 10³/µL" step="1" min={0} max={1000} placeholder="Norm: 0 - 50"
          />
        </div>
      </FieldRow>

      <FieldRow label="Post-transfusion platelet count" hint="Collect at either 1 or 20 hours after transfusion">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={postE9Str}
            onChange={v => { setPostE9Str(v); setPostE3Str(''); }}
            suffix="× 10⁹/L" step="1" min={0} max={1000} placeholder="Norm: 50 - 150"
          />
          <OrDivider />
          <NumInput
            value={postE3Str}
            onChange={v => { setPostE3Str(v); setPostE9Str(''); }}
            suffix="× 10³/µL" step="1" min={0} max={1000} placeholder="Norm: 50 - 150"
          />
        </div>
      </FieldRow>

      <FieldRow label="Time after transfusion">
        <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-gray-200">
          {([1, 20] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setTimeHour(h)}
              className="h-11 flex items-center justify-center text-sm font-semibold transition-colors"
              style={timeHour === h ? ACTIVE : IDLE}
            >
              {h}-hour
            </button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Height">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={hCmStr}
            onChange={v => { setHCmStr(v); setHInStr(''); }}
            suffix="cm" step="1" min={0} max={250} placeholder="Norm: 152 - 213"
          />
          <OrDivider />
          <NumInput
            value={hInStr}
            onChange={v => { setHInStr(v); setHCmStr(''); }}
            suffix="in" step="0.5" min={0} max={100} placeholder="Norm: 60 - 84"
          />
        </div>
      </FieldRow>

      <FieldRow label="Weight">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={wKgStr}
            onChange={v => { setWKgStr(v); setWLbStr(''); }}
            suffix="kg" step="0.1" min={0} max={300} placeholder="Norm: 1 - 150"
          />
          <OrDivider />
          <NumInput
            value={wLbStr}
            onChange={v => { setWLbStr(v); setWKgStr(''); }}
            suffix="lbs" step="1" min={0} max={660} placeholder="Norm: 2 - 330"
          />
        </div>
      </FieldRow>

      <FieldRow label="Platelet unit content" hint="Apheresis ~3.0 × 10¹¹ plts; pooled ~0.55 × 10¹¹ plts">
        <NumInput
          value={unitStr} onChange={setUnitStr}
          suffix="× 10¹¹ plts" step="0.1" min={0} max={20} placeholder="Norm: 0.5 - 10"
        />
      </FieldRow>
    </div>
  );
}
