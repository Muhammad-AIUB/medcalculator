'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculatePreciseDapt } from '@/lib/calculators/precise-dapt';
import { FieldRow, NumInput, OrDivider, fmt } from './shared-ui';

interface Props { onResult: (result: any) => void; }

const ACTIVE = { background: '#0E7490', color: '#ffffff' };
const IDLE   = { background: '#ffffff', color: '#1e293b' };

export function PreciseDaptForm({ onResult }: Props) {
  const [ageStr,   setAgeStr]   = useState('');
  const [wbcStr,   setWbcStr]   = useState('');
  const [wbcUnit,  setWbcUnit]  = useState<'e9' | 'e3'>('e9'); // display-only toggle (1:1 equivalent)
  const [hbGlStr,  setHbGlStr]  = useState('');  // g/L
  const [hbGdlStr, setHbGdlStr] = useState('');  // g/dL
  const [crClStr,  setCrClStr]  = useState('');
  const [bleeding, setBleeding] = useState<boolean | null>(null);

  const age   = parseFloat(ageStr)   || 0;
  const wbc   = parseFloat(wbcStr)   || 0;
  const hbGl  = parseFloat(hbGlStr)  || 0;
  const hbGdl = parseFloat(hbGdlStr) || 0;
  const crCl  = parseFloat(crClStr)  || 0;

  // Resolved haemoglobin in g/dL
  const hemoglobin = hbGlStr !== '' ? hbGl / 10 : hbGdl;

  const liveResult = useMemo(() => {
    if (age <= 0 || wbc <= 0 || hemoglobin <= 0 || crCl <= 0 || bleeding === null) return null;
    try {
      return calculatePreciseDapt({ age, hemoglobin, wbc, crCl, priorBleeding: bleeding });
    } catch { return null; }
  }, [age, wbc, hemoglobin, crCl, bleeding]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'precise-dapt',
        label: 'PRECISE-DAPT Score',
        value: liveResult.score,
        unit: '',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { age, wbc, hemoglobin, crCl, priorBleeding: bleeding },
      formulaUsed:
        'PRECISE-DAPT Score (0–100) derived from the PRECISE-DAPT linear prediction model\n\n' +
        'LP = 0.04376×Age + 0.000087×CrCl² − 0.0462×CrCl\n' +
        '   + 0.2274×WBC − 0.77044×Hgb + 0.84637×PriorBleeding\n\n' +
        '< 25:  Low bleeding risk → Standard/long DAPT (12–24 months)\n' +
        '≥ 25:  High bleeding risk → Short DAPT (3–6 months)',
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="Age">
        <NumInput
          value={ageStr} onChange={setAgeStr}
          suffix="years" step="1" min={18} max={110} placeholder="18 – 110"
        />
      </FieldRow>

      <FieldRow label="White Blood Cell Count">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={wbcStr} onChange={setWbcStr}
              suffix={wbcUnit === 'e9' ? '× 10⁹/L' : '× 10³/µL'}
              step="0.1" min={0} max={100} placeholder="4 – 11"
            />
          </div>
          <button
            type="button"
            onClick={() => setWbcUnit(u => u === 'e9' ? 'e3' : 'e9')}
            className="h-11 px-3 rounded-lg border-2 text-xs font-semibold whitespace-nowrap"
            style={{ borderColor: '#0E7490', color: '#0E7490', background: '#ffffff' }}
          >
            {wbcUnit === 'e9' ? '× 10⁹/L ⇌' : '× 10³/µL ⇌'}
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Hemoglobin">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NumInput
            value={hbGlStr}
            onChange={v => { const n = parseFloat(v); setHbGlStr(v); setHbGdlStr(Number.isFinite(n) && n > 0 ? fmt(n / 10, 1) : ''); }}
            suffix="g/L" step="1" min={0} max={250} placeholder="120 – 180"
          />
          <OrDivider />
          <NumInput
            value={hbGdlStr}
            onChange={v => { const n = parseFloat(v); setHbGdlStr(v); setHbGlStr(Number.isFinite(n) && n > 0 ? fmt(n * 10, 0) : ''); }}
            suffix="g/dL" step="0.1" min={0} max={25} placeholder="12 – 18"
          />
        </div>
      </FieldRow>

      <FieldRow label="Creatinine Clearance">
        <NumInput
          value={crClStr} onChange={setCrClStr}
          suffix="mL/min" step="1" min={0} max={200} placeholder="Norm: 88 – 137"
        />
      </FieldRow>

      <FieldRow label="Prior Bleeding">
        <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-gray-200">
          {([false, true] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setBleeding(val)}
              className="h-11 text-sm font-semibold transition-colors"
              style={bleeding === val ? ACTIVE : IDLE}
            >
              {val ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </FieldRow>
    </div>
  );
}
