'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCalciumCorrection } from '@/lib/calculators/calcium-correction';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

// Conversion constants
const CA_MMOL_TO_MGDL  = 4.0;   // 1 mmol/L = 4.0 mg/dL
const ALB_GL_TO_GDL    = 0.1;   // 1 g/L    = 0.1 g/dL

function toggleConvert(str: string, factor: number): string {
  const n = parseFloat(str);
  if (!str || isNaN(n)) return '';
  return String(Math.round(n * factor * 100) / 100);
}

export function CalciumCorrectionForm({ onResult }: Props) {
  const [caStr,       setCaStr]       = useState('');
  const [caUnit,      setCaUnit]      = useState<'mmol' | 'mgdl'>('mmol');
  const [albStr,      setAlbStr]      = useState('');
  const [albUnit,     setAlbUnit]     = useState<'gl' | 'gdl'>('gl');
  const [normAlbStr,  setNormAlbStr]  = useState('');
  const [normAlbUnit, setNormAlbUnit] = useState<'gl' | 'gdl'>('gl');

  // Resolve all inputs to the base units used by the formula (mg/dL, g/dL)
  const caMgDl       = caUnit      === 'mmol' ? (parseFloat(caStr)      || 0) * CA_MMOL_TO_MGDL : (parseFloat(caStr)      || 0);
  const albGdl       = albUnit     === 'gl'   ? (parseFloat(albStr)     || 0) * ALB_GL_TO_GDL   : (parseFloat(albStr)     || 0);
  const normAlbGdl   = normAlbUnit === 'gl'   ? (parseFloat(normAlbStr) || 0) * ALB_GL_TO_GDL   : (parseFloat(normAlbStr) || 0);

  const liveResult = useMemo(() => {
    if (caMgDl <= 0 || albGdl <= 0 || normAlbGdl <= 0) return null;
    try {
      return calculateCalciumCorrection({ calciumMgDl: caMgDl, albuminGdl: albGdl, normalAlbuminGdl: normAlbGdl });
    } catch { return null; }
  }, [caMgDl, albGdl, normAlbGdl]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'calcium-correction',
        label: 'Corrected Calcium',
        value: liveResult.correctedCaMgDl,
        unit: 'mg/dL',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { caMgDl, albGdl, normAlbGdl },
      formulaUsed:
        'Corrected Calcium (mg/dL) = (0.8 × (Normal Albumin − Patient Albumin)) + Serum Ca\n\n' +
        `= (0.8 × (${normAlbGdl.toFixed(1)} − ${albGdl.toFixed(1)})) + ${caMgDl.toFixed(1)}\n` +
        `= ${liveResult.correctedCaMgDl} mg/dL  (${liveResult.correctedCaMmolL} mmol/L)\n\n` +
        'Note: formula uses albumin in g/dL and calcium in mg/dL',
      references: liveResult.references,
    });
  }, [liveResult, albGdl, caMgDl, normAlbGdl]);

  const toggleBtn = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="h-11 px-3 rounded-lg border-2 text-xs font-semibold whitespace-nowrap"
      style={{ borderColor: '#0E7490', color: '#0E7490', background: '#ffffff' }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <FieldRow label="Calcium">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={caStr} onChange={setCaStr}
              suffix={caUnit === 'mmol' ? 'mmol/L' : 'mg/dL'}
              step={caUnit === 'mmol' ? '0.01' : '0.1'}
              min={0} max={caUnit === 'mmol' ? 5 : 20}
              placeholder={caUnit === 'mmol' ? 'Norm: 2.25 - 2.625' : 'Norm: 9 - 10.5'}
            />
          </div>
          {toggleBtn(
            caUnit === 'mmol' ? 'mmol/L ⇌' : 'mg/dL ⇌',
            () => {
              setCaStr(s => caUnit === 'mmol' ? toggleConvert(s, CA_MMOL_TO_MGDL) : toggleConvert(s, 1 / CA_MMOL_TO_MGDL));
              setCaUnit(u => u === 'mmol' ? 'mgdl' : 'mmol');
            },
          )}
        </div>
      </FieldRow>

      <FieldRow label="Albumin">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={albStr} onChange={setAlbStr}
              suffix={albUnit === 'gl' ? 'g/L' : 'g/dL'}
              step={albUnit === 'gl' ? '1' : '0.1'}
              min={0} max={albUnit === 'gl' ? 60 : 6}
              placeholder={albUnit === 'gl' ? 'Norm: 35 - 55' : 'Norm: 3.5 - 5.5'}
            />
          </div>
          {toggleBtn(
            albUnit === 'gl' ? 'g/L ⇌' : 'g/dL ⇌',
            () => {
              setAlbStr(s => albUnit === 'gl' ? toggleConvert(s, ALB_GL_TO_GDL) : toggleConvert(s, 1 / ALB_GL_TO_GDL));
              setAlbUnit(u => u === 'gl' ? 'gdl' : 'gl');
            },
          )}
        </div>
      </FieldRow>

      <FieldRow label="Normal albumin: 4 g/dL or 40 g/L">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={normAlbStr} onChange={setNormAlbStr}
              suffix={normAlbUnit === 'gl' ? 'g/L' : 'g/dL'}
              step={normAlbUnit === 'gl' ? '1' : '0.1'}
              min={0} max={normAlbUnit === 'gl' ? 60 : 6}
              placeholder={normAlbUnit === 'gl' ? 'Norm: 35 - 55' : 'Norm: 3.5 - 5.5'}
            />
          </div>
          {toggleBtn(
            normAlbUnit === 'gl' ? 'g/L ⇌' : 'g/dL ⇌',
            () => {
              setNormAlbStr(s => normAlbUnit === 'gl' ? toggleConvert(s, ALB_GL_TO_GDL) : toggleConvert(s, 1 / ALB_GL_TO_GDL));
              setNormAlbUnit(u => u === 'gl' ? 'gdl' : 'gl');
            },
          )}
        </div>
      </FieldRow>
    </div>
  );
}
