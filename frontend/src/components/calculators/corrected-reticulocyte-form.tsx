'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { calculateCorrectedReticulocyte } from '@/lib/calculators/corrected-reticulocyte';
import { FieldRow, NumInput } from './shared-ui';

interface Props { onResult: (result: any) => void; }

export function CorrectedReticulocyteForm({ onResult }: Props) {
  const [reticStr,  setReticStr]  = useState('');
  const [rbcStr,    setRbcStr]    = useState('');
  const [rbcUnit,   setRbcUnit]   = useState<'e12' | 'e6'>('e12'); // display-only toggle (1:1 equivalent)
  const [mHctStr,   setMHctStr]   = useState('');
  const [nHctStr,   setNHctStr]   = useState('');

  const reticulocytePct = parseFloat(reticStr) || 0;
  const rbcCount        = parseFloat(rbcStr)   || 0;
  const measuredHct     = parseFloat(mHctStr)  || 0;
  const normalHct       = parseFloat(nHctStr)  || 0;

  const liveResult = useMemo(() => {
    if (reticulocytePct <= 0 || rbcCount <= 0 || measuredHct <= 0 || normalHct <= 0) return null;
    try {
      return calculateCorrectedReticulocyte({ reticulocytePct, rbcCount, measuredHct, normalHct });
    } catch { return null; }
  }, [reticulocytePct, rbcCount, measuredHct, normalHct]);

  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!liveResult) return;
    onResultRef.current({
      outputs: [{
        id: 'corrected-reticulocyte',
        label: 'Corrected Reticulocyte %',
        value: liveResult.correctedRetic,
        unit: '%',
        interpretation: { text: liveResult.interpretation, severity: liveResult.severity },
      }],
      inputs: { reticulocytePct, rbcCount, measuredHct, normalHct },
      formulaUsed:
        `Absolute Reticulocyte Count = ${liveResult.arc.toLocaleString()} cells/µL\n` +
        `Corrected Reticulocyte % = ${liveResult.correctedRetic}%\n` +
        `Maturation Factor = ${liveResult.matFactor}\n` +
        `RPI = ${liveResult.rpi}`,
      references: liveResult.references,
    });
  }, [liveResult]);

  return (
    <div className="space-y-6">
      <FieldRow label="% of reticulocytes">
        <NumInput
          value={reticStr} onChange={setReticStr}
          suffix="%" step="0.1" min={0} max={100} placeholder="Norm: 0.5 - 2.5"
        />
      </FieldRow>

      <FieldRow label="Red blood cell count">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <NumInput
              value={rbcStr} onChange={setRbcStr}
              suffix={rbcUnit === 'e12' ? '× 10¹² cells/L' : '× 10⁶ cells/µL'}
              step="0.1" min={0} max={10} placeholder="Norm: 4 - 6"
            />
          </div>
          <button
            type="button"
            onClick={() => setRbcUnit(u => u === 'e12' ? 'e6' : 'e12')}
            className="h-11 px-3 rounded-lg border-2 text-xs font-semibold whitespace-nowrap"
            style={{ borderColor: '#0E7490', color: '#0E7490', background: '#ffffff' }}
          >
            {rbcUnit === 'e12' ? '× 10¹²/L ⇌' : '× 10⁶/µL ⇌'}
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Measured hematocrit">
        <NumInput
          value={mHctStr} onChange={setMHctStr}
          suffix="%" step="1" min={0} max={70} placeholder="Norm: 36 - 51"
        />
      </FieldRow>

      <FieldRow label="Normal hematocrit" hint="Based on age/gender">
        <NumInput
          value={nHctStr} onChange={setNHctStr}
          suffix="%" step="1" min={0} max={70} placeholder="Norm: 36 - 51"
        />
      </FieldRow>
    </div>
  );
}
